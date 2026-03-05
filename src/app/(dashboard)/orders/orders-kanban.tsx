"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { COLORS } from "@/lib/tokens";
import { Package } from "lucide-react";
import { KanbanBoard, type KanbanColumnConfig } from "@/components/kanban/kanban-board";

type Order = {
  id: string;
  number: string;
  title: string;
  status: string;
  totalAmount: any;
  createdAt: string | Date;
  company: { id: string; name: string };
  createdBy: { id: string; name: string };
  items: { id: string; description: string; lineTotal: any }[];
  _count: { items: number; shipments: number; invoices: number };
};

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: "SUBMITTED", label: "Submitted", color: "#5B8DEF", bg: "rgba(91,141,239,0.12)" },
  { id: "IN_REVIEW", label: "In Review", color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  { id: "PROOFING", label: "Proofing", color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
  { id: "APPROVED", label: "Approved", color: "#34C759", bg: "rgba(52,199,89,0.12)" },
  { id: "IN_PRODUCTION", label: "In Production", color: "#E85D5D", bg: "rgba(232,93,93,0.12)" },
  { id: "READY", label: "Ready", color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
  { id: "SHIPPED", label: "Shipped", color: "#5BDBEF", bg: "rgba(91,219,239,0.12)" },
  { id: "COMPLETED", label: "Completed", color: "#34C759", bg: "rgba(52,199,89,0.12)" },
];

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

  const items = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    for (const col of KANBAN_COLUMNS) {
      grouped[col.id] = orders.filter((o) => o.status === col.id);
    }
    return grouped;
  }, [orders]);

  const handleMove = useCallback(
    (orderId: string, _fromColumn: string, toColumn: string) => {
      if (!isStaff) return;
      transitionMutation.mutate({ id: orderId, status: toColumn as any });
    },
    [isStaff, transitionMutation]
  );

  const renderCard = useCallback(
    (order: Order) => (
      <div
        onClick={() => router.push(`/orders/${order.id}`)}
        className="rounded-lg border p-3 transition-all"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.cardBorder,
          cursor: isStaff ? "inherit" : "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorder;
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            className="font-mono text-xs font-medium"
            style={{ color: COLORS.coral }}
          >
            {order.number}
          </span>
        </div>

        <p
          className="mb-1 text-sm font-medium line-clamp-2"
          style={{ color: COLORS.textPrimary }}
        >
          {order.title}
        </p>

        <div
          className="mb-3 text-xs"
          style={{ color: COLORS.textSecondary }}
        >
          {order.company.name}
        </div>

        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: COLORS.textMuted }}
          >
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
    ),
    [router, isStaff]
  );

  return (
    <KanbanBoard<Order>
      columns={KANBAN_COLUMNS}
      items={items}
      renderCard={renderCard}
      onMove={handleMove}
      disabled={!isStaff}
      columnWidth="18rem"
      emptyLabel="No orders"
    />
  );
}
