import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const DATABASE_URL =
  process.env["DATABASE_URL"] ||
  "postgresql://csuite:csuite_dev@localhost:5432/csuite?schema=public";

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

async function main() {
  console.log("Seeding database...");

  // Clean up all seeded data to prevent duplicates on re-run.
  await prisma.auditLogEvent.deleteMany();
  await prisma.automationRun.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.proofAnnotationComment.deleteMany();
  await prisma.proofApproval.deleteMany();
  await prisma.proofAnnotation.deleteMany();
  await prisma.proofAsset.deleteMany();
  await prisma.proofVersion.deleteMany();
  await prisma.proof.deleteMany();
  await prisma.clientProductImprint.deleteMany();
  await prisma.clientProduct.deleteMany();
  await prisma.artworkVersion.deleteMany();
  await prisma.artworkTag.deleteMany();
  await prisma.orderArtworkLink.deleteMany();
  await prisma.artworkQuoteLink.deleteMany();
  await prisma.artworkAsset.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.quoteChangeRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.threadReadState.deleteMany();
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.quoteRequestItem.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventoryLedgerEntry.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.internalTask.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.project.deleteMany();
  await prisma.savedProduct.deleteMany();
  await prisma.location.deleteMany();
  await prisma.catalogProduct.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // ═══════════════════════════════════════════════════════════════════
  // COMPANIES & USERS
  // ═══════════════════════════════════════════════════════════════════

  const ccc = await prisma.company.upsert({
    where: { slug: "central-creative" },
    update: {},
    create: {
      name: "Central Creative Co.",
      slug: "central-creative",
      inviteCode: "CCC-STAFF-2026",
    },
  });

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

  const cccSarah = await prisma.user.upsert({
    where: { email: "sarah@centralcreative.co" },
    update: {},
    create: {
      companyId: ccc.id,
      email: "sarah@centralcreative.co",
      passwordHash: hashSync("password123", 12),
      name: "Sarah Lin",
      role: "CCC_STAFF",
      status: "ACTIVE",
    },
  });

  // --- Acme Corp ---
  const acme = await prisma.company.upsert({
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
      companyId: acme.id,
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
      companyId: acme.id,
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
      companyId: acme.id,
      email: "mike@acme.com",
      passwordHash: hashSync("password123", 12),
      name: "Mike Rivera",
      role: "CLIENT_USER",
      status: "ACTIVE",
    },
  });

  const acmeHQ = await prisma.location.create({
    data: {
      companyId: acme.id,
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
  });

  // --- Globex Corporation ---
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

  const hankScorpio = await prisma.user.upsert({
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

  const globexHQ = await prisma.location.create({
    data: {
      companyId: globex.id,
      label: "Main Office",
      addressLine1: "456 Globex Blvd",
      city: "Cypress Creek",
      state: "OR",
      zip: "97401",
      country: "US",
      contactName: "Hank Scorpio",
      contactPhone: "541-555-0199",
      isDefault: true,
    },
  });

  // --- Bloom Studio ---
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

  const lilyChen = await prisma.user.upsert({
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
    create: { companyId: bloom.id, email: "omar@bloomstudio.com", passwordHash: hashSync("password123", 12), name: "Omar Patel", role: "CLIENT_USER", status: "ACTIVE" },
  });

  await prisma.user.upsert({
    where: { email: "nina@bloomstudio.com" },
    update: {},
    create: { companyId: bloom.id, email: "nina@bloomstudio.com", passwordHash: hashSync("password123", 12), name: "Nina Brooks", role: "CLIENT_USER", status: "ACTIVE" },
  });

  const bloomHQ = await prisma.location.create({
    data: {
      companyId: bloom.id,
      label: "Studio",
      addressLine1: "789 Flower Ave",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "US",
      contactName: "Lily Chen",
      contactPhone: "415-555-0234",
      isDefault: true,
    },
  });

  // --- NovaTech Industries ---
  await prisma.company.upsert({
    where: { slug: "novatech-industries" },
    update: {},
    create: { name: "NovaTech Industries", slug: "novatech-industries", inviteCode: "NOVA-INVITE-2026", status: "paused", phone: "(312) 555-0777", address: "200 Innovation Dr, Chicago, IL 60601", notes: "Account paused — pending budget approval for Q2." },
  });

  await prisma.user.upsert({
    where: { email: "marcus@novatech.io" },
    update: {},
    create: { companyId: (await prisma.company.findUnique({ where: { slug: "novatech-industries" } }))!.id, email: "marcus@novatech.io", passwordHash: hashSync("password123", 12), name: "Marcus Webb", role: "CLIENT_ADMIN", status: "ACTIVE" },
  });

  // --- Redline Events ---
  const redline = await prisma.company.upsert({
    where: { slug: "redline-events" },
    update: {},
    create: { name: "Redline Events", slug: "redline-events", inviteCode: "REDLINE-INVITE-2026", status: "overdue", phone: "(305) 555-0412", address: "55 Ocean Dr, Miami, FL 33139", notes: "Outstanding invoice. Contacted 3 times. Escalate if no payment by March 1." },
  });

  await prisma.user.upsert({ where: { email: "dana@redlineevents.com" }, update: {}, create: { companyId: redline.id, email: "dana@redlineevents.com", passwordHash: hashSync("password123", 12), name: "Dana Torres", role: "CLIENT_ADMIN", status: "ACTIVE" } });
  await prisma.user.upsert({ where: { email: "casey@redlineevents.com" }, update: {}, create: { companyId: redline.id, email: "casey@redlineevents.com", passwordHash: hashSync("password123", 12), name: "Casey Nguyen", role: "CLIENT_USER", status: "ACTIVE" } });

  // --- Greenfield Co ---
  await prisma.company.upsert({
    where: { slug: "greenfield-co" },
    update: {},
    create: { name: "Greenfield Co", slug: "greenfield-co", inviteCode: "GREEN-INVITE-2026", status: "active", phone: "(206) 555-0388", address: "1010 Evergreen Way, Seattle, WA 98101", notes: "Eco-focused brand. Only uses organic cotton and recycled polyester." },
  });

  await prisma.user.upsert({ where: { email: "sam@greenfield.co" }, update: {}, create: { companyId: (await prisma.company.findUnique({ where: { slug: "greenfield-co" } }))!.id, email: "sam@greenfield.co", passwordHash: hashSync("password123", 12), name: "Sam Okafor", role: "CLIENT_ADMIN", status: "ACTIVE" } });

  // ═══════════════════════════════════════════════════════════════════
  // VENDORS
  // ═══════════════════════════════════════════════════════════════════

  const vendorSS = await prisma.vendor.create({
    data: { name: "S&S Activewear", contactName: "Support Team", email: "orders@ssactivewear.com", website: "https://ssactivewear.com", categories: ["apparel"], tags: ["blanks", "activewear"] },
  });

  const vendorSanMar = await prisma.vendor.create({
    data: { name: "SanMar", contactName: "Rep Team", email: "orders@sanmar.com", website: "https://sanmar.com", categories: ["apparel", "headwear"], tags: ["blanks", "caps"] },
  });

  // ═══════════════════════════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════════════════════════

  const projSpring = await prisma.project.create({
    data: { companyId: acme.id, name: "Spring Merch 2026", description: "All spring collateral — polos, hats, banners.", createdById: cccAdmin.id, status: "IN_PROGRESS", eventDate: daysAgo(-30) },
  });

  const projSxsw = await prisma.project.create({
    data: { companyId: acme.id, name: "SXSW 2026", description: "Booth banners and table throws for the Austin conference.", createdById: cccAdmin.id, status: "IN_PROGRESS", eventDate: daysAgo(-14) },
  });

  const projBloomLaunch = await prisma.project.create({
    data: { companyId: bloom.id, name: "Brand Relaunch", description: "New logo, tees, pouches for brand relaunch event.", createdById: cccAdmin.id, status: "PLANNING" },
  });

  const projGlobexQ1 = await prisma.project.create({
    data: { companyId: globex.id, name: "Q1 Onboarding Swag", description: "Hoodies, notebooks, lanyards for new hire kits.", createdById: cccSarah.id, status: "IN_PROGRESS" },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════════

  const ord1 = await prisma.order.create({
    data: {
      number: "ORD-2026-001",
      companyId: acme.id,
      createdByUserId: cccAdmin.id,
      projectId: projSpring.id,
      title: "Acme Polo Shirts — Spring Run",
      status: "COMPLETED",
      totalAmount: 2350.00,
      inHandsDate: daysAgo(10),
      poNumber: "PO-ACME-4420",
      internalNotes: "Rush order. Client confirmed navy thread on collar.",
      createdAt: daysAgo(45),
      items: {
        create: [
          { description: "Bella+Canvas 3001 — Heather Navy", sku: "BC3001-HTHR-NVY", color: "Heather Navy", unitPrice: 14.50, quantity: 100, lineTotal: 1450.00, sizeBreakdown: { S: 15, M: 30, L: 30, XL: 20, "2XL": 5 }, decorationNotes: "Left chest embroidered logo, 8k stitches.", vendorId: vendorSS.id, sortOrder: 0 },
          { description: "Richardson 112 Trucker — Heather/Black", sku: "R112-HTHR-BLK", color: "Heather Grey/Black", unitPrice: 18.00, quantity: 50, lineTotal: 900.00, decorationNotes: "Front center embroidered logo.", vendorId: vendorSanMar.id, sortOrder: 1 },
        ],
      },
    },
  });

  const ord2 = await prisma.order.create({
    data: {
      number: "ORD-2026-002",
      companyId: acme.id,
      createdByUserId: cccAdmin.id,
      projectId: projSxsw.id,
      title: "Acme Trade Show Kit",
      status: "IN_PRODUCTION",
      totalAmount: 845.00,
      inHandsDate: daysAgo(-14),
      poNumber: "PO-ACME-4421",
      internalNotes: "Banners + table throw. Artwork finalized.",
      createdAt: daysAgo(30),
      items: {
        create: [
          { description: "Retractable Banner Stand 33x80\"", unitPrice: 185.00, quantity: 3, lineTotal: 555.00, decorationNotes: "Full color print. Artwork: acme-tradeshow-2026-v2.pdf", sortOrder: 0 },
          { description: "Table Throw 6ft Full Color", unitPrice: 145.00, quantity: 2, lineTotal: 290.00, decorationNotes: "Full wrap print. Match PMS 286C.", sortOrder: 1 },
        ],
      },
    },
  });

  const ord3 = await prisma.order.create({
    data: {
      number: "ORD-2026-003",
      companyId: acme.id,
      createdByUserId: cccAdmin.id,
      title: "Office Welcome Kits — Q2",
      status: "SUBMITTED",
      totalAmount: 1590.00,
      inHandsDate: daysAgo(-30),
      clientNotes: "Converted from QT-2026-002.",
      createdAt: daysAgo(5),
      items: {
        create: [
          { description: "Custom Moleskine Notebook — Black", unitPrice: 22.00, quantity: 30, lineTotal: 660.00, decorationNotes: "Debossed logo on cover.", sortOrder: 0 },
          { description: "Miir 16oz Travel Tumbler — White", unitPrice: 28.50, quantity: 30, lineTotal: 855.00, decorationNotes: "Laser engraved logo.", sortOrder: 1 },
          { description: "Branded Sticker Sheet (4x6)", unitPrice: 2.50, quantity: 30, lineTotal: 75.00, sortOrder: 2 },
        ],
      },
    },
  });

  const ord4 = await prisma.order.create({
    data: {
      number: "ORD-2026-004",
      companyId: globex.id,
      createdByUserId: cccSarah.id,
      projectId: projGlobexQ1.id,
      title: "Globex Winter Hoodies — 500 Units",
      status: "IN_REVIEW",
      totalAmount: 16000.00,
      inHandsDate: daysAgo(-21),
      poNumber: "PO-GLX-0088",
      internalNotes: "Awaiting sizing sample approval before moving to production.",
      createdAt: daysAgo(20),
      items: {
        create: [
          { description: "Independent Trading Co. IND4000 — Black", sku: "IND4000-BLK", color: "Black", unitPrice: 32.00, quantity: 500, lineTotal: 16000.00, sizeBreakdown: { S: 50, M: 125, L: 150, XL: 125, "2XL": 50 }, decorationNotes: "Left chest: embroidered Globex logo. Back: large screen print.", vendorId: vendorSS.id, sortOrder: 0 },
        ],
      },
    },
  });

  const ord5 = await prisma.order.create({
    data: {
      number: "ORD-2026-005",
      companyId: bloom.id,
      createdByUserId: cccAdmin.id,
      projectId: projBloomLaunch.id,
      title: "Bloom Brand Launch Tees",
      status: "APPROVED",
      totalAmount: 5600.00,
      inHandsDate: daysAgo(-7),
      createdAt: daysAgo(18),
      items: {
        create: [
          { description: "AS Colour 5001 — Natural", sku: "ASC5001-NAT", color: "Natural", unitPrice: 16.00, quantity: 200, lineTotal: 3200.00, sizeBreakdown: { S: 30, M: 60, L: 60, XL: 40, "2XL": 10 }, decorationNotes: "Front: oversized screen print, 2 colors. Custom hang tag.", sortOrder: 0 },
          { description: "Canvas Zip Pouch — Natural", unitPrice: 12.00, quantity: 200, lineTotal: 2400.00, decorationNotes: "1-color screen print.", sortOrder: 1 },
        ],
      },
    },
  });

  const ord6 = await prisma.order.create({
    data: {
      number: "ORD-2026-006",
      companyId: globex.id,
      createdByUserId: cccAdmin.id,
      projectId: projGlobexQ1.id,
      title: "Globex Quarterly Notebooks",
      status: "SHIPPED",
      totalAmount: 2400.00,
      inHandsDate: daysAgo(2),
      poNumber: "PO-GLX-0085",
      createdAt: daysAgo(35),
      items: {
        create: [
          { description: "Leuchtturm1917 A5 Hardcover — Navy", unitPrice: 24.00, quantity: 100, lineTotal: 2400.00, decorationNotes: "Gold foil deboss of Globex logo on cover.", sortOrder: 0 },
        ],
      },
    },
  });

  const ord7 = await prisma.order.create({
    data: {
      number: "ORD-2026-007",
      companyId: acme.id,
      createdByUserId: cccAdmin.id,
      projectId: projSpring.id,
      title: "Acme Summer Event Tees",
      status: "READY",
      totalAmount: 1305.00,
      inHandsDate: daysAgo(-3),
      createdAt: daysAgo(25),
      items: {
        create: [
          { description: "Bella+Canvas 3001 — Heather Navy", sku: "BC3001-HTHR-NVY", color: "Heather Navy", unitPrice: 14.50, quantity: 90, lineTotal: 1305.00, sizeBreakdown: { S: 10, M: 25, L: 30, XL: 20, "2XL": 5 }, vendorId: vendorSS.id, sortOrder: 0 },
        ],
      },
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVOICES, INVOICE ITEMS & PAYMENTS
  // ═══════════════════════════════════════════════════════════════════

  const inv1 = await prisma.invoice.create({
    data: {
      number: "INV-2026-001",
      orderId: ord1.id,
      companyId: acme.id,
      status: "PAID",
      dueDate: daysAgo(15),
      issuedAt: daysAgo(40),
      paidAt: daysAgo(12),
      items: {
        create: [
          { description: "Bella+Canvas 3001 — Heather Navy x100", unitPrice: 14.50, quantity: 100, lineTotal: 1450.00 },
          { description: "Richardson 112 Trucker x50", unitPrice: 18.00, quantity: 50, lineTotal: 900.00 },
        ],
      },
    },
  });

  await prisma.payment.create({ data: { invoiceId: inv1.id, amount: 1175.00, method: "STRIPE", recordedByUserId: cccAdmin.id, paidAt: daysAgo(38) } });
  await prisma.payment.create({ data: { invoiceId: inv1.id, amount: 1175.00, method: "STRIPE", recordedByUserId: cccAdmin.id, paidAt: daysAgo(12) } });

  const inv2 = await prisma.invoice.create({
    data: {
      number: "INV-2026-002",
      orderId: ord2.id,
      companyId: acme.id,
      status: "PARTIALLY_PAID",
      dueDate: daysAgo(-7),
      issuedAt: daysAgo(28),
      items: {
        create: [
          { description: "Retractable Banner Stand 33x80\" x3", unitPrice: 185.00, quantity: 3, lineTotal: 555.00 },
          { description: "Table Throw 6ft Full Color x2", unitPrice: 145.00, quantity: 2, lineTotal: 290.00 },
        ],
      },
    },
  });

  await prisma.payment.create({ data: { invoiceId: inv2.id, amount: 422.50, method: "STRIPE", recordedByUserId: cccAdmin.id, paidAt: daysAgo(26), notes: "50% deposit" } });

  await prisma.invoice.create({
    data: {
      number: "INV-2026-003",
      orderId: ord4.id,
      companyId: globex.id,
      status: "SENT",
      dueDate: daysAgo(-14),
      issuedAt: daysAgo(18),
      items: { create: [{ description: "IND4000 Black Hoodies x500", unitPrice: 32.00, quantity: 500, lineTotal: 16000.00 }] },
    },
  });

  await prisma.invoice.create({
    data: {
      number: "INV-2026-004",
      orderId: ord5.id,
      companyId: bloom.id,
      status: "SENT",
      dueDate: daysAgo(-7),
      issuedAt: daysAgo(16),
      items: {
        create: [
          { description: "AS Colour 5001 Natural x200", unitPrice: 16.00, quantity: 200, lineTotal: 3200.00 },
          { description: "Canvas Zip Pouch x200", unitPrice: 12.00, quantity: 200, lineTotal: 2400.00 },
        ],
      },
    },
  });

  const inv5 = await prisma.invoice.create({
    data: {
      number: "INV-2026-005",
      orderId: ord6.id,
      companyId: globex.id,
      status: "PAID",
      dueDate: daysAgo(5),
      issuedAt: daysAgo(30),
      paidAt: daysAgo(8),
      items: { create: [{ description: "Leuchtturm1917 A5 Navy x100", unitPrice: 24.00, quantity: 100, lineTotal: 2400.00 }] },
    },
  });

  await prisma.payment.create({ data: { invoiceId: inv5.id, amount: 2400.00, method: "CHECK", recordedByUserId: cccAdmin.id, paidAt: daysAgo(8), reference: "Check #4492" } });

  const inv6 = await prisma.invoice.create({
    data: {
      number: "INV-2026-006",
      orderId: ord7.id,
      companyId: acme.id,
      status: "PAID",
      dueDate: daysAgo(3),
      issuedAt: daysAgo(22),
      paidAt: daysAgo(5),
      items: { create: [{ description: "Bella+Canvas 3001 Heather Navy x90", unitPrice: 14.50, quantity: 90, lineTotal: 1305.00 }] },
    },
  });

  await prisma.payment.create({ data: { invoiceId: inv6.id, amount: 1305.00, method: "STRIPE", recordedByUserId: cccAdmin.id, paidAt: daysAgo(5) } });

  // ═══════════════════════════════════════════════════════════════════
  // SHIPMENTS
  // ═══════════════════════════════════════════════════════════════════

  await prisma.shipment.create({ data: { orderId: ord1.id, locationId: acmeHQ.id, carrier: "FedEx", trackingNumber: "794644790132", status: "DELIVERED", shippedAt: daysAgo(14), deliveredAt: daysAgo(11) } });
  await prisma.shipment.create({ data: { orderId: ord6.id, locationId: globexHQ.id, carrier: "UPS", trackingNumber: "1Z999AA10123456784", status: "IN_TRANSIT", shippedAt: daysAgo(2) } });
  await prisma.shipment.create({ data: { orderId: ord7.id, locationId: acmeHQ.id, carrier: "FedEx", trackingNumber: "794644790145", status: "LABEL_CREATED" } });

  // ═══════════════════════════════════════════════════════════════════
  // ARTWORK
  // ═══════════════════════════════════════════════════════════════════

  const art1 = await prisma.artworkAsset.create({
    data: {
      companyId: acme.id, name: "Acme Primary Logo", filename: "acme-logo-primary.ai", fileType: "ai", currentVersion: 2, createdBy: cccAdmin.id, createdAt: daysAgo(60),
      versions: {
        create: [
          { versionNumber: 1, fileName: "acme-logo-v1.ai", fileUrl: "/uploads/artwork/acme-logo-v1.ai", fileSize: 2_400_000, mimeType: "application/illustrator", uploadedBy: cccAdmin.id, createdAt: daysAgo(60) },
          { versionNumber: 2, fileName: "acme-logo-v2.ai", fileUrl: "/uploads/artwork/acme-logo-v2.ai", fileSize: 2_600_000, mimeType: "application/illustrator", uploadedBy: cccAdmin.id, createdAt: daysAgo(30), notes: "Updated with refined icon." },
        ],
      },
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: acme.id, name: "Trade Show Banner", filename: "acme-tradeshow-banner.pdf", fileType: "pdf", currentVersion: 1, createdBy: cccAdmin.id, createdAt: daysAgo(35),
      versions: {
        create: [{ versionNumber: 1, fileName: "acme-tradeshow-banner-v1.pdf", fileUrl: "/uploads/artwork/acme-tradeshow-banner-v1.pdf", fileSize: 8_200_000, mimeType: "application/pdf", uploadedBy: cccAdmin.id, createdAt: daysAgo(35) }],
      },
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: globex.id, name: "Globex Embroidery File", filename: "globex-logo-embroidery.dst", fileType: "dst", currentVersion: 1, createdBy: cccSarah.id, createdAt: daysAgo(25),
      versions: {
        create: [{ versionNumber: 1, fileName: "globex-logo-embroidery.dst", fileUrl: "/uploads/artwork/globex-logo-embroidery.dst", fileSize: 450_000, mimeType: "application/octet-stream", uploadedBy: cccSarah.id, createdAt: daysAgo(25) }],
      },
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: bloom.id, name: "Bloom Tee Front Print", filename: "bloom-rebrand-tee-front.psd", fileType: "psd", currentVersion: 3, createdBy: cccAdmin.id, createdAt: daysAgo(40),
      versions: {
        create: [
          { versionNumber: 1, fileName: "bloom-tee-v1.psd", fileUrl: "/uploads/artwork/bloom-tee-v1.psd", fileSize: 12_000_000, mimeType: "image/vnd.adobe.photoshop", uploadedBy: cccAdmin.id, createdAt: daysAgo(40) },
          { versionNumber: 2, fileName: "bloom-tee-v2.psd", fileUrl: "/uploads/artwork/bloom-tee-v2.psd", fileSize: 12_800_000, mimeType: "image/vnd.adobe.photoshop", uploadedBy: cccAdmin.id, createdAt: daysAgo(28), notes: "Scaled up print 20%." },
          { versionNumber: 3, fileName: "bloom-tee-v3.psd", fileUrl: "/uploads/artwork/bloom-tee-v3.psd", fileSize: 13_100_000, mimeType: "image/vnd.adobe.photoshop", uploadedBy: cccAdmin.id, createdAt: daysAgo(15), notes: "Fixed PMS spot color." },
        ],
      },
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: bloom.id, name: "Bloom Zip Pouch", filename: "bloom-zip-pouch-artwork.ai", fileType: "ai", currentVersion: 1, createdBy: cccSarah.id, createdAt: daysAgo(20),
      versions: {
        create: [{ versionNumber: 1, fileName: "bloom-pouch-v1.ai", fileUrl: "/uploads/artwork/bloom-pouch-v1.ai", fileSize: 3_400_000, mimeType: "application/illustrator", uploadedBy: cccSarah.id, createdAt: daysAgo(20) }],
      },
    },
  });

  // Link artwork to orders
  await prisma.orderArtworkLink.create({ data: { orderId: ord1.id, artworkAssetId: art1.id, label: "Primary logo for embroidery" } });

  // ═══════════════════════════════════════════════════════════════════
  // PROOFS
  // ═══════════════════════════════════════════════════════════════════

  // Proof 1: Acme Polo — APPROVED
  const proof1 = await prisma.proof.create({ data: { companyId: acme.id, orderId: ord1.id, title: "Acme Polo Shirt — Left Chest Embroidery", createdById: cccAdmin.id, createdAt: daysAgo(40) } });

  const p1v1 = await prisma.proofVersion.create({ data: { proofId: proof1.id, versionNumber: 1, status: "SUPERSEDED", notes: "Initial mockup — centered logo placement.", publishedAt: daysAgo(38), publishedById: cccAdmin.id, createdAt: daysAgo(40) } });
  const p1v1asset = await prisma.proofAsset.create({ data: { versionId: p1v1.id, kind: "IMAGE", s3Key: "proofs/acme-polo-v1-front.png", fileName: "acme-polo-v1-front.png", mimeType: "image/png", width: 1200, height: 1600, position: 0 } });

  const p1v2 = await prisma.proofVersion.create({ data: { proofId: proof1.id, versionNumber: 2, status: "APPROVED", notes: "Moved logo to left chest per client request. Navy thread confirmed.", publishedAt: daysAgo(34), publishedById: cccAdmin.id, createdAt: daysAgo(36) } });
  const p1v2asset = await prisma.proofAsset.create({ data: { versionId: p1v2.id, kind: "IMAGE", s3Key: "proofs/acme-polo-v2-front.png", fileName: "acme-polo-v2-front.png", mimeType: "image/png", width: 1200, height: 1600, position: 0 } });

  await prisma.proof.update({ where: { id: proof1.id }, data: { currentVersionId: p1v2.id } });

  const p1a1 = await prisma.proofAnnotation.create({ data: { versionId: p1v1.id, assetId: p1v1asset.id, type: "PIN", x: 0.5, y: 0.35, seq: 1, status: "RESOLVED", authorId: janeSmith.id, resolvedById: cccAdmin.id, resolvedAt: daysAgo(36), createdAt: daysAgo(37) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p1a1.id, authorId: janeSmith.id, body: "Can we move the logo to the left chest? The centered placement feels off for a polo.", createdAt: daysAgo(37) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p1a1.id, authorId: cccAdmin.id, body: "Done — v2 has the left chest placement at 3.5\" wide.", createdAt: daysAgo(36) } });

  const p1a2 = await prisma.proofAnnotation.create({ data: { versionId: p1v2.id, assetId: p1v2asset.id, type: "REGION", x: 0.28, y: 0.1, w: 0.18, h: 0.08, seq: 1, status: "RESOLVED", authorId: janeSmith.id, resolvedById: cccAdmin.id, resolvedAt: daysAgo(33), createdAt: daysAgo(34) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p1a2.id, authorId: janeSmith.id, body: "Collar — confirm this is navy thread, not black?", createdAt: daysAgo(34) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p1a2.id, authorId: cccAdmin.id, body: "Confirmed navy thread (PMS 289) — production has stock.", createdAt: daysAgo(33) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p1a2.id, authorId: cccAdmin.id, body: "INTERNAL: checked with production — navy thread in stock, 4 spools remaining.", createdAt: daysAgo(33), isInternal: true } });

  await prisma.proofApproval.create({ data: { versionId: p1v2.id, decision: "APPROVED", signedName: "Jane Smith", signedById: janeSmith.id, ipAddress: "192.168.1.42", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", createdAt: daysAgo(32) } });

  // Proof 2: Acme Banners — SENT (awaiting review)
  const proof2 = await prisma.proof.create({ data: { companyId: acme.id, orderId: ord2.id, title: "Acme Trade Show Banners — SXSW 2026", createdById: cccAdmin.id, createdAt: daysAgo(28) } });

  const p2v1 = await prisma.proofVersion.create({ data: { proofId: proof2.id, versionNumber: 1, status: "SENT", notes: "First pass — 3 retractable banners, front artwork.", publishedAt: daysAgo(26), publishedById: cccAdmin.id, createdAt: daysAgo(28) } });
  const p2v1asset = await prisma.proofAsset.create({ data: { versionId: p2v1.id, kind: "PDF", s3Key: "proofs/acme-banner-v1.pdf", fileName: "acme-sxsw-banners-v1.pdf", mimeType: "application/pdf", width: 2550, height: 6150, pageCount: 3, position: 0 } });
  await prisma.proof.update({ where: { id: proof2.id }, data: { currentVersionId: p2v1.id } });

  const p2a1 = await prisma.proofAnnotation.create({ data: { versionId: p2v1.id, assetId: p2v1asset.id, type: "REGION", x: 0.15, y: 0.7, w: 0.7, h: 0.15, seq: 1, status: "OPEN", authorId: janeSmith.id, createdAt: daysAgo(24) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p2a1.id, authorId: janeSmith.id, body: "The tagline at the bottom is cut off on the banner mockup. Can you check the bleed area?", createdAt: daysAgo(24) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p2a1.id, authorId: cccAdmin.id, body: "Good catch — the text extends into the trim zone. I'll bump it up 0.5\" in the next revision.", createdAt: daysAgo(22) } });

  // Proof 3: Bloom Tees — CHANGES_REQUESTED
  const proof3 = await prisma.proof.create({ data: { companyId: bloom.id, orderId: ord5.id, title: "Bloom Rebrand Tee — Front Print", createdById: cccAdmin.id, createdAt: daysAgo(22) } });

  const p3v1 = await prisma.proofVersion.create({ data: { proofId: proof3.id, versionNumber: 1, status: "CHANGES_REQUESTED", notes: "Initial tee mockup on AS Colour 5001.", publishedAt: daysAgo(20), publishedById: cccAdmin.id, createdAt: daysAgo(22) } });
  const p3v1asset = await prisma.proofAsset.create({ data: { versionId: p3v1.id, kind: "IMAGE", s3Key: "proofs/bloom-tee-v1-front.png", fileName: "bloom-rebrand-tee-v1-front.png", mimeType: "image/png", width: 1200, height: 1600, position: 0 } });
  await prisma.proof.update({ where: { id: proof3.id }, data: { currentVersionId: p3v1.id } });

  const p3a1 = await prisma.proofAnnotation.create({ data: { versionId: p3v1.id, assetId: p3v1asset.id, type: "PIN", x: 0.5, y: 0.3, seq: 1, status: "OPEN", authorId: lilyChen.id, createdAt: daysAgo(18) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p3a1.id, authorId: lilyChen.id, body: "The print feels too small. Can we scale it up about 20%? It should be more oversized and impactful.", createdAt: daysAgo(18) } });

  const p3a2 = await prisma.proofAnnotation.create({ data: { versionId: p3v1.id, assetId: p3v1asset.id, type: "PIN", x: 0.48, y: 0.65, seq: 2, status: "OPEN", authorId: lilyChen.id, createdAt: daysAgo(18) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p3a2.id, authorId: lilyChen.id, body: "The color here looks more salmon than our brand coral (PMS 7417C). Can we match it exactly?", createdAt: daysAgo(18) } });
  await prisma.proofAnnotationComment.create({ data: { annotationId: p3a2.id, authorId: cccAdmin.id, body: "INTERNAL: need to re-separate this color. Current file uses a close CMYK build, not the PMS spot.", createdAt: daysAgo(17), isInternal: true } });

  await prisma.proofApproval.create({ data: { versionId: p3v1.id, decision: "CHANGES_REQUESTED", signedName: "Lily Chen", signedById: lilyChen.id, note: "Scale up the front print and fix the color — see my annotations.", createdAt: daysAgo(17) } });

  // Proof 4: Globex Hoodies — DRAFT
  const proof4 = await prisma.proof.create({ data: { companyId: globex.id, orderId: ord4.id, title: "Globex Hoodie — Embroidery + Back Print", createdById: cccSarah.id, createdAt: daysAgo(10) } });

  const p4v1 = await prisma.proofVersion.create({ data: { proofId: proof4.id, versionNumber: 1, status: "DRAFT", createdAt: daysAgo(10) } });
  await prisma.proofAsset.create({ data: { versionId: p4v1.id, kind: "IMAGE", s3Key: "proofs/globex-hoodie-v1-front.png", fileName: "globex-hoodie-v1-front.png", mimeType: "image/png", width: 1200, height: 1600, position: 0 } });
  await prisma.proofAsset.create({ data: { versionId: p4v1.id, kind: "IMAGE", s3Key: "proofs/globex-hoodie-v1-back.png", fileName: "globex-hoodie-v1-back.png", mimeType: "image/png", width: 1200, height: 1600, position: 1 } });
  await prisma.proof.update({ where: { id: proof4.id }, data: { currentVersionId: p4v1.id } });

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGE THREADS
  // ═══════════════════════════════════════════════════════════════════

  await prisma.messageThread.create({ data: { companyId: acme.id, orderId: ord1.id, subject: "Logo placement on polo shirts", orderTitle: "ORD-2026-001 — Acme Polo Shirts", status: "open", createdBy: janeSmith.id, assigneeId: cccAdmin.id, createdAt: hoursAgo(48), messages: { create: [
    { authorId: janeSmith.id, body: "Hi, can we move the logo to the left chest? The mockup has it centered.", senderType: "client", createdAt: hoursAgo(48) },
    { authorId: cccAdmin.id, body: "Absolutely — I'll update the proof. Left chest, about 3.5\" wide. Does that work?", senderType: "staff", createdAt: hoursAgo(46) },
    { authorId: janeSmith.id, body: "Perfect, 3.5\" is great. Can we also get it in navy thread instead of black?", senderType: "client", createdAt: hoursAgo(24) },
    { authorId: cccAdmin.id, body: "Navy thread noted. I'll send a revised proof by end of day.", senderType: "staff", createdAt: hoursAgo(23) },
    { authorId: cccAdmin.id, body: "Internal: need to check with production if navy thread is in stock for this run.", senderType: "internal", createdAt: hoursAgo(22) },
  ] } } });

  await prisma.messageThread.create({ data: { companyId: acme.id, orderId: ord2.id, subject: "Delivery timeline for conference booth banners", orderTitle: "ORD-2026-002 — Acme Trade Show Kit", status: "waiting_on_client", createdBy: johnDoe.id, assigneeId: cccAdmin.id, createdAt: hoursAgo(120), messages: { create: [
    { authorId: johnDoe.id, body: "We need the banners delivered by March 10 for the trade show. Is that feasible?", senderType: "client", createdAt: hoursAgo(120) },
    { authorId: cccAdmin.id, body: "That's tight but doable if we finalize artwork by this Friday. Can you send the updated vector files?", senderType: "staff", createdAt: hoursAgo(96) },
    { authorId: johnDoe.id, body: "Working on them now. One question — do you need CMYK or RGB?", senderType: "client", createdAt: hoursAgo(72) },
    { authorId: cccAdmin.id, body: "CMYK preferred for print. RGB works in a pinch but colors may shift.", senderType: "staff", createdAt: hoursAgo(70) },
  ] } } });

  await prisma.messageThread.create({ data: { companyId: globex.id, orderId: ord4.id, subject: "Bulk hoodie order — sizing samples", orderTitle: "ORD-2026-004 — Globex Winter Hoodies", status: "waiting_on_ccc", createdBy: hankScorpio.id, assigneeId: cccSarah.id, createdAt: hoursAgo(36), messages: { create: [
    { authorId: hankScorpio.id, body: "Can we get sizing samples before committing to the full 500-unit order?", senderType: "client", createdAt: hoursAgo(36) },
    { authorId: cccSarah.id, body: "Of course. I'll ship S, M, L, XL samples to your office. Should arrive in 3 business days.", senderType: "staff", createdAt: hoursAgo(30) },
    { authorId: hankScorpio.id, body: "Great, please send to our main office at 456 Globex Blvd, Cypress Creek.", senderType: "client", createdAt: hoursAgo(28) },
    { authorId: cccSarah.id, body: "Internal: samples shipped via FedEx, tracking #789456123.", senderType: "internal", createdAt: hoursAgo(26) },
  ] } } });

  await prisma.messageThread.create({ data: { companyId: acme.id, subject: "Invoice correction — duplicate charge", status: "resolved", createdBy: janeSmith.id, assigneeId: cccAdmin.id, createdAt: hoursAgo(200), messages: { create: [
    { authorId: janeSmith.id, body: "Hi, we were charged twice for order ORD-2025-031. Can you look into this?", senderType: "client", createdAt: hoursAgo(200) },
    { authorId: cccAdmin.id, body: "I see the duplicate. Issuing a refund now — should appear in 3-5 business days.", senderType: "staff", createdAt: hoursAgo(196) },
    { authorId: janeSmith.id, body: "Refund received. Thanks for the quick turnaround!", senderType: "client", createdAt: hoursAgo(100) },
  ] } } });

  await prisma.messageThread.create({ data: { companyId: bloom.id, orderId: ord5.id, subject: "Color matching for rebrand tees", orderTitle: "ORD-2026-005 — Bloom Brand Launch Tees", status: "open", createdBy: lilyChen.id, assigneeId: cccAdmin.id, createdAt: hoursAgo(72), messages: { create: [
    { authorId: lilyChen.id, body: "The proof mockup color looks off — closer to salmon than our brand coral. Can we match PMS 7417C exactly?", senderType: "client", createdAt: hoursAgo(72) },
    { authorId: cccAdmin.id, body: "I see the issue — the file was using a CMYK approximation. I'll re-separate with the PMS spot color and send a revised proof.", senderType: "staff", createdAt: hoursAgo(68) },
    { authorId: lilyChen.id, body: "That would be great. This is the hero piece for our launch, so the color has to be dead-on.", senderType: "client", createdAt: hoursAgo(48) },
  ] } } });

  // ═══════════════════════════════════════════════════════════════════
  // QUOTES
  // ═══════════════════════════════════════════════════════════════════

  await prisma.quote.create({ data: { number: "QT-2026-001", companyId: acme.id, createdByUserId: cccAdmin.id, title: "Summer Event Tees — June 2026", status: "SENT", paymentTermType: "DEPOSIT", depositPercent: 50, clientMessage: "Hey Jane — here's the quote for your June event.", sentAt: new Date("2026-02-20"), expiresAt: new Date("2026-03-20"), items: { create: [
    { description: "Bella+Canvas 3001 — Heather Navy", sku: "BC3001-HTHR-NVY", color: "Heather Navy", unitPrice: 14.50, quantity: 90, decorationNotes: "Left chest: 1-color white. Back: full event graphic.", sizeBreakdown: { S: 10, M: 25, L: 30, XL: 20, "2XL": 5 }, sortOrder: 0, lineTotal: 1305.00 },
    { description: "Richardson 112 — Heather Grey/Black", sku: "R112-HTHR-BLK", color: "Heather Grey/Black", unitPrice: 18.00, quantity: 50, decorationNotes: "Front center: embroidered logo.", sortOrder: 1, lineTotal: 900.00 },
  ] } } }).catch(() => {});

  await prisma.quote.create({ data: { number: "QT-2026-002", companyId: acme.id, createdByUserId: cccAdmin.id, title: "Office Welcome Kits — Q2", status: "DRAFT", paymentTermType: "FULL", notes: "Waiting on final headcount from Jane.", items: { create: [
    { description: "Custom Moleskine Notebook — Black", unitPrice: 22.00, quantity: 30, decorationNotes: "Debossed logo.", sortOrder: 0, lineTotal: 660.00 },
    { description: "Miir 16oz Travel Tumbler — White", unitPrice: 28.50, quantity: 30, decorationNotes: "Laser engraved logo.", sortOrder: 1, lineTotal: 855.00 },
    { description: "Branded Sticker Sheet (4x6)", unitPrice: 2.50, quantity: 30, sortOrder: 2, lineTotal: 75.00 },
  ] } } }).catch(() => {});

  const qt3 = await prisma.quote.create({ data: { number: "QT-2026-003", companyId: bloom.id, createdByUserId: cccAdmin.id, title: "Bloom Studio — Brand Launch Merch", status: "CHANGES_REQUESTED", paymentTermType: "DEPOSIT", depositPercent: 50, clientMessage: "Updated merch quote for your rebrand launch!", sentAt: new Date("2026-02-15"), items: { create: [
    { description: "AS Colour 5001 — Natural", sku: "ASC5001-NAT", color: "Natural", unitPrice: 16.00, quantity: 200, decorationNotes: "Front: oversized screen print, 2 colors.", sizeBreakdown: { S: 30, M: 60, L: 60, XL: 40, "2XL": 10 }, sortOrder: 0, lineTotal: 3200.00 },
    { description: "Canvas Tote Bag — Natural", unitPrice: 8.50, quantity: 200, decorationNotes: "1-color screen print, both sides.", sortOrder: 1, lineTotal: 1700.00 },
  ] } } }).catch(() => null);

  if (qt3) {
    const toteItem = await prisma.quoteItem.findFirst({ where: { quoteId: qt3.id, description: { contains: "Tote Bag" } } });
    await prisma.quoteChangeRequest.create({ data: { quoteId: qt3.id, userId: lilyChen.id, message: "Love the tee selection! Can we swap the tote for a zip pouch instead?", itemComments: toteItem ? [{ quoteItemId: toteItem.id, comment: "Prefer a zip pouch — something more premium feeling." }] : [] } }).catch(() => {});
  }

  await prisma.quote.create({ data: { number: "QT-2026-004", companyId: acme.id, createdByUserId: cccAdmin.id, title: "Trade Show Banners — March", status: "APPROVED", paymentTermType: "FULL", clientMessage: "Banners for your Austin trade show. Rush turnaround included.", sentAt: new Date("2026-02-10"), approvedAt: new Date("2026-02-11"), approvedByUserId: janeSmith.id, items: { create: [
    { description: "Retractable Banner Stand — 33x80\"", unitPrice: 185.00, quantity: 3, decorationNotes: "Full color print.", sortOrder: 0, lineTotal: 555.00 },
    { description: "Table Throw — 6ft, Full Color", unitPrice: 145.00, quantity: 2, decorationNotes: "Full wrap print. Match PMS 286C.", sortOrder: 1, lineTotal: 290.00 },
  ] } } }).catch(() => {});

  await prisma.quote.create({ data: { number: "QT-2026-005", companyId: acme.id, createdByUserId: cccAdmin.id, title: "Holiday Gift Boxes — Dec 2025 (Reissue)", status: "CONVERTED", paymentTermType: "NET", netDays: 30, sentAt: new Date("2026-01-05"), approvedAt: new Date("2026-01-06"), convertedAt: new Date("2026-01-06"), items: { create: [
    { description: "Custom Gift Box Kit (Mug + Socks + Card)", unitPrice: 45.00, quantity: 50, sortOrder: 0, lineTotal: 2250.00 },
  ] } } }).catch(() => {});

  await prisma.quote.create({ data: { number: "QT-2026-006", companyId: globex.id, createdByUserId: cccSarah.id, title: "Globex Q2 Onboarding Kits", status: "SENT", paymentTermType: "NET", netDays: 30, clientMessage: "Q2 new-hire kits. Volume discount applied.", sentAt: daysAgo(8), expiresAt: daysAgo(-22), items: { create: [
    { description: "Independent Trading Co. IND4000 — Black Hoodie", sku: "IND4000-BLK", color: "Black", unitPrice: 32.00, quantity: 100, decorationNotes: "Left chest embroidered.", sizeBreakdown: { S: 10, M: 25, L: 30, XL: 25, "2XL": 10 }, sortOrder: 0, lineTotal: 3200.00 },
    { description: "Bella+Canvas 3001 — Athletic Heather Tee", sku: "BC3001-ATH-HTR", color: "Athletic Heather", unitPrice: 12.00, quantity: 100, sortOrder: 1, lineTotal: 1200.00 },
    { description: "Custom Lanyard + Badge Holder", unitPrice: 4.50, quantity: 100, sortOrder: 2, lineTotal: 450.00 },
  ] } } }).catch(() => {});

  // ═══════════════════════════════════════════════════════════════════
  // INVENTORY
  // ═══════════════════════════════════════════════════════════════════

  const inv_bc3001 = await prisma.inventoryItem.create({ data: { companyId: acme.id, sku: "BC3001-HTHR-NVY", productName: "Bella+Canvas 3001 — Heather Navy", locationId: acmeHQ.id, onHand: 45, reserved: 10, available: 35, supplier: "SS_ACTIVEWEAR", lastSyncedAt: daysAgo(1) } });
  await prisma.inventoryLedgerEntry.create({ data: { inventoryItemId: inv_bc3001.id, adjustment: 100, reason: "SYNC", performedBy: cccAdmin.id, createdAt: daysAgo(30) } });
  await prisma.inventoryLedgerEntry.create({ data: { inventoryItemId: inv_bc3001.id, adjustment: -55, reason: "ORDER_FULFILLED", performedBy: cccAdmin.id, createdAt: daysAgo(10) } });

  const inv_r112 = await prisma.inventoryItem.create({ data: { companyId: acme.id, sku: "R112-HTHR-BLK", productName: "Richardson 112 — Heather Grey/Black", locationId: acmeHQ.id, onHand: 22, reserved: 0, available: 22, supplier: "SANMAR", lastSyncedAt: daysAgo(2) } });
  await prisma.inventoryLedgerEntry.create({ data: { inventoryItemId: inv_r112.id, adjustment: 50, reason: "SYNC", performedBy: cccAdmin.id, createdAt: daysAgo(30) } });
  await prisma.inventoryLedgerEntry.create({ data: { inventoryItemId: inv_r112.id, adjustment: -28, reason: "ORDER_FULFILLED", performedBy: cccAdmin.id, createdAt: daysAgo(10) } });

  await prisma.inventoryItem.create({ data: { companyId: globex.id, sku: "IND4000-BLK", productName: "Independent Trading IND4000 — Black", locationId: globexHQ.id, onHand: 0, reserved: 500, available: 0, supplier: "SS_ACTIVEWEAR", lastSyncedAt: daysAgo(3) } });

  // ═══════════════════════════════════════════════════════════════════
  // TASKS
  // ═══════════════════════════════════════════════════════════════════

  await prisma.task.create({ data: { title: "Finalize Bloom tee color separation", description: "Re-separate front print using PMS 7417C spot color instead of CMYK build.", createdByUserId: cccAdmin.id, orderId: ord5.id, tenantId: bloom.id, status: "IN_PROGRESS", priority: "HIGH", dueDate: daysAgo(-2) } });
  await prisma.task.create({ data: { title: "Ship Globex sizing samples", description: "Send S/M/L/XL IND4000 samples to 456 Globex Blvd.", createdByUserId: cccSarah.id, orderId: ord4.id, tenantId: globex.id, status: "DONE", priority: "MEDIUM" } });
  await prisma.task.create({ data: { title: "Prepare Acme welcome kit mockup", description: "Create mockup layout for notebook + tumbler + sticker sheet.", createdByUserId: cccAdmin.id, orderId: ord3.id, tenantId: acme.id, status: "TODO", priority: "LOW", dueDate: daysAgo(-10) } });

  // ═══════════════════════════════════════════════════════════════════
  // AUDIT LOG
  // ═══════════════════════════════════════════════════════════════════

  await prisma.auditLogEvent.create({ data: { companyId: acme.id, userId: cccAdmin.id, entityType: "Order", entityId: ord1.id, action: "CREATED", createdAt: daysAgo(45) } });
  await prisma.auditLogEvent.create({ data: { companyId: acme.id, userId: cccAdmin.id, entityType: "Order", entityId: ord1.id, action: "STATUS_CHANGED", changes: { from: "IN_PRODUCTION", to: "COMPLETED" }, createdAt: daysAgo(10) } });
  await prisma.auditLogEvent.create({ data: { companyId: acme.id, userId: janeSmith.id, entityType: "Proof", entityId: proof1.id, action: "UPDATED", changes: { action: "approved", versionNumber: 2 }, createdAt: daysAgo(32) } });
  await prisma.auditLogEvent.create({ data: { companyId: bloom.id, userId: lilyChen.id, entityType: "Proof", entityId: proof3.id, action: "UPDATED", changes: { action: "changes_requested", versionNumber: 1 }, createdAt: daysAgo(17) } });
  await prisma.auditLogEvent.create({ data: { companyId: globex.id, userId: cccSarah.id, entityType: "Order", entityId: ord4.id, action: "CREATED", createdAt: daysAgo(20) } });

  // ═══════════════════════════════════════════════════════════════════

  console.log("Seed complete!");
  console.log("---");
  console.log("CCC Staff login:    admin@centralcreative.co / password123");
  console.log("CCC Staff (Sarah):  sarah@centralcreative.co / password123");
  console.log("Client Admin:       admin@acme.com / password123");
  console.log("Client User:        user@acme.com / password123");
  console.log("Globex Admin:       hank@globex.com / password123");
  console.log("Bloom Admin:        lily@bloomstudio.com / password123");
  console.log("NovaTech Admin:     marcus@novatech.io / password123");
  console.log("Redline Admin:      dana@redlineevents.com / password123");
  console.log("Greenfield Admin:   sam@greenfield.co / password123");
  console.log("---");
  console.log("Orders: 7 (SUBMITTED, IN_REVIEW, APPROVED, IN_PRODUCTION, READY, SHIPPED, COMPLETED)");
  console.log("Invoices: 6 (PAID x3, PARTIALLY_PAID x1, SENT x2)");
  console.log("Proofs: 4 (APPROVED, SENT, CHANGES_REQUESTED, DRAFT)");
  console.log("Artwork: 5 assets across Acme, Globex, Bloom");
  console.log("Quotes: 6 (DRAFT, SENT x2, CHANGES_REQUESTED, APPROVED, CONVERTED)");
  console.log("Threads: 5 (open x2, waiting_on_client, waiting_on_ccc, resolved)");
  console.log("Projects: 4 | Tasks: 3 | Vendors: 2 | Inventory: 3 items");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
