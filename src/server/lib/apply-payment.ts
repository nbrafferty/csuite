import { prisma } from "@/server/db/prisma";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

export type ApplyPaymentInput = {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  stripePaymentIntentId?: string;
  recordedByUserId?: string;
  notes?: string;
  paidAt?: Date;
};

/**
 * Creates a Payment and rolls the invoice status forward
 * (SENT -> PARTIALLY_PAID -> PAID). Used by both staff manual entry and the
 * Stripe webhook. Stripe payments are idempotent on stripePaymentIntentId.
 */
export async function applyPayment(input: ApplyPaymentInput) {
  if (input.stripePaymentIntentId) {
    const existing = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: input.stripePaymentIntentId },
    });
    if (existing) return existing;
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId },
    include: { items: true, payments: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "VOID") throw new Error("Invoice is voided");

  const invoiceTotal = invoice.items.reduce(
    (sum, i) => sum + Number(i.lineTotal),
    0
  );
  const previouslyPaid = invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const payment = await prisma.payment.create({
    data: {
      invoiceId: input.invoiceId,
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      stripePaymentIntentId: input.stripePaymentIntentId,
      recordedByUserId: input.recordedByUserId,
      notes: input.notes,
      paidAt: input.paidAt ?? new Date(),
    },
  });

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
}
