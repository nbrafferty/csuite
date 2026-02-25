"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Clock, Package, DollarSign } from "lucide-react";

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

const KANBAN_COLUMNS = [
  { status: "SUBMITTED", label: "Submitted", color: "border-blue-500" },
  { status: "IN_REVIEW", label: "In Review", color: "border-amber-500" },
  { status: "APPROVED", label: "Approved", color: "border-emerald-500" },
  { status: "READY_FOR_PRODUCTION", label: "Ready for Production", color: "border-purple-500" },
  { status: "IN_PRODUCTION", label: "In Production", color: "border-orange-500" },
  { status: "SHIPPED", label: "Shipped", color: "border-cyan-500" },
  { status: "COMPLETED", label: "Completed", color: "border-green-500" },
] as const;

const STATUS_HEADER_COLORS: Record<string, string> = {
  SUBMITTED: "text-blue-400",
  IN_REVIEW: "text-amber-400",
  APPROVED: "text-emerald-400",
  READY_FOR_PRODUCTION: "text-purple-400",
  IN_PRODUCTION: "text-orange-400",
  SHIPPED: "text-cyan-400",
  COMPLETED: "text-green-400",
};

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

  const grouped = KANBAN_COLUMNS.map((col) => ({
    ...col,
    orders: orders.filter((o) => o.status === col.status),
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
          className="flex w-72 shrink-0 flex-col"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("ring-1", "ring-coral/30");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("ring-1", "ring-coral/30");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("ring-1", "ring-coral/30");
            const orderId = e.dataTransfer.getData("orderId");
            if (orderId) handleDrop(orderId, col.status);
          }}
        >
          {/* Column header */}
          <div className={cn("mb-2 flex items-center justify-between rounded-lg border-t-2 bg-surface-card px-3 py-2", col.color)}>
            <span className={cn("text-xs font-semibold uppercase tracking-wider", STATUS_HEADER_COLORS[col.status])}>
              {col.label}
            </span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/5 px-1.5 text-[10px] font-medium text-gray-400">
              {col.orders.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-1 flex-col gap-2">
            {col.orders.map((order) => {
              const dueDate = order.dueDate ? new Date(order.dueDate) : null;
              const isOverdue = dueDate && dueDate < new Date() && !["COMPLETED", "CANCELLED", "DELIVERED"].includes(order.status);
              const daysInState = Math.floor(
                (Date.now() - new Date(order.createdAt).getTime()) / 86400000
              );

              return (
                <div
                  key={order.id}
                  draggable={isStaff}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("orderId", order.id);
                  }}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className={cn(
                    "cursor-pointer rounded-lg border border-surface-border bg-surface-card p-3 transition-all hover:border-gray-500",
                    isStaff && "cursor-grab active:cursor-grabbing",
                    isOverdue && "border-red-500/30"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-medium text-coral">
                      {order.displayId}
                    </span>
                    {isOverdue && (
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                        Overdue
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 text-sm font-medium text-white line-clamp-2">
                    {order.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {order.company.name}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      {dueDate && (
                        <span className={cn("flex items-center gap-1", isOverdue && "text-red-400")}>
                          <Clock className="h-3 w-3" />
                          {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {order._count.items}
                      </span>
                    </div>
                    <span className="font-medium text-gray-300">
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
              <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-border py-8 text-xs text-gray-600">
                No orders
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
