"use client";

import { useState } from "react";
import { COLORS } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { Search, X } from "lucide-react";

interface OrderPickerProps {
  projectId: string;
  onDone: () => void;
}

export function OrderPicker({ projectId, onDone }: OrderPickerProps) {
  const [search, setSearch] = useState("");

  const ordersQuery = trpc.projects.searchOrders.useQuery(
    { search: search || undefined },
    { enabled: true }
  );

  const utils = trpc.useUtils();
  const addOrder = trpc.projects.addOrder.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.list.invalidate();
      onDone();
    },
  });

  return (
    <div className="rounded-lg border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.cardBorder }}>
      <div className="flex items-center gap-2 px-3">
        <Search className="h-4 w-4 shrink-0" style={{ color: COLORS.textMuted }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search unassigned orders..."
          className="w-full bg-transparent py-2 text-sm outline-none"
          style={{ color: COLORS.textPrimary }}
          autoFocus
        />
        <button onClick={onDone}><X className="h-4 w-4" style={{ color: COLORS.textMuted }} /></button>
      </div>
      <div className="max-h-48 overflow-y-auto border-t" style={{ borderColor: COLORS.cardBorder }}>
        {(ordersQuery.data ?? []).map((order) => (
          <button
            key={order.id}
            onClick={() => addOrder.mutate({ projectId, orderId: order.id })}
            disabled={addOrder.isPending}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
            style={{ color: COLORS.textSecondary }}
          >
            <span className="font-mono text-xs" style={{ color: COLORS.textMuted }}>{order.number}</span>
            <span className="flex-1 truncate">{order.title}</span>
            <span className="text-xs">{order.status}</span>
          </button>
        ))}
        {(ordersQuery.data ?? []).length === 0 && !ordersQuery.isLoading && (
          <div className="px-3 py-4 text-center text-xs" style={{ color: COLORS.textMuted }}>
            No unassigned orders found
          </div>
        )}
      </div>
    </div>
  );
}
