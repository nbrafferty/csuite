import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/server/db/prisma";
import { sendEmail, passwordResetEmail, appBaseUrl } from "@/server/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  // Always respond identically whether or not the account exists,
  // so this endpoint can't be used to probe for registered emails.
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, status: true },
  });

  if (user && user.status === "ACTIVE") {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`;
    const template = passwordResetEmail(resetUrl);
    await sendEmail({ to: parsed.data.email, ...template });
  }

  return NextResponse.json({ ok: true });
}
