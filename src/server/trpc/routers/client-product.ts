import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { generateQuoteNumber } from "../../lib/quote-number";
import {
  sendEmail,
  reorderRequestEmail,
  staffEmails,
  appBaseUrl,
} from "@/server/lib/email";

const PRODUCT_INCLUDE = {
  imprints: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      artworkAsset: {
        select: {
          id: true,
          name: true,
          filename: true,
          versions: {
            orderBy: { versionNumber: "desc" as const },
            take: 1,
            select: { thumbnailUrl: true, fileUrl: true },
          },
        },
      },
    },
  },
};

/** lastOrdered / totalOrdered computed from order items linked to the product */
async function productStats(productIds: string[]) {
  if (productIds.length === 0) return new Map();
  const rows = await prisma.orderItem.findMany({
    where: { clientProductId: { in: productIds } },
    select: {
      clientProductId: true,
      quantity: true,
      order: { select: { createdAt: true, status: true } },
    },
  });
  const stats = new Map<
    string,
    { totalOrdered: number; lastOrdered: Date | null; lastOrderedQty: number }
  >();
  for (const row of rows) {
    if (row.order.status === "CANCELLED") continue;
    const key = row.clientProductId!;
    const cur = stats.get(key) ?? {
      totalOrdered: 0,
      lastOrdered: null,
      lastOrderedQty: 0,
    };
    cur.totalOrdered += row.quantity;
    if (!cur.lastOrdered || row.order.createdAt > cur.lastOrdered) {
      cur.lastOrdered = row.order.createdAt;
      cur.lastOrderedQty = row.quantity;
    }
    stats.set(key, cur);
  }
  return stats;
}

export const clientProductRouter = router({
  // LIST — clients see their own company's active products; staff can
  // filter any company and optionally include retired ones.
  list: protectedProcedure
    .input(
      z
        .object({
          companyId: z.string().uuid().optional(), // staff only
          includeRetired: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const companyId = isStaff
        ? input?.companyId
        : (ctx.companyId as string);

      const where: any = {};
      if (companyId) where.companyId = companyId;
      if (!isStaff || !input?.includeRetired) where.status = "ACTIVE";

      const products = await prisma.clientProduct.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: "desc" },
      });

      const stats = await productStats(products.map((p) => p.id));
      return products.map((p) => ({
        ...p,
        stats: stats.get(p.id) ?? {
          totalOrdered: 0,
          lastOrdered: null,
          lastOrderedQty: 0,
        },
      }));
    }),

  // BY ID — full spec + order history
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const product = await prisma.clientProduct.findUnique({
        where: { id: input.id },
        include: PRODUCT_INCLUDE,
      });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isStaff && product.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const history = await prisma.orderItem.findMany({
        where: { clientProductId: product.id },
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          order: {
            select: { id: true, number: true, status: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const stats = await productStats([product.id]);
      return {
        ...product,
        history,
        stats: stats.get(product.id) ?? {
          totalOrdered: 0,
          lastOrdered: null,
          lastOrderedQty: 0,
        },
      };
    }),

  // PROMOTE — staff copies a quote/order line item's full spec into a
  // ClientProduct. All imprints must have artwork pinned.
  promoteFromLineItem: staffProcedure
    .input(
      z
        .object({
          orderItemId: z.string().optional(),
          quoteItemId: z.string().optional(),
          name: z.string().max(200).optional(), // defaults to item description
          blankBrand: z.string().max(100).optional(),
          blankStyle: z.string().max(100).optional(),
        })
        .refine((v) => !!v.orderItemId !== !!v.quoteItemId, {
          message: "Provide exactly one of orderItemId or quoteItemId",
        })
    )
    .mutation(async ({ ctx, input }) => {
      let item:
        | {
            description: string;
            sku: string | null;
            itemNumber: string | null;
            color: string | null;
            category: string | null;
            unitPrice: any;
            sizeBreakdown: any;
            companyId: string;
            sourceOrderId: string | null;
            imprints: {
              method: string;
              colorCount: number | null;
              placement: string | null;
              widthIn: number | null;
              heightIn: number | null;
              artworkAssetId: string | null;
              notes: string | null;
              sortOrder: number;
            }[];
          }
        | null = null;

      if (input.orderItemId) {
        const oi = await prisma.orderItem.findUnique({
          where: { id: input.orderItemId },
          include: { imprints: true, order: { select: { companyId: true, id: true } } },
        });
        if (!oi) throw new TRPCError({ code: "NOT_FOUND" });
        item = { ...oi, companyId: oi.order.companyId, sourceOrderId: oi.order.id };
      } else {
        const qi = await prisma.quoteItem.findUnique({
          where: { id: input.quoteItemId! },
          include: {
            imprints: true,
            quote: {
              select: { companyId: true, convertedOrder: { select: { id: true } } },
            },
          },
        });
        if (!qi) throw new TRPCError({ code: "NOT_FOUND" });
        item = {
          ...qi,
          companyId: qi.quote.companyId,
          sourceOrderId: qi.quote.convertedOrder?.id ?? null,
        };
      }

      const missingArt = item.imprints.filter((imp) => !imp.artworkAssetId);
      if (missingArt.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Every imprint needs linked artwork before saving as a product — link artwork to the imprint(s) first.",
        });
      }

      const product = await prisma.clientProduct.create({
        data: {
          companyId: item.companyId,
          name: input.name?.trim() || item.description,
          blankBrand: input.blankBrand,
          blankStyle: input.blankStyle,
          itemNumber: item.itemNumber,
          color: item.color,
          category: item.category,
          defaultUnitPrice: item.unitPrice,
          defaultSizeCurve: item.sizeBreakdown ?? undefined,
          createdFromOrderId: item.sourceOrderId,
          createdByUserId: ctx.user.id as string,
          imprints: {
            create: item.imprints.map((imp) => ({
              method: imp.method,
              colorCount: imp.colorCount,
              placement: imp.placement,
              widthIn: imp.widthIn,
              heightIn: imp.heightIn,
              artworkAssetId: imp.artworkAssetId!,
              notes: imp.notes,
              sortOrder: imp.sortOrder,
            })),
          },
        },
        include: PRODUCT_INCLUDE,
      });

      // Backfill the source line item so the original order counts as
      // history ("last ordered" works immediately after promotion)
      if (input.orderItemId) {
        await prisma.orderItem.update({
          where: { id: input.orderItemId },
          data: { clientProductId: product.id },
        });
      } else if (input.quoteItemId) {
        await prisma.quoteItem.update({
          where: { id: input.quoteItemId },
          data: { clientProductId: product.id },
        });
      }

      return product;
    }),

  // UPDATE — staff-only (pricing, blank info, size curve)
  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        blankBrand: z.string().max(100).nullable().optional(),
        blankStyle: z.string().max(100).nullable().optional(),
        itemNumber: z.string().max(100).nullable().optional(),
        color: z.string().max(100).nullable().optional(),
        category: z.string().max(100).nullable().optional(),
        defaultUnitPrice: z.number().positive().optional(),
        defaultSizeCurve: z
          .record(z.string(), z.number().int().nonnegative())
          .nullable()
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, defaultSizeCurve, ...rest } = input;
      return prisma.clientProduct.update({
        where: { id },
        data: {
          ...rest,
          defaultSizeCurve:
            defaultSizeCurve === undefined ? undefined : defaultSizeCurve ?? undefined,
        },
      });
    }),

  // RETIRE / REACTIVATE — staff only
  setStatus: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["ACTIVE", "RETIRED"]),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.clientProduct.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // REORDER — creates a DRAFT quote from the product spec (Build 2 pipeline)
  reorder: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        sizeBreakdown: z
          .record(z.string(), z.number().int().nonnegative())
          .optional(),
        quantity: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const product = await prisma.clientProduct.findUnique({
        where: { id: input.productId },
        include: { imprints: true, company: { select: { name: true } } },
      });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isStaff && product.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (product.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This product has been retired — contact us to reorder it.",
        });
      }

      const sizes =
        input.sizeBreakdown ??
        (product.defaultSizeCurve as Record<string, number> | null) ??
        undefined;
      const sizeSum = sizes
        ? Object.values(sizes).reduce((a, b) => a + b, 0)
        : 0;
      const qty = sizeSum > 0 ? sizeSum : input.quantity ?? 0;
      if (qty <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enter a quantity or size breakdown",
        });
      }

      const number = await generateQuoteNumber(prisma as any);
      const quote = await prisma.quote.create({
        data: {
          number,
          companyId: product.companyId,
          createdByUserId: ctx.user.id as string,
          title: `REORDER: ${product.name}`,
          status: "DRAFT",
          sourceOrderId: product.createdFromOrderId,
          items: {
            create: [
              {
                sortOrder: 0,
                description: product.name,
                itemNumber: product.itemNumber,
                color: product.color,
                category: product.category,
                unitPrice: product.defaultUnitPrice,
                quantity: qty,
                sizeBreakdown: sizes ?? undefined,
                lineTotal: Number(product.defaultUnitPrice) * qty,
                clientProductId: product.id,
                imprints: {
                  create: product.imprints.map((imp) => ({
                    method: imp.method,
                    colorCount: imp.colorCount,
                    placement: imp.placement,
                    widthIn: imp.widthIn,
                    heightIn: imp.heightIn,
                    artworkAssetId: imp.artworkAssetId,
                    notes: imp.notes,
                    sortOrder: imp.sortOrder,
                  })),
                },
              },
            ],
          },
        },
      });

      if (!isStaff) {
        const recipients = await staffEmails();
        if (recipients.length > 0) {
          const template = reorderRequestEmail({
            companyName: product.company.name,
            quoteTitle: quote.title,
            quoteUrl: `${appBaseUrl()}/quotes/${quote.id}`,
          });
          await sendEmail({ to: recipients, ...template });
        }
      }

      return { id: quote.id, number: quote.number, title: quote.title };
    }),
});
