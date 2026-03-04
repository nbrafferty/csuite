"use client";

import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/orders/invoice-status-badge";

export function OrderBillingTab({ order, isStaff }: { order: any; isStaff: boolean }) {
  const router = useRouter();
  const invoices = order.invoices ?? [];

  const totalInvoiced = invoices.reduce(
    (sum: number, inv: any) =>
      sum + (inv.items ?? []).reduce((s: number, i: any) => s + Number(i.lineTotal), 0),
    0
  );
  const totalPaid = invoices.reduce(
    (sum: number, inv: any) =>
      sum + (inv.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0),
    0
  );

  return (
    <div className="space-y-4">
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-16 text-center">
          <CreditCard className="h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No invoices yet</p>
          <p className="mt-1 text-xs text-gray-600">
            Invoices will be generated for this order as it progresses.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {invoices.map((invoice: any) => {
                const invoiceTotal = (invoice.items ?? []).reduce(
                  (s: number, i: any) => s + Number(i.lineTotal),
                  0
                );
                const invoicePaid = (invoice.payments ?? []).reduce(
                  (s: number, p: any) => s + Number(p.amount),
                  0
                );

                return (
                  <tr
                    key={invoice.id}
                    onClick={() => router.push(`/billing/${invoice.id}`)}
                    className="cursor-pointer bg-surface-card transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-coral">
                        {invoice.number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white">
                      ${invoiceTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-400">
                      ${invoicePaid.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {invoice.issuedAt
                        ? new Date(invoice.issuedAt).toLocaleDateString()
                        : "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment summary */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Payment Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-gray-500">Order Total</p>
            <p className="mt-1 text-lg font-bold text-white">
              ${Number(order.totalAmount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-gray-500">Total Invoiced</p>
            <p className="mt-1 text-lg font-bold text-amber-400">
              ${totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
