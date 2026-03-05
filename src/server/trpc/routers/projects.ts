import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import type { ProjectSummary, ProjectDetail } from "@/lib/types";
import type { ProjectStatus } from "@/lib/tokens";

const VALID_STATUSES: ProjectStatus[] = ["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"];

function toSummary(project: any, isStaff: boolean): ProjectSummary {
  const orders = project.orders ?? [];
  const quotes = project.quotes ?? [];
  const totalAmount = orders.reduce(
    (sum: number, o: any) => sum + Number(o.totalAmount ?? 0),
    0
  );

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status as ProjectStatus,
    orderCount: orders.length,
    quoteCount: quotes.length,
    totalAmount,
    eventDate: project.eventDate ? new Date(project.eventDate).toISOString() : null,
    clientContact: project.clientContact,
    budget: project.budget,
    logoUrl: project.logoUrl,
    companyName: isStaff ? (project.company?.name ?? null) : null,
    createdByName: project.createdBy?.name ?? "Unknown",
    updatedAt: new Date(project.updatedAt).toISOString(),
  };
}

const listInclude = {
  company: { select: { name: true } },
  createdBy: { select: { name: true } },
  orders: { select: { id: true, totalAmount: true } },
  quotes: { select: { id: true } },
};

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

      if (isStaff && input.companyId) {
        where.companyId = input.companyId;
      } else if (!isStaff) {
        where.companyId = ctx.companyId;
      }

      if (!input.includeArchived) {
        where.status = { not: "ARCHIVED" };
      }

      if (input.status && input.status.length > 0) {
        if (where.status) {
          where.AND = [{ status: where.status }, { status: { in: input.status } }];
          delete where.status;
        } else {
          where.status = { in: input.status };
        }
      }

      if (input.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }

      const projects = await prisma.project.findMany({
        where,
        include: listInclude,
        orderBy: { updatedAt: "desc" },
      });

      return projects.map((p) => toSummary(p, isStaff));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";

      const project = await prisma.project.findUnique({
        where: { id: input.id },
        include: {
          company: { select: { name: true } },
          createdBy: { select: { id: true, name: true } },
          orders: {
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              totalAmount: true,
              inHandsDate: true,
              poNumber: true,
            },
            orderBy: { createdAt: "desc" },
          },
          quotes: {
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              expiresAt: true,
              items: { select: { lineTotal: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (!isStaff && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const orders = project.orders ?? [];
      const totalAmount = orders.reduce(
        (sum, o) => sum + Number(o.totalAmount ?? 0),
        0
      );

      const detail: ProjectDetail = {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status as ProjectStatus,
        orderCount: orders.length,
        quoteCount: project.quotes.length,
        totalAmount,
        eventDate: project.eventDate ? new Date(project.eventDate).toISOString() : null,
        clientContact: project.clientContact,
        budget: project.budget,
        logoUrl: project.logoUrl,
        companyName: isStaff ? (project.company?.name ?? null) : null,
        createdByName: project.createdBy?.name ?? "Unknown",
        createdById: project.createdBy?.id ?? project.createdById,
        updatedAt: new Date(project.updatedAt).toISOString(),
        createdAt: new Date(project.createdAt).toISOString(),
        orders: orders.map((o) => ({
          id: o.id,
          number: o.number,
          title: o.title,
          status: o.status,
          totalAmount: Number(o.totalAmount ?? 0),
          inHandsDate: o.inHandsDate ? new Date(o.inHandsDate).toISOString() : null,
          poNumber: o.poNumber,
        })),
        quotes: project.quotes.map((q) => ({
          id: q.id,
          number: q.number,
          title: q.title,
          status: q.status,
          totalAmount: q.items.reduce((sum, i) => sum + Number(i.lineTotal ?? 0), 0),
          expiresAt: q.expiresAt ? new Date(q.expiresAt).toISOString() : null,
        })),
      };

      return detail;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        status: z.string().optional().default("PLANNING"),
        eventDate: z.string().optional(),
        clientContact: z.string().optional(),
        budget: z.number().optional(),
        logoUrl: z.string().optional(),
        companyId: z.string().optional(), // staff only
        orderIds: z.array(z.string()).optional(),
        quoteIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const companyId = isStaff && input.companyId ? input.companyId : ctx.companyId;

      const project = await prisma.project.create({
        data: {
          companyId,
          name: input.name,
          description: input.description,
          status: input.status,
          eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
          clientContact: input.clientContact,
          budget: input.budget,
          logoUrl: input.logoUrl,
          createdById: ctx.user.id!,
        },
      });

      if (input.orderIds && input.orderIds.length > 0) {
        await prisma.order.updateMany({
          where: { id: { in: input.orderIds }, companyId },
          data: { projectId: project.id },
        });
      }

      if (input.quoteIds && input.quoteIds.length > 0) {
        await prisma.quote.updateMany({
          where: { id: { in: input.quoteIds }, companyId },
          data: { projectId: project.id },
        });
      }

      return project;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        description: z.string().nullable().optional(),
        eventDate: z.string().nullable().optional(),
        clientContact: z.string().nullable().optional(),
        budget: z.number().nullable().optional(),
        logoUrl: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.role !== "CCC_STAFF" && existing.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return prisma.project.update({
        where: { id },
        data: {
          ...data,
          eventDate:
            data.eventDate === null
              ? null
              : data.eventDate
                ? new Date(data.eventDate)
                : undefined,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({ where: { id: input.id } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.role !== "CCC_STAFF" && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Client Users cannot change status
      if (ctx.role === "CLIENT_USER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change project status" });
      }

      // Client Admins cannot set ARCHIVED
      if (ctx.role === "CLIENT_ADMIN" && input.status === "ARCHIVED") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only staff can archive projects" });
      }

      return prisma.project.update({
        where: { id: input.id },
        data: {
          status: input.status,
          archivedAt: input.status === "ARCHIVED" ? new Date() : null,
        },
      });
    }),

  addOrder: protectedProcedure
    .input(z.object({ projectId: z.string(), orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({ where: { id: input.projectId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.role !== "CCC_STAFF" && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const order = await prisma.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      if (order.projectId && order.projectId !== input.projectId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This order already belongs to another project. Remove it from that project first.",
        });
      }

      await prisma.order.update({
        where: { id: input.orderId },
        data: { projectId: input.projectId },
      });

      return { success: true };
    }),

  removeOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: { project: true },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.role !== "CCC_STAFF" && order.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await prisma.order.update({
        where: { id: input.orderId },
        data: { projectId: null },
      });

      return { success: true };
    }),

  addQuote: protectedProcedure
    .input(z.object({ projectId: z.string(), quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({ where: { id: input.projectId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.role !== "CCC_STAFF" && project.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const quote = await prisma.quote.findUnique({ where: { id: input.quoteId } });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });

      if (quote.projectId && quote.projectId !== input.projectId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This quote already belongs to another project. Remove it from that project first.",
        });
      }

      await prisma.quote.update({
        where: { id: input.quoteId },
        data: { projectId: input.projectId },
      });

      return { success: true };
    }),

  removeQuote: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findUnique({ where: { id: input.quoteId } });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.role !== "CCC_STAFF" && quote.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await prisma.quote.update({
        where: { id: input.quoteId },
        data: { projectId: null },
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({ where: { id: input.id } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const isStaff = ctx.role === "CCC_STAFF";
      if (!isStaff && project.createdById !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Can only delete projects you created" });
      }

      // Unlink all orders and quotes
      await prisma.order.updateMany({
        where: { projectId: input.id },
        data: { projectId: null },
      });
      await prisma.quote.updateMany({
        where: { projectId: input.id },
        data: { projectId: null },
      });

      await prisma.project.delete({ where: { id: input.id } });

      return { success: true };
    }),

  searchOrders: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      return prisma.order.findMany({
        where: {
          ...(isStaff ? {} : { companyId: ctx.companyId }),
          projectId: null,
          ...(input.search
            ? {
                OR: [
                  { title: { contains: input.search, mode: "insensitive" as const } },
                  { number: { contains: input.search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        select: { id: true, title: true, number: true, status: true, totalAmount: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
    }),

  searchQuotes: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      return prisma.quote.findMany({
        where: {
          ...(isStaff ? {} : { companyId: ctx.companyId }),
          projectId: null,
          ...(input.search
            ? {
                OR: [
                  { title: { contains: input.search, mode: "insensitive" as const } },
                  { number: { contains: input.search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        select: { id: true, title: true, number: true, status: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
    }),

  searchProjects: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      return prisma.project.findMany({
        where: {
          ...(isStaff ? {} : { companyId: ctx.companyId }),
          status: { not: "ARCHIVED" },
          ...(input.search
            ? { name: { contains: input.search, mode: "insensitive" as const } }
            : {}),
        },
        select: {
          id: true,
          name: true,
          status: true,
          logoUrl: true,
          _count: { select: { orders: true, quotes: true } },
        },
        take: 20,
        orderBy: { updatedAt: "desc" },
      });
    }),
});
