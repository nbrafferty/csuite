import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const quoteRequestsRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.user as any).id as string;

    // Find existing draft or create one
    let draft = await prisma.quoteRequest.findFirst({
      where: {
        companyId: ctx.companyId,
        userId,
        status: "draft",
      },
      include: {
        items: {
          include: { catalogProduct: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!draft) {
      draft = await prisma.quoteRequest.create({
        data: {
          companyId: ctx.companyId,
          userId,
          status: "draft",
        },
        include: {
          items: {
            include: { catalogProduct: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    return draft;
  }),

  addItem: protectedProcedure
    .input(
      z.object({
        catalogProductId: z.string().uuid(),
        config: z.any().optional(),
        totalQty: z.number().optional(),
        sizeBreakdown: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.user as any).id as string;

      // Get or create draft
      let draft = await prisma.quoteRequest.findFirst({
        where: { companyId: ctx.companyId, userId, status: "draft" },
      });

      if (!draft) {
        draft = await prisma.quoteRequest.create({
          data: { companyId: ctx.companyId, userId, status: "draft" },
        });
      }

      // Check if item already exists
      const existing = await prisma.quoteRequestItem.findFirst({
        where: {
          quoteRequestId: draft.id,
          catalogProductId: input.catalogProductId,
        },
      });

      if (existing) return existing;

      return prisma.quoteRequestItem.create({
        data: {
          quoteRequestId: draft.id,
          catalogProductId: input.catalogProductId,
          config: input.config ?? null,
          totalQty: input.totalQty ?? null,
          sizeBreakdown: input.sizeBreakdown ?? null,
        },
        include: { catalogProduct: true },
      });
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string().uuid(),
        config: z.any().optional(),
        totalQty: z.number().optional().nullable(),
        sizeBreakdown: z.any().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.quoteRequestItem.update({
        where: { id: input.itemId },
        data: {
          config: input.config,
          totalQty: input.totalQty,
          sizeBreakdown: input.sizeBreakdown,
        },
        include: { catalogProduct: true },
      });
    }),

  removeItem: protectedProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.quoteRequestItem.delete({
        where: { id: input.itemId },
      });
    }),

  submit: protectedProcedure
    .input(z.object({ quoteRequestId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return prisma.quoteRequest.update({
        where: { id: input.quoteRequestId },
        data: { status: "submitted" },
      });
    }),
});
