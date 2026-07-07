import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { ContentType, PricingType, Prisma } from "@prisma/client";

export const catalogRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        contentType: z.nativeEnum(ContentType).optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const where: Prisma.CatalogProductWhereInput = { isActive: true };
      if (input.contentType) where.contentType = input.contentType;
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { sku: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const products = await prisma.catalogProduct.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { name: "asc" },
        include: {
          vendor: { select: { id: true, name: true } },
        },
      });

      let nextCursor: string | undefined;
      if (products.length > input.limit) {
        const nextItem = products.pop();
        nextCursor = nextItem?.id;
      }

      return { products, nextCursor };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.catalogProduct.findFirst({
        where: { id: input.id, isActive: true },
        include: {
          vendor: { select: { id: true, name: true } },
        },
      });
    }),

  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1),
        sku: z.string().optional(),
        contentType: z.nativeEnum(ContentType).default("OTHER"),
        basePrice: z.number().min(0),
        pricingType: z.nativeEnum(PricingType).default("FLAT"),
        pricingRules: z.any().optional(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        options: z.any().optional(),
        vendorId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.catalogProduct.create({
        data: {
          name: input.name,
          sku: input.sku,
          contentType: input.contentType,
          basePrice: input.basePrice,
          pricingType: input.pricingType,
          pricingRules: input.pricingRules ?? Prisma.JsonNull,
          description: input.description,
          images: input.images ?? [],
          options: input.options ?? Prisma.JsonNull,
          vendorId: input.vendorId,
        },
      });
    }),

  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        sku: z.string().optional(),
        contentType: z.nativeEnum(ContentType).optional(),
        basePrice: z.number().min(0).optional(),
        pricingType: z.nativeEnum(PricingType).optional(),
        pricingRules: z.any().optional(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        options: z.any().optional(),
        vendorId: z.string().uuid().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.catalogProduct.update({ where: { id }, data });
    }),
});
