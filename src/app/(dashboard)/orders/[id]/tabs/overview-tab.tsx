"use client";

import { cn } from "@/lib/utils";
import {
  Package,
  Truck,
  DollarSign,
  FileText,
} from "lucide-react";
import { PaymentSummaryCard } from "@/components/orders/payment-summary-card";

export function OrderOverviewTab({ order, isStaff }: { order: any; isStaff: boolean }) {
  const totalInvoiced = (order.invoices ?? []).reduce(
    (sum: number, inv: any) =>
      sum + (inv.items ?? []).reduce((s: number, i: any) => s + Number(i.lineTotal), 0),
    0
  );
  const totalPaid = (order.invoices ?? []).reduce(
    (sum: number, inv: any) =>
      sum + (inv.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Key details */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Details
          </h3>
          <div className="space-y-3">
            <DetailRow
              label="Created"
              value={new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            />
            {order.inHandsDate && (
              <DetailRow
                label="In-Hands Date"
                value={new Date(order.inHandsDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                highlight={new Date(order.inHandsDate) < new Date()}
              />
            )}
            {order.poNumber && (
              <DetailRow label="PO Number" value={order.poNumber} />
            )}
            <DetailRow label="Source" value={order.source === "QUOTE" ? "Quote" : "Manual"} />
            {order.quote && (
              <DetailRow label="Quote" value={order.quote.number} />
            )}
            {order.clientNotes && (
              <div className="pt-2">
                <span className="text-xs text-gray-500">Client Notes</span>
                <p className="mt-1 text-sm text-gray-300">{order.clientNotes}</p>
              </div>
            )}
            {isStaff && order.internalNotes && (
              <div className="pt-2">
                <span className="text-xs text-gray-500">Internal Notes</span>
                <p className="mt-1 text-sm text-gray-300">{order.internalNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment summary */}
        <PaymentSummaryCard
          paymentTermType={order.paymentTermType}
          depositPercent={order.depositPercent}
          netDays={order.netDays}
          totalAmount={Number(order.totalAmount)}
          totalInvoiced={totalInvoiced}
          totalPaid={totalPaid}
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickStat
          icon={Package}
          label="Line Items"
          value={order.items?.length ?? 0}
        />
        <QuickStat
          icon={Truck}
          label="Shipments"
          value={order.shipments?.length ?? 0}
        />
        <QuickStat
          icon={FileText}
          label="Proofs"
          value={order.proofs?.length ?? 0}
        />
        <QuickStat
          icon={DollarSign}
          label="Invoices"
          value={order.invoices?.length ?? 0}
        />
      </div>

      {/* Staff-only: Cost breakdown */}
      {isStaff && order.items?.some((i: any) => i.costPerUnit) && (
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Cost Breakdown (Internal)
          </h3>
          <div className="overflow-hidden rounded-lg border border-surface-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-white/[0.02] text-xs font-medium uppercase text-gray-500">
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Cost/Unit</th>
                  <th className="px-3 py-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {order.items.map((item: any) => {
                  const revenue = Number(item.lineTotal);
                  const cost = item.costPerUnit ? Number(item.costPerUnit) * item.quantity : 0;
                  const margin = revenue - cost;
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-gray-300">{item.description}</td>
                      <td className="px-3 py-2 text-right text-gray-300">
                        ${revenue.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-400">
                        {item.costPerUnit ? `$${Number(item.costPerUnit).toFixed(2)}` : "--"}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-medium",
                          margin > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {item.costPerUnit ? `$${margin.toFixed(2)}` : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={cn("text-sm", highlight ? "font-medium text-red-400" : "text-gray-300")}>
        {value}
      </span>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-4 py-3">
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="ml-auto text-sm font-medium text-white">{value}</span>
    </div>
  );
}
