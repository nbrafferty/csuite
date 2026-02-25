import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { QuoteRequestStatus, Prisma } from "@prisma/client";

export const quoteRequestRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(QuoteRequestStatus).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.QuoteRequestWhereInput = {};
      if (!isStaff) where.companyId = ctx.companyId;
      if (input.status) where.status = input.status;

      const requests = await prisma.quoteRequest.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          quote: { select: { id: true, displayId: true, status: true } },
          _count: { select: { catalogItems: true } },
        },
      });

      let nextCursor: string | undefined;
      if (requests.length > input.limit) {
        const nextItem = requests.pop();
        nextCursor = nextItem?.id;
      }

      return { requests, nextCursor };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.QuoteRequestWhereInput = { id: input.id };
      if (!isStaff) where.companyId = ctx.companyId;

      return prisma.quoteRequest.findFirst({
        where,
        include: {
          company: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true } },
          quote: { select: { id: true, displayId: true, status: true } },
          catalogItems: {
            include: {
              catalogProduct: { select: { id: true, name: true, sku: true, basePrice: true } },
            },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        inHandsDate: z.string().datetime().optional(),
        attachments: z.array(z.object({
          url: z.string(),
          filename: z.string(),
          size: z.number().optional(),
        })).optional(),
        catalogItems: z.array(z.object({
          catalogProductId: z.string().uuid().optional(),
          description: z.string().optional(),
          quantity: z.number().int().optional(),
          notes: z.string().optional(),
        })).optional(),
        submit: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.quoteRequest.create({
        data: {
          companyId: ctx.companyId,
          createdById: ctx.user.id,
          title: input.title,
          description: input.description,
          inHandsDate: input.inHandsDate ? new Date(input.inHandsDate) : null,
          attachments: input.attachments ?? Prisma.JsonNull,
          status: input.submit ? QuoteRequestStatus.SUBMITTED : QuoteRequestStatus.DRAFT,
          catalogItems: input.catalogItems?.length
            ? {
                create: input.catalogItems.map((item) => ({
                  catalogProductId: item.catalogProductId,
                  description: item.description,
                  quantity: item.quantity,
                  notes: item.notes,
                })),
              }
            : undefined,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        inHandsDate: z.string().datetime().nullable().optional(),
        attachments: z.array(z.object({
          url: z.string(),
          filename: z.string(),
          size: z.number().optional(),
        })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const request = await prisma.quoteRequest.findFirst({
        where: { id, companyId: ctx.companyId },
      });

      if (!request) throw new Error("Quote request not found");

      // Only editable in DRAFT and SUBMITTED states
      if (
        request.status !== QuoteRequestStatus.DRAFT &&
        request.status !== QuoteRequestStatus.SUBMITTED
      ) {
        throw new Error("Quote request can only be edited in Draft or Submitted state");
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.inHandsDate !== undefined) updateData.inHandsDate = data.inHandsDate ? new Date(data.inHandsDate) : null;
      if (data.attachments !== undefined) updateData.attachments = data.attachments;

      return prisma.quoteRequest.update({ where: { id }, data: updateData });
    }),

  submit: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.quoteRequest.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!request) throw new Error("Quote request not found");
      if (request.status !== QuoteRequestStatus.DRAFT) {
        throw new Error("Only draft requests can be submitted");
      }

      return prisma.quoteRequest.update({
        where: { id: input.id },
        data: { status: QuoteRequestStatus.SUBMITTED },
      });
    }),

  // Staff marks as in_review
  startReview: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.quoteRequest.update({
        where: { id: input.id },
        data: { status: QuoteRequestStatus.IN_REVIEW },
      });
    }),

  // Staff closes without quoting
  close: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.quoteRequest.update({
        where: { id: input.id },
        data: { status: QuoteRequestStatus.CLOSED },
      });
    }),
});
