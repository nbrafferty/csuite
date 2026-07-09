import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { sendEmail, inviteEmail, appBaseUrl } from "@/server/lib/email";

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
        contacts: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(120),
              email: z.string().trim().toLowerCase().email(),
              role: z.enum(["CLIENT_ADMIN", "CLIENT_USER"]).default("CLIENT_USER"),
            })
          )
          .min(1, "At least one contact is required")
          .max(20),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Reject duplicate emails within the submission
      const emails = input.contacts.map((c) => c.email);
      if (new Set(emails).size !== emails.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Each user needs a unique email address",
        });
      }

      // Reject emails that already belong to accounts anywhere in the system
      const existing = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      });
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Already registered: ${existing.map((u) => u.email).join(", ")}`,
        });
      }

      // At least one contact must be an admin — promote the first if none is
      const hasAdmin = input.contacts.some((c) => c.role === "CLIENT_ADMIN");
      const contacts = input.contacts.map((c, i) => ({
        ...c,
        role: !hasAdmin && i === 0 ? ("CLIENT_ADMIN" as const) : c.role,
      }));

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
            create: contacts.map((c) => ({
              name: c.name,
              email: c.email,
              passwordHash: "$2a$12$placeholder", // Placeholder — user will set password via invite
              role: c.role,
              status: "INVITED",
            })),
          },
        },
        include: {
          users: { select: { id: true, name: true, email: true } },
        },
      });

      // Invite every contact (soft-fails if email isn't configured)
      const template = inviteEmail({
        companyName: company.name,
        inviteCode: company.inviteCode,
        registerUrl: `${appBaseUrl()}/register`,
      });
      for (const c of contacts) {
        await sendEmail({ to: c.email, ...template });
      }

      return { id: company.id, name: company.name, slug: company.slug };
    }),
});
