"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { COLORS, STATUS_COLORS, CATEGORY_LABELS } from "@/lib/tokens";
import { DerivedStatusBadge } from "./DerivedStatusBadge";
import type { ProjectSummary } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectSummary;
  variant: "kanban" | "list";
  isDragging?: boolean;
  isAdminView?: boolean;
  canDrag?: boolean;
}

export function ProjectCard({
  project,
  variant,
  isAdminView,
  canDrag = true,
}: ProjectCardProps) {
  const [shaking, setShaking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingDnd,
  } = useDraggable({
    id: project.id,
    data: { project },
    disabled: !canDrag || variant === "list",
  });

  const style =
    variant === "kanban" && transform
      ? {
          transform: CSS.Translate.toString(transform),
          zIndex: isDraggingDnd ? 50 : undefined,
        }
      : undefined;

  // External shake trigger
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const handler = () => {
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
    };
    el.addEventListener("card-shake", handler);
    return () => el.removeEventListener("card-shake", handler);
  }, []);

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
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ring-2"
              style={{
                backgroundColor: member.color,
                ringColor: COLORS.card,
              }}
              title={member.initials}
            >
              {member.initials}
            </div>
          ))}
          {project.team.length > 3 && (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ring-2"
              style={{
                backgroundColor: COLORS.cardBorder,
                color: COLORS.textSecondary,
                ringColor: COLORS.card,
              }}
            >
              +{project.team.length - 3}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Kanban variant
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (cardRef as any).current = node;
      }}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      className={`rounded-lg border p-3 transition-all ${shaking ? "shake" : ""} ${
        isDraggingDnd ? "rotate-2 shadow-xl" : ""
      }`}
      style={{
        backgroundColor: COLORS.card,
        borderColor: isDraggingDnd
          ? statusColor.color
          : COLORS.cardBorder,
        cursor: canDrag ? (isDraggingDnd ? "grabbing" : "grab") : "default",
        opacity: isDraggingDnd ? 0.9 : 1,
        boxShadow: isDraggingDnd
          ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${statusColor.color}40`
          : undefined,
        ...style,
      }}
      role="button"
      tabIndex={0}
      aria-label={`${project.name}, ${STATUS_COLORS[project.status].label}. ${
        canDrag ? "Press space to grab." : ""
      }`}
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
      <Link
        href={`/projects/${project.id}`}
        className="mb-1 block text-sm font-medium hover:underline"
        style={{ color: COLORS.textPrimary }}
        onClick={(e) => {
          if (isDraggingDnd) e.preventDefault();
        }}
      >
        {project.name}
      </Link>

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
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ring-2"
              style={{
                backgroundColor: member.color,
                ringColor: COLORS.card,
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
    </div>
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
