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
    where: { displayId: "CS-1001" },
    update: {},
    create: {
      companyId: demo.id,
      createdBy: janeSmith.id,
      displayId: "CS-1001",
      sourceType: "CATALOG",
      title: "Acme Polo Shirts — Q1 Onboarding",
      status: "IN_PRODUCTION",
      dueDate: daysAgo(-10),
      poNumber: "ACME-PO-2026-001",
      eventName: "Q1 New Hire Onboarding",
      subtotal: 4247.50,
      taxRate: 0.0825,
      taxAmount: 350.42,
      shippingAmount: 89.00,
      totalAmount: 4686.92,
      createdAt: daysAgo(14),
      items: {
        create: [
          {
            position: 1,
            contentType: "APPAREL",
            title: "Classic Polo Shirt — Navy",
            description: "Left chest embroidery with Acme logo",
            catalogProductId: productPolo.id,
            sku: "POL-001-NVY",
            vendorId: vendorSanMar.id,
            unitPrice: 18.99,
            quantity: 150,
            sizeBreakdown: { S: 15, M: 40, L: 50, XL: 30, "2XL": 15 },
            lineTotal: 2848.50,
            costPerUnit: 11.50,
            totalCost: 1725.00,
            profitMargin: 1123.50,
            status: "IN_PRODUCTION",
          },
          {
            position: 2,
            contentType: "APPAREL",
            title: "Classic Polo Shirt — White",
            description: "Left chest embroidery with Acme logo",
            catalogProductId: productPolo.id,
            sku: "POL-001-WHT",
            vendorId: vendorSanMar.id,
            unitPrice: 18.99,
            quantity: 50,
            sizeBreakdown: { S: 5, M: 15, L: 15, XL: 10, "2XL": 5 },
            lineTotal: 949.50,
            costPerUnit: 11.50,
            totalCost: 575.00,
            profitMargin: 374.50,
            status: "IN_PRODUCTION",
          },
          {
            position: 3,
            contentType: "APPAREL",
            title: "Essential Crew T-Shirt — Black",
            description: "Full back screen print",
            catalogProductId: productTee.id,
            sku: "TEE-001-BLK",
            vendorId: vendorPrintShop.id,
            unitPrice: 9.99,
            quantity: 45,
            sizeBreakdown: { M: 15, L: 15, XL: 10, "2XL": 5 },
            lineTotal: 449.55,
            costPerUnit: 5.25,
            totalCost: 236.25,
            profitMargin: 213.30,
            status: "PENDING",
          },
        ],
      },
    },
  });

  // Order 2: Acme — Submitted
  await prisma.order.upsert({
    where: { displayId: "CS-1002" },
    update: {},
    create: {
      companyId: demo.id,
      createdBy: johnDoe.id,
      displayId: "CS-1002",
      sourceType: "CATALOG",
      title: "Trade Show Booth Package",
      status: "SUBMITTED",
      dueDate: daysAgo(-21),
      eventName: "SxSW 2026",
      subtotal: 1633.98,
      totalAmount: 1633.98,
      createdAt: daysAgo(2),
      items: {
        create: [
          { position: 1, contentType: "SIGNAGE", title: "Retractable Banner Stand — Main Booth", sku: "BNR-001", unitPrice: 149.99, quantity: 2, lineTotal: 299.98, status: "PENDING" },
          { position: 2, contentType: "APPAREL", title: "Event Staff T-Shirts — Coral", sku: "TEE-001-CRL", unitPrice: 9.99, quantity: 100, sizeBreakdown: { S: 10, M: 30, L: 30, XL: 20, "2XL": 10 }, lineTotal: 999.00, status: "PENDING" },
          { position: 3, contentType: "PROMO_ITEM", title: "Custom Die-Cut Stickers", sku: "STK-001", unitPrice: 0.59, quantity: 500, lineTotal: 295.00, status: "PENDING" },
          { position: 4, contentType: "COMMERCIAL_PRINTING", title: "Business Cards — Matte", sku: "PRT-001", unitPrice: 0.08, quantity: 500, lineTotal: 40.00, status: "PENDING" },
        ],
      },
    },
  });

  // Order 3: Globex — Approved
  await prisma.order.upsert({
    where: { displayId: "CS-1003" },
    update: {},
    create: {
      companyId: globex.id,
      createdBy: globexAdmin.id,
      displayId: "CS-1003",
      sourceType: "CATALOG",
      title: "Globex Winter Hoodies 2026",
      status: "APPROVED",
      dueDate: daysAgo(-30),
      poNumber: "GLX-PO-2026-012",
      subtotal: 19495.00,
      shippingAmount: 250.00,
      taxAmount: 1608.38,
      taxRate: 0.0825,
      totalAmount: 21353.38,
      createdAt: daysAgo(7),
      items: {
        create: [
          {
            position: 1,
            contentType: "APPAREL",
            title: "Performance Hoodie — Black",
            catalogProductId: productHoodie.id,
            sku: "HOD-001-BLK",
            vendorId: vendorSSActive.id,
            unitPrice: 38.99,
            quantity: 500,
            sizeBreakdown: { S: 50, M: 125, L: 150, XL: 100, "2XL": 75 },
            lineTotal: 19495.00,
            costPerUnit: 22.00,
            totalCost: 11000.00,
            profitMargin: 8495.00,
            status: "PENDING",
          },
        ],
      },
    },
  });

  // Order 4: Bloom — Shipped
  await prisma.order.upsert({
    where: { displayId: "CS-1004" },
    update: {},
    create: {
      companyId: bloom.id,
      createdBy: bloomAdmin.id,
      displayId: "CS-1004",
      sourceType: "QUOTE",
      title: "Bloom Studio Grand Opening Kit",
      status: "SHIPPED",
      dueDate: daysAgo(-5),
      subtotal: 3250.00,
      shippingAmount: 45.00,
      taxAmount: 268.13,
      taxRate: 0.0825,
      totalAmount: 3563.13,
      createdAt: daysAgo(21),
      items: {
        create: [
          { position: 1, contentType: "APPAREL", title: "Bloom-branded Tees — Sage Green", unitPrice: 12.50, quantity: 200, lineTotal: 2500.00, status: "COMPLETED" },
          { position: 2, contentType: "SIGNAGE", title: "Window Vinyl Decals (Set of 4)", unitPrice: 75.00, quantity: 4, lineTotal: 300.00, status: "COMPLETED" },
          { position: 3, contentType: "PROMO_ITEM", title: "Canvas Tote Bags — Natural", unitPrice: 4.50, quantity: 100, lineTotal: 450.00, status: "COMPLETED" },
        ],
      },
      shipments: {
        create: [{
          destinationAddress: { name: "Bloom Studio", street: "789 Flower Ave", city: "San Francisco", state: "CA", zip: "94102", country: "US" },
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
    where: { displayId: "CS-1005" },
    update: {},
    create: {
      companyId: redline.id,
      createdBy: redlineAdmin.id,
      displayId: "CS-1005",
      sourceType: "CATALOG",
      title: "Redline Events — Corporate Gala Shirts",
      status: "COMPLETED",
      dueDate: daysAgo(5),
      poNumber: "RDL-2026-003",
      subtotal: 2997.00,
      shippingAmount: 65.00,
      totalAmount: 3062.00,
      createdAt: daysAgo(45),
      items: {
        create: [{
          position: 1,
          contentType: "APPAREL",
          title: "Dress Shirts — White w/ Red Embroidery",
          unitPrice: 29.97,
          quantity: 100,
          lineTotal: 2997.00,
          status: "COMPLETED",
        }],
      },
    },
  });

  // Order 6: Greenfield — In Review
  await prisma.order.upsert({
    where: { displayId: "CS-1006" },
    update: {},
    create: {
      companyId: greenfield.id,
      createdBy: greenfieldAdmin.id,
      displayId: "CS-1006",
      sourceType: "CATALOG",
      title: "Greenfield Earth Day Merch",
      status: "IN_REVIEW",
      dueDate: daysAgo(-15),
      eventName: "Earth Day 2026",
      subtotal: 1674.50,
      totalAmount: 1674.50,
      createdAt: daysAgo(3),
      items: {
        create: [
          { position: 1, contentType: "APPAREL", title: "Organic Cotton Tees — Forest Green", unitPrice: 14.50, quantity: 75, sizeBreakdown: { S: 10, M: 25, L: 25, XL: 10, "2XL": 5 }, lineTotal: 1087.50, status: "PENDING" },
          { position: 2, contentType: "PROMO_ITEM", title: "Recycled Polyester Drawstring Bags", unitPrice: 5.87, quantity: 100, lineTotal: 587.00, status: "PENDING" },
        ],
      },
    },
  });

  // ─── Sample Quotes ───────────────────────────────────────────────

  await prisma.quote.upsert({
    where: { displayId: "Q-1001" },
    update: {},
    create: {
      displayId: "Q-1001",
      companyId: demo.id,
      createdById: cccAdmin.id,
      status: "SENT",
      version: 1,
      title: "Acme Annual Conference Package",
      notes: "Pricing includes setup fees. Volume discounts applied at 200+ units.",
      validUntil: daysAgo(-30),
      subtotal: 8750.00,
      shippingAmount: 195.00,
      taxAmount: 721.88,
      totalAmount: 9666.88,
      lineItems: {
        create: [
          { position: 1, contentType: "APPAREL", title: "Conference T-Shirts — Custom Design", quantity: 500, unitPrice: 9.50, lineTotal: 4750.00 },
          { position: 2, contentType: "APPAREL", title: "Speaker Polo Shirts — Premium", quantity: 25, unitPrice: 28.00, lineTotal: 700.00 },
          { position: 3, contentType: "SIGNAGE", title: "Stage Backdrop Banner (10ft × 8ft)", quantity: 1, unitPrice: 850.00, lineTotal: 850.00 },
          { position: 4, contentType: "SIGNAGE", title: "Directional Signs (Coroplast, 24x36)", quantity: 15, unitPrice: 25.00, lineTotal: 375.00 },
          { position: 5, contentType: "PROMO_ITEM", title: "Branded Lanyards", quantity: 500, unitPrice: 2.15, lineTotal: 1075.00 },
          { position: 6, contentType: "PROMO_ITEM", title: "Conference Tote Bags", quantity: 500, unitPrice: 2.00, lineTotal: 1000.00 },
        ],
      },
    },
  });

  await prisma.quote.upsert({
    where: { displayId: "Q-1002" },
    update: {},
    create: {
      displayId: "Q-1002",
      companyId: globex.id,
      createdById: cccAdmin.id,
      status: "DRAFT",
      version: 1,
      title: "Globex Q2 New Hire Welcome Kits",
      subtotal: 6240.00,
      totalAmount: 6240.00,
      lineItems: {
        create: [
          { position: 1, contentType: "APPAREL", title: "Welcome Hoodie — Charcoal", quantity: 80, unitPrice: 38.00, lineTotal: 3040.00 },
          { position: 2, contentType: "APPAREL", title: "Welcome T-Shirt — White", quantity: 80, unitPrice: 12.00, lineTotal: 960.00 },
          { position: 3, contentType: "PROMO_ITEM", title: "Branded Water Bottle", quantity: 80, unitPrice: 15.00, lineTotal: 1200.00 },
          { position: 4, contentType: "PROMO_ITEM", title: "Custom Notebook + Pen Set", quantity: 80, unitPrice: 13.00, lineTotal: 1040.00 },
        ],
      },
    },
  });

  await prisma.quote.upsert({
    where: { displayId: "Q-1003" },
    update: {},
    create: {
      displayId: "Q-1003",
      companyId: bloom.id,
      createdById: cccAdmin.id,
      status: "CONVERTED",
      version: 2,
      title: "Bloom Studio Grand Opening Kit",
      notes: "Revised from v1 — added tote bags per client request.",
      subtotal: 3250.00,
      shippingAmount: 45.00,
      taxAmount: 268.13,
      totalAmount: 3563.13,
      lineItems: {
        create: [
          { position: 1, contentType: "APPAREL", title: "Bloom-branded Tees — Sage Green", quantity: 200, unitPrice: 12.50, lineTotal: 2500.00 },
          { position: 2, contentType: "SIGNAGE", title: "Window Vinyl Decals (Set of 4)", quantity: 4, unitPrice: 75.00, lineTotal: 300.00 },
          { position: 3, contentType: "PROMO_ITEM", title: "Canvas Tote Bags — Natural", quantity: 100, unitPrice: 4.50, lineTotal: 450.00 },
        ],
      },
      revisionComments: {
        create: [{
          authorId: bloomAdmin.id,
          body: "Can you add canvas tote bags to the order? About 100 units. Natural color.",
          version: 1,
          createdAt: daysAgo(25),
        }],
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

  // ─── Message Threads ─────────────────────────────────────────────
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

  await prisma.messageThread.create({
    data: {
      companyId: demo.id,
      subject: "Logo placement on polo shirts",
      orderTitle: "CS-1001 — Acme Polo Shirts",
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
      orderTitle: "CS-1002 — Trade Show Booth Package",
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
      orderTitle: "CS-1003 — Globex Winter Hoodies",
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
