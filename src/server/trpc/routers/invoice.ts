import { z } from "zod";
import { router, protectedProcedure, staffProcedure } from "../trpc";
import { prisma } from "@/server/db/prisma";
import { sendEmail, invoiceSentEmail, clientAdminEmails, appBaseUrl } from "@/server/lib/email";
import { InvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";
import { generateInvoiceNumber } from "../../lib/invoice-number";
import { getStripe, isStripeConfigured } from "../../lib/stripe";
import { applyPayment } from "../../lib/apply-payment";
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

      const updated = await prisma.invoice.update({
        where: { id: input.id },
        data: { status: "SENT", issuedAt: new Date() },
        include: { items: { select: { lineTotal: true } } },
      });

      // Notify the client's admins (soft-fails if email isn't configured)
      const recipients = await clientAdminEmails(updated.companyId);
      if (recipients.length > 0) {
        const total = updated.items.reduce((sum, i) => sum + Number(i.lineTotal), 0);
        const template = invoiceSentEmail({
          invoiceNumber: updated.number,
          amountDue: total.toLocaleString("en-US", { style: "currency", currency: "USD" }),
          invoiceUrl: `${appBaseUrl()}/billing/${updated.id}`,
        });
        await sendEmail({ to: recipients, ...template });
      }

      return updated;
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

      return applyPayment({
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        recordedByUserId: ctx.user.id,
        notes: input.notes,
        paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
      });
    }),

  // CREATE PAYMENT INTENT — client (or staff) starts a Stripe payment for
  // the outstanding balance of an invoice
  createPaymentIntent: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Online payments are not available right now",
        });
      }

      const isStaff = ctx.role === "CCC_STAFF";
      const where: Prisma.InvoiceWhereInput = { id: input.invoiceId };
      if (!isStaff) where.companyId = ctx.companyId;

      const invoice = await prisma.invoice.findFirst({
        where,
        include: { items: true, payments: true, company: true },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      if (invoice.status === "PAID" || invoice.status === "VOID" || invoice.status === "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invoice is not open for payment",
        });
      }

      const invoiceTotal = invoice.items.reduce(
        (sum, i) => sum + Number(i.lineTotal),
        0
      );
      const previouslyPaid = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const outstanding = Math.round((invoiceTotal - previouslyPaid) * 100) / 100;

      if (outstanding < 0.5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Outstanding balance is below the minimum chargeable amount",
        });
      }

      const stripe = getStripe();

      // Ensure the company has a Stripe customer
      let stripeCustomerId = invoice.company.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          name: invoice.company.name,
          metadata: { companyId: invoice.companyId },
        });
        stripeCustomerId = customer.id;
        await prisma.company.update({
          where: { id: invoice.companyId },
          data: { stripeCustomerId },
        });
      }

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(outstanding * 100),
        currency: "usd",
        customer: stripeCustomerId,
        description: `Invoice ${invoice.number}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          companyId: invoice.companyId,
        },
        automatic_payment_methods: { enabled: true },
      });

      return {
        clientSecret: intent.client_secret,
        amount: outstanding,
      };
    }),
});
