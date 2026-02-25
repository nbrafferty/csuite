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

  // ─── Client Companies ──────────────────────────────────────────────

  // 1. Acme Corp — active, 3 active orders
  const demo = await prisma.company.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      inviteCode: "ACME-INVITE-2026",
      status: "active",
      phone: "(512) 555-0100",
      address: "123 Main St, Austin, TX 78701",
      notes: "Long-standing client. Prefers rush delivery. Net-30 terms approved.",
    },
  });

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

  await prisma.user.upsert({
    where: { email: "mike@acme.com" },
    update: {},
    create: {
      companyId: demo.id,
      email: "mike@acme.com",
      passwordHash: hashSync("password123", 12),
      name: "Mike Rivera",
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
  });

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
  }).catch(() => {});

  // 2. Globex Corporation — active, 2 active orders
  const globex = await prisma.company.upsert({
    where: { slug: "globex-corp" },
    update: {},
    create: {
      name: "Globex Corporation",
      slug: "globex-corp",
      inviteCode: "GLOBEX-INVITE-2026",
      status: "active",
      phone: "(541) 555-0199",
      address: "456 Globex Blvd, Cypress Creek, OR 97401",
      notes: "Large corporate account. Quarterly swag orders for new hires.",
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

  await prisma.user.upsert({
    where: { email: "frank@globex.com" },
    update: {},
    create: {
      companyId: globex.id,
      email: "frank@globex.com",
      passwordHash: hashSync("password123", 12),
      name: "Frank Grimes",
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
  });

  // 3. Bloom Studio — active, 4 active orders
  const bloom = await prisma.company.upsert({
    where: { slug: "bloom-studio" },
    update: {},
    create: {
      name: "Bloom Studio",
      slug: "bloom-studio",
      inviteCode: "BLOOM-INVITE-2026",
      status: "active",
      phone: "(415) 555-0234",
      address: "789 Flower Ave, San Francisco, CA 94102",
      notes: "Design-forward brand. Very particular about Pantone matching.",
    },
  });

  await prisma.user.upsert({
    where: { email: "lily@bloomstudio.com" },
    update: {},
    create: {
      companyId: bloom.id,
      email: "lily@bloomstudio.com",
      passwordHash: hashSync("password123", 12),
      name: "Lily Chen",
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "omar@bloomstudio.com" },
    update: {},
    create: {
      companyId: bloom.id,
      email: "omar@bloomstudio.com",
      passwordHash: hashSync("password123", 12),
      name: "Omar Patel",
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "nina@bloomstudio.com" },
    update: {},
    create: {
      companyId: bloom.id,
      email: "nina@bloomstudio.com",
      passwordHash: hashSync("password123", 12),
      name: "Nina Brooks",
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
  });

  // 4. NovaTech Industries — paused, 0 active orders
  const novatech = await prisma.company.upsert({
    where: { slug: "novatech-industries" },
    update: {},
    create: {
      name: "NovaTech Industries",
      slug: "novatech-industries",
      inviteCode: "NOVA-INVITE-2026",
      status: "paused",
      phone: "(312) 555-0777",
      address: "200 Innovation Dr, Chicago, IL 60601",
      notes: "Account paused — pending budget approval for Q2. Follow up in March.",
    },
  });

  await prisma.user.upsert({
    where: { email: "marcus@novatech.io" },
    update: {},
    create: {
      companyId: novatech.id,
      email: "marcus@novatech.io",
      passwordHash: hashSync("password123", 12),
      name: "Marcus Webb",
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
    },
  });

  // 5. Redline Events — overdue, 1 active order
  const redline = await prisma.company.upsert({
    where: { slug: "redline-events" },
    update: {},
    create: {
      name: "Redline Events",
      slug: "redline-events",
      inviteCode: "REDLINE-INVITE-2026",
      status: "overdue",
      phone: "(305) 555-0412",
      address: "55 Ocean Dr, Miami, FL 33139",
      notes: "Outstanding invoice INV-2025-089. Contacted 3 times. Escalate if no payment by March 1.",
    },
  });

  await prisma.user.upsert({
    where: { email: "dana@redlineevents.com" },
    update: {},
    create: {
      companyId: redline.id,
      email: "dana@redlineevents.com",
      passwordHash: hashSync("password123", 12),
      name: "Dana Torres",
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "casey@redlineevents.com" },
    update: {},
    create: {
      companyId: redline.id,
      email: "casey@redlineevents.com",
      passwordHash: hashSync("password123", 12),
      name: "Casey Nguyen",
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
  });

  // 6. Greenfield Co — active, 2 active orders
  const greenfield = await prisma.company.upsert({
    where: { slug: "greenfield-co" },
    update: {},
    create: {
      name: "Greenfield Co",
      slug: "greenfield-co",
      inviteCode: "GREEN-INVITE-2026",
      status: "active",
      phone: "(206) 555-0388",
      address: "1010 Evergreen Way, Seattle, WA 98101",
      notes: "Eco-focused brand. Only uses organic cotton and recycled polyester.",
    },
  });

  await prisma.user.upsert({
    where: { email: "sam@greenfield.co" },
    update: {},
    create: {
      companyId: greenfield.id,
      email: "sam@greenfield.co",
      passwordHash: hashSync("password123", 12),
      name: "Sam Okafor",
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
    },
  });

  // ─── Seed Orders, Quotes, and Projects ──────────────────────────────
  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400_000);

  // ── Acme orders ──
  const acmeOrder1 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "ORD-2026-001",
      title: "Summer Festival Tees — Venue 1",
      status: "IN_PRODUCTION",
      dueDate: daysFromNow(30),
      eventName: "Summer Music Festival",
    },
  });

  const acmeOrder2 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "ORD-2026-002",
      title: "Summer Festival Tees — Venue 2",
      status: "IN_PRODUCTION",
      dueDate: daysFromNow(30),
      eventName: "Summer Music Festival",
    },
  });

  const acmeOrder3 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: johnDoe.id,
      displayId: "ORD-2026-003",
      title: "Summer Festival Tanks",
      status: "APPROVED",
      dueDate: daysFromNow(30),
      eventName: "Summer Music Festival",
    },
  });

  const acmeOrder4 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "ORD-2026-004",
      title: "Trade Show Banners",
      status: "IN_REVIEW",
      dueDate: daysFromNow(16),
      eventName: "SXSW 2026",
    },
  });

  // Completed orders for Acme (Holiday project)
  const acmeOrder5 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "ORD-2025-031",
      title: "Holiday Gift Box — Design A",
      status: "COMPLETED",
    },
  });
  const acmeOrder6 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "ORD-2025-032",
      title: "Holiday Gift Box — Design B",
      status: "COMPLETED",
    },
  });
  const acmeOrder7 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "ORD-2025-033",
      title: "Holiday Gift Box — VIP Edition",
      status: "SHIPPED",
    },
  });
  const acmeOrder8 = await prisma.order.create({
    data: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "ORD-2025-034",
      title: "Holiday Tissue Paper & Ribbon",
      status: "COMPLETED",
    },
  });

  // ── Acme quotes ──
  const acmeQuote1 = await prisma.quote.create({
    data: {
      companyId: demo.id,
      displayId: "QTE-2026-001",
      title: "Festival Lanyards & Wristbands",
      status: "SENT",
      amount: 2400,
    },
  });

  const acmeQuote2 = await prisma.quote.create({
    data: {
      companyId: demo.id,
      displayId: "QTE-2026-002",
      title: "Trade Show Table Throws",
      status: "REVIEWING",
      amount: 1800,
    },
  });

  const acmeQuote3 = await prisma.quote.create({
    data: {
      companyId: demo.id,
      displayId: "QTE-2026-003",
      title: "Badge Lanyards — SXSW",
      status: "SENT",
      amount: 950,
    },
  });

  // ── Bloom orders ──
  const bloomOrder1 = await prisma.order.create({
    data: {
      companyId: bloom.id,
      createdBy: (await prisma.user.findUnique({ where: { email: "lily@bloomstudio.com" } }))!.id,
      displayId: "ORD-2026-010",
      title: "Rebrand Tumblers — 16oz",
      status: "AWAITING_PROOF",
      dueDate: daysFromNow(21),
    },
  });

  const bloomOrder2 = await prisma.order.create({
    data: {
      companyId: bloom.id,
      createdBy: (await prisma.user.findUnique({ where: { email: "lily@bloomstudio.com" } }))!.id,
      displayId: "ORD-2026-011",
      title: "Rebrand Mugs — New Logo",
      status: "IN_REVIEW",
      dueDate: daysFromNow(21),
    },
  });

  // Bloom quote
  const bloomQuote1 = await prisma.quote.create({
    data: {
      companyId: bloom.id,
      displayId: "QTE-2026-010",
      title: "New Hire Welcome Kit — Hoodies",
      status: "SENT",
      amount: 4500,
    },
  });

  // ── Create proof pending approval for Bloom order (to trigger NEEDS_ATTENTION) ──
  await prisma.proof.create({
    data: {
      orderId: bloomOrder1.id,
      version: 1,
      status: "SENT",
      publishedBy: cccAdmin.id,
    },
  });

  // Create overdue invoice for Bloom order (to trigger NEEDS_ATTENTION)
  await prisma.invoice.create({
    data: {
      orderId: bloomOrder1.id,
      companyId: bloom.id,
      displayId: "INV-2026-010",
      amountTotal: 3200,
      balanceRemaining: 3200,
      status: "UNPAID",
      dueDate: new Date(now.getTime() - 7 * 86400_000), // 7 days overdue
    },
  });

  // ── Create Projects ──────────────────────────────────────────────────

  const lilyId = (await prisma.user.findUnique({ where: { email: "lily@bloomstudio.com" } }))!.id;

  // 1. Summer Festival Tees 2026 (Acme, IN_PRODUCTION)
  const project1 = await prisma.project.create({
    data: {
      companyId: demo.id,
      name: "Summer Festival Tees 2026",
      description: "Custom tees and tanks for the Summer Music Festival series. 3 venues, 5 designs.",
      category: "APPAREL",
      eventDate: new Date("2026-06-15"),
      createdById: janeSmith.id,
    },
  });
  await prisma.order.updateMany({
    where: { id: { in: [acmeOrder1.id, acmeOrder2.id, acmeOrder3.id] } },
    data: { projectId: project1.id },
  });
  await prisma.quote.update({
    where: { id: acmeQuote1.id },
    data: { projectId: project1.id },
  });

  // 2. Trade Show Booth — SXSW (Acme, ACTIVE)
  const project2 = await prisma.project.create({
    data: {
      companyId: demo.id,
      name: "Trade Show Booth — SXSW",
      description: "Retractable banners, table throws, and badge lanyards for SXSW 2026.",
      category: "SIGNAGE",
      eventDate: new Date("2026-03-13"),
      createdById: janeSmith.id,
    },
  });
  await prisma.order.update({
    where: { id: acmeOrder4.id },
    data: { projectId: project2.id },
  });
  await prisma.quote.updateMany({
    where: { id: { in: [acmeQuote2.id, acmeQuote3.id] } },
    data: { projectId: project2.id },
  });

  // 3. New Hire Welcome Kits Q2 (Bloom, IN_REVIEW)
  const project3 = await prisma.project.create({
    data: {
      companyId: bloom.id,
      name: "New Hire Welcome Kits Q2",
      description: "Branded hoodies, notebooks, and water bottles for Q2 onboarding.",
      category: "APPAREL",
      createdById: lilyId,
    },
  });
  await prisma.quote.update({
    where: { id: bloomQuote1.id },
    data: { projectId: project3.id },
  });

  // 4. Rebrand Launch — Drinkware (Bloom, NEEDS_ATTENTION)
  const project4 = await prisma.project.create({
    data: {
      companyId: bloom.id,
      name: "Rebrand Launch — Drinkware",
      description: "New logo rollout on tumblers and mugs. Proof revision pending.",
      category: "DRINKWARE",
      createdById: lilyId,
    },
  });
  await prisma.order.updateMany({
    where: { id: { in: [bloomOrder1.id, bloomOrder2.id] } },
    data: { projectId: project4.id },
  });

  // 5. Holiday Gift Boxes 2025 (Acme, COMPLETED)
  const project5 = await prisma.project.create({
    data: {
      companyId: demo.id,
      name: "Holiday Gift Boxes 2025",
      description: "Custom packaging for client holiday gift program. All shipped.",
      category: "PACKAGING",
      createdById: janeSmith.id,
    },
  });
  await prisma.order.updateMany({
    where: { id: { in: [acmeOrder5.id, acmeOrder6.id, acmeOrder7.id, acmeOrder8.id] } },
    data: { projectId: project5.id },
  });

  // 6. Empty Project Placeholder (Bloom)
  await prisma.project.create({
    data: {
      companyId: bloom.id,
      name: "Empty Project Placeholder",
      category: "OTHER",
      createdById: lilyId,
    },
  });

  // Recompute derived status for all projects
  // Import and use inline since seed runs standalone
  const { deriveProjectStatus } = await import("../src/lib/projects");
  for (const proj of [project1, project2, project3, project4, project5]) {
    const full = await prisma.project.findUniqueOrThrow({
      where: { id: proj.id },
      include: {
        orders: {
          select: {
            status: true,
            proofs: { select: { status: true } },
            invoices: { select: { status: true, dueDate: true } },
          },
        },
        quotes: { select: { status: true } },
      },
    });
    const derived = deriveProjectStatus(full as any);
    await prisma.project.update({
      where: { id: proj.id },
      data: { derivedStatus: derived },
    });
  }

  console.log("Projects seeded!");

  // ─── Seed Message Threads ────────────────────────────────────────────
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

  // ─── Seed Quotes ─────────────────────────────────────────────────────
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400_000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400_000);

  // Delete existing quotes and quote requests (idempotent re-seed)
  await prisma.quoteRequest.deleteMany({});
  await prisma.quote.deleteMany({});

  const qt041 = await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-041",
      companyId: demo.id,
      createdById: cccAdmin.id,
      assignedToId: cccAdmin.id,
      projectName: "Q4 Apparel Collection",
      description: "Custom Screen Printing",
      status: "pending_approval",
      totalAmount: 4250,
      expiresAt: daysFromNow(5),
      createdAt: daysAgo(10),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-039",
      companyId: globex.id,
      createdById: cccAdmin.id,
      assignedToId: cccAdmin.id,
      projectName: "Tech Summit Signage",
      description: "Vinyl Banners & Flags",
      status: "approved",
      totalAmount: 12400,
      approvedAt: daysAgo(5),
      createdAt: daysAgo(15),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-044",
      companyId: bloom.id,
      createdById: cccAdmin.id,
      projectName: "Spring Collection Print Run",
      description: "DTG on Premium Cotton",
      status: "approved",
      totalAmount: 3400,
      approvedAt: daysAgo(3),
      createdAt: daysAgo(12),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-048",
      companyId: demo.id,
      createdById: cccAdmin.id,
      projectName: "Holiday Gift Boxes",
      description: "Premium Packaging",
      status: "sent",
      totalAmount: 2800,
      expiresAt: daysFromNow(12),
      createdAt: daysAgo(7),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-050",
      companyId: bloom.id,
      createdById: cccAdmin.id,
      projectName: "Custom Packaging Redesign",
      description: "Eco-Friendly Materials",
      status: "sent",
      totalAmount: 1900,
      expiresAt: daysFromNow(8),
      createdAt: daysAgo(5),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-052",
      companyId: globex.id,
      createdById: cccAdmin.id,
      projectName: "Onboarding Kit Bundle",
      description: "Mixed Media Kit",
      status: "draft",
      totalAmount: 3200,
      createdAt: daysAgo(2),
    },
  });

  const qt053 = await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-053",
      companyId: bloom.id,
      createdById: cccAdmin.id,
      projectName: "Sticker Subscription Q2",
      description: "Die-Cut Vinyl",
      status: "expired",
      totalAmount: 600,
      expiresAt: daysAgo(3),
      createdAt: daysAgo(30),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-035",
      companyId: novatech.id,
      createdById: cccAdmin.id,
      projectName: "Annual Report Printing",
      description: "Matte Finish, Gold Foil",
      status: "declined",
      totalAmount: 5500,
      declinedAt: daysAgo(10),
      createdAt: daysAgo(40),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-046",
      companyId: redline.id,
      createdById: cccAdmin.id,
      assignedToId: cccAdmin.id,
      projectName: "Festival Full Package",
      description: "Event Backdrop & Stands",
      status: "pending_approval",
      totalAmount: 15980,
      expiresAt: daysFromNow(2),
      createdAt: daysAgo(8),
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "QT-2026-049",
      companyId: greenfield.id,
      createdById: cccAdmin.id,
      projectName: "Eco Product Launch Kit",
      description: "Recycled Materials",
      status: "approved",
      totalAmount: 2100,
      approvedAt: daysAgo(2),
      createdAt: daysAgo(14),
    },
  });

  // ─── Seed Quote Requests ────────────────────────────────────────────

  await prisma.quoteRequest.create({
    data: {
      companyId: demo.id,
      requestedById: janeSmith.id,
      title: "Custom Embroidered Jackets",
      description: "Looking for embroidered jackets for our sales team, approx 50 units.",
      status: "new",
      createdAt: daysAgo(1),
    },
  });

  await prisma.quoteRequest.create({
    data: {
      companyId: demo.id,
      requestedById: janeSmith.id,
      title: "Warehouse Team Vests",
      description: "High-visibility vests with company logo for warehouse staff.",
      status: "reviewing",
      createdAt: daysAgo(5),
    },
  });

  await prisma.quoteRequest.create({
    data: {
      companyId: globex.id,
      requestedById: globexAdmin.id,
      title: "Executive Gift Set",
      description: "Premium gift sets for C-level executives, leather-bound notebooks and pens.",
      status: "new",
      createdAt: daysAgo(2),
    },
  });

  const bloomAdmin = await prisma.user.findUnique({ where: { email: "lily@bloomstudio.com" } });
  const redlineAdmin = await prisma.user.findUnique({ where: { email: "dana@redlineevents.com" } });

  await prisma.quoteRequest.create({
    data: {
      companyId: bloom.id,
      requestedById: bloomAdmin!.id,
      title: "Seasonal Window Decals",
      description: "Full-color window decals for spring storefront display.",
      status: "reviewing",
      createdAt: daysAgo(3),
    },
  });

  await prisma.quoteRequest.create({
    data: {
      companyId: bloom.id,
      requestedById: bloomAdmin!.id,
      title: "Branded Aprons",
      description: "Custom embroidered aprons for studio staff.",
      status: "quoted",
      quotedAmount: 600,
      linkedQuoteId: qt053.id,
      createdAt: daysAgo(10),
    },
  });

  await prisma.quoteRequest.create({
    data: {
      companyId: redline.id,
      requestedById: redlineAdmin!.id,
      title: "VIP Lanyards & Badges",
      description: "Custom lanyards and badge holders for upcoming festival VIP area.",
      status: "new",
      createdAt: hoursAgo(12),
    },
  });

  console.log("Seed complete!");
  console.log("---");
  console.log("CCC Staff login:  admin@centralcreative.co / password123");
  console.log("Client Admin:     admin@acme.com / password123");
  console.log("Client User:      user@acme.com / password123");
  console.log("Globex Admin:     hank@globex.com / password123");
  console.log("Bloom Admin:      lily@bloomstudio.com / password123");
  console.log("NovaTech Admin:   marcus@novatech.io / password123");
  console.log("Redline Admin:    dana@redlineevents.com / password123");
  console.log("Greenfield Admin: sam@greenfield.co / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
