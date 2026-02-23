import { PrismaClient, UserRole } from "../src/generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create CCC Staff company (system tenant)
  const cccCompany = await prisma.company.upsert({
    where: { slug: "central-creative-co" },
    update: {},
    create: {
      name: "Central Creative Co",
      slug: "central-creative-co",
      inviteCode: "ccc-staff-invite-2024",
    },
  });

  console.log(`Created company: ${cccCompany.name} (${cccCompany.id})`);

  // Create CCC Staff admin user
  const passwordHash = await hash("password123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@centralcreative.co" },
    update: {},
    create: {
      email: "admin@centralcreative.co",
      passwordHash,
      firstName: "CCC",
      lastName: "Admin",
      role: UserRole.CCC_STAFF,
      companyId: cccCompany.id,
    },
  });

  console.log(`Created staff user: ${adminUser.email}`);

  // Create a demo client company
  const demoCompany = await prisma.company.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      inviteCode: "acme-invite-2024",
    },
  });

  console.log(`Created company: ${demoCompany.name} (${demoCompany.id})`);

  // Create a client admin user
  const clientAdmin = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      passwordHash,
      firstName: "Jane",
      lastName: "Doe",
      role: UserRole.CLIENT_ADMIN,
      companyId: demoCompany.id,
    },
  });

  console.log(`Created client admin: ${clientAdmin.email}`);

  // Create a client user
  const clientUser = await prisma.user.upsert({
    where: { email: "user@acme.com" },
    update: {},
    create: {
      email: "user@acme.com",
      passwordHash,
      firstName: "John",
      lastName: "Smith",
      role: UserRole.CLIENT_USER,
      companyId: demoCompany.id,
    },
  });

  console.log(`Created client user: ${clientUser.email}`);

  // Create a demo location for Acme
  await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyId: demoCompany.id,
      label: "Main Office",
      address1: "123 Main St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "US",
      contactName: "Jane Doe",
      isDefault: true,
    },
  });

  console.log("Created demo location for Acme Corp");

  console.log("\nSeed complete!");
  console.log("\nTest accounts (all passwords: password123):");
  console.log("  CCC Staff:    admin@centralcreative.co");
  console.log("  Client Admin: admin@acme.com");
  console.log("  Client User:  user@acme.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
