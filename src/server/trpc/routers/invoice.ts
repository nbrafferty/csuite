import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { InvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";
import { generateInvoiceNumber } from "../../lib/invoice-number";
import { TRPCError } from "@trpc/server";

export const invoiceRouter = router({
  // LIST — role-aware
  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(InvoiceStatus).optional(),
        orderId: z.string().uuid().optional(),
        companyId: z.string().uuid().optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.InvoiceWhereInput = {};

      if (isStaff && input.companyId) {
        where.companyId = input.companyId;
      } else if (!isStaff) {
        where.companyId = ctx.companyId;
      }

      if (input.status) where.status = input.status;
      if (input.orderId) where.orderId = input.orderId;

      if (input.search) {
        where.OR = [
          { number: { contains: input.search, mode: "insensitive" } },
          { order: { title: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      const invoices = await prisma.invoice.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          order: { select: { id: true, number: true, title: true } },
          company: { select: { id: true, name: true } },
          items: true,
          payments: { orderBy: { paidAt: "desc" } },
          _count: { select: { payments: true } },
        },
      });

      let nextCursor: string | undefined;
      if (invoices.length > input.limit) {
        const nextItem = invoices.pop();
        nextCursor = nextItem?.id;
      }

      return { invoices, nextCursor };
    }),

  // GET single invoice
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.InvoiceWhereInput = { id: input.id };
      if (!isStaff) where.companyId = ctx.companyId;

      return prisma.invoice.findFirst({
        where,
        include: {
          order: { select: { id: true, number: true, title: true } },
          company: { select: { id: true, name: true } },
          items: true,
          payments: {
            orderBy: { paidAt: "desc" },
            include: {
              recordedBy: { select: { id: true, name: true } },
            },
          },
        },
      });
    }),

  // CREATE — staff only
  create: staffProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        dueDate: z.string().datetime().optional(),
        memo: z.string().optional(),
        items: z
          .array(
            z.object({
              description: z.string().min(1),
              quantity: z.number().int().min(1).default(1),
              unitPrice: z.number(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input }) => {
      const order = await prisma.order.findFirst({ where: { id: input.orderId } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const number = await generateInvoiceNumber(prisma);

      return prisma.invoice.create({
        data: {
          number,
          orderId: input.orderId,
          companyId: order.companyId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          memo: input.memo,
          items: {
            create: input.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { items: true },
      });
    }),

  // SEND — mark as sent, set issuedAt
  send: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const invoice = await prisma.invoice.findFirst({ where: { id: input.id } });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      if (invoice.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only send DRAFT invoices" });
      }

      return prisma.invoice.update({
        where: { id: input.id },
        data: { status: "SENT", issuedAt: new Date() },
      });
    }),

  // VOID — staff only
  void: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const invoice = await prisma.invoice.findFirst({ where: { id: input.id } });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      if (invoice.status === "PAID") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot void a paid invoice" });
      }

      return prisma.invoice.update({
        where: { id: input.id },
        data: { status: "VOID" },
      });
    }),

  // RECORD PAYMENT — staff records manual payment
  recordPayment: staffProcedure
    .input(
      z.object({
        invoiceId: z.string().uuid(),
        amount: z.number().positive(),
        method: z.nativeEnum(PaymentMethod),
        reference: z.string().optional(),
        notes: z.string().optional(),
        paidAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invoice = await prisma.invoice.findFirst({
        where: { id: input.invoiceId },
        include: { items: true, payments: true },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      if (invoice.status === "PAID" || invoice.status === "VOID") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice is already paid or voided" });
      }

      const invoiceTotal = invoice.items.reduce(
        (sum, i) => sum + Number(i.lineTotal),
        0
      );
      const previouslyPaid = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const remaining = invoiceTotal - previouslyPaid;

      if (input.amount > remaining + 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Payment exceeds remaining balance of $${remaining.toFixed(2)}`,
        });
      }

      const payment = await prisma.payment.create({
        data: {
          invoiceId: input.invoiceId,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          recordedByUserId: ctx.user.id,
          notes: input.notes,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        },
      });

      // Update invoice status
      const totalPaid = previouslyPaid + input.amount;
      let newStatus: InvoiceStatus = invoice.status;
      if (totalPaid >= invoiceTotal - 0.01) {
        newStatus = "PAID";
      } else if (totalPaid > 0) {
        newStatus = "PARTIALLY_PAID";
      }

      if (newStatus !== invoice.status) {
        await prisma.invoice.update({
          where: { id: input.invoiceId },
          data: {
            status: newStatus,
            paidAt: newStatus === "PAID" ? new Date() : null,
          },
        });
      }

      return payment;
    }),
});
