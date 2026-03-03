"use client";

import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  DRAFT: { label: "Draft", bg: "bg-zinc-800", text: "text-zinc-400" },
  SENT: { label: "Sent", bg: "bg-blue-500/15", text: "text-blue-400" },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
  },
  APPROVED: { label: "Approved", bg: "bg-green-500/15", text: "text-green-400" },
  DECLINED: { label: "Declined", bg: "bg-red-500/15", text: "text-red-400" },
  EXPIRED: { label: "Expired", bg: "bg-zinc-800", text: "text-zinc-500" },
  CONVERTED: {
    label: "Converted",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
  },
};

export function QuoteStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}
