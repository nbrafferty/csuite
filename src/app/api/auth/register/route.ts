import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
  inviteCode: z.string().trim().min(1, "Invite code is required"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, inviteCode } = parsed.data;

  // Resolve the company from the invite code
  const company = await prisma.company.findUnique({
    where: { inviteCode },
  });
  if (!company) {
    return NextResponse.json(
      { error: "That invite code is not valid" },
      { status: 400 }
    );
  }

  const passwordHash = await hash(password, 12);

  // Is there already a user with this email?
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Activating a pending invite (e.g. the client admin seeded by staff)
    if (existing.companyId === company.id && existing.status === "INVITED") {
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: { name, passwordHash, status: "ACTIVE" },
        select: { id: true },
      });
      return NextResponse.json({ id: user.id, activated: true });
    }

    // Any other existing account — don't reveal cross-tenant details
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  // New teammate joining via the company invite code — regular client user
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name,
      email,
      passwordHash,
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return NextResponse.json({ id: user.id, activated: false });
}
