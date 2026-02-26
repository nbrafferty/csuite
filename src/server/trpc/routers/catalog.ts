import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const catalogRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(50).default(8),
      })
    )
    .query(async ({ input }) => {
      const { category, search, page, perPage } = input;

      const where: any = { isActive: true };
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { subtitle: { contains: search, mode: "insensitive" } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.catalogProduct.findMany({
          where,
          orderBy: [{ popular: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.catalogProduct.count({ where }),
      ]);

      return {
        products,
        total,
        hasMore: page * perPage < total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.catalogProduct.findUnique({
        where: { id: input.id },
      });
    }),

  categories: protectedProcedure.query(async () => {
    const counts = await prisma.catalogProduct.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { id: true },
    });
    return counts.map((c) => ({
      category: c.category,
      count: c._count.id,
    }));
  }),
});
