import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resend Inbound webhook: turns email replies into thread messages.
 *
 * Outbound thread notifications set replyTo to
 * thread+<threadId>@<EMAIL_REPLY_DOMAIN>; this endpoint receives the reply,
 * verifies the Svix signature (RESEND_INBOUND_SECRET), matches the sender to
 * a portal user of the thread's company, strips the quoted history, and
 * posts the body into the thread. Unknown senders are posted as
 * staff-visible internal notes — never auto-shown to clients.
 */

function verifySvixSignature(req: NextRequest, payload: string): boolean {
  const secret = process.env.RESEND_INBOUND_SECRET;
  if (!secret) return false;

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signatures = req.headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;

  // Reject stale timestamps (5 min window)
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${payload}`;
  const expected = createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // Header format: "v1,<sig> v1,<sig2> ..."
  for (const part of signatures.split(" ")) {
    const [, sig] = part.split(",");
    if (!sig) continue;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** Cut quoted history: everything from the first reply marker onward */
function stripQuotedHistory(text: string): string {
  const markers = [
    /^On .{5,200} wrote:\s*$/m,
    /^-{2,}\s*Original Message\s*-{2,}/im,
    /^From:\s.+$/m,
    /^_{10,}$/m,
  ];
  let cut = text.length;
  for (const marker of markers) {
    const m = text.match(marker);
    if (m && m.index !== undefined && m.index < cut) cut = m.index;
  }
  let body = text.slice(0, cut);
  // Drop trailing fully-quoted lines ("> ...")
  body = body.replace(/(\n>.*)+\s*$/g, "");
  return body.trim();
}

function extractEmail(from: unknown): string | null {
  if (typeof from !== "string") {
    if (from && typeof from === "object" && "email" in (from as any)) {
      return String((from as any).email).toLowerCase();
    }
    return null;
  }
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_INBOUND_SECRET) {
    // Inbound email not configured — acknowledge and ignore
    return NextResponse.json({ ignored: true }, { status: 200 });
  }

  const payload = await req.text();
  if (!verifySvixSignature(req, payload)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = event?.data ?? event;
  const toList: string[] = Array.isArray(data?.to) ? data.to : [data?.to].filter(Boolean);
  const fromEmail = extractEmail(data?.from);
  const text: string = data?.text ?? "";

  // Find the thread id in any recipient address: thread+<id>@...
  let threadId: string | null = null;
  for (const to of toList) {
    const addr = extractEmail(to) ?? "";
    const m = addr.match(/^thread\+([a-z0-9-]+)@/i);
    if (m) {
      threadId = m[1];
      break;
    }
  }

  if (!threadId || !fromEmail || !text.trim()) {
    console.warn("[resend-inbound] Missing thread id, sender, or body — skipping");
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: { id: true, companyId: true },
  });
  if (!thread) {
    console.warn(`[resend-inbound] Unknown thread ${threadId}`);
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  const body = stripQuotedHistory(text);
  if (!body) {
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  // Match the sender to a user of the thread's company (or CCC staff)
  const sender = await prisma.user.findUnique({
    where: { email: fromEmail },
    select: { id: true, role: true, companyId: true, status: true },
  });

  const isThreadMember =
    sender &&
    sender.status === "ACTIVE" &&
    (sender.companyId === thread.companyId || sender.role === "CCC_STAFF");

  if (isThreadMember) {
    await prisma.message.create({
      data: {
        threadId: thread.id,
        authorId: sender.id,
        body,
        senderType: sender.role === "CCC_STAFF" ? "staff" : "client",
        via: "email",
      },
    });
  } else {
    // Unknown sender → staff-visible holding note, never auto-posted to the client
    const staffUser = await prisma.user.findFirst({
      where: { role: "CCC_STAFF", status: "ACTIVE" },
      select: { id: true },
    });
    if (!staffUser) {
      console.error("[resend-inbound] No staff user to attribute holding note to");
      return NextResponse.json({ skipped: true }, { status: 200 });
    }
    await prisma.message.create({
      data: {
        threadId: thread.id,
        authorId: staffUser.id,
        body: `[Unverified email from ${fromEmail} — review before sharing]\n\n${body}`,
        senderType: "internal",
        via: "email",
      },
    });
  }

  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ received: true });
}
