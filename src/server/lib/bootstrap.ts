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
  await maybeForceReset();

  const staffCount = await prisma.user.count({ where: { role: "CCC_STAFF" } });
  if (staffCount > 0) {
    console.log(
      `[bootstrap] Skipping — ${staffCount} staff user(s) already exist. To re-run, the database must have no CCC_STAFF users.`
    );
    return;
  }

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

/**
 * One-time emergency wipe, driven by env var so it can be done from the
 * Railway dashboard without a SQL console.
 *
 * BOOTSTRAP_FORCE_RESET must be set to today's UTC date (YYYY-MM-DD) to
 * fire. The date gate means a forgotten variable goes inert by tomorrow —
 * it can never silently wipe a future deploy. Remove the variable after use.
 */
async function maybeForceReset() {
  const reset = process.env.BOOTSTRAP_FORCE_RESET?.trim();
  if (!reset) return;

  const todayUtc = new Date().toISOString().slice(0, 10);
  if (reset !== todayUtc) {
    console.warn(
      `[bootstrap] BOOTSTRAP_FORCE_RESET is set to "${reset}" but only fires when it equals today's UTC date (${todayUtc}). Ignoring. Remove this variable if you no longer intend to wipe the database.`
    );
    return;
  }

  console.warn("[bootstrap] BOOTSTRAP_FORCE_RESET matches today's date — WIPING ALL DATA NOW");

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '\_prisma%'
  `;
  if (tables.length > 0) {
    const quoted = tables.map((t) => `"${t.tablename}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} CASCADE`);
  }

  console.warn(
    `[bootstrap] Wiped ${tables.length} tables. REMOVE the BOOTSTRAP_FORCE_RESET variable from your environment now.`
  );
}
