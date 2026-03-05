"use client";

import { PROJECT_STATUS_COLORS, type ProjectStatus } from "@/lib/tokens";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  size?: "sm" | "md";
}

export function ProjectStatusBadge({ status, size = "md" }: ProjectStatusBadgeProps) {
  const config = PROJECT_STATUS_COLORS[status];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
