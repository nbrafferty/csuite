"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, AlertCircle, Send, Ban } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/orders/invoice-status-badge";
import { StripePaymentSection, isStripeEnabled } from "@/components/billing/stripe-payment-form";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

const PAYMENT_METHODS = [
  { label: "Stripe", value: "STRIPE" },
  { label: "Check", value: "CHECK" },
  { label: "Wire Transfer", value: "WIRE" },
  { label: "Cash", value: "CASH" },
  { label: "Other", value: "OTHER" },
];

export function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const { data: invoice, isLoading } = trpc.invoice.get.useQuery(
    { id: invoiceId },
    { refetchInterval: 10_000 }
  );

  const utils = trpc.useUtils();

  const sendMutation = trpc.invoice.send.useMutation({
    onSuccess: () => utils.invoice.get.invalidate({ id: invoiceId }),
  });

  const voidMutation = trpc.invoice.void.useMutation({
    onSuccess: () => utils.invoice.get.invalidate({ id: invoiceId }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-gray-600" />
        <p className="mt-4 text-gray-400">Invoice not found</p>
        <button
          onClick={() => router.push("/billing")}
          className="mt-4 text-sm text-coral hover:text-coral-light"
        >
          Back to billing
        </button>
      </div>
    );
  }

  const invoiceTotal = (invoice.items ?? []).reduce(
    (s, i) => s + Number(i.lineTotal),
    0
  );
  const totalPaid = (invoice.payments ?? []).reduce(
    (s, p) => s + Number(p.amount),
    0
  );
  const outstanding = invoiceTotal - totalPaid;

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.push("/billing")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl uppercase tracking-display text-white">{invoice.number}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Order: {invoice.order?.number} — {invoice.order?.title}
          </p>
          <p className="text-sm text-gray-500">
            Client: {invoice.company?.name}
          </p>
        </div>

        {/* Staff actions */}
        {isStaff && (
          <div className="flex items-center gap-2">
            {invoice.status === "DRAFT" && (
              <button
                onClick={() => sendMutation.mutate({ id: invoiceId })}
                disabled={sendMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sendMutation.isPending ? "Sending..." : "Send Invoice"}
              </button>
            )}
            {invoice.status !== "PAID" && invoice.status !== "VOID" && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                Record Payment
              </button>
            )}
            {invoice.status !== "PAID" && invoice.status !== "VOID" && (
              <button
                onClick={() => {
                  if (confirm("Void this invoice?")) {
                    voidMutation.mutate({ id: invoiceId });
                  }
                }}
                className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-red-400"
              >
                <Ban className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Invoice details */}
      <div className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5">
        <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Issued</span>
            <p className="text-gray-300">
              {invoice.issuedAt
                ? new Date(invoice.issuedAt).toLocaleDateString()
                : "Not yet issued"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Due Date</span>
            <p className="text-gray-300">
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString()
                : "No due date"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Paid</span>
            <p className="text-gray-300">
              {invoice.paidAt
                ? new Date(invoice.paidAt).toLocaleDateString()
                : "--"}
            </p>
          </div>
        </div>

        {invoice.memo && (
          <div className="mb-4 border-t border-surface-border pt-3">
            <span className="text-xs text-gray-500">Memo</span>
            <p className="mt-1 text-sm text-gray-300">{invoice.memo}</p>
          </div>
        )}

        {/* Line items */}
        <h3 className="mb-3 text-sm font-semibold text-white">Items</h3>
        <div className="overflow-hidden rounded-lg border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-secondary text-xs font-medium uppercase text-gray-500">
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-center">Qty</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {invoice.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-gray-300">{item.description}</td>
                  <td className="px-3 py-2 text-center text-gray-400">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-gray-400">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-white">
                    {formatCurrency(Number(item.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-2 border-t border-surface-border pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-white">{formatCurrency(invoiceTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Paid</span>
            <span className="text-green-400">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-gray-400">Outstanding</span>
            <span className={outstanding > 0 ? "text-yellow-400" : "text-green-400"}>
              {formatCurrency(outstanding)}
            </span>
          </div>
        </div>
      </div>

      {/* Online payment — clients pay open invoices via Stripe */}
      {!isStaff &&
        outstanding > 0.5 &&
        (invoice.status === "SENT" ||
          invoice.status === "PARTIALLY_PAID" ||
          invoice.status === "OVERDUE") &&
        (isStripeEnabled() ? (
          <StripePaymentSection invoiceId={invoiceId} outstanding={outstanding} />
        ) : (
          <div className="mt-6 rounded-lg border border-surface-border bg-surface-card p-5">
            <h3 className="text-sm font-semibold text-white">Ready to pay?</h3>
            <p className="mt-1 text-sm text-gray-400">
              Online card payment isn&apos;t available yet. Please contact Central
              Creative to arrange payment by check, wire, or card — or send us a
              message from the Messages page.
            </p>
          </div>
        ))}

      {/* Payment form */}
      {showPaymentForm && isStaff && (
        <RecordPaymentForm
          invoiceId={invoiceId}
          maxAmount={outstanding}
          onClose={() => setShowPaymentForm(false)}
        />
      )}

      {/* Payment history */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Payment History</h3>
          <div className="space-y-3">
            {invoice.payments.map((payment: any) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg bg-surface-secondary px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payment.method} · {new Date(payment.paidAt).toLocaleDateString()}
                    {payment.reference && ` · Ref: ${payment.reference}`}
                  </p>
                  {payment.notes && (
                    <p className="mt-0.5 text-xs text-gray-500">{payment.notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {payment.recordedBy?.name
                    ? `by ${payment.recordedBy.name}`
                    : payment.method === "STRIPE"
                      ? "Paid online"
                      : "by Unknown"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecordPaymentForm({
  invoiceId,
  maxAmount,
  onClose,
}: {
  invoiceId: string;
  maxAmount: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(maxAmount);
  const [method, setMethod] = useState("CHECK");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const mutation = trpc.invoice.recordPayment.useMutation({
    onSuccess: () => {
      utils.invoice.get.invalidate({ id: invoiceId });
      onClose();
    },
  });

  return (
    <div className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Record Payment</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Amount</label>
          <input
            type="number"
            step={0.01}
            min={0.01}
            max={maxAmount}
            required
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Reference</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Check #, wire ref, etc."
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            mutation.mutate({
              invoiceId,
              amount,
              method: method as any,
              reference: reference || undefined,
              notes: notes || undefined,
            })
          }
          disabled={mutation.isPending || amount <= 0}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Recording..." : `Record ${formatCurrency(amount)}`}
        </button>
      </div>
    </div>
  );
}
