"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { COLORS } from "@/lib/tokens";
import { Clock, Package } from "lucide-react";

type Order = {
  id: string;
  displayId: string;
  title: string;
  status: string;
  sourceType: string;
  dueDate: string | Date | null;
  totalAmount: any;
  createdAt: string | Date;
  company: { id: string; name: string };
  creator: { id: string; name: string };
  items: { id: string; contentType: string; title: string; lineTotal: any }[];
  _count: { items: number; shipments: number; invoices: number; proofs: number };
};

const ORDER_STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  SUBMITTED: { color: "#5B8DEF", bg: "rgba(91,141,239,0.12)", label: "Submitted" },
  IN_REVIEW: { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", label: "In Review" },
  APPROVED: { color: "#34C759", bg: "rgba(52,199,89,0.12)", label: "Approved" },
  READY_FOR_PRODUCTION: { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", label: "Ready for Production" },
  IN_PRODUCTION: { color: "#E85D5D", bg: "rgba(232,93,93,0.12)", label: "In Production" },
  SHIPPED: { color: "#5BDBEF", bg: "rgba(91,219,239,0.12)", label: "Shipped" },
  COMPLETED: { color: "#34C759", bg: "rgba(52,199,89,0.12)", label: "Completed" },
};

const KANBAN_COLUMNS = [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "READY_FOR_PRODUCTION",
  "IN_PRODUCTION",
  "SHIPPED",
  "COMPLETED",
] as const;

export function OrdersKanban({
  orders,
  isStaff,
}: {
  orders: Order[];
  isStaff: boolean;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const transitionMutation = trpc.order.transitionStatus.useMutation({
    onSuccess: () => utils.order.list.invalidate(),
  });

  const grouped = KANBAN_COLUMNS.map((status) => ({
    status,
    config: ORDER_STATUS_COLORS[status],
    orders: orders.filter((o) => o.status === status),
  }));

  const handleDrop = (orderId: string, newStatus: string) => {
    if (!isStaff) return;
    transitionMutation.mutate({ id: orderId, status: newStatus as any });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {grouped.map((col) => (
        <div
          key={col.status}
          className="flex w-72 shrink-0 flex-col rounded-lg border transition-all"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.cardBorder,
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = col.config.color;
            e.currentTarget.style.boxShadow = `0 0 12px ${col.config.color}30`;
            e.currentTarget.style.backgroundColor = `${col.config.color}08`;
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.backgroundColor = COLORS.surface;
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.backgroundColor = COLORS.surface;
            const orderId = e.dataTransfer.getData("orderId");
            if (orderId) handleDrop(orderId, col.status);
          }}
        >
          {/* Column header */}
          <div
            className="flex items-center justify-between px-3 py-2.5 border-b"
            style={{ borderColor: COLORS.cardBorder }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: col.config.color }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: col.config.color }}
              >
                {col.config.label}
              </span>
            </div>
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium"
              style={{
                backgroundColor: col.config.bg,
                color: col.config.color,
              }}
            >
              {col.orders.length}
            </span>
          </div>

          {/* Cards */}
          <div
            className="relative flex-1 space-y-2 overflow-y-auto p-2"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
            {col.orders.map((order) => {
              const dueDate = order.dueDate ? new Date(order.dueDate) : null;
              const isOverdue = dueDate && dueDate < new Date() && !["COMPLETED", "CANCELLED", "DELIVERED"].includes(order.status);

              return (
                <div
                  key={order.id}
                  draggable={isStaff}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("orderId", order.id);
                  }}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="rounded-lg border p-3 transition-all"
                  style={{
                    backgroundColor: COLORS.card,
                    borderColor: isOverdue ? "rgba(232,93,93,0.3)" : COLORS.cardBorder,
                    cursor: isStaff ? "grab" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = isOverdue ? "rgba(232,93,93,0.3)" : COLORS.cardBorder;
                  }}
                >
                  {/* Header: ID + overdue badge */}
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="font-mono text-xs font-medium"
                      style={{ color: COLORS.coral }}
                    >
                      {order.displayId}
                    </span>
                    {isOverdue && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: "rgba(232,93,93,0.12)",
                          color: "#E85D5D",
                        }}
                      >
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p
                    className="mb-1 text-sm font-medium line-clamp-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {order.title}
                  </p>

                  {/* Company */}
                  <div
                    className="mb-3 text-xs"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {order.company.name}
                  </div>

                  {/* Footer: date, items, amount */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 text-xs"
                      style={{ color: COLORS.textMuted }}
                    >
                      {dueDate && (
                        <span
                          className="flex items-center gap-1"
                          style={isOverdue ? { color: "#E85D5D" } : undefined}
                        >
                          <Clock className="h-3 w-3" />
                          {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {order._count.items}
                      </span>
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: COLORS.textMuted }}
                    >
                      ${Number(order.totalAmount).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {col.orders.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs" style={{ color: COLORS.textMuted }}>
                  No orders
                </span>
              </div>
            )}

            {/* Bottom fade gradient for overflow */}
            {col.orders.length > 3 && (
              <div
                className="pointer-events-none sticky bottom-0 left-0 right-0 h-6"
                style={{
                  background: `linear-gradient(transparent, ${COLORS.surface})`,
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
