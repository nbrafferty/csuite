import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import {
  recomputeProjectStatus,
  getEffectiveStatus,
  computeProjectProgress,
  getTeamColor,
  getInitials,
} from "@/lib/projects";
import { canTransition } from "@/lib/tokens";
import type { ProjectStatus, ProjectCategory } from "@prisma/client";
import type { ProjectSummary, ProjectDetail, TeamMember } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────────────────

function buildProjectSummary(
  project: any,
  isStaff: boolean
): ProjectSummary {
  const effectiveStatus: ProjectStatus =
    project.statusOverride ?? project.derivedStatus;

  const orders = project.orders ?? [];
  const quotes = project.quotes ?? [];

  // Team members from order creators
  const teamMap = new Map<string, TeamMember>();
  for (const order of orders) {
    if (order.creator && !teamMap.has(order.creator.id)) {
      teamMap.set(order.creator.id, {
        id: order.creator.id,
        initials: getInitials(order.creator.name),
        color: getTeamColor(order.creator.id),
      });
    }
  }

  // Total invoiced
  const totalInvoiced = orders.reduce((sum: number, o: any) => {
    const invoiceTotal = (o.invoices ?? []).reduce(
      (iSum: number, inv: any) => iSum + Number(inv.amountTotal ?? 0),
      0
    );
    return sum + invoiceTotal;
  }, 0);

  // Total quoted
  const totalQuoted = quotes.reduce(
    (sum: number, q: any) => sum + Number(q.totalAmount ?? 0),
    0
  );

  // Estimated delivery: earliest upcoming shipment
  let estimatedDelivery: string | null = null;
  for (const order of orders) {
    for (const shipment of order.shipments ?? []) {
      if (shipment.status === "PENDING" || shipment.status === "SHIPPED") {
        const date = shipment.shippedAt || shipment.deliveredAt;
        if (date) {
          const dateStr = new Date(date).toISOString();
          if (!estimatedDelivery || dateStr < estimatedDelivery) {
            estimatedDelivery = dateStr;
          }
        }
      }
    }
  }

  return {
    id: project.id,
    name: project.name,
    category: project.category as ProjectCategory,
    status: effectiveStatus,
    hasStatusOverride: project.statusOverride != null,
    orderCount: orders.length,
    quoteCount: quotes.length,
    progressPercent: computeProjectProgress(orders),
    totalInvoiced,
    totalQuoted,
    eventDate: project.eventDate
      ? new Date(project.eventDate).toISOString()
      : null,
    estimatedDelivery,
    team: Array.from(teamMap.values()),
    companyName: isStaff ? (project.company?.name ?? null) : null,
    updatedAt: new Date(project.updatedAt).toISOString(),
  };
}

const projectInclude = {
  company: { select: { name: true } },
  orders: {
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      creator: { select: { id: true, name: true } },
      invoices: { select: { amountTotal: true, status: true, dueDate: true } },
      proofs: { select: { status: true } },
      shipments: {
        select: { status: true, shippedAt: true, deliveredAt: true },
      },
    },
  },
  quotes: {
    select: {
      id: true,
      title: true,
      status: true,
      totalAmount: true,
      updatedAt: true,
    },
  },
};

// ─── Router ────────────────────────────────────────────────────────

export const projectsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.array(z.string()).optional(),
        search: z.string().optional(),
        companyId: z.string().optional(),
        includeArchived: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: any = {};

      // Tenant scoping
      if (isStaff && input.companyId) {
        where.companyId = input.companyId;
      } else if (!isStaff) {
        where.companyId = ctx.companyId;
      }

      // Archive filter
      if (!input.includeArchived || !isStaff) {
        where.archivedAt = null;
      }

      // Search filter
      if (input.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }

      const projects = await prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: { updatedAt: "desc" },
      });

      let summaries = projects.map((p) => buildProjectSummary(p, isStaff));

      // Status filter (applied on effective status)
      if (input.status && input.status.length > 0) {
        summaries = summaries.filter((s) => input.status!.includes(s.status));
      }

      return summaries;
    }),

  detail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";

      const project = await prisma.project.findUnique({
        where: { id: input.id },
        include: {
          ...projectInclude,
          createdBy: { select: { name: true } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Tenant check
      if (!isStaff && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const summary = buildProjectSummary(project, isStaff);

      const detail: ProjectDetail = {
        ...summary,
        description: project.description,
        orders: project.orders.map((o) => ({
          id: o.id,
          title: o.title,
          status: o.status,
          amount: o.invoices.reduce(
            (sum, inv) => sum + Number(inv.amountTotal),
            0
          ),
          updatedAt: new Date(o.updatedAt).toISOString(),
        })),
        quotes: project.quotes.map((q) => ({
          id: q.id,
          title: q.title,
          status: q.status,
          amount: Number(q.totalAmount),
          updatedAt: new Date(q.updatedAt).toISOString(),
        })),
        createdAt: new Date(project.createdAt).toISOString(),
      };

      return detail;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        category: z.enum([
          "APPAREL",
          "SIGNAGE",
          "PACKAGING",
          "HEADWEAR",
          "DRINKWARE",
          "OTHER",
        ]),
        eventDate: z.string().optional(),
        orderIds: z.array(z.string()).optional(),
        quoteIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.create({
        data: {
          companyId: ctx.companyId,
          name: input.name,
          description: input.description,
          category: input.category,
          eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
          createdById: ctx.user.id!,
        },
      });

      // Link orders
      if (input.orderIds && input.orderIds.length > 0) {
        await prisma.order.updateMany({
          where: {
            id: { in: input.orderIds },
            companyId: ctx.companyId,
          },
          data: { projectId: project.id },
        });
      }

      // Link quotes
      if (input.quoteIds && input.quoteIds.length > 0) {
        await prisma.quote.updateMany({
          where: {
            id: { in: input.quoteIds },
            companyId: ctx.companyId,
          },
          data: { projectId: project.id },
        });
      }

      // Recompute derived status
      await recomputeProjectStatus(prisma, project.id);

      return prisma.project.findUniqueOrThrow({
        where: { id: project.id },
        include: projectInclude,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        category: z
          .enum([
            "APPAREL",
            "SIGNAGE",
            "PACKAGING",
            "HEADWEAR",
            "DRINKWARE",
            "OTHER",
          ])
          .optional(),
        eventDate: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify tenant
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (ctx.role !== "CCC_STAFF" && existing.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return prisma.project.update({
        where: { id },
        data: {
          ...data,
          eventDate: data.eventDate ? new Date(data.eventDate) : data.eventDate === null ? null : undefined,
        },
      });
    }),

  moveStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        toStatus: z.enum([
          "EMPTY",
          "IN_REVIEW",
          "ACTIVE",
          "IN_PRODUCTION",
          "NEEDS_ATTENTION",
          "COMPLETED",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (ctx.role !== "CCC_STAFF" && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const currentStatus = getEffectiveStatus(project);
      const role = ctx.role as "CLIENT_ADMIN" | "CLIENT_USER" | "CCC_STAFF";

      if (!canTransition(currentStatus, input.toStatus, role)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${currentStatus} to ${input.toStatus}`,
        });
      }

      return prisma.project.update({
        where: { id: input.id },
        data: { statusOverride: input.toStatus },
        include: projectInclude,
      });
    }),

  clearStatusOverride: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.project.update({
        where: { id: input.id },
        data: { statusOverride: null },
        include: projectInclude,
      });
    }),

  linkItem: adminProcedure
    .input(
      z
        .object({
          projectId: z.string(),
          orderId: z.string().optional(),
          quoteId: z.string().optional(),
        })
        .refine((d) => !!d.orderId !== !!d.quoteId, {
          message: "Exactly one of orderId or quoteId must be provided",
        })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.role !== "CCC_STAFF" && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.orderId) {
        await prisma.order.update({
          where: { id: input.orderId },
          data: { projectId: input.projectId },
        });
      }

      if (input.quoteId) {
        await prisma.quote.update({
          where: { id: input.quoteId },
          data: { projectId: input.projectId },
        });
      }

      await recomputeProjectStatus(prisma, input.projectId);

      return prisma.project.findUniqueOrThrow({
        where: { id: input.projectId },
        include: projectInclude,
      });
    }),

  unlinkItem: adminProcedure
    .input(
      z
        .object({
          projectId: z.string(),
          orderId: z.string().optional(),
          quoteId: z.string().optional(),
        })
        .refine((d) => !!d.orderId !== !!d.quoteId, {
          message: "Exactly one of orderId or quoteId must be provided",
        })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.role !== "CCC_STAFF" && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.orderId) {
        await prisma.order.update({
          where: { id: input.orderId },
          data: { projectId: null },
        });
      }

      if (input.quoteId) {
        await prisma.quote.update({
          where: { id: input.quoteId },
          data: { projectId: null },
        });
      }

      await recomputeProjectStatus(prisma, input.projectId);

      return prisma.project.findUniqueOrThrow({
        where: { id: input.projectId },
        include: projectInclude,
      });
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.id },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.role !== "CCC_STAFF" && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return prisma.project.update({
        where: { id: input.id },
        data: { archivedAt: new Date() },
      });
    }),

  // Search orders available for linking
  searchOrders: protectedProcedure
    .input(z.object({ search: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return prisma.order.findMany({
        where: {
          companyId: ctx.companyId,
          projectId: null,
          title: { contains: input.search, mode: "insensitive" },
        },
        select: { id: true, title: true, displayId: true, status: true },
        take: 10,
      });
    }),

  // Search quotes available for linking
  searchQuotes: protectedProcedure
    .input(z.object({ search: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return prisma.quote.findMany({
        where: {
          companyId: ctx.companyId,
          projectId: null,
          title: { contains: input.search, mode: "insensitive" },
        },
        select: { id: true, title: true, displayId: true, status: true },
        take: 10,
      });
    }),
});
