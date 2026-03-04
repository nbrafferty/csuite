import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { QuoteRequestStatus, Prisma } from "@prisma/client";
import { generateQuoteNumber } from "../../lib/quote-number";

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
          quote: { select: { id: true, number: true, status: true } },
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
          quote: { select: { id: true, number: true, status: true } },
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

  // Staff declines a request
  decline: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const request = await prisma.quoteRequest.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (request.status === QuoteRequestStatus.QUOTED || request.status === QuoteRequestStatus.CLOSED) {
        throw new Error("Cannot decline a request that is already quoted or closed");
      }
      return prisma.quoteRequest.update({
        where: { id: input.id },
        data: { status: QuoteRequestStatus.CLOSED },
      });
    }),

  // Staff converts request to a DRAFT quote
  convertToQuote: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.quoteRequest.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          catalogItems: {
            include: {
              catalogProduct: true,
            },
          },
        },
      });

      if (request.status === QuoteRequestStatus.QUOTED) {
        throw new Error("This request has already been converted to a quote");
      }
      if (request.status === QuoteRequestStatus.CLOSED) {
        throw new Error("Cannot convert a closed request");
      }

      const quoteNumber = await generateQuoteNumber(prisma as any);

      // Build quote items from catalog items if they exist
      const quoteItems = request.catalogItems.map((item, index) => {
        const product = item.catalogProduct;
        const unitPrice = product ? Number(product.basePrice) : 0;
        const quantity = item.quantity ?? 1;
        return {
          description: item.description || product?.name || "Item",
          sku: product?.sku ?? undefined,
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity,
          sortOrder: index,
          decorationNotes: item.notes ?? undefined,
        };
      });

      const quote = await prisma.quote.create({
        data: {
          number: quoteNumber,
          companyId: request.companyId,
          createdByUserId: ctx.user.id,
          title: request.title,
          status: "DRAFT",
          notes: request.description ?? undefined,
          items: quoteItems.length > 0 ? { create: quoteItems } : undefined,
        },
      });

      // Link request to the new quote and mark as QUOTED
      await prisma.quoteRequest.update({
        where: { id: input.id },
        data: {
          status: QuoteRequestStatus.QUOTED,
          quoteId: quote.id,
        },
      });

      return quote;
    }),
});
