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

  // ─── Seed Catalog Products ────────────────────────────────────────────

  const catalogProducts = [
    {
      name: "Executive Signature Hoodie",
      subtitle: "Premium 400GSM Cotton Blend",
      description: "Premium 6.1oz ring-spun cotton. Double-lined hood, classic fit.",
      category: "apparel",
      priceFrom: 45.0,
      priceUnit: "unit",
      tag: "NEW ARRIVAL",
      tagColor: "#E85D5D",
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
        "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80",
      ],
      popular: true,
    },
    {
      name: "Eco-Thread Organic Tee",
      subtitle: "100% Recycled Cotton",
      description: "Lightweight organic cotton. Available in 20+ earth tones.",
      category: "apparel",
      priceFrom: 18.5,
      priceUnit: "unit",
      tag: "SUSTAINABILITY PICK",
      tagColor: "#34C759",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Apex Technical Shell",
      subtitle: "Waterproof Gore-Tex® Compatible",
      description: "3-layer waterproof construction. Adjustable hood and cuffs.",
      category: "apparel",
      priceFrom: 142.0,
      priceUnit: "unit",
      tag: "APPAREL",
      tagColor: "#A78BFA",
      images: [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Summit Structured Cap",
      subtitle: "Premium Wool Blend / 6-Panel",
      description: "Structured 6-panel cap with pre-curved visor. Embroidery-ready.",
      category: "apparel",
      priceFrom: 12.95,
      priceUnit: "unit",
      tag: "APPAREL",
      tagColor: "#A78BFA",
      images: [
        "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&q=80",
      ],
      popular: true,
    },
    {
      name: "Bulk Promotion Tee",
      subtitle: "Lightweight Cotton / Events",
      description: "Budget-friendly event tee. Screen print or DTG. Min qty 50.",
      category: "apparel",
      priceFrom: 6.5,
      priceUnit: "unit",
      tag: "APPAREL",
      tagColor: "#A78BFA",
      images: [
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
        "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Corporate Piqué Polo",
      subtitle: "Moisture-Wicking / Antimicrobial",
      description: "Performance polo with antimicrobial finish. Perfect for corporate.",
      category: "apparel",
      priceFrom: 24.0,
      priceUnit: "unit",
      tag: "APPAREL",
      tagColor: "#A78BFA",
      images: [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Custom Tote Bag",
      subtitle: "Heavy-Duty Natural Canvas",
      description: "Heavy-duty natural canvas. Screen print or full-color options.",
      category: "promo",
      priceFrom: 4.5,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80",
      ],
      popular: true,
    },
    {
      name: "Drinkware — Tumbler",
      subtitle: "20oz Double-Wall Stainless",
      description: "20oz double-wall stainless. Laser engraving or full wrap print.",
      category: "promo",
      priceFrom: 12.0,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Retractable Banner Stand",
      subtitle: '33" x 80" Premium Banner',
      description: "Full bleed print with carry case. Premium retractable mechanism.",
      category: "signage",
      priceFrom: 85.0,
      priceUnit: "unit",
      tag: "SIGNAGE",
      tagColor: "#FFD60A",
      images: [
        "https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80",
      ],
      popular: true,
    },
    {
      name: "Vinyl Banner",
      subtitle: "13oz Gloss or Matte Vinyl",
      description: "Grommets, pole pockets, or hemmed. Indoor and outdoor options.",
      category: "signage",
      priceFrom: 38.0,
      priceUnit: "banner",
      tag: "SIGNAGE",
      tagColor: "#FFD60A",
      images: [
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Foam Board Display",
      subtitle: '3/16" Foam Core',
      description: "UV-resistant print. Custom shapes available. Lightweight.",
      category: "signage",
      priceFrom: 24.0,
      priceUnit: "unit",
      tag: "SIGNAGE",
      tagColor: "#FFD60A",
      images: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Branded Pen Set",
      subtitle: "Soft-Touch Barrel",
      description: "Soft-touch barrel with metal clip. Min qty 250.",
      category: "promo",
      priceFrom: 0.85,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=80",
      ],
      popular: false,
    },
    // Extra products for pagination
    {
      name: "Performance Quarter-Zip",
      subtitle: "Stretch Polyester Blend",
      description: "Lightweight quarter-zip pullover. Ideal for layering.",
      category: "apparel",
      priceFrom: 38.0,
      priceUnit: "unit",
      tag: "APPAREL",
      tagColor: "#A78BFA",
      images: [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Fleece Vest",
      subtitle: "Micro-Fleece / Windproof",
      description: "Full-zip micro-fleece vest. Embroidery-ready chest panel.",
      category: "apparel",
      priceFrom: 32.0,
      priceUnit: "unit",
      tag: "APPAREL",
      tagColor: "#A78BFA",
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Custom Lanyard",
      subtitle: "Dye-Sublimated / Safety Breakaway",
      description: "Full-color dye-sub lanyards with safety breakaway. Min qty 100.",
      category: "promo",
      priceFrom: 1.25,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Wireless Charging Pad",
      subtitle: "10W Fast Charge / Custom Print",
      description: "Full-color print on surface. Compatible with all Qi devices.",
      category: "promo",
      priceFrom: 8.5,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Table Throw — Fitted",
      subtitle: '6ft / 8ft Stretch Fabric',
      description: "Wrinkle-resistant stretch fabric. Machine washable.",
      category: "signage",
      priceFrom: 95.0,
      priceUnit: "unit",
      tag: "SIGNAGE",
      tagColor: "#FFD60A",
      images: [
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "A-Frame Sidewalk Sign",
      subtitle: "Double-Sided / Weather-Resistant",
      description: "Heavy-duty A-frame with interchangeable inserts.",
      category: "signage",
      priceFrom: 120.0,
      priceUnit: "unit",
      tag: "SIGNAGE",
      tagColor: "#FFD60A",
      images: [
        "https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Laptop Sleeve",
      subtitle: "Neoprene / 13\" & 15\"",
      description: "Snug-fit neoprene sleeve with full-color edge-to-edge print.",
      category: "promo",
      priceFrom: 9.95,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Heavyweight Crewneck",
      subtitle: "12oz Fleece / Oversized Fit",
      description: "Premium heavyweight fleece. Oversized streetwear cut.",
      category: "apparel",
      priceFrom: 36.0,
      priceUnit: "unit",
      tag: "NEW ARRIVAL",
      tagColor: "#E85D5D",
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
        "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80",
      ],
      popular: true,
    },
    {
      name: "Drawstring Bag",
      subtitle: "Ripstop Nylon / Cinch Sack",
      description: "Lightweight ripstop nylon drawstring bag. Full-color print.",
      category: "promo",
      priceFrom: 2.75,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Window Cling",
      subtitle: "Static Cling / Removable",
      description: "No adhesive needed. Perfect for storefronts and vehicles.",
      category: "signage",
      priceFrom: 15.0,
      priceUnit: "unit",
      tag: "SIGNAGE",
      tagColor: "#FFD60A",
      images: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Beanie — Cuffed Knit",
      subtitle: "Acrylic / Embroidered Patch",
      description: "Classic cuffed beanie with woven label or embroidered patch.",
      category: "apparel",
      priceFrom: 10.5,
      priceUnit: "unit",
      tag: "APPAREL",
      tagColor: "#A78BFA",
      images: [
        "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&q=80",
      ],
      popular: false,
    },
    {
      name: "Sticker Sheet — Custom",
      subtitle: "Die-Cut / Kiss-Cut / Sheets",
      description: "Premium vinyl stickers. Weather and UV resistant.",
      category: "promo",
      priceFrom: 0.5,
      priceUnit: "unit",
      tag: "PROMO",
      tagColor: "#5B8DEF",
      images: [
        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=80",
      ],
      popular: false,
    },
  ];

  for (const product of catalogProducts) {
    await prisma.catalogProduct.create({
      data: product,
    });
  }

  console.log(`Seeded ${catalogProducts.length} catalog products`);

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
