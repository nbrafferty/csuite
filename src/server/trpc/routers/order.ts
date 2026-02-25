import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { OrderStatus, OrderSourceType, ContentType, Prisma } from "@prisma/client";

// Valid status transitions for orders
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  SUBMITTED: [OrderStatus.IN_REVIEW, OrderStatus.CANCELLED],
  IN_REVIEW: [OrderStatus.APPROVED, OrderStatus.SUBMITTED, OrderStatus.CANCELLED],
  APPROVED: [OrderStatus.READY_FOR_PRODUCTION, OrderStatus.IN_REVIEW, OrderStatus.CANCELLED],
  READY_FOR_PRODUCTION: [OrderStatus.IN_PRODUCTION, OrderStatus.APPROVED, OrderStatus.CANCELLED],
  IN_PRODUCTION: [OrderStatus.SHIPPED, OrderStatus.READY_FOR_PRODUCTION, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
  DELIVERED: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

export const orderRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(OrderStatus).optional(),
        contentType: z.nativeEnum(ContentType).optional(),
        search: z.string().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        clientCompanyId: z.string().uuid().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.OrderWhereInput = {};

      if (isStaff && input.clientCompanyId) {
        where.companyId = input.clientCompanyId;
      } else if (!isStaff) {
        where.companyId = ctx.companyId;
      }

      if (input.status) where.status = input.status;

      if (input.search) {
        where.OR = [
          { displayId: { contains: input.search, mode: "insensitive" } },
          { title: { contains: input.search, mode: "insensitive" } },
          { poNumber: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input.dateFrom || input.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) where.createdAt.gte = new Date(input.dateFrom);
        if (input.dateTo) where.createdAt.lte = new Date(input.dateTo);
      }

      const orders = await prisma.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          items: {
            select: { id: true, contentType: true, title: true, lineTotal: true },
          },
          _count: { select: { items: true, shipments: true, invoices: true, proofs: true } },
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
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.OrderWhereInput = { id: input.id };
      if (!isStaff) where.companyId = ctx.companyId;

      const order = await prisma.order.findFirst({
        where,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          creator: { select: { id: true, name: true, email: true } },
          items: {
            orderBy: { position: "asc" },
            include: {
              vendor: { select: { id: true, name: true } },
              artworkAsset: { select: { id: true, filename: true } },
              catalogProduct: { select: { id: true, name: true } },
            },
          },
          proofs: { orderBy: { version: "desc" } },
          shipments: {
            include: {
              location: true,
              lineItems: { include: { orderItem: { select: { id: true, title: true } } } },
            },
          },
          invoices: { orderBy: { issuedAt: "desc" } },
          quote: { select: { id: true, displayId: true } },
          internalTasks: isStaff
            ? { orderBy: { createdAt: "asc" }, include: { assignee: { select: { id: true, name: true } } } }
            : false,
        },
      });

      return order;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        poNumber: z.string().optional(),
        eventName: z.string().optional(),
        dueDate: z.string().datetime().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            title: z.string().min(1),
            contentType: z.nativeEnum(ContentType).default("OTHER"),
            description: z.string().optional(),
            catalogProductId: z.string().uuid().optional(),
            sku: z.string().optional(),
            unitPrice: z.number().min(0),
            quantity: z.number().int().min(1),
            sizeBreakdown: z.record(z.number()).optional(),
            decorationDetails: z.any().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate a display ID
      const count = await prisma.order.count();
      const displayId = `CS-${String(count + 1001).padStart(4, "0")}`;

      const order = await prisma.order.create({
        data: {
          companyId: ctx.companyId,
          createdBy: ctx.user.id,
          displayId,
          sourceType: OrderSourceType.CATALOG,
          title: input.title,
          status: OrderStatus.SUBMITTED,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          poNumber: input.poNumber,
          eventName: input.eventName,
          notes: input.notes,
          items: {
            create: input.items.map((item, idx) => ({
              position: idx + 1,
              title: item.title,
              contentType: item.contentType,
              description: item.description,
              catalogProductId: item.catalogProductId,
              sku: item.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              sizeBreakdown: item.sizeBreakdown ?? Prisma.JsonNull,
              decorationDetails: item.decorationDetails ?? Prisma.JsonNull,
              lineTotal: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Compute totals
      const subtotal = order.items.reduce(
        (sum, i) => sum + Number(i.lineTotal),
        0
      );
      await prisma.order.update({
        where: { id: order.id },
        data: {
          subtotal,
          totalAmount: subtotal,
        },
      });

      return order;
    }),

  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        poNumber: z.string().optional(),
        eventName: z.string().optional(),
        dueDate: z.string().datetime().nullable().optional(),
        notes: z.string().optional(),
        shippingAmount: z.number().min(0).optional(),
        discountAmount: z.number().min(0).optional(),
        feeAmount: z.number().min(0).optional(),
        taxRate: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const order = await prisma.order.findFirst({
        where: { id },
      });

      if (!order) throw new Error("Order not found");
      if (order.status === OrderStatus.COMPLETED)
        throw new Error("Cannot edit a completed order");

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.poNumber !== undefined) updateData.poNumber = data.poNumber;
      if (data.eventName !== undefined) updateData.eventName = data.eventName;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.shippingAmount !== undefined) updateData.shippingAmount = data.shippingAmount;
      if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount;
      if (data.feeAmount !== undefined) updateData.feeAmount = data.feeAmount;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;

      // Recalculate totals if financial fields changed
      if (data.shippingAmount !== undefined || data.discountAmount !== undefined || data.feeAmount !== undefined || data.taxRate !== undefined) {
        const items = await prisma.orderItem.findMany({ where: { orderId: id } });
        const subtotal = items.reduce((sum, i) => sum + Number(i.lineTotal), 0);
        const shipping = data.shippingAmount ?? Number(order.shippingAmount);
        const discount = data.discountAmount ?? Number(order.discountAmount);
        const fee = data.feeAmount ?? Number(order.feeAmount);
        const rate = data.taxRate ?? Number(order.taxRate);
        const taxAmount = subtotal * rate;
        const total = subtotal + shipping + fee + taxAmount - discount;

        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.totalAmount = total;
      }

      return prisma.order.update({ where: { id }, data: updateData });
    }),

  transitionStatus: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.nativeEnum(OrderStatus),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.id } });
      if (!order) throw new Error("Order not found");

      const validNext = VALID_STATUS_TRANSITIONS[order.status];
      if (!validNext?.includes(input.status)) {
        throw new Error(
          `Cannot transition from ${order.status} to ${input.status}`
        );
      }

      const updated = await prisma.order.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      // Log the transition
      await prisma.auditLogEvent.create({
        data: {
          companyId: order.companyId,
          userId: ctx.user.id,
          entityType: "Order",
          entityId: order.id,
          action: "STATUS_CHANGED",
          changes: {
            from: order.status,
            to: input.status,
            note: input.note,
          },
        },
      });

      return updated;
    }),

  cancel: staffProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.id } });
      if (!order) throw new Error("Order not found");

      if (
        order.status === OrderStatus.SHIPPED ||
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.COMPLETED ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new Error("Cannot cancel order in current state");
      }

      const updated = await prisma.order.update({
        where: { id: input.id },
        data: { status: OrderStatus.CANCELLED },
      });

      await prisma.auditLogEvent.create({
        data: {
          companyId: order.companyId,
          userId: ctx.user.id,
          entityType: "Order",
          entityId: order.id,
          action: "STATUS_CHANGED",
          changes: { from: order.status, to: "CANCELLED", reason: input.reason },
        },
      });

      return updated;
    }),

  duplicate: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const original = await prisma.order.findFirst({
        where: { id: input.id },
        include: { items: true },
      });
      if (!original) throw new Error("Order not found");

      const count = await prisma.order.count();
      const displayId = `CS-${String(count + 1001).padStart(4, "0")}`;

      const newOrder = await prisma.order.create({
        data: {
          companyId: original.companyId,
          createdBy: ctx.user.id,
          displayId,
          sourceType: original.sourceType,
          title: `${original.title} (Copy)`,
          status: OrderStatus.SUBMITTED,
          dueDate: original.dueDate,
          poNumber: original.poNumber,
          eventName: original.eventName,
          notes: original.notes,
          subtotal: original.subtotal,
          taxRate: original.taxRate,
          taxAmount: original.taxAmount,
          shippingAmount: original.shippingAmount,
          discountAmount: original.discountAmount,
          feeAmount: original.feeAmount,
          totalAmount: original.totalAmount,
          items: {
            create: original.items.map((item) => ({
              position: item.position,
              title: item.title,
              contentType: item.contentType,
              description: item.description,
              catalogProductId: item.catalogProductId,
              sku: item.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              sizeBreakdown: item.sizeBreakdown ?? Prisma.JsonNull,
              decorationDetails: item.decorationDetails ?? Prisma.JsonNull,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      return newOrder;
    }),

  // ─── Line Items ──────────────────────────────────────────────────

  addLineItem: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        title: z.string().min(1),
        contentType: z.nativeEnum(ContentType).default("OTHER"),
        description: z.string().optional(),
        catalogProductId: z.string().uuid().optional(),
        sku: z.string().optional(),
        unitPrice: z.number().min(0),
        quantity: z.number().int().min(1),
        sizeBreakdown: z.record(z.number()).optional(),
        decorationDetails: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.orderId } });
      if (!order) throw new Error("Order not found");
      if (order.status === OrderStatus.COMPLETED) throw new Error("Cannot modify completed order");

      const maxPos = await prisma.orderItem.aggregate({
        where: { orderId: input.orderId },
        _max: { position: true },
      });

      const item = await prisma.orderItem.create({
        data: {
          orderId: input.orderId,
          position: (maxPos._max.position ?? 0) + 1,
          title: input.title,
          contentType: input.contentType,
          description: input.description,
          catalogProductId: input.catalogProductId,
          sku: input.sku,
          unitPrice: input.unitPrice,
          quantity: input.quantity,
          sizeBreakdown: input.sizeBreakdown ?? Prisma.JsonNull,
          decorationDetails: input.decorationDetails ?? Prisma.JsonNull,
          lineTotal: input.unitPrice * input.quantity,
        },
      });

      // Recalculate order totals
      await recalculateOrderTotals(input.orderId);

      return item;
    }),

  updateLineItem: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        contentType: z.nativeEnum(ContentType).optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        unitPrice: z.number().min(0).optional(),
        quantity: z.number().int().min(1).optional(),
        sizeBreakdown: z.record(z.number()).optional(),
        decorationDetails: z.any().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const item = await prisma.orderItem.findFirst({ where: { id } });
      if (!item) throw new Error("Line item not found");

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.contentType !== undefined) updateData.contentType = data.contentType;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.sizeBreakdown !== undefined) updateData.sizeBreakdown = data.sizeBreakdown;
      if (data.decorationDetails !== undefined) updateData.decorationDetails = data.decorationDetails;

      const price = data.unitPrice ?? Number(item.unitPrice);
      const qty = data.quantity ?? item.quantity;
      if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      updateData.lineTotal = price * qty;

      const updated = await prisma.orderItem.update({ where: { id }, data: updateData });
      await recalculateOrderTotals(item.orderId);
      return updated;
    }),

  deleteLineItem: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const item = await prisma.orderItem.findFirst({ where: { id: input.id } });
      if (!item) throw new Error("Line item not found");

      await prisma.orderItem.delete({ where: { id: input.id } });
      await recalculateOrderTotals(item.orderId);

      return { success: true };
    }),

  assignVendor: staffProcedure
    .input(
      z.object({
        lineItemId: z.string().uuid(),
        vendorId: z.string().uuid().nullable(),
        vendorTags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.orderItem.update({
        where: { id: input.lineItemId },
        data: {
          vendorId: input.vendorId,
          vendorTags: input.vendorTags ?? [],
        },
      });
    }),

  updateExpenses: staffProcedure
    .input(
      z.object({
        lineItemId: z.string().uuid(),
        costPerUnit: z.number().min(0),
        totalCost: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const item = await prisma.orderItem.findFirst({ where: { id: input.lineItemId } });
      if (!item) throw new Error("Line item not found");

      return prisma.orderItem.update({
        where: { id: input.lineItemId },
        data: {
          costPerUnit: input.costPerUnit,
          totalCost: input.totalCost,
          profitMargin: Number(item.lineTotal) - input.totalCost,
        },
      });
    }),

  // ─── Shipments ───────────────────────────────────────────────────

  listShipments: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.shipment.findMany({
        where: { orderId: input.orderId },
        include: {
          location: true,
          lineItems: {
            include: { orderItem: { select: { id: true, title: true, quantity: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  addShipment: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        destinationAddress: z.object({
          name: z.string(),
          street: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
          country: z.string().default("US"),
        }),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.shipment.create({
        data: {
          orderId: input.orderId,
          destinationAddress: input.destinationAddress,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
        },
      });
    }),

  updateShipment: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        trackingUrl: z.string().optional(),
        status: z.enum(["PENDING", "LABEL_CREATED", "IN_TRANSIT", "DELIVERED"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = {};
      if (data.carrier !== undefined) updateData.carrier = data.carrier;
      if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
      if (data.trackingUrl !== undefined) updateData.trackingUrl = data.trackingUrl;
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "IN_TRANSIT") updateData.shippedAt = new Date();
        if (data.status === "DELIVERED") updateData.deliveredAt = new Date();
      }
      return prisma.shipment.update({ where: { id }, data: updateData });
    }),

  // ─── Internal Tasks ──────────────────────────────────────────────

  listTasks: staffProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.internalTask.findMany({
        where: { orderId: input.orderId },
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  createTask: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        title: z.string().min(1),
        assigneeId: z.string().uuid().optional(),
        dueDate: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.internalTask.create({
        data: {
          orderId: input.orderId,
          title: input.title,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
      });
    }),

  updateTask: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        assigneeId: z.string().uuid().nullable().optional(),
        dueDate: z.string().datetime().nullable().optional(),
        completed: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (data.completed !== undefined) {
        updateData.completed = data.completed;
        updateData.completedAt = data.completed ? new Date() : null;
      }
      return prisma.internalTask.update({ where: { id }, data: updateData });
    }),

  deleteTask: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await prisma.internalTask.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ─── Activity Log ────────────────────────────────────────────────

  activity: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.auditLogEvent.findMany({
        where: { entityType: "Order", entityId: input.orderId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),
});

// Helper: recalculate order totals from line items
async function recalculateOrderTotals(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce((sum, i) => sum + Number(i.lineTotal), 0);

  const order = await prisma.order.findFirst({ where: { id: orderId } });
  if (!order) return;

  const shipping = Number(order.shippingAmount);
  const discount = Number(order.discountAmount);
  const fee = Number(order.feeAmount);
  const taxRate = Number(order.taxRate);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shipping + fee + taxAmount - discount;

  await prisma.order.update({
    where: { id: orderId },
    data: { subtotal, taxAmount, totalAmount: total },
  });
}
