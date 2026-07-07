"use client";

import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  SENT: { label: "Sent", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  PARTIALLY_PAID: { label: "Partially Paid", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  PAID: { label: "Paid", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  OVERDUE: { label: "Overdue", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  VOID: { label: "Void", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
