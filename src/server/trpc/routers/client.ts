import { z } from "zod";
import { router, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

// Statuses that count toward "active orders" (in-flight work)
const ACTIVE_ORDER_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "PROOFING",
  "APPROVED",
  "IN_PRODUCTION",
  "READY",
  "SHIPPED",
] as const;

export const clientRouter = router({
  list: staffProcedure.query(async () => {
    const [companies, activeCounts, revenueSums] = await Promise.all([
      prisma.company.findMany({
        where: {
          slug: { not: "central-creative" },
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.groupBy({
        by: ["companyId"],
        where: { status: { in: [...ACTIVE_ORDER_STATUSES] } },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["companyId"],
        where: { status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
    ]);

    const activeByCompany = new Map(activeCounts.map((r) => [r.companyId, r._count.id]));
    const revenueByCompany = new Map(
      revenueSums.map((r) => [r.companyId, Number(r._sum.totalAmount ?? 0)])
    );

    return companies.map((c) => {
      const primaryContact = c.users.find((u) => u.role === "CLIENT_ADMIN") ?? c.users[0];
      const metrics = {
        activeOrders: activeByCompany.get(c.id) ?? 0,
        revenue: revenueByCompany.get(c.id) ?? 0,
      };
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        status: c.status,
        primaryContact: primaryContact
          ? { name: primaryContact.name, email: primaryContact.email }
          : null,
        userCount: c._count.users,
        activeOrders: metrics.activeOrders,
        revenue: metrics.revenue,
        lastActivity: c.createdAt,
        createdAt: c.createdAt,
      };
    });
  }),

  get: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const company = await prisma.company.findUnique({
        where: { id: input.id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { users: true },
          },
        },
      });

      if (!company) return null;

      const [activeOrders, revenueAgg] = await Promise.all([
        prisma.order.count({
          where: { companyId: company.id, status: { in: [...ACTIVE_ORDER_STATUSES] } },
        }),
        prisma.order.aggregate({
          where: { companyId: company.id, status: { not: "CANCELLED" } },
          _sum: { totalAmount: true },
        }),
      ]);
      const metrics = {
        activeOrders,
        revenue: Number(revenueAgg._sum.totalAmount ?? 0),
      };
      const primaryContact = company.users.find((u) => u.role === "CLIENT_ADMIN") ?? company.users[0];

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: company.status,
        logoUrl: company.logoUrl,
        phone: company.phone,
        address: company.address,
        notes: company.notes,
        createdAt: company.createdAt,
        primaryContact: primaryContact
          ? { name: primaryContact.name, email: primaryContact.email }
          : null,
        users: company.users,
        userCount: company._count.users,
        activeOrders: metrics.activeOrders,
        revenue: metrics.revenue,
      };
    }),

  updateStatus: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["active", "paused", "overdue"]),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.company.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  updateNotes: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        notes: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.company.update({
        where: { id: input.id },
        data: { notes: input.notes },
      });
    }),

  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        contactName: z.string().min(1).max(100),
        contactEmail: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Generate slug from name
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure uniqueness
      let slug = baseSlug;
      let attempt = 0;
      while (await prisma.company.findUnique({ where: { slug } })) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      // Generate invite code
      const inviteCode = `${slug.toUpperCase().slice(0, 10)}-INVITE-${Date.now().toString(36).toUpperCase()}`;

      const company = await prisma.company.create({
        data: {
          name: input.name,
          slug,
          inviteCode,
          status: "active",
          phone: input.phone,
          address: input.address,
          users: {
            create: {
              name: input.contactName,
              email: input.contactEmail,
              passwordHash: "$2a$12$placeholder", // Placeholder — user will set password via invite
              role: "CLIENT_ADMIN",
              status: "INVITED",
            },
          },
        },
        include: {
          users: { select: { id: true, name: true, email: true } },
        },
      });

      return { id: company.id, name: company.name, slug: company.slug };
    }),
});
