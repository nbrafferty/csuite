"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

type Order = {
  id: string;
  number: string;
  title: string;
  status: string;
  source: string;
  totalAmount: any;
  createdAt: string | Date;
  company: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: { id: string; description: string; lineTotal: any }[];
  _count: { items: number; shipments: number; invoices: number };
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
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="cursor-pointer bg-surface-card transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                <span className="font-mono text-sm font-medium text-coral">
                  {order.number}
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
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-400">
                {order._count.items}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
