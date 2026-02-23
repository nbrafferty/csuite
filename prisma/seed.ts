import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.threadReadState.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create tenants
  const acme = await prisma.tenant.create({
    data: {
      id: "tenant-acme",
      companyName: "Acme Corp",
      primaryContact: "Lisa Chen",
      billingStatus: "good",
      activeOrderCount: 5,
    },
  });

  const bloom = await prisma.tenant.create({
    data: {
      id: "tenant-bloom",
      companyName: "Bloom Studio",
      primaryContact: "Lisa Chen",
      billingStatus: "good",
      activeOrderCount: 3,
    },
  });

  const redline = await prisma.tenant.create({
    data: {
      id: "tenant-redline",
      companyName: "Redline Events",
      primaryContact: "Tom Rivera",
      billingStatus: "good",
      activeOrderCount: 2,
    },
  });

  const novatech = await prisma.tenant.create({
    data: {
      id: "tenant-novatech",
      companyName: "NovaTech",
      primaryContact: "Mike Park",
      billingStatus: "good",
      activeOrderCount: 4,
    },
  });

  const greenfield = await prisma.tenant.create({
    data: {
      id: "tenant-greenfield",
      companyName: "Greenfield Co",
      primaryContact: "Dana Kim",
      billingStatus: "good",
      activeOrderCount: 1,
    },
  });

  // Create staff users
  const sarah = await prisma.user.create({
    data: {
      id: "user-sarah",
      name: "Sarah M.",
      email: "sarah@centralcreative.com",
      role: "ccc_staff",
    },
  });

  const alex = await prisma.user.create({
    data: {
      id: "user-alex",
      name: "Alex K.",
      email: "alex@centralcreative.com",
      role: "ccc_staff",
    },
  });

  const jordan = await prisma.user.create({
    data: {
      id: "user-jordan",
      name: "Jordan R.",
      email: "jordan@centralcreative.com",
      role: "ccc_staff",
    },
  });

  // Create client users
  const lisa = await prisma.user.create({
    data: {
      id: "user-lisa",
      name: "Lisa Chen",
      email: "lisa@bloomstudio.com",
      role: "client_admin",
      tenantId: bloom.id,
    },
  });

  const tom = await prisma.user.create({
    data: {
      id: "user-tom",
      name: "Tom Rivera",
      email: "tom@redlineevents.com",
      role: "client_admin",
      tenantId: redline.id,
    },
  });

  const mike = await prisma.user.create({
    data: {
      id: "user-mike",
      name: "Mike Park",
      email: "mike@novatech.com",
      role: "client_admin",
      tenantId: novatech.id,
    },
  });

  const dana = await prisma.user.create({
    data: {
      id: "user-dana",
      name: "Dana Kim",
      email: "dana@greenfield.com",
      role: "client_admin",
      tenantId: greenfield.id,
    },
  });

  const acmeAdmin = await prisma.user.create({
    data: {
      id: "user-acme-admin",
      name: "James Wilson",
      email: "james@acmecorp.com",
      role: "client_admin",
      tenantId: acme.id,
    },
  });

  // Create threads matching mock data
  const now = new Date();

  // THR-001: Acme Corp - Logo placement on back panel
  const thread1 = await prisma.thread.create({
    data: {
      id: "thr-001",
      subject: "Logo placement on back panel",
      orderId: "CS-9012",
      orderTitle: "Summer Tees 2026",
      status: "waiting_client",
      tenantId: acme.id,
      assigneeId: sarah.id,
      updatedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
    },
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: thread1.id,
        senderId: acmeAdmin.id,
        senderType: "client",
        text: "Hi, we need to adjust the logo placement on the back panel. It's currently too high — can we move it down about 2 inches?",
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      },
      {
        threadId: thread1.id,
        senderId: sarah.id,
        senderType: "staff",
        text: "I've attached the updated mockup with the revised logo position. Can you confirm this works?",
        attachments: JSON.stringify(["mockup-v2.pdf"]),
        createdAt: new Date(now.getTime() - 2 * 60 * 1000),
      },
    ],
  });

  // THR-002: Bloom Studio - Thread color change request
  const thread2 = await prisma.thread.create({
    data: {
      id: "thr-002",
      subject: "Thread color change request",
      orderId: "CS-8991",
      orderTitle: "Brand Refresh Hoodies",
      status: "open",
      tenantId: bloom.id,
      assigneeId: sarah.id,
      updatedAt: new Date(now.getTime() - 12 * 60 * 1000), // 12 min ago
    },
  });

  await prisma.message.createMany({
    data: [
      {
        id: "msg-201",
        threadId: thread2.id,
        senderId: lisa.id,
        senderType: "client",
        text: "Hi! We just got the proof back for the Brand Refresh Hoodies order. The overall layout looks great, but I noticed the thread color on the embroidery is charcoal — our brand guide specifies navy (Pantone 289C). Can we get that changed before we approve?",
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 10:22 AM equivalent
      },
      {
        id: "msg-202",
        threadId: thread2.id,
        senderId: sarah.id,
        senderType: "staff",
        text: "Hi Lisa! Thanks for catching that. I'll have the production team update the thread color to Pantone 289C and re-render the proof. Should have a new version for you by end of day.",
        createdAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000), // 10:35 AM
      },
      {
        id: "msg-203",
        threadId: thread2.id,
        senderId: sarah.id,
        senderType: "internal",
        text: "Note to team: Check if we have navy 289C thread in stock. If not, we may need to order from Superior Threads — lead time is 2 days. @Alex can you confirm inventory?",
        createdAt: new Date(now.getTime() - 2.4 * 60 * 60 * 1000), // 10:36 AM
      },
      {
        id: "msg-204",
        threadId: thread2.id,
        senderId: lisa.id,
        senderType: "client",
        text: "Perfect, thank you! Also — can we change the thread color to navy on the cuffs too? I want everything consistent.",
        createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // 11:02 AM
      },
      {
        id: "msg-205",
        threadId: thread2.id,
        senderId: alex.id,
        senderType: "internal",
        text: "Checked inventory — we have 289C in stock, 4 spools. That's enough for this run. No need to reorder.",
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 11:15 AM
      },
    ],
  });

  // THR-003: Redline Events - Delivery timeline
  const thread3 = await prisma.thread.create({
    data: {
      id: "thr-003",
      subject: "Delivery timeline for March event",
      orderId: "CS-8960",
      orderTitle: "Event Banners Q1",
      status: "open",
      tenantId: redline.id,
      assigneeId: null,
      updatedAt: new Date(now.getTime() - 34 * 60 * 1000), // 34 min ago
    },
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: thread3.id,
        senderId: tom.id,
        senderType: "client",
        text: "We need these by March 8th at the latest. Is that still on track?",
        createdAt: new Date(now.getTime() - 34 * 60 * 1000),
      },
    ],
  });

  // THR-004: NovaTech - Sizing question
  const thread4 = await prisma.thread.create({
    data: {
      id: "thr-004",
      subject: "Sizing question — unisex vs fitted",
      orderId: "CS-8974",
      orderTitle: "Conference Merch Pack",
      status: "open",
      tenantId: novatech.id,
      assigneeId: null,
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hrs ago
    },
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: thread4.id,
        senderId: mike.id,
        senderType: "client",
        text: "Do you have a sizing chart for the unisex cut? We want to make sure we order the right split.",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
  });

  // THR-005: Greenfield Co - Proof annotation
  const thread5 = await prisma.thread.create({
    data: {
      id: "thr-005",
      subject: "Proof annotation — ink color off",
      orderId: "CS-9008",
      orderTitle: "Eco Tote Bags",
      status: "waiting_staff",
      tenantId: greenfield.id,
      assigneeId: alex.id,
      updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hrs ago
    },
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: thread5.id,
        senderId: dana.id,
        senderType: "client",
        text: "The green in the proof looks too lime. We need it closer to Pantone 349C.",
        attachments: JSON.stringify(["proof-v1-annotated.png"]),
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
    ],
  });

  // THR-006: Acme Corp - Shipping address update (resolved)
  const thread6 = await prisma.thread.create({
    data: {
      id: "thr-006",
      subject: "Shipping address update",
      orderId: "CS-8945",
      orderTitle: "Holiday Gift Boxes",
      status: "resolved",
      tenantId: acme.id,
      assigneeId: jordan.id,
      updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hrs ago
    },
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: thread6.id,
        senderId: acmeAdmin.id,
        senderType: "client",
        text: "We need to update the shipping address for this order. The new address is 123 Main St, Suite 400, New York, NY 10001.",
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        threadId: thread6.id,
        senderId: jordan.id,
        senderType: "staff",
        text: "Thanks for confirming. We'll update the shipping label and have it out tomorrow.",
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
    ],
  });

  // Set read states to simulate unread counts
  // Mark threads 5, 6 as read by sarah (the logged-in user)
  await prisma.threadReadState.createMany({
    data: [
      { threadId: thread5.id, userId: sarah.id, readAt: now },
      { threadId: thread6.id, userId: sarah.id, readAt: now },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
