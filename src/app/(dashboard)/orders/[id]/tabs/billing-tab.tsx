"use client";

import { cn } from "@/lib/utils";
import { CreditCard, DollarSign } from "lucide-react";

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400",
  SENT: "bg-blue-500/10 text-blue-400",
  PARTIALLY_PAID: "bg-amber-500/10 text-amber-400",
  PAID: "bg-emerald-500/10 text-emerald-400",
  REFUNDED: "bg-red-500/10 text-red-400",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

export function OrderBillingTab({ order, isStaff }: { order: any; isStaff: boolean }) {
  const invoices = order.invoices ?? [];

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
                <th className="px-4 py-3 text-right">Deposit</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {invoices.map((invoice: any) => (
                <tr
                  key={invoice.id}
                  className="bg-surface-card transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-coral">
                      {invoice.displayId}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        INVOICE_STATUS_COLORS[invoice.status] ?? "bg-gray-500/10 text-gray-400"
                      )}
                    >
                      {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-white">
                    ${Number(invoice.amountTotal).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-400">
                    ${Number(invoice.depositPaid).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">
                    ${Number(invoice.balanceRemaining).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString()
                      : "--"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(invoice.issuedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order payment summary */}
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
              ${invoices
                .reduce((sum: number, i: any) => sum + Number(i.amountTotal), 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              ${invoices
                .filter((i: any) => i.status === "PAID")
                .reduce((sum: number, i: any) => sum + Number(i.amountTotal), 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
