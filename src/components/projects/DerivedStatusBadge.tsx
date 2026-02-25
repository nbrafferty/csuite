"use client";

import type { ProjectStatus } from "@prisma/client";
import { STATUS_COLORS } from "@/lib/tokens";

interface DerivedStatusBadgeProps {
  status: ProjectStatus;
  hasStatusOverride?: boolean;
  size?: "sm" | "md";
}

export function DerivedStatusBadge({
  status,
  hasStatusOverride,
  size = "md",
}: DerivedStatusBadgeProps) {
  const { color, bg, label } = STATUS_COLORS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
      style={{ color, backgroundColor: bg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
      {hasStatusOverride && (
        <span title="Status manually set by staff" className="cursor-help">
          📌
        </span>
      )}
    </span>
  );
}
