import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { OrderStatus, OrderSource, PaymentTermType, Prisma } from "@prisma/client";
import { generateOrderNumber } from "../../lib/order-number";
import { generateQuoteNumber } from "../../lib/quote-number";
import { sendEmail, reorderRequestEmail, staffEmails, appBaseUrl } from "@/server/lib/email";
import { TRPCError } from "@trpc/server";

// Valid status transitions per spec
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  SUBMITTED: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["PROOFING", "APPROVED", "CANCELLED"],
  PROOFING: ["APPROVED", "IN_REVIEW", "CANCELLED"],
  APPROVED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["READY", "CANCELLED"],
  READY: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const orderRouter = router({
  // LIST — role-aware
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(OrderStatus).optional(),
        search: z.string().optional(),
        companyId: z.string().uuid().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.OrderWhereInput = {};

      if (isStaff && input.companyId) {
        where.companyId = input.companyId;
      } else if (!isStaff) {
        where.companyId = ctx.companyId;
      }

      if (input.status) where.status = input.status;

      if (input.search) {
        where.OR = [
          { number: { contains: input.search, mode: "insensitive" } },
          { title: { contains: input.search, mode: "insensitive" } },
          { poNumber: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const orders = await prisma.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          items: {
            select: { id: true, description: true, lineTotal: true },
          },
          _count: { select: { items: true, shipments: true, invoices: true } },
        },
      });

      let nextCursor: string | undefined;
      if (orders.length > input.limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem?.id;
      }

      return { orders, nextCursor };
    }),

  // GET single order
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
          createdBy: { select: { id: true, name: true, email: true } },
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              vendor: { select: { id: true, name: true } },
              imprints: {
                orderBy: { sortOrder: "asc" },
                include: {
                  artworkAsset: {
                    select: {
                      id: true,
                      name: true,
                      filename: true,
                      versions: {
                        orderBy: { versionNumber: "desc" },
                        take: 1,
                        select: { thumbnailUrl: true, fileUrl: true },
                      },
                    },
                  },
                },
              },
            },
          },
          quote: { select: { id: true, number: true } },
          fees: { orderBy: { sortOrder: "asc" } },
          project: { select: { id: true, name: true, status: true, logoUrl: true } },
          invoices: {
            orderBy: { createdAt: "desc" },
            include: {
              items: true,
              payments: { select: { id: true, amount: true, paidAt: true } },
              _count: { select: { payments: true } },
            },
          },
          shipments: {
            orderBy: { createdAt: "asc" },
            include: { location: true },
          },
          artworkLinks: {
            include: {
              artworkAsset: {
                select: { id: true, filename: true },
              },
            },
          },
          proofs: { orderBy: { createdAt: "desc" } },
          internalTasks: isStaff
            ? { orderBy: { createdAt: "asc" }, include: { assignee: { select: { id: true, name: true } } } }
            : false,
        },
      });

      return order;
    }),

  // CREATE — staff only
  create: staffProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        title: z.string().min(1),
        source: z.nativeEnum(OrderSource).default("MANUAL"),
        paymentTermType: z.nativeEnum(PaymentTermType).default("FULL"),
        depositPercent: z.number().int().min(1).max(99).optional(),
        netDays: z.number().int().min(1).optional(),
        inHandsDate: z.string().datetime().optional(),
        poNumber: z.string().optional(),
        internalNotes: z.string().optional(),
        clientNotes: z.string().optional(),
        projectId: z.string().optional(),
        items: z
          .array(
            z.object({
              description: z.string().min(1),
              sku: z.string().optional(),
              color: z.string().optional(),
              unitPrice: z.number().min(0),
              quantity: z.number().int().min(1),
              sizeBreakdown: z.record(z.number()).optional(),
              decorationNotes: z.string().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const number = await generateOrderNumber(prisma);
      const totalAmount = input.items.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0
      );

      const order = await prisma.order.create({
        data: {
          number,
          companyId: input.companyId,
          createdByUserId: ctx.user.id,
          projectId: input.projectId,
          title: input.title,
          source: input.source,
          paymentTermType: input.paymentTermType,
          depositPercent: input.depositPercent,
          netDays: input.netDays,
          inHandsDate: input.inHandsDate ? new Date(input.inHandsDate) : null,
          poNumber: input.poNumber,
          internalNotes: input.internalNotes,
          clientNotes: input.clientNotes,
          totalAmount,
          items: {
            create: input.items.map((item, idx) => ({
              sortOrder: idx,
              description: item.description,
              sku: item.sku,
              color: item.color,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              sizeBreakdown: item.sizeBreakdown ?? Prisma.JsonNull,
              decorationNotes: item.decorationNotes,
              lineTotal: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      return order;
    }),

  // UPDATE — staff only
  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        poNumber: z.string().nullable().optional(),
        internalNotes: z.string().nullable().optional(),
        clientNotes: z.string().nullable().optional(),
        inHandsDate: z.string().datetime().nullable().optional(),
        paymentTermType: z.nativeEnum(PaymentTermType).optional(),
        depositPercent: z.number().int().min(1).max(99).nullable().optional(),
        netDays: z.number().int().min(1).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const order = await prisma.order.findFirst({ where: { id } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.status === "COMPLETED" || order.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot edit a completed or cancelled order",
        });
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.poNumber !== undefined) updateData.poNumber = data.poNumber;
      if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
      if (data.clientNotes !== undefined) updateData.clientNotes = data.clientNotes;
      if (data.inHandsDate !== undefined)
        updateData.inHandsDate = data.inHandsDate ? new Date(data.inHandsDate) : null;
      if (data.paymentTermType !== undefined) updateData.paymentTermType = data.paymentTermType;
      if (data.depositPercent !== undefined) updateData.depositPercent = data.depositPercent;
      if (data.netDays !== undefined) updateData.netDays = data.netDays;

      return prisma.order.update({ where: { id }, data: updateData });
    }),

  // TRANSITION STATUS — staff only
  transitionStatus: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.nativeEnum(OrderStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.id } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const validNext = VALID_TRANSITIONS[order.status];
      if (!validNext?.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${order.status} to ${input.status}`,
        });
      }

      const updated = await prisma.order.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await prisma.auditLogEvent.create({
        data: {
          companyId: order.companyId,
          userId: ctx.user.id,
          entityType: "Order",
          entityId: order.id,
          action: "STATUS_CHANGED",
          changes: { from: order.status, to: input.status },
        },
      });

      return updated;
    }),

  // CANCEL — staff only, from any non-terminal status
  cancel: staffProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.id } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      if (order.status === "COMPLETED" || order.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel order in current state",
        });
      }

      const updated = await prisma.order.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
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

  // ─── Line Items ──────────────────────────────────────────────────

  addItem: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        description: z.string().min(1),
        sku: z.string().optional(),
        color: z.string().optional(),
        unitPrice: z.number().min(0),
        quantity: z.number().int().min(1),
        sizeBreakdown: z.record(z.number()).optional(),
        decorationNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.orderId } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const maxSort = await prisma.orderItem.aggregate({
        where: { orderId: input.orderId },
        _max: { sortOrder: true },
      });

      const item = await prisma.orderItem.create({
        data: {
          orderId: input.orderId,
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          description: input.description,
          sku: input.sku,
          color: input.color,
          unitPrice: input.unitPrice,
          quantity: input.quantity,
          sizeBreakdown: input.sizeBreakdown ?? Prisma.JsonNull,
          decorationNotes: input.decorationNotes,
          lineTotal: input.unitPrice * input.quantity,
        },
      });

      await recalculateOrderTotal(input.orderId);
      return item;
    }),

  updateItem: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        description: z.string().min(1).optional(),
        sku: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        unitPrice: z.number().min(0).optional(),
        quantity: z.number().int().min(1).optional(),
        sizeBreakdown: z.record(z.number()).nullable().optional(),
        decorationNotes: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const item = await prisma.orderItem.findFirst({ where: { id } });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: any = {};
      if (data.description !== undefined) updateData.description = data.description;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.decorationNotes !== undefined) updateData.decorationNotes = data.decorationNotes;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.sizeBreakdown !== undefined)
        updateData.sizeBreakdown = data.sizeBreakdown ?? Prisma.JsonNull;

      const price = data.unitPrice ?? Number(item.unitPrice);
      const qty = data.quantity ?? item.quantity;
      if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      updateData.lineTotal = price * qty;

      const updated = await prisma.orderItem.update({ where: { id }, data: updateData });
      await recalculateOrderTotal(item.orderId);
      return updated;
    }),

  removeItem: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const item = await prisma.orderItem.findFirst({ where: { id: input.id } });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.orderItem.delete({ where: { id: input.id } });
      await recalculateOrderTotal(item.orderId);
      return { success: true };
    }),

  assignVendor: staffProcedure
    .input(
      z.object({
        itemId: z.string().uuid(),
        vendorId: z.string().uuid().nullable(),
        costPerUnit: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = { vendorId: input.vendorId };
      if (input.costPerUnit !== undefined) updateData.costPerUnit = input.costPerUnit;
      return prisma.orderItem.update({
        where: { id: input.itemId },
        data: updateData,
      });
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

  // REORDER — deep-clone an order's line-item tree into a new DRAFT quote.
  // Staff can reorder any order; clients only their own company's.
  reorder: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        // Optional per-item quantity/size overrides collected in the
        // confirmation dialog (keyed by the source order item id).
        overrides: z
          .array(
            z.object({
              itemId: z.string(),
              quantity: z.number().int().positive().optional(),
              sizeBreakdown: z
                .record(z.string(), z.number().int().nonnegative())
                .optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";

      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: { orderBy: { sortOrder: "asc" }, include: { imprints: true } },
          fees: { orderBy: { sortOrder: "asc" } },
          company: { select: { name: true } },
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (!isStaff && order.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (order.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This order has no line items to reorder",
        });
      }

      const overrideMap = new Map(
        (input.overrides ?? []).map((o) => [o.itemId, o])
      );

      const number = await generateQuoteNumber(prisma as any);
      const quote = await prisma.quote.create({
        data: {
          number,
          companyId: order.companyId,
          createdByUserId: ctx.user.id as string,
          title: `REORDER: ${order.title}`,
          status: "DRAFT",
          sourceOrderId: order.id,
          paymentTermType: order.paymentTermType,
          depositPercent: order.depositPercent,
          netDays: order.netDays,
          items: {
            create: order.items.map((item, idx) => {
              const ov = overrideMap.get(item.id);
              const sizes =
                ov?.sizeBreakdown ??
                (item.sizeBreakdown as Record<string, number> | null) ??
                undefined;
              const sizeSum = sizes
                ? Object.values(sizes).reduce((a, b) => a + b, 0)
                : 0;
              const qty = sizeSum > 0 ? sizeSum : ov?.quantity ?? item.quantity;
              return {
                sortOrder: idx,
                description: item.description,
                sku: item.sku,
                itemNumber: item.itemNumber,
                color: item.color,
                category: item.category,
                unitPrice: item.unitPrice,
                quantity: qty,
                sizeBreakdown: sizes ?? undefined,
                decorationNotes: item.decorationNotes,
                lineTotal: Number(item.unitPrice) * qty,
                imprints: {
                  create: item.imprints.map((imp) => ({
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
              };
            }),
          },
          fees: {
            create: order.fees.map((f) => ({
              description: f.description,
              quantity: f.quantity,
              unitAmount: f.unitAmount,
              sortOrder: f.sortOrder,
            })),
          },
        },
      });

      // Client-submitted reorders land in the staff queue — notify staff
      if (!isStaff) {
        const recipients = await staffEmails();
        if (recipients.length > 0) {
          const template = reorderRequestEmail({
            companyName: order.company.name,
            quoteTitle: quote.title,
            quoteUrl: `${appBaseUrl()}/quotes/${quote.id}`,
          });
          await sendEmail({ to: recipients, ...template });
        }
      }

      return { id: quote.id, number: quote.number, title: quote.title };
    }),

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

// Helper: recalculate order totalAmount from line items
async function recalculateOrderTotal(orderId: string) {
  const [items, fees] = await Promise.all([
    prisma.orderItem.findMany({ where: { orderId } }),
    prisma.feeLine.findMany({ where: { orderId } }),
  ]);
  const totalAmount =
    items.reduce((sum, i) => sum + Number(i.lineTotal), 0) +
    fees.reduce((sum, f) => sum + Number(f.unitAmount) * f.quantity, 0);
  await prisma.order.update({
    where: { id: orderId },
    data: { totalAmount },
  });
}
