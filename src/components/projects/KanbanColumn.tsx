"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ProjectStatus } from "@prisma/client";
import { COLORS, STATUS_COLORS } from "@/lib/tokens";
import { ProjectCard } from "./ProjectCard";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";
import type { ProjectSummary } from "@/lib/types";
import { Lock } from "lucide-react";

interface KanbanColumnProps {
  status: ProjectStatus;
  projects: ProjectSummary[];
  isLoading?: boolean;
  isValidTarget?: boolean;
  isInvalidTarget?: boolean;
  isDragging?: boolean;
  isAdminView?: boolean;
  canDrag?: boolean;
}

export function KanbanColumn({
  status,
  projects,
  isLoading,
  isValidTarget,
  isInvalidTarget,
  isDragging,
  isAdminView,
  canDrag,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const statusConfig = STATUS_COLORS[status];
  const isNeedsAttention = status === "NEEDS_ATTENTION";

  // Determine column visual state
  const isHighlighted = isValidTarget && isOver;
  const isDimmed = isDragging && !isValidTarget && !isInvalidTarget;
  const isRejected = isInvalidTarget && isOver;

  return (
    <div
      ref={setNodeRef}
      className="flex w-72 shrink-0 flex-col rounded-lg border transition-all"
      style={{
        backgroundColor: isHighlighted
          ? `${statusConfig.color}08`
          : COLORS.surface,
        borderColor: isHighlighted
          ? statusConfig.color
          : isRejected
          ? "#E85D5D"
          : COLORS.cardBorder,
        opacity: isDimmed ? 0.4 : 1,
        boxShadow: isHighlighted
          ? `0 0 12px ${statusConfig.color}30`
          : undefined,
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: COLORS.cardBorder }}>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: statusConfig.color }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.label}
          </span>
          {isNeedsAttention && (
            <span title="Status is automatically set when items need attention.">
              <Lock
                className="h-3 w-3"
                style={{ color: COLORS.textMuted }}
              />
            </span>
          )}
        </div>
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium"
          style={{
            backgroundColor: statusConfig.bg,
            color: statusConfig.color,
          }}
        >
          {projects.length}
        </span>
      </div>

      {/* Card list */}
      <div
        className="relative flex-1 space-y-2 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 280px)" }}
      >
        {isLoading ? (
          <>
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </>
        ) : projects.length === 0 ? (
          isDragging && isValidTarget ? (
            // Ghost drop zone
            <div
              className="flex items-center justify-center rounded-lg border-2 border-dashed p-6"
              style={{
                borderColor: `${statusConfig.color}66`,
                backgroundColor: `${statusConfig.color}08`,
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: statusConfig.color }}
              >
                Drop here
              </span>
            </div>
          ) : (
            // Empty state
            <div className="flex items-center justify-center py-8">
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                No {statusConfig.label.toLowerCase()} projects
              </span>
            </div>
          )
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant="kanban"
              isAdminView={isAdminView}
              canDrag={canDrag}
            />
          ))
        )}

        {/* Bottom fade gradient for overflow */}
        {projects.length > 3 && (
          <div
            className="pointer-events-none sticky bottom-0 left-0 right-0 h-6"
            style={{
              background: `linear-gradient(transparent, ${COLORS.surface})`,
            }}
          />
        )}
      </div>
    </div>
  );
}
