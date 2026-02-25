import { z } from "zod";
import { router, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { TRPCError } from "@trpc/server";

export const quoteRouter = router({
  list: staffProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["createdAt", "totalAmount", "status"]).optional(),
        sortDir: z.enum(["asc", "desc"]).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const status = input?.status;
      const search = input?.search;
      const sortBy = input?.sortBy ?? "createdAt";
      const sortDir = input?.sortDir ?? "desc";
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { quoteNumber: { contains: search, mode: "insensitive" } },
          { projectName: { contains: search, mode: "insensitive" } },
          { company: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
          where,
          include: {
            company: { select: { id: true, name: true, slug: true } },
            createdBy: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.quote.count({ where }),
      ]);

      return {
        quotes,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  get: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              address: true,
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      return quote;
    }),

  updateStatus: staffProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "draft",
          "sent",
          "pending_approval",
          "revision_requested",
          "approved",
          "declined",
          "expired",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      // Validation: can't approve an expired quote
      if (input.status === "approved" && quote.status === "expired") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot approve an expired quote",
        });
      }

      const data: any = { status: input.status };

      if (input.status === "approved") {
        data.approvedAt = new Date();
      } else if (input.status === "declined") {
        data.declinedAt = new Date();
      }

      return prisma.quote.update({
        where: { id: input.id },
        data,
      });
    }),

  updateNotes: staffProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.quote.update({
        where: { id: input.id },
        data: { notes: input.notes },
      });
    }),

  requestsList: staffProcedure
    .input(
      z.object({
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const where: any = {};

      if (input?.status) {
        where.status = input.status;
      }

      const requests = await prisma.quoteRequest.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          requestedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return requests;
    }),

  updateRequestStatus: staffProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["new", "reviewing", "quoted", "closed"]),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.quoteRequest.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  stats: staffProcedure.query(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingCount, approvedThisMonth, activeQuotes] = await Promise.all([
      prisma.quote.count({ where: { status: "pending_approval" } }),
      prisma.quote.count({
        where: {
          status: "approved",
          approvedAt: { gte: startOfMonth },
        },
      }),
      prisma.quote.findMany({
        where: {
          status: {
            in: ["draft", "sent", "pending_approval"],
          },
        },
        select: { totalAmount: true },
      }),
    ]);

    const totalValue = activeQuotes.reduce((sum, q) => sum + q.totalAmount, 0);

    return {
      pendingApproval: pendingCount,
      approvedThisMonth,
      totalValue,
      avgTurnaround: "24h",
    };
  }),
});
