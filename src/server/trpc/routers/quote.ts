import { z } from "zod";
import { router, protectedProcedure, staffProcedure, adminProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { QuoteStatus, QuoteRequestStatus, OrderStatus, OrderSourceType, ContentType, Prisma } from "@prisma/client";

export const quoteRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(QuoteStatus).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.QuoteWhereInput = {};
      if (!isStaff) where.companyId = ctx.companyId;
      if (input.status) where.status = input.status;

      const quotes = await prisma.quote.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          quoteRequest: { select: { id: true, title: true } },
          _count: { select: { lineItems: true } },
        },
      });

      let nextCursor: string | undefined;
      if (quotes.length > input.limit) {
        const nextItem = quotes.pop();
        nextCursor = nextItem?.id;
      }

      return { quotes, nextCursor };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.QuoteWhereInput = { id: input.id };
      if (!isStaff) where.companyId = ctx.companyId;

      return prisma.quote.findFirst({
        where,
        include: {
          company: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true } },
          quoteRequest: { select: { id: true, title: true, description: true } },
          lineItems: {
            orderBy: { position: "asc" },
            include: {
              catalogProduct: { select: { id: true, name: true } },
            },
          },
          revisionComments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true } } },
          },
          order: { select: { id: true, displayId: true } },
        },
      });
    }),

  // Staff creates a quote (optionally from a quote request)
  create: staffProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        quoteRequestId: z.string().uuid().optional(),
        title: z.string().min(1),
        notes: z.string().optional(),
        validUntil: z.string().datetime().optional(),
        lineItems: z.array(
          z.object({
            contentType: z.nativeEnum(ContentType).default("OTHER"),
            title: z.string().min(1),
            description: z.string().optional(),
            catalogProductId: z.string().uuid().optional(),
            sku: z.string().optional(),
            quantity: z.number().int().min(1).default(1),
            unitPrice: z.number().min(0),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const count = await prisma.quote.count();
      const displayId = `Q-${String(count + 1001).padStart(4, "0")}`;

      const lineItems = input.lineItems?.map((item, idx) => ({
        position: idx + 1,
        contentType: item.contentType,
        title: item.title,
        description: item.description,
        catalogProductId: item.catalogProductId,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
      })) ?? [];

      const subtotal = lineItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);

      const quote = await prisma.quote.create({
        data: {
          displayId,
          companyId: input.companyId,
          createdById: ctx.user.id,
          title: input.title,
          notes: input.notes,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          subtotal,
          totalAmount: subtotal,
          lineItems: lineItems.length > 0 ? { create: lineItems } : undefined,
        },
      });

      // If from a quote request, link them and update the request status
      if (input.quoteRequestId) {
        await prisma.quoteRequest.update({
          where: { id: input.quoteRequestId },
          data: {
            quoteId: quote.id,
            status: QuoteRequestStatus.QUOTED,
          },
        });
      }

      return quote;
    }),

  // Staff edits a quote (DRAFT, REVISION_REQUESTED, REVISED states)
  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        notes: z.string().optional(),
        validUntil: z.string().datetime().nullable().optional(),
        shippingAmount: z.number().min(0).optional(),
        discountAmount: z.number().min(0).optional(),
        feeAmount: z.number().min(0).optional(),
        taxAmount: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const quote = await prisma.quote.findFirst({ where: { id } });
      if (!quote) throw new Error("Quote not found");

      const editableStatuses: QuoteStatus[] = [QuoteStatus.DRAFT, QuoteStatus.REVISION_REQUESTED, QuoteStatus.REVISED];
      if (!editableStatuses.includes(quote.status)) {
        throw new Error("Quote can only be edited in Draft, Revision Requested, or Revised state");
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
      if (data.shippingAmount !== undefined) updateData.shippingAmount = data.shippingAmount;
      if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount;
      if (data.feeAmount !== undefined) updateData.feeAmount = data.feeAmount;
      if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;

      // Recalculate total
      const items = await prisma.quoteLineItem.findMany({ where: { quoteId: id } });
      const subtotal = items.reduce((sum, i) => sum + Number(i.lineTotal), 0);
      const shipping = data.shippingAmount ?? Number(quote.shippingAmount);
      const discount = data.discountAmount ?? Number(quote.discountAmount);
      const fee = data.feeAmount ?? Number(quote.feeAmount);
      const tax = data.taxAmount ?? Number(quote.taxAmount);
      updateData.subtotal = subtotal;
      updateData.totalAmount = subtotal + shipping + fee + tax - discount;

      return prisma.quote.update({ where: { id }, data: updateData });
    }),

  // Staff sends quote to client
  send: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const quote = await prisma.quote.findFirst({ where: { id: input.id } });
      if (!quote) throw new Error("Quote not found");
      if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REVISED) {
        throw new Error("Only draft or revised quotes can be sent");
      }
      return prisma.quote.update({
        where: { id: input.id },
        data: { status: QuoteStatus.SENT },
      });
    }),

  // Client approves → creates order
  approve: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { lineItems: true },
      });

      if (!quote) throw new Error("Quote not found");
      if (quote.status !== QuoteStatus.SENT) {
        throw new Error("Only sent quotes can be approved");
      }

      // Create order from quote
      const count = await prisma.order.count();
      const displayId = `CS-${String(count + 1001).padStart(4, "0")}`;

      const order = await prisma.order.create({
        data: {
          companyId: quote.companyId,
          createdBy: ctx.user.id,
          displayId,
          sourceType: OrderSourceType.QUOTE,
          title: quote.title,
          status: OrderStatus.SUBMITTED,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          shippingAmount: quote.shippingAmount,
          discountAmount: quote.discountAmount,
          feeAmount: quote.feeAmount,
          totalAmount: quote.totalAmount,
          items: {
            create: quote.lineItems.map((item) => ({
              position: item.position,
              contentType: item.contentType,
              title: item.title,
              description: item.description,
              catalogProductId: item.catalogProductId,
              sku: item.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      // Update quote status and link to order
      await prisma.quote.update({
        where: { id: input.id },
        data: {
          status: QuoteStatus.CONVERTED,
          orderId: order.id,
        },
      });

      return order;
    }),

  // Client declines
  decline: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!quote) throw new Error("Quote not found");
      if (quote.status !== QuoteStatus.SENT) {
        throw new Error("Only sent quotes can be declined");
      }

      const updated = await prisma.quote.update({
        where: { id: input.id },
        data: { status: QuoteStatus.DECLINED },
      });

      if (input.reason) {
        await prisma.quoteComment.create({
          data: {
            quoteId: input.id,
            authorId: ctx.user.id,
            body: input.reason,
            version: quote.version,
          },
        });
      }

      return updated;
    }),

  // Client requests changes
  requestChanges: protectedProcedure
    .input(z.object({ id: z.string().uuid(), comment: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const quote = await prisma.quote.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!quote) throw new Error("Quote not found");
      if (quote.status !== QuoteStatus.SENT) {
        throw new Error("Can only request changes on sent quotes");
      }

      await prisma.quoteComment.create({
        data: {
          quoteId: input.id,
          authorId: ctx.user.id,
          body: input.comment,
          version: quote.version,
        },
      });

      return prisma.quote.update({
        where: { id: input.id },
        data: { status: QuoteStatus.REVISION_REQUESTED },
      });
    }),

  // Staff submits revision
  revise: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const quote = await prisma.quote.findFirst({ where: { id: input.id } });
      if (!quote) throw new Error("Quote not found");
      if (quote.status !== QuoteStatus.REVISION_REQUESTED) {
        throw new Error("Only revision-requested quotes can be revised");
      }
      return prisma.quote.update({
        where: { id: input.id },
        data: {
          status: QuoteStatus.REVISED,
          version: quote.version + 1,
        },
      });
    }),

  // ─── Line Items ──────────────────────────────────────────────────

  addLineItem: staffProcedure
    .input(
      z.object({
        quoteId: z.string().uuid(),
        contentType: z.nativeEnum(ContentType).default("OTHER"),
        title: z.string().min(1),
        description: z.string().optional(),
        catalogProductId: z.string().uuid().optional(),
        sku: z.string().optional(),
        quantity: z.number().int().min(1).default(1),
        unitPrice: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const maxPos = await prisma.quoteLineItem.aggregate({
        where: { quoteId: input.quoteId },
        _max: { position: true },
      });

      const item = await prisma.quoteLineItem.create({
        data: {
          quoteId: input.quoteId,
          position: (maxPos._max.position ?? 0) + 1,
          contentType: input.contentType,
          title: input.title,
          description: input.description,
          catalogProductId: input.catalogProductId,
          sku: input.sku,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          lineTotal: input.unitPrice * input.quantity,
        },
      });

      await recalculateQuoteTotals(input.quoteId);
      return item;
    }),

  removeLineItem: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const item = await prisma.quoteLineItem.findFirst({ where: { id: input.id } });
      if (!item) throw new Error("Line item not found");
      await prisma.quoteLineItem.delete({ where: { id: input.id } });
      await recalculateQuoteTotals(item.quoteId);
      return { success: true };
    }),
});

async function recalculateQuoteTotals(quoteId: string) {
  const items = await prisma.quoteLineItem.findMany({ where: { quoteId } });
  const subtotal = items.reduce((sum, i) => sum + Number(i.lineTotal), 0);

  const quote = await prisma.quote.findFirst({ where: { id: quoteId } });
  if (!quote) return;

  const shipping = Number(quote.shippingAmount);
  const discount = Number(quote.discountAmount);
  const fee = Number(quote.feeAmount);
  const tax = Number(quote.taxAmount);
  const total = subtotal + shipping + fee + tax - discount;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { subtotal, totalAmount: total },
  });
}
