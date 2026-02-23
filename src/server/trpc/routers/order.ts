import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const orderRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { companyId: ctx.companyId };
      if (input.status) where.status = input.status;

      const orders = await prisma.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { name: true } },
          _count: { select: { items: true } },
        },
      });

      let nextCursor: string | undefined;
      if (orders.length > input.limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem?.id;
      }

      return { orders, nextCursor };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return prisma.order.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          creator: { select: { name: true, email: true } },
          items: true,
          proofs: { orderBy: { version: "desc" } },
          shipments: { include: { location: true } },
          invoices: true,
        },
      });
    }),
});
