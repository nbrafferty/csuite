"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/10 text-blue-400",
  IN_REVIEW: "bg-amber-500/10 text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-400",
  READY_FOR_PRODUCTION: "bg-purple-500/10 text-purple-400",
  IN_PRODUCTION: "bg-orange-500/10 text-orange-400",
  SHIPPED: "bg-cyan-500/10 text-cyan-400",
  DELIVERED: "bg-teal-500/10 text-teal-400",
  COMPLETED: "bg-green-500/10 text-green-400",
  CANCELLED: "bg-red-500/10 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  READY_FOR_PRODUCTION: "Ready",
  IN_PRODUCTION: "In Production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  APPAREL: "bg-indigo-500/10 text-indigo-400",
  COMMERCIAL_PRINTING: "bg-pink-500/10 text-pink-400",
  SIGNAGE: "bg-yellow-500/10 text-yellow-400",
  PROMO_ITEM: "bg-emerald-500/10 text-emerald-400",
  OTHER: "bg-gray-500/10 text-gray-400",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  APPAREL: "Apparel",
  COMMERCIAL_PRINTING: "Print",
  SIGNAGE: "Signage",
  PROMO_ITEM: "Promo",
  OTHER: "Other",
};

export function OrdersTable({
  orders,
  isStaff,
}: {
  orders: Order[];
  isStaff: boolean;
}) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-20 text-center">
        <p className="text-gray-400">No orders found</p>
        <p className="mt-1 text-sm text-gray-500">
          Create a new order from the catalog or submit a quote request.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Order #</th>
            {isStaff && <th className="px-4 py-3">Client</th>}
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">In-Hands Date</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {orders.map((order) => {
            const contentTypes = Array.from(
              new Set(order.items.map((i) => i.contentType))
            );
            const dueDate = order.dueDate ? new Date(order.dueDate) : null;
            const isOverdue = dueDate && dueDate < new Date() && !["COMPLETED", "CANCELLED", "DELIVERED"].includes(order.status);

            return (
              <tr
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="cursor-pointer bg-surface-card transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-medium text-coral">
                    {order.displayId}
                  </span>
                </td>
                {isStaff && (
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {order.company.name}
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-white">
                    {order.title}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {contentTypes.map((type) => (
                      <span
                        key={type}
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          CONTENT_TYPE_COLORS[type] ?? CONTENT_TYPE_COLORS.OTHER
                        )}
                      >
                        {CONTENT_TYPE_LABELS[type] ?? type}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_COLORS[order.status] ?? "bg-gray-500/10 text-gray-400"
                    )}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {dueDate ? (
                    <span
                      className={cn(
                        "text-sm",
                        isOverdue ? "font-medium text-red-400" : "text-gray-300"
                      )}
                    >
                      {dueDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">--</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-white">
                    ${Number(order.totalAmount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
