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

  // Clean up all seeded data to prevent duplicates on re-run.
  // Order: leaf tables first, then parents (respects FK constraints).
  await prisma.auditLogEvent.deleteMany();
  await prisma.proofAnnotation.deleteMany();
  await prisma.proof.deleteMany();
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
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.project.deleteMany();
  await prisma.savedProduct.deleteMany();
  await prisma.location.deleteMany();
  await prisma.catalogProduct.deleteMany();
  await prisma.vendor.deleteMany();

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

  // 1. Acme Corp
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

  // 2. Globex Corporation
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

  // 3. Bloom Studio
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

  const bloomAdmin = await prisma.user.upsert({
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

  // 4. NovaTech Industries
  await prisma.company.upsert({
    where: { slug: "novatech-industries" },
    update: {},
    create: {
      name: "NovaTech Industries",
      slug: "novatech-industries",
      inviteCode: "NOVA-INVITE-2026",
      status: "paused",
      phone: "(312) 555-0777",
      address: "200 Innovation Dr, Chicago, IL 60601",
      notes: "Account paused — pending budget approval for Q2.",
    },
  });

  await prisma.user.upsert({
    where: { email: "marcus@novatech.io" },
    update: {},
    create: {
      companyId: (await prisma.company.findUnique({ where: { slug: "novatech-industries" } }))!.id,
      email: "marcus@novatech.io",
      passwordHash: hashSync("password123", 12),
      name: "Marcus Webb",
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
    },
  });

  // 5. Redline Events
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
      notes: "Outstanding invoice INV-2025-089. Contacted 3 times.",
    },
  });

  const redlineAdmin = await prisma.user.upsert({
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

  // 6. Greenfield Co
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

  const greenfieldAdmin = await prisma.user.upsert({
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

  // ─── Vendors ─────────────────────────────────────────────────────

  const vendorSanMar = await prisma.vendor.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "SanMar",
      contactName: "Sales Team",
      email: "orders@sanmar.com",
      phone: "(800) 426-6399",
      categories: ["screen_printing", "embroidery", "apparel"],
      tags: ["blanks", "wholesale"],
      notes: "Primary blank apparel supplier. 2-day shipping on most items.",
    },
  });

  const vendorSSActive = await prisma.vendor.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "S&S Activewear",
      contactName: "Account Manager",
      email: "support@ssactivewear.com",
      phone: "(800) 523-2155",
      categories: ["apparel", "activewear"],
      tags: ["blanks", "athletic"],
      notes: "Good for athletic wear and performance fabrics.",
    },
  });

  const vendorPrintShop = await prisma.vendor.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Metro Print Co.",
      contactName: "Alex Martinez",
      email: "alex@metroprint.com",
      phone: "(512) 555-0444",
      categories: ["screen_printing", "dtg", "embroidery"],
      tags: ["local", "austin"],
      notes: "Local decorator. Great quality, fast turnaround on small runs.",
    },
  });

  await prisma.vendor.upsert({
    where: { id: "00000000-0000-0000-0000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      name: "SignWorks USA",
      contactName: "Pat Johnson",
      email: "pat@signworksusa.com",
      phone: "(800) 555-7446",
      categories: ["signage", "banners", "vinyl"],
      tags: ["large_format"],
      notes: "Large format printing and signage vendor.",
    },
  });

  // ─── Catalog Products ────────────────────────────────────────────

  const productPolo = await prisma.catalogProduct.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      name: "Classic Polo Shirt",
      sku: "POL-001",
      contentType: "APPAREL",
      basePrice: 24.99,
      pricingType: "TIERED",
      pricingRules: {
        tiers: [
          { minQuantity: 1, maxQuantity: 49, pricePerUnit: 24.99 },
          { minQuantity: 50, maxQuantity: 99, pricePerUnit: 21.99 },
          { minQuantity: 100, maxQuantity: 499, pricePerUnit: 18.99 },
          { minQuantity: 500, pricePerUnit: 15.99 },
        ],
      },
      description: "Premium cotton pique polo with embroidered logo placement. Available in 12 colors.",
      options: {
        sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
        colors: ["White", "Navy", "Black", "Red", "Royal Blue", "Heather Gray"],
      },
      vendorId: vendorSanMar.id,
    },
  });

  const productTee = await prisma.catalogProduct.upsert({
    where: { id: "00000000-0000-0000-0000-000000000011" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000011",
      name: "Essential Crew T-Shirt",
      sku: "TEE-001",
      contentType: "APPAREL",
      basePrice: 12.99,
      pricingType: "TIERED",
      pricingRules: {
        tiers: [
          { minQuantity: 1, maxQuantity: 49, pricePerUnit: 12.99 },
          { minQuantity: 50, maxQuantity: 199, pricePerUnit: 9.99 },
          { minQuantity: 200, pricePerUnit: 7.49 },
        ],
      },
      description: "Soft ringspun cotton tee. Screen print or DTG available.",
      options: {
        sizes: ["S", "M", "L", "XL", "2XL"],
        colors: ["White", "Black", "Navy", "Charcoal", "Red", "Forest Green"],
      },
      vendorId: vendorSanMar.id,
    },
  });

  const productHoodie = await prisma.catalogProduct.upsert({
    where: { id: "00000000-0000-0000-0000-000000000012" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000012",
      name: "Performance Hoodie",
      sku: "HOD-001",
      contentType: "APPAREL",
      basePrice: 38.99,
      pricingType: "FLAT",
      description: "Midweight fleece hoodie with kangaroo pocket.",
      options: {
        sizes: ["S", "M", "L", "XL", "2XL"],
        colors: ["Black", "Navy", "Heather Gray", "Charcoal"],
      },
      vendorId: vendorSSActive.id,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { id: "00000000-0000-0000-0000-000000000013" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000013",
      name: "Retractable Banner Stand",
      sku: "BNR-001",
      contentType: "SIGNAGE",
      basePrice: 149.99,
      pricingType: "FLAT",
      description: "33\" x 80\" retractable banner with aluminum stand. Full color dye-sub print.",
    },
  });

  await prisma.catalogProduct.upsert({
    where: { id: "00000000-0000-0000-0000-000000000014" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000014",
      name: "Embroidered Cap",
      sku: "CAP-001",
      contentType: "APPAREL",
      basePrice: 16.99,
      pricingType: "TIERED",
      pricingRules: {
        tiers: [
          { minQuantity: 1, maxQuantity: 23, pricePerUnit: 16.99 },
          { minQuantity: 24, maxQuantity: 99, pricePerUnit: 14.49 },
          { minQuantity: 100, pricePerUnit: 11.99 },
        ],
      },
      description: "Structured 6-panel cap with flat embroidery. Up to 8,000 stitches included.",
      options: { colors: ["Black", "Navy", "White", "Khaki", "Red"] },
      vendorId: vendorSanMar.id,
    },
  });

  await prisma.catalogProduct.upsert({
    where: { id: "00000000-0000-0000-0000-000000000015" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000015",
      name: "Custom Sticker Pack",
      sku: "STK-001",
      contentType: "PROMO_ITEM",
      basePrice: 0.89,
      pricingType: "TIERED",
      pricingRules: {
        tiers: [
          { minQuantity: 50, maxQuantity: 249, pricePerUnit: 0.89 },
          { minQuantity: 250, maxQuantity: 999, pricePerUnit: 0.59 },
          { minQuantity: 1000, pricePerUnit: 0.35 },
        ],
      },
      description: "Die-cut vinyl stickers. UV-resistant, waterproof. Full color print.",
    },
  });

  await prisma.catalogProduct.upsert({
    where: { id: "00000000-0000-0000-0000-000000000016" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000016",
      name: "Business Cards - Premium",
      sku: "PRT-001",
      contentType: "COMMERCIAL_PRINTING",
      basePrice: 0.12,
      pricingType: "TIERED",
      pricingRules: {
        tiers: [
          { minQuantity: 250, maxQuantity: 499, pricePerUnit: 0.12 },
          { minQuantity: 500, maxQuantity: 999, pricePerUnit: 0.08 },
          { minQuantity: 1000, pricePerUnit: 0.05 },
        ],
      },
      description: "16pt card stock, full color both sides, matte or gloss finish.",
    },
  });

  // ─── Sample Orders ───────────────────────────────────────────────

  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

  // Order 1: Acme — In Production
  await prisma.order.upsert({
    where: { number: "ORD-2026-001" },
    update: {},
    create: {
      companyId: demo.id,
      createdByUserId: janeSmith.id,
      number: "ORD-2026-001",
      source: "MANUAL",
      title: "Acme Polo Shirts — Q1 Onboarding",
      status: "IN_PRODUCTION",
      inHandsDate: daysAgo(-10),
      poNumber: "ACME-PO-2026-001",
      totalAmount: 4247.55,
      createdAt: daysAgo(14),
      items: {
        create: [
          {
            sortOrder: 0,
            description: "Classic Polo Shirt — Navy",
            decorationNotes: "Left chest embroidery with Acme logo",
            sku: "POL-001-NVY",
            vendorId: vendorSanMar.id,
            unitPrice: 18.99,
            quantity: 150,
            sizeBreakdown: { S: 15, M: 40, L: 50, XL: 30, "2XL": 15 },
            lineTotal: 2848.50,
            costPerUnit: 11.50,
          },
          {
            sortOrder: 1,
            description: "Classic Polo Shirt — White",
            decorationNotes: "Left chest embroidery with Acme logo",
            sku: "POL-001-WHT",
            vendorId: vendorSanMar.id,
            unitPrice: 18.99,
            quantity: 50,
            sizeBreakdown: { S: 5, M: 15, L: 15, XL: 10, "2XL": 5 },
            lineTotal: 949.50,
            costPerUnit: 11.50,
          },
          {
            sortOrder: 2,
            description: "Essential Crew T-Shirt — Black",
            decorationNotes: "Full back screen print",
            sku: "TEE-001-BLK",
            vendorId: vendorPrintShop.id,
            unitPrice: 9.99,
            quantity: 45,
            sizeBreakdown: { M: 15, L: 15, XL: 10, "2XL": 5 },
            lineTotal: 449.55,
            costPerUnit: 5.25,
          },
        ],
      },
    },
  });

  // Order 2: Acme — Submitted
  await prisma.order.upsert({
    where: { number: "ORD-2026-002" },
    update: {},
    create: {
      companyId: demo.id,
      createdByUserId: johnDoe.id,
      number: "ORD-2026-002",
      source: "MANUAL",
      title: "Trade Show Booth Package",
      status: "SUBMITTED",
      inHandsDate: daysAgo(-21),
      clientNotes: "SxSW 2026",
      totalAmount: 1633.98,
      createdAt: daysAgo(2),
      items: {
        create: [
          { sortOrder: 0, description: "Retractable Banner Stand — Main Booth", sku: "BNR-001", unitPrice: 149.99, quantity: 2, lineTotal: 299.98 },
          { sortOrder: 1, description: "Event Staff T-Shirts — Coral", sku: "TEE-001-CRL", unitPrice: 9.99, quantity: 100, sizeBreakdown: { S: 10, M: 30, L: 30, XL: 20, "2XL": 10 }, lineTotal: 999.00 },
          { sortOrder: 2, description: "Custom Die-Cut Stickers", sku: "STK-001", unitPrice: 0.59, quantity: 500, lineTotal: 295.00 },
          { sortOrder: 3, description: "Business Cards — Matte", sku: "PRT-001", unitPrice: 0.08, quantity: 500, lineTotal: 40.00 },
        ],
      },
    },
  });

  // Order 3: Globex — Approved
  await prisma.order.upsert({
    where: { number: "ORD-2026-003" },
    update: {},
    create: {
      companyId: globex.id,
      createdByUserId: globexAdmin.id,
      number: "ORD-2026-003",
      source: "MANUAL",
      title: "Globex Winter Hoodies 2026",
      status: "APPROVED",
      inHandsDate: daysAgo(-30),
      poNumber: "GLX-PO-2026-012",
      totalAmount: 19495.00,
      createdAt: daysAgo(7),
      items: {
        create: [
          {
            sortOrder: 0,
            description: "Performance Hoodie — Black",
            sku: "HOD-001-BLK",
            color: "Black",
            vendorId: vendorSSActive.id,
            unitPrice: 38.99,
            quantity: 500,
            sizeBreakdown: { S: 50, M: 125, L: 150, XL: 100, "2XL": 75 },
            lineTotal: 19495.00,
            costPerUnit: 22.00,
          },
        ],
      },
    },
  });

  // Order 4: Bloom — Shipped
  await prisma.order.upsert({
    where: { number: "ORD-2026-004" },
    update: {},
    create: {
      companyId: bloom.id,
      createdByUserId: bloomAdmin.id,
      number: "ORD-2026-004",
      source: "QUOTE",
      title: "Bloom Studio Grand Opening Kit",
      status: "SHIPPED",
      inHandsDate: daysAgo(-5),
      totalAmount: 3250.00,
      createdAt: daysAgo(21),
      items: {
        create: [
          { sortOrder: 0, description: "Bloom-branded Tees — Sage Green", unitPrice: 12.50, quantity: 200, lineTotal: 2500.00 },
          { sortOrder: 1, description: "Window Vinyl Decals (Set of 4)", unitPrice: 75.00, quantity: 4, lineTotal: 300.00 },
          { sortOrder: 2, description: "Canvas Tote Bags — Natural", unitPrice: 4.50, quantity: 100, lineTotal: 450.00 },
        ],
      },
      shipments: {
        create: [{
          addressName: "Bloom Studio",
          addressLine1: "789 Flower Ave",
          addressCity: "San Francisco",
          addressState: "CA",
          addressZip: "94102",
          carrier: "FedEx",
          trackingNumber: "7948291847561",
          status: "IN_TRANSIT",
          shippedAt: daysAgo(1),
        }],
      },
    },
  });

  // Order 5: Redline — Completed
  await prisma.order.upsert({
    where: { number: "ORD-2026-005" },
    update: {},
    create: {
      companyId: redline.id,
      createdByUserId: redlineAdmin.id,
      number: "ORD-2026-005",
      source: "MANUAL",
      title: "Redline Events — Corporate Gala Shirts",
      status: "COMPLETED",
      inHandsDate: daysAgo(5),
      poNumber: "RDL-2026-003",
      totalAmount: 2997.00,
      createdAt: daysAgo(45),
      items: {
        create: [{
          sortOrder: 0,
          description: "Dress Shirts — White w/ Red Embroidery",
          unitPrice: 29.97,
          quantity: 100,
          lineTotal: 2997.00,
        }],
      },
    },
  });

  // Order 6: Greenfield — In Review
  await prisma.order.upsert({
    where: { number: "ORD-2026-006" },
    update: {},
    create: {
      companyId: greenfield.id,
      createdByUserId: greenfieldAdmin.id,
      number: "ORD-2026-006",
      source: "MANUAL",
      title: "Greenfield Earth Day Merch",
      status: "IN_REVIEW",
      inHandsDate: daysAgo(-15),
      clientNotes: "Earth Day 2026",
      totalAmount: 1674.50,
      createdAt: daysAgo(3),
      items: {
        create: [
          { sortOrder: 0, description: "Organic Cotton Tees — Forest Green", unitPrice: 14.50, quantity: 75, sizeBreakdown: { S: 10, M: 25, L: 25, XL: 10, "2XL": 5 }, lineTotal: 1087.50 },
          { sortOrder: 1, description: "Recycled Polyester Drawstring Bags", unitPrice: 5.87, quantity: 100, lineTotal: 587.00 },
        ],
      },
    },
  });

  // ─── Sample Quote Requests ───────────────────────────────────────

  await prisma.quoteRequest.create({
    data: {
      companyId: greenfield.id,
      createdById: greenfieldAdmin.id,
      status: "SUBMITTED",
      title: "Greenfield Summer Festival Merch",
      description: "We need merchandise for our annual Summer Festival. Looking for eco-friendly options — organic cotton tees, recycled polyester bags, and possibly bamboo sunglasses. Around 300 attendees expected. Budget is flexible but hoping to stay under $5,000.",
      inHandsDate: daysAgo(-45),
    },
  }).catch(() => {});

  await prisma.quoteRequest.create({
    data: {
      companyId: demo.id,
      createdById: janeSmith.id,
      status: "IN_REVIEW",
      title: "Acme Client Appreciation Gift Boxes",
      description: "We want to send gift boxes to our top 50 clients. Each box should include a branded item (pen, notebook, or similar), a t-shirt in their size, and a thank-you card. Need this shipped directly to each client address.",
      inHandsDate: daysAgo(-20),
    },
  }).catch(() => {});

  // QUOTED — Redline, converted to a quote
  await prisma.quoteRequest.create({
    data: {
      companyId: redline.id,
      createdById: redlineAdmin.id,
      status: "QUOTED",
      title: "Redline Awards Night Merch",
      description: "We need polos and embroidered caps for our annual awards night. Around 75 attendees. Also want custom award plaques if possible.",
      inHandsDate: daysAgo(-60),
      createdAt: daysAgo(40),
    },
  }).catch(() => {});

  // CLOSED — Globex, declined by staff
  await prisma.quoteRequest.create({
    data: {
      companyId: globex.id,
      createdById: globexAdmin.id,
      status: "CLOSED",
      title: "Globex Office Furniture Branding",
      description: "Looking into branded desk accessories — mouse pads, phone stands, monitor risers. Not sure if this is something you offer.",
      createdAt: daysAgo(30),
    },
  }).catch(() => {});

  // ─── Seed Quotes ──────────────────────────────────────────────────

  // QT-2026-001 — Acme, SENT (with deposit terms, expiration)
  const qt1 = await prisma.quote.create({
    data: {
      number: "QT-2026-001",
      companyId: demo.id,
      createdByUserId: cccAdmin.id,
      title: "Summer Event Tees — June 2026",
      status: "SENT",
      paymentTermType: "DEPOSIT",
      depositPercent: 50,
      clientMessage: "Hey Jane — here's the quote for your June event. Let me know if the sizes look right.",
      sentAt: new Date("2026-02-20"),
      expiresAt: new Date("2026-03-20"),
      items: {
        create: [
          {
            description: "Bella+Canvas 3001 — Heather Navy",
            sku: "BC3001-HTHR-NVY",
            color: "Heather Navy",
            unitPrice: 14.50,
            quantity: 90,
            decorationNotes: "Left chest: CCC logo, 1-color white. Back: full event graphic, 4-color process.",
            sizeBreakdown: { S: 10, M: 25, L: 30, XL: 20, "2XL": 5 },
            sortOrder: 0,
            lineTotal: 14.50 * 90,
          },
          {
            description: "Richardson 112 — Heather Grey/Black",
            sku: "R112-HTHR-BLK",
            color: "Heather Grey/Black",
            unitPrice: 18.00,
            quantity: 50,
            decorationNotes: "Front center: embroidered logo, 8k stitches.",
            sortOrder: 1,
            lineTotal: 18.00 * 50,
          },
        ],
      },
    },
  }).catch(() => {});

  // QT-2026-002 — Acme, DRAFT
  await prisma.quote.create({
    data: {
      number: "QT-2026-002",
      companyId: demo.id,
      createdByUserId: cccAdmin.id,
      title: "Office Welcome Kits — Q2",
      status: "DRAFT",
      paymentTermType: "FULL",
      notes: "Waiting on final headcount from Jane before sending.",
      items: {
        create: [
          {
            description: "Custom Moleskine Notebook — Black",
            unitPrice: 22.00,
            quantity: 30,
            decorationNotes: "Debossed logo on cover.",
            sortOrder: 0,
            lineTotal: 22.00 * 30,
          },
          {
            description: "Miir 16oz Travel Tumbler — White",
            unitPrice: 28.50,
            quantity: 30,
            decorationNotes: "Laser engraved logo.",
            sortOrder: 1,
            lineTotal: 28.50 * 30,
          },
          {
            description: "Branded Sticker Sheet (4x6)",
            unitPrice: 2.50,
            quantity: 30,
            sortOrder: 2,
            lineTotal: 2.50 * 30,
          },
        ],
      },
    },
  }).catch(() => {});

  // QT-2026-003 — Bloom, CHANGES_REQUESTED (with change request)
  const qt3 = await prisma.quote.create({
    data: {
      number: "QT-2026-003",
      companyId: bloom.id,
      createdByUserId: cccAdmin.id,
      title: "Bloom Studio — Brand Launch Merch",
      status: "CHANGES_REQUESTED",
      paymentTermType: "DEPOSIT",
      depositPercent: 50,
      clientMessage: "Here's the updated merch quote for your rebrand launch!",
      sentAt: new Date("2026-02-15"),
      items: {
        create: [
          {
            description: "AS Colour 5001 — Natural",
            sku: "ASC5001-NAT",
            color: "Natural",
            unitPrice: 16.00,
            quantity: 200,
            decorationNotes: "Front: oversized screen print, 2 colors. Hang tag with new brand.",
            sizeBreakdown: { S: 30, M: 60, L: 60, XL: 40, "2XL": 10 },
            sortOrder: 0,
            lineTotal: 16.00 * 200,
          },
          {
            description: "Canvas Tote Bag — Natural",
            unitPrice: 8.50,
            quantity: 200,
            decorationNotes: "1-color screen print, both sides.",
            sortOrder: 1,
            lineTotal: 8.50 * 200,
          },
        ],
      },
    },
  }).catch(() => null);

  // Add change request for QT-2026-003
  if (qt3) {
    const toteItem = await prisma.quoteItem.findFirst({
      where: { quoteId: qt3.id, description: { contains: "Tote Bag" } },
    });

    await prisma.quoteChangeRequest.create({
      data: {
        quoteId: qt3.id,
        userId: bloomAdmin.id,
        message: "Love the tee selection! Can we swap the tote for a zip pouch instead? Also wondering if we can get the tees in a slightly heavier weight.",
        itemComments: toteItem
          ? [{ quoteItemId: toteItem.id, comment: "Prefer a zip pouch — something more premium feeling." }]
          : [],
      },
    }).catch(() => {});
  }

  // ─── Projects ────────────────────────────────────────────────────

  // Project 1: TechConnect 2026 Trade Show — ACTIVE
  await prisma.project.create({
    data: {
      companyId: demo.id,
      createdById: janeSmith.id,
      name: "TechConnect 2026 Trade Show",
      description: "Everything for our booth at TechConnect Austin. Banners, table throws, tees for the team, and giveaways.",
      status: "ACTIVE",
      eventDate: daysAgo(-45),
      clientContact: "Lisa Chen",
      budget: 5000,
      createdAt: daysAgo(30),
      orders: {
        connect: [{ number: "ORD-2026-001" }],
      },
      quotes: {
        connect: [{ number: "QT-2026-001" }],
      },
    },
  }).catch(() => {});

  // Project 2: Holiday Campaign 2025 — COMPLETED
  await prisma.project.create({
    data: {
      companyId: demo.id,
      createdById: johnDoe.id,
      name: "Holiday Campaign 2025",
      description: "Client gift boxes and holiday cards for top accounts.",
      status: "COMPLETED",
      eventDate: daysAgo(75),
      createdAt: daysAgo(90),
      orders: {
        connect: [{ number: "ORD-2026-002" }],
      },
      quotes: {
        connect: [{ number: "QT-2026-003" }],
      },
    },
  }).catch(() => {});

  // Project 3: Q2 Team Gear — PLANNING
  await prisma.project.create({
    data: {
      companyId: demo.id,
      createdById: janeSmith.id,
      name: "Q2 Team Gear",
      description: "Polos and branded gear for new hires starting in April.",
      status: "PLANNING",
      eventDate: daysAgo(-30),
      clientContact: "Mike Park",
      createdAt: daysAgo(10),
      quotes: {
        connect: [{ number: "QT-2026-002" }],
      },
    },
  }).catch(() => {});

  // Project 4: Bloom Rebrand Launch — ACTIVE
  await prisma.project.create({
    data: {
      companyId: bloom.id,
      createdById: bloomAdmin.id,
      name: "Bloom Rebrand Launch",
      description: "Merch and materials for the rebrand launch. Tees, totes, stickers.",
      status: "ACTIVE",
      eventDate: daysAgo(-15),
      clientContact: "Lisa Chen",
      budget: 8000,
      createdAt: daysAgo(21),
      orders: {
        connect: [{ number: "ORD-2026-004" }],
      },
    },
  }).catch(() => {});

  // Project 5: NovaTech Conference Booth — PLANNING
  await prisma.project.create({
    data: {
      companyId: globex.id,
      createdById: globexAdmin.id,
      name: "NovaTech Conference Booth",
      description: "Booth setup for the annual tech conference. Need banners, swag bags, branded USB drives.",
      status: "PLANNING",
      createdAt: daysAgo(5),
      orders: {
        connect: [{ number: "ORD-2026-003" }],
      },
    },
  }).catch(() => {});

  // ─── Message Threads ─────────────────────────────────────────────
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

  await prisma.messageThread.create({
    data: {
      companyId: demo.id,
      subject: "Logo placement on polo shirts",
      orderTitle: "ORD-2026-001 — Acme Polo Shirts",
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
  }).catch(() => {});

  await prisma.messageThread.create({
    data: {
      companyId: demo.id,
      subject: "Delivery timeline for conference booth banners",
      orderTitle: "ORD-2026-002 — Trade Show Booth Package",
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
  }).catch(() => {});

  await prisma.messageThread.create({
    data: {
      companyId: globex.id,
      subject: "Bulk hoodie order — sizing samples",
      orderTitle: "ORD-2026-003 — Globex Winter Hoodies",
      status: "waiting_on_ccc",
      createdBy: globexAdmin.id,
      assigneeId: cccAdmin.id,
      createdAt: hoursAgo(36),
      messages: {
        create: [
          { authorId: globexAdmin.id, body: "Can we get sizing samples before committing to the full 500-unit order?", senderType: "client", createdAt: hoursAgo(36) },
          { authorId: cccAdmin.id, body: "Of course. I'll ship S, M, L, XL samples to your office. Should arrive in 3 business days.", senderType: "staff", createdAt: hoursAgo(30) },
          { authorId: globexAdmin.id, body: "Great, please send to our main office at 123 Globex Blvd, Cypress Creek.", senderType: "client", createdAt: hoursAgo(28) },
          { authorId: cccAdmin.id, body: "Internal: samples shipped via FedEx, tracking #789456123.", senderType: "internal", createdAt: hoursAgo(26) },
        ],
      },
    },
  }).catch(() => {});

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
  }).catch(() => {});

  // QT-2026-004 — Acme, APPROVED
  await prisma.quote.create({
    data: {
      number: "QT-2026-004",
      companyId: demo.id,
      createdByUserId: cccAdmin.id,
      title: "Trade Show Banners — March",
      status: "APPROVED",
      paymentTermType: "FULL",
      clientMessage: "Banners for your Austin trade show. Rush turnaround included.",
      sentAt: new Date("2026-02-10"),
      approvedAt: new Date("2026-02-11"),
      approvedByUserId: janeSmith.id,
      items: {
        create: [
          {
            description: "Retractable Banner Stand — 33x80\"",
            unitPrice: 185.00,
            quantity: 3,
            decorationNotes: "Full color print. Artwork file: acme-tradeshow-2026-v2.pdf",
            sortOrder: 0,
            lineTotal: 185.00 * 3,
          },
          {
            description: "Table Throw — 6ft, Full Color",
            unitPrice: 145.00,
            quantity: 2,
            decorationNotes: "Full wrap print. Match PMS 286C.",
            sortOrder: 1,
            lineTotal: 145.00 * 2,
          },
        ],
      },
    },
  }).catch(() => {});

  // QT-2026-005 — Acme, CONVERTED
  await prisma.quote.create({
    data: {
      number: "QT-2026-005",
      companyId: demo.id,
      createdByUserId: cccAdmin.id,
      title: "Holiday Gift Boxes — Dec 2025 (Reissue)",
      status: "CONVERTED",
      paymentTermType: "NET",
      netDays: 30,
      sentAt: new Date("2026-01-05"),
      approvedAt: new Date("2026-01-06"),
      convertedAt: new Date("2026-01-06"),
      items: {
        create: [
          {
            description: "Custom Gift Box Kit (Mug + Socks + Card)",
            unitPrice: 45.00,
            quantity: 50,
            sortOrder: 0,
            lineTotal: 45.00 * 50,
          },
        ],
      },
    },
  }).catch(() => {});

  // ─── Invoices & Payments ─────────────────────────────────────────

  const ord1 = await prisma.order.findUnique({ where: { number: "ORD-2026-001" } });
  const ord3 = await prisma.order.findUnique({ where: { number: "ORD-2026-003" } });
  const ord4 = await prisma.order.findUnique({ where: { number: "ORD-2026-004" } });
  const ord5 = await prisma.order.findUnique({ where: { number: "ORD-2026-005" } });

  // INV-2026-001 — Acme ORD-2026-001, SENT, no payments
  await prisma.invoice.create({
    data: {
      number: "INV-2026-001",
      orderId: ord1!.id,
      companyId: demo.id,
      status: "SENT",
      issuedAt: daysAgo(10),
      dueDate: daysAgo(-20),
      memo: "50% deposit invoice for Acme Q1 polo order.",
      items: {
        create: [
          {
            description: "Classic Polo Shirt — Navy",
            quantity: 150,
            unitPrice: 18.99,
            lineTotal: 2848.50,
          },
          {
            description: "Classic Polo Shirt — White",
            quantity: 50,
            unitPrice: 18.99,
            lineTotal: 949.50,
          },
          {
            description: "Essential Crew T-Shirt — Black",
            quantity: 45,
            unitPrice: 9.99,
            lineTotal: 449.55,
          },
        ],
      },
    },
  }).catch(() => {});

  // INV-2026-002 — Bloom ORD-2026-004, PARTIALLY_PAID, 1 payment
  await prisma.invoice.create({
    data: {
      number: "INV-2026-002",
      orderId: ord4!.id,
      companyId: bloom.id,
      status: "PARTIALLY_PAID",
      issuedAt: daysAgo(18),
      dueDate: daysAgo(-3),
      memo: "Bloom Studio grand opening order — deposit collected, balance due on delivery.",
      items: {
        create: [
          {
            description: "Bloom-branded Tees — Sage Green",
            quantity: 200,
            unitPrice: 12.50,
            lineTotal: 2500.00,
          },
          {
            description: "Window Vinyl Decals (Set of 4)",
            quantity: 4,
            unitPrice: 75.00,
            lineTotal: 300.00,
          },
          {
            description: "Canvas Tote Bags — Natural",
            quantity: 100,
            unitPrice: 4.50,
            lineTotal: 450.00,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 1625.00,
            method: "STRIPE",
            reference: "pi_3abc123def456",
            recordedByUserId: cccAdmin.id,
            paidAt: daysAgo(15),
            notes: "50% deposit via Stripe",
          },
        ],
      },
    },
  }).catch(() => {});

  // INV-2026-003 — Redline ORD-2026-005, PAID, 1 payment
  await prisma.invoice.create({
    data: {
      number: "INV-2026-003",
      orderId: ord5!.id,
      companyId: redline.id,
      status: "PAID",
      issuedAt: daysAgo(40),
      dueDate: daysAgo(10),
      paidAt: daysAgo(12),
      memo: "Final invoice — Redline corporate gala shirts.",
      items: {
        create: [
          {
            description: "Dress Shirts — White w/ Red Embroidery",
            quantity: 100,
            unitPrice: 29.97,
            lineTotal: 2997.00,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 2997.00,
            method: "CHECK",
            reference: "CHK-7891",
            recordedByUserId: cccAdmin.id,
            paidAt: daysAgo(12),
            notes: "Paid in full via check",
          },
        ],
      },
    },
  }).catch(() => {});

  // INV-2026-004 — Globex ORD-2026-003, DRAFT, no payments
  await prisma.invoice.create({
    data: {
      number: "INV-2026-004",
      orderId: ord3!.id,
      companyId: globex.id,
      status: "DRAFT",
      memo: "Globex winter hoodie order — pending final approval.",
      items: {
        create: [
          {
            description: "Performance Hoodie — Black",
            quantity: 500,
            unitPrice: 38.99,
            lineTotal: 19495.00,
          },
        ],
      },
    },
  }).catch(() => {});

  // INV-2026-005 — Acme ORD-2026-001, OVERDUE, no payments
  await prisma.invoice.create({
    data: {
      number: "INV-2026-005",
      orderId: ord1!.id,
      companyId: demo.id,
      status: "OVERDUE",
      issuedAt: daysAgo(35),
      dueDate: daysAgo(5),
      memo: "Balance due for Acme Q1 onboarding polos.",
      items: {
        create: [
          {
            description: "Balance due — Classic Polo Shirt — Navy",
            quantity: 150,
            unitPrice: 18.99,
            lineTotal: 2848.50,
          },
          {
            description: "Balance due — Classic Polo Shirt — White",
            quantity: 50,
            unitPrice: 18.99,
            lineTotal: 949.50,
          },
          {
            description: "Balance due — Essential Crew T-Shirt — Black",
            quantity: 45,
            unitPrice: 9.99,
            lineTotal: 449.55,
          },
        ],
      },
    },
  }).catch(() => {});

  // ─── Tasks ──────────────────────────────────────────────────────

  const ord2 = await prisma.order.findUnique({ where: { number: "ORD-2026-002" } });

  // Task 1: Order-linked, HIGH, assigned to staff + client → EXTERNAL
  await prisma.task.create({
    data: {
      orderId: ord1!.id,
      tenantId: demo.id,
      title: "Approve final artwork for Acme polos",
      description: "Client needs to sign off on the embroidery placement before we go to production.",
      status: "TODO",
      priority: "HIGH",
      dueDate: daysAgo(-3),
      visibility: "EXTERNAL",
      createdByUserId: cccAdmin.id,
      createdAt: daysAgo(5),
      assignees: { create: [{ userId: cccAdmin.id }, { userId: janeSmith.id }] },
    },
  });

  // Task 2: Order-linked, MEDIUM, staff only → INTERNAL
  await prisma.task.create({
    data: {
      orderId: ord1!.id,
      tenantId: demo.id,
      title: "Source backup thread color for navy polos",
      description: "Primary thread vendor is backordered. Check SanMar and S&S for alternatives.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      visibility: "INTERNAL",
      createdByUserId: cccAdmin.id,
      createdAt: daysAgo(4),
      assignees: { create: [{ userId: cccAdmin.id }] },
    },
  });

  // Task 3: Order-linked, completed
  await prisma.task.create({
    data: {
      orderId: ord1!.id,
      tenantId: demo.id,
      title: "Confirm size breakdown with Acme HR",
      status: "DONE",
      priority: "MEDIUM",
      visibility: "EXTERNAL",
      createdByUserId: janeSmith.id,
      completedAt: daysAgo(2),
      completedByUserId: janeSmith.id,
      createdAt: daysAgo(8),
      assignees: { create: [{ userId: janeSmith.id }] },
    },
  });

  // Task 4: Order-linked to ORD-2026-002
  await prisma.task.create({
    data: {
      orderId: ord2!.id,
      tenantId: demo.id,
      title: "Ship booth display samples to venue",
      description: "Need to arrive 2 days before event for setup.",
      status: "TODO",
      priority: "HIGH",
      dueDate: daysAgo(-5),
      visibility: "EXTERNAL",
      createdByUserId: cccAdmin.id,
      createdAt: daysAgo(3),
      assignees: { create: [{ userId: cccAdmin.id }, { userId: johnDoe.id }] },
    },
  });

  // Task 5: Standalone internal task
  await prisma.task.create({
    data: {
      title: "Update Q2 pricing sheet",
      description: "New vendor pricing came in. Update the internal pricing calculator.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: daysAgo(-14),
      visibility: "INTERNAL",
      createdByUserId: cccAdmin.id,
      createdAt: daysAgo(7),
      assignees: { create: [{ userId: cccAdmin.id }] },
    },
  });

  // Task 6: Globex order task
  await prisma.task.create({
    data: {
      orderId: ord3!.id,
      tenantId: globex.id,
      title: "Confirm hoodie color swatches with Globex",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      visibility: "EXTERNAL",
      createdByUserId: cccAdmin.id,
      createdAt: daysAgo(6),
      assignees: { create: [{ userId: globexAdmin.id }] },
    },
  });

  // Task 7: Low priority done task
  await prisma.task.create({
    data: {
      orderId: ord3!.id,
      tenantId: globex.id,
      title: "Generate PO for Globex winter order",
      status: "DONE",
      priority: "LOW",
      visibility: "INTERNAL",
      createdByUserId: cccAdmin.id,
      completedAt: daysAgo(1),
      completedByUserId: cccAdmin.id,
      createdAt: daysAgo(10),
    },
  });

  // Task 8: Standalone client-visible task
  await prisma.task.create({
    data: {
      tenantId: demo.id,
      title: "Schedule Q2 planning call with Acme",
      description: "Discuss upcoming product launches and swag needs for next quarter.",
      status: "TODO",
      priority: "LOW",
      dueDate: daysAgo(-21),
      visibility: "EXTERNAL",
      createdByUserId: cccAdmin.id,
      createdAt: daysAgo(2),
      assignees: { create: [{ userId: cccAdmin.id }, { userId: janeSmith.id }] },
    },
  });

  // Task 9: Urgent standalone
  await prisma.task.create({
    data: {
      title: "Fix invoice template formatting",
      description: "Tax line is wrapping on PDF export. Need to adjust margins.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      visibility: "INTERNAL",
      createdByUserId: cccAdmin.id,
      createdAt: daysAgo(1),
      assignees: { create: [{ userId: cccAdmin.id }] },
    },
  });

  // Task 10: Client-created task
  await prisma.task.create({
    data: {
      orderId: ord1!.id,
      tenantId: demo.id,
      title: "Send updated logo file (vector format)",
      description: "The current logo file is low-res. Need .ai or .eps version.",
      status: "TODO",
      priority: "HIGH",
      dueDate: daysAgo(-2),
      visibility: "EXTERNAL",
      createdByUserId: janeSmith.id,
      createdAt: daysAgo(1),
      assignees: { create: [{ userId: janeSmith.id }] },
    },
  });

  // ─── Artwork Assets ──────────────────────────────────────────────

  const art1 = await prisma.artworkAsset.create({
    data: {
      companyId: demo.id,
      name: "Acme Primary Logo",
      description: "Official Acme Corp primary logo in vector format",
      filename: "acme-logo-primary.ai",
      fileType: "ai",
      currentVersion: 2,
      createdBy: janeSmith.id,
      createdAt: daysAgo(45),
      versions: {
        create: [
          {
            versionNumber: 1,
            fileName: "acme-logo-primary-v1.ai",
            fileUrl: "https://mock-s3.example.com/artwork/acme/logo-v1.ai",
            fileSize: 2400000,
            mimeType: "application/illustrator",
            sourceType: "NATIVE",
            s3Key: "artwork/acme/logo-v1.ai",
            uploadedBy: janeSmith.id,
            notes: "Initial upload",
            createdAt: daysAgo(45),
          },
          {
            versionNumber: 2,
            fileName: "acme-logo-primary-v2.ai",
            fileUrl: "https://mock-s3.example.com/artwork/acme/logo-v2.ai",
            fileSize: 2650000,
            mimeType: "application/illustrator",
            sourceType: "NATIVE",
            s3Key: "artwork/acme/logo-v2.ai",
            uploadedBy: janeSmith.id,
            notes: "Updated brand colors",
            createdAt: daysAgo(20),
          },
        ],
      },
      tags: {
        create: [{ tag: "logo" }, { tag: "brand" }, { tag: "vector" }],
      },
      orderArtworkLinks: ord1
        ? {
            create: [
              { orderId: ord1.id, linkedByUserId: janeSmith.id },
            ],
          }
        : undefined,
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: demo.id,
      name: "Trade Show Banner Design",
      description: "36x80 retractable banner for Q2 trade show",
      filename: "tradeshow-banner-2026.pdf",
      fileType: "pdf",
      currentVersion: 1,
      createdBy: janeSmith.id,
      createdAt: daysAgo(30),
      versions: {
        create: [
          {
            versionNumber: 1,
            fileName: "tradeshow-banner-2026.pdf",
            fileUrl: "https://www.dropbox.com/s/mock/banner-design.pdf",
            fileSize: 8500000,
            mimeType: "application/pdf",
            sourceType: "DROPBOX",
            dropboxLink: "https://www.dropbox.com/s/mock/banner-design.pdf",
            dropboxPath: "/Acme Marketing/Trade Show/banner-2026.pdf",
            uploadedBy: janeSmith.id,
            notes: "Linked from team Dropbox",
            createdAt: daysAgo(30),
          },
        ],
      },
      tags: {
        create: [{ tag: "banner" }, { tag: "trade-show" }, { tag: "print" }],
      },
      orderArtworkLinks: ord1
        ? {
            create: [
              { orderId: ord1.id, linkedByUserId: cccAdmin.id },
            ],
          }
        : undefined,
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: demo.id,
      name: "Product Photography - Widget Pro",
      description: "High-res product shots for catalog",
      filename: "widget-pro-photo-set.png",
      fileType: "png",
      currentVersion: 1,
      createdBy: cccAdmin.id,
      createdAt: daysAgo(15),
      versions: {
        create: [
          {
            versionNumber: 1,
            fileName: "widget-pro-photo-set.png",
            fileUrl: "https://drive.google.com/file/d/mock123/view",
            fileSize: 12000000,
            mimeType: "image/png",
            sourceType: "GOOGLE_DRIVE",
            googleDriveFileId: "mock123",
            googleDriveLink: "https://drive.google.com/file/d/mock123/view",
            uploadedBy: cccAdmin.id,
            notes: "Studio photos from spring shoot",
            createdAt: daysAgo(15),
          },
        ],
      },
      tags: {
        create: [{ tag: "photography" }, { tag: "product" }, { tag: "catalog" }],
      },
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: bloom.id,
      name: "Bloom Studio Brandmark",
      description: "Brandmark and wordmark for Bloom Studio",
      filename: "bloom-brandmark.svg",
      fileType: "svg",
      currentVersion: 1,
      createdBy: bloomAdmin.id,
      createdAt: daysAgo(60),
      versions: {
        create: [
          {
            versionNumber: 1,
            fileName: "bloom-brandmark.svg",
            fileUrl: "https://mock-s3.example.com/artwork/bloom/brandmark.svg",
            fileSize: 45000,
            mimeType: "image/svg+xml",
            sourceType: "NATIVE",
            s3Key: "artwork/bloom/brandmark.svg",
            uploadedBy: bloomAdmin.id,
            createdAt: daysAgo(60),
          },
        ],
      },
      tags: {
        create: [{ tag: "logo" }, { tag: "brand" }, { tag: "svg" }],
      },
    },
  });

  await prisma.artworkAsset.create({
    data: {
      companyId: bloom.id,
      name: "Event Invitation Template",
      description: "Editable Photoshop template for event invitations",
      filename: "bloom-invite-template.psd",
      fileType: "psd",
      currentVersion: 1,
      createdBy: bloomAdmin.id,
      createdAt: daysAgo(25),
      versions: {
        create: [
          {
            versionNumber: 1,
            fileName: "bloom-invite-template.psd",
            fileUrl: "https://www.dropbox.com/s/mock/bloom-invite.psd",
            fileSize: 18000000,
            mimeType: "image/vnd.adobe.photoshop",
            sourceType: "DROPBOX",
            dropboxLink: "https://www.dropbox.com/s/mock/bloom-invite.psd",
            dropboxPath: "/Bloom Studio/Templates/invite-2026.psd",
            uploadedBy: bloomAdmin.id,
            notes: "Master template - do not flatten layers",
            createdAt: daysAgo(25),
          },
        ],
      },
      tags: {
        create: [{ tag: "template" }, { tag: "invitation" }, { tag: "editable" }],
      },
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
