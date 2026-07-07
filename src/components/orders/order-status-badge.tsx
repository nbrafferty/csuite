"use client";

import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Submitted", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  IN_REVIEW: { label: "In Review", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  PROOFING: { label: "Proofing", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  APPROVED: { label: "Approved", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  IN_PRODUCTION: { label: "In Production", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  READY: { label: "Ready", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  SHIPPED: { label: "Shipped", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function OrderStatusBadge({ status }: { status: string }) {
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
