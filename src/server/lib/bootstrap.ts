import { hash } from "bcryptjs";
import { prisma } from "@/server/db/prisma";

/**
 * Production bootstrap: on a clean database, create the Central Creative
 * staff org and the first staff admin so someone can log in. Never modifies
 * existing data — it no-ops as soon as any staff user exists.
 *
 * Requires BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD. The password
 * env var can (and should) be removed after the first successful boot.
 */
export async function bootstrap() {
  const staffCount = await prisma.user.count({ where: { role: "CCC_STAFF" } });
  if (staffCount > 0) return;

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "[bootstrap] No staff users exist and BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD are not set — nobody can log in until they are."
    );
    return;
  }
  if (password.length < 8) {
    console.error("[bootstrap] BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters");
    return;
  }

  const company = await prisma.company.upsert({
    where: { slug: "central-creative" },
    update: {},
    create: {
      name: "Central Creative Co.",
      slug: "central-creative",
      inviteCode: `CCC-STAFF-${Date.now().toString(36).toUpperCase()}`,
    },
  });

  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      companyId: company.id,
      email,
      passwordHash,
      name: "Admin",
      role: "CCC_STAFF",
      status: "ACTIVE",
    },
  });

  console.log(`[bootstrap] Created staff admin ${email} for Central Creative Co.`);
}
