"use client";

import { cn } from "@/lib/utils";
import {
  Calendar,
  FileText,
  Package,
  Truck,
  DollarSign,
  CheckCircle,
  Clock,
} from "lucide-react";

const STATUS_SEQUENCE = [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "READY_FOR_PRODUCTION",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

const STATUS_SHORT_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "Review",
  APPROVED: "Approved",
  READY_FOR_PRODUCTION: "Ready",
  IN_PRODUCTION: "Production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

export function OrderOverviewTab({ order, isStaff }: { order: any; isStaff: boolean }) {
  const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Status timeline */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Order Progress
        </h3>
        {isCancelled ? (
          <div className="flex items-center gap-2 text-red-400">
            <span className="text-sm font-medium">This order has been cancelled</span>
          </div>
        ) : (
          <div className="flex items-center">
            {STATUS_SEQUENCE.map((status, idx) => {
              const isComplete = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={status} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                        isComplete
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-coral text-white"
                          : "bg-surface-border text-gray-500"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] font-medium",
                        isCurrent ? "text-white" : isComplete ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      {STATUS_SHORT_LABELS[status]}
                    </span>
                  </div>
                  {idx < STATUS_SEQUENCE.length - 1 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 flex-1",
                        idx < currentIndex ? "bg-emerald-500" : "bg-surface-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Key dates & details */}
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
            {order.dueDate && (
              <DetailRow
                label="In-Hands Date"
                value={new Date(order.dueDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                highlight={new Date(order.dueDate) < new Date()}
              />
            )}
            {order.poNumber && (
              <DetailRow label="PO Number" value={order.poNumber} />
            )}
            {order.eventName && (
              <DetailRow label="Event" value={order.eventName} />
            )}
            <DetailRow label="Source" value={order.sourceType === "QUOTE" ? "Quote" : "Catalog"} />
            {order.notes && (
              <div className="pt-2">
                <span className="text-xs text-gray-500">Notes</span>
                <p className="mt-1 text-sm text-gray-300">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing summary */}
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Order Summary
          </h3>
          <div className="space-y-2">
            <SummaryRow label="Subtotal" value={Number(order.subtotal)} />
            {Number(order.feeAmount) > 0 && (
              <SummaryRow label="Fees" value={Number(order.feeAmount)} />
            )}
            {Number(order.shippingAmount) > 0 && (
              <SummaryRow label="Shipping" value={Number(order.shippingAmount)} />
            )}
            {Number(order.taxAmount) > 0 && (
              <SummaryRow label="Tax" value={Number(order.taxAmount)} />
            )}
            {Number(order.discountAmount) > 0 && (
              <SummaryRow
                label="Discount"
                value={-Number(order.discountAmount)}
                className="text-emerald-400"
              />
            )}
            <div className="border-t border-surface-border pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-white">
                  ${Number(order.totalAmount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 gap-3">
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
        </div>
      </div>

      {/* Staff-only: Financials panel */}
      {isStaff && order.items?.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Financials (Internal)
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <FinancialCard
              label="Revenue"
              value={Number(order.totalAmount)}
              color="text-white"
            />
            <FinancialCard
              label="Total Cost"
              value={order.items.reduce(
                (sum: number, i: any) => sum + (Number(i.totalCost) || 0),
                0
              )}
              color="text-amber-400"
            />
            <FinancialCard
              label="Gross Margin"
              value={
                Number(order.totalAmount) -
                order.items.reduce(
                  (sum: number, i: any) => sum + (Number(i.totalCost) || 0),
                  0
                )
              }
              color="text-emerald-400"
            />
            <FinancialCard
              label="Margin %"
              value={
                Number(order.totalAmount) > 0
                  ? ((Number(order.totalAmount) -
                      order.items.reduce(
                        (sum: number, i: any) =>
                          sum + (Number(i.totalCost) || 0),
                        0
                      )) /
                      Number(order.totalAmount)) *
                    100
                  : 0
              }
              color="text-emerald-400"
              isPercentage
            />
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

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={cn("text-sm text-gray-300", className)}>
        ${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
    <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
      <Icon className="h-4 w-4 text-gray-500" />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="ml-auto text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function FinancialCard({
  label,
  value,
  color,
  isPercentage,
}: {
  label: string;
  value: number;
  color: string;
  isPercentage?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn("mt-1 text-lg font-bold", color)}>
        {isPercentage
          ? `${value.toFixed(1)}%`
          : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
      </p>
    </div>
  );
}
