import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const DATABASE_URL =
  process.env["DATABASE_URL"] ||
  "postgresql://csuite:csuite_dev@localhost:5432/csuite?schema=public";

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create CCC super-tenant
  const ccc = await prisma.company.upsert({
    where: { slug: "central-creative" },
    update: {},
    create: {
      name: "Central Creative Co.",
      slug: "central-creative",
      inviteCode: "CCC-STAFF-2026",
    },
  });

  // Create CCC admin user
  const cccAdmin = await prisma.user.upsert({
    where: { email: "admin@centralcreative.co" },
    update: {},
    create: {
      companyId: ccc.id,
      email: "admin@centralcreative.co",
      passwordHash: hashSync("password123", 12),
      name: "CCC Admin",
      role: "CCC_STAFF",
      status: "ACTIVE",
    },
  });

  // Create demo client company
  const demo = await prisma.company.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
      inviteCode: "ACME-INVITE-2026",
    },
  });

  // Create demo client admin
  const janeSmith = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      companyId: demo.id,
      email: "admin@acme.com",
      passwordHash: hashSync("password123", 12),
      name: "Jane Smith",
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
    },
  });

  // Create demo client user
  const johnDoe = await prisma.user.upsert({
    where: { email: "user@acme.com" },
    update: {},
    create: {
      companyId: demo.id,
      email: "user@acme.com",
      passwordHash: hashSync("password123", 12),
      name: "John Doe",
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
  });

  // Create demo location
  await prisma.location.create({
    data: {
      companyId: demo.id,
      label: "HQ",
      addressLine1: "123 Main St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "US",
      contactName: "Jane Smith",
      contactPhone: "512-555-0100",
      isDefault: true,
    },
  }).catch(() => {
    // Ignore if already exists on re-seed
  });

  // Create second client company
  const globex = await prisma.company.upsert({
    where: { slug: "globex-corp" },
    update: {},
    create: {
      name: "Globex Corporation",
      slug: "globex-corp",
      inviteCode: "GLOBEX-INVITE-2026",
    },
  });

  const globexAdmin = await prisma.user.upsert({
    where: { email: "hank@globex.com" },
    update: {},
    create: {
      companyId: globex.id,
      email: "hank@globex.com",
      passwordHash: hashSync("password123", 12),
      name: "Hank Scorpio",
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
    },
  });

  // ─── Seed Message Threads ────────────────────────────────────────────
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

  // Thread 1 — Acme, open, assigned to CCC admin
  const thread1 = await prisma.messageThread.create({
    data: {
      companyId: demo.id,
      subject: "Logo placement on polo shirts",
      orderTitle: "ORD-2025-042 — Acme Polo Shirts",
      status: "open",
      createdBy: janeSmith.id,
      assigneeId: cccAdmin.id,
      createdAt: hoursAgo(48),
      messages: {
        create: [
          { authorId: janeSmith.id, body: "Hi, can we move the logo to the left chest? The mockup has it centered.", senderType: "client", createdAt: hoursAgo(48) },
          { authorId: cccAdmin.id, body: "Absolutely — I'll update the proof. Left chest, about 3.5\" wide. Does that work?", senderType: "staff", createdAt: hoursAgo(46) },
          { authorId: janeSmith.id, body: "Perfect, 3.5\" is great. Can we also get it in navy thread instead of black?", senderType: "client", createdAt: hoursAgo(24) },
          { authorId: cccAdmin.id, body: "Navy thread noted. I'll send a revised proof by end of day.", senderType: "staff", createdAt: hoursAgo(23) },
          { authorId: cccAdmin.id, body: "Internal: need to check with production if navy thread is in stock for this run.", senderType: "internal", createdAt: hoursAgo(22) },
        ],
      },
    },
  });

  // Thread 2 — Acme, waiting on client
  const thread2 = await prisma.messageThread.create({
    data: {
      companyId: demo.id,
      subject: "Delivery timeline for conference booth banners",
      orderTitle: "ORD-2025-051 — Acme Trade Show Kit",
      status: "waiting_on_client",
      createdBy: johnDoe.id,
      assigneeId: cccAdmin.id,
      createdAt: hoursAgo(120),
      messages: {
        create: [
          { authorId: johnDoe.id, body: "We need the banners delivered by March 10 for the trade show. Is that feasible?", senderType: "client", createdAt: hoursAgo(120) },
          { authorId: cccAdmin.id, body: "That's tight but doable if we finalize artwork by this Friday. Can you send the updated vector files?", senderType: "staff", createdAt: hoursAgo(96) },
          { authorId: johnDoe.id, body: "Working on them now. One question — do you need CMYK or RGB?", senderType: "client", createdAt: hoursAgo(72) },
          { authorId: cccAdmin.id, body: "CMYK preferred for print. RGB works in a pinch but colors may shift.", senderType: "staff", createdAt: hoursAgo(70) },
        ],
      },
    },
  });

  // Thread 3 — Globex, waiting on CCC
  const thread3 = await prisma.messageThread.create({
    data: {
      companyId: globex.id,
      subject: "Bulk hoodie order — sizing samples",
      orderTitle: "ORD-2025-063 — Globex Winter Hoodies",
      status: "waiting_on_ccc",
      createdBy: globexAdmin.id,
      assigneeId: cccAdmin.id,
      createdAt: hoursAgo(36),
      messages: {
        create: [
          { authorId: globexAdmin.id, body: "Can we get sizing samples before committing to the full 500-unit order? We want to make sure the fit is right for our team.", senderType: "client", createdAt: hoursAgo(36) },
          { authorId: cccAdmin.id, body: "Of course. I'll ship S, M, L, XL samples to your office. Should arrive in 3 business days.", senderType: "staff", createdAt: hoursAgo(30) },
          { authorId: globexAdmin.id, body: "Great, please send to our main office at 123 Globex Blvd, Cypress Creek.", senderType: "client", createdAt: hoursAgo(28) },
          { authorId: cccAdmin.id, body: "Internal: samples shipped via FedEx, tracking #789456123. Mark as waiting_on_ccc until delivery confirmed.", senderType: "internal", createdAt: hoursAgo(26) },
        ],
      },
    },
  });

  // Thread 4 — Acme, resolved
  await prisma.messageThread.create({
    data: {
      companyId: demo.id,
      subject: "Invoice correction — duplicate charge",
      status: "resolved",
      createdBy: janeSmith.id,
      assigneeId: cccAdmin.id,
      createdAt: hoursAgo(200),
      messages: {
        create: [
          { authorId: janeSmith.id, body: "Hi, we were charged twice for order ORD-2025-031. Can you look into this?", senderType: "client", createdAt: hoursAgo(200) },
          { authorId: cccAdmin.id, body: "I see the duplicate. Issuing a refund now — should appear in 3-5 business days.", senderType: "staff", createdAt: hoursAgo(196) },
          { authorId: janeSmith.id, body: "Refund received. Thanks for the quick turnaround!", senderType: "client", createdAt: hoursAgo(100) },
        ],
      },
    },
  });

  console.log("Seed complete!");
  console.log("---");
  console.log("CCC Staff login:  admin@centralcreative.co / password123");
  console.log("Client Admin:     admin@acme.com / password123");
  console.log("Client User:      user@acme.com / password123");
  console.log("Globex Admin:     hank@globex.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
