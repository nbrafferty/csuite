"use client";

import Link from "next/link";
import { COLORS, STATUS_COLORS, CATEGORY_LABELS } from "@/lib/tokens";
import { DerivedStatusBadge } from "./DerivedStatusBadge";
import type { ProjectSummary } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectSummary;
  variant: "kanban" | "list";
  isAdminView?: boolean;
  canDrag?: boolean;
}

export function ProjectCard({
  project,
  variant,
  isAdminView,
  canDrag = true,
}: ProjectCardProps) {
  const category = CATEGORY_LABELS[project.category];
  const statusColor = STATUS_COLORS[project.status];
  const progressBarColor = statusColor.color;

  if (variant === "list") {
    return (
      <Link
        href={`/projects/${project.id}`}
        className="flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors hover:border-opacity-60"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.cardBorder,
          cursor: "pointer",
        }}
      >
        {/* Name + category */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">{category?.icon}</span>
            <span
              className="truncate text-sm font-medium"
              style={{ color: COLORS.textPrimary }}
            >
              {project.name}
            </span>
          </div>
        </div>

        {/* Client (admin only) */}
        {isAdminView && project.companyName && (
          <div
            className="w-28 shrink-0 truncate text-xs"
            style={{ color: COLORS.textSecondary }}
          >
            {project.companyName}
          </div>
        )}

        {/* Status */}
        <div className="w-32 shrink-0">
          <DerivedStatusBadge
            status={project.status}
            hasStatusOverride={project.hasStatusOverride}
            size="sm"
          />
        </div>

        {/* Orders / Quotes */}
        <div
          className="w-28 shrink-0 text-xs"
          style={{ color: COLORS.textSecondary }}
        >
          {project.orderCount} orders · {project.quoteCount} quotes
        </div>

        {/* Progress */}
        <div className="w-24 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 flex-1 rounded-full"
              style={{ backgroundColor: COLORS.cardBorder }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${project.progressPercent}%`,
                  backgroundColor: progressBarColor,
                }}
              />
            </div>
            <span
              className="text-xs tabular-nums"
              style={{ color: COLORS.textMuted }}
            >
              {project.progressPercent}%
            </span>
          </div>
        </div>

        {/* Budget */}
        <div
          className="w-24 shrink-0 text-right text-xs"
          style={{ color: COLORS.textSecondary }}
        >
          ${project.totalInvoiced.toLocaleString()}
          {project.totalQuoted > 0 && (
            <span style={{ color: COLORS.textMuted }}>
              {" "}
              / ${project.totalQuoted.toLocaleString()}
            </span>
          )}
        </div>

        {/* Event date */}
        <div
          className="w-20 shrink-0 text-right text-xs"
          style={{ color: COLORS.textSecondary }}
        >
          {project.eventDate
            ? new Date(project.eventDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "—"}
        </div>

        {/* Updated */}
        <div
          className="w-20 shrink-0 text-right text-xs"
          style={{ color: COLORS.textMuted }}
        >
          {formatRelativeTime(project.updatedAt)}
        </div>

        {/* Team */}
        <div className="flex w-16 shrink-0 justify-end -space-x-1">
          {project.team.slice(0, 3).map((member) => (
            <div
              key={member.id}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{
                backgroundColor: member.color,
                boxShadow: `0 0 0 2px ${COLORS.card}`,
              }}
              title={member.initials}
            >
              {member.initials}
            </div>
          ))}
          {project.team.length > 3 && (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: COLORS.cardBorder,
                color: COLORS.textSecondary,
                boxShadow: `0 0 0 2px ${COLORS.card}`,
              }}
            >
              +{project.team.length - 3}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Kanban variant — pure content card (drag is handled by KanbanBoard wrapper)
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border p-3 transition-all"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.cardBorder,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorder;
      }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {category?.icon} {category?.label}
        </span>
        <DerivedStatusBadge
          status={project.status}
          hasStatusOverride={project.hasStatusOverride}
          size="sm"
        />
      </div>

      {/* Title */}
      <span
        className="mb-1 block text-sm font-medium"
        style={{ color: COLORS.textPrimary }}
      >
        {project.name}
      </span>

      {/* Subtitle */}
      <div className="mb-3 text-xs" style={{ color: COLORS.textSecondary }}>
        {project.orderCount} orders · {project.quoteCount} quotes
        {project.eventDate && (
          <>
            {" "}
            ·{" "}
            {new Date(project.eventDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="mb-3 h-1 w-full rounded-full"
        style={{ backgroundColor: COLORS.cardBorder }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${project.progressPercent}%`,
            backgroundColor: progressBarColor,
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1">
          {project.team.slice(0, 3).map((member) => (
            <div
              key={member.id}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{
                backgroundColor: member.color,
                boxShadow: `0 0 0 2px ${COLORS.card}`,
              }}
              title={member.initials}
            >
              {member.initials}
            </div>
          ))}
        </div>

        {isAdminView && project.companyName && (
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            {project.companyName}
          </span>
        )}

        {!isAdminView && project.totalInvoiced > 0 && (
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            ${project.totalInvoiced.toLocaleString()}
          </span>
        )}
      </div>
    </Link>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
