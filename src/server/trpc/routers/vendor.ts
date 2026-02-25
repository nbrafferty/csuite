import { z } from "zod";
import { router, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";

export const vendorRouter = router({
  list: staffProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        activeOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.activeOnly) where.isActive = true;
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { contactName: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.category) {
        where.categories = { has: input.category };
      }

      return prisma.vendor.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { orderItems: true, purchaseOrders: true } },
        },
      });
    }),

  get: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.vendor.findFirst({
        where: { id: input.id },
        include: {
          _count: { select: { orderItems: true, purchaseOrders: true } },
        },
      });
    }),

  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1),
        contactName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        address: z.string().optional(),
        categories: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.vendor.create({
        data: {
          name: input.name,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone,
          website: input.website,
          address: input.address,
          categories: input.categories ?? [],
          tags: input.tags ?? [],
          notes: input.notes,
        },
      });
    }),

  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        contactName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        address: z.string().optional(),
        categories: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.vendor.update({ where: { id }, data });
    }),

  // Purchase orders
  listPurchaseOrders: staffProcedure
    .input(z.object({ vendorId: z.string().uuid().optional(), orderId: z.string().uuid().optional() }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.vendorId) where.vendorId = input.vendorId;
      if (input.orderId) where.orderId = input.orderId;

      return prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          order: { select: { id: true, displayId: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  createPurchaseOrder: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        vendorId: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const count = await prisma.purchaseOrder.count();
      const displayId = `PO-${String(count + 1001).padStart(4, "0")}`;

      return prisma.purchaseOrder.create({
        data: {
          displayId,
          orderId: input.orderId,
          vendorId: input.vendorId,
          notes: input.notes,
        },
      });
    }),

  updatePurchaseOrder: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["DRAFT", "SENT", "ACKNOWLEDGED", "FULFILLED"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.purchaseOrder.update({ where: { id }, data });
    }),
});
