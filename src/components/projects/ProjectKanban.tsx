"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import type { ProjectStatus } from "@prisma/client";
import {
  COLUMN_ORDER,
  ALWAYS_VISIBLE_COLUMNS,
  getValidTargets,
  type UserRole,
} from "@/lib/tokens";
import { KanbanColumn } from "./KanbanColumn";
import type { ProjectSummary } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import { COLORS } from "@/lib/tokens";

interface ProjectKanbanProps {
  projects: ProjectSummary[];
  isLoading?: boolean;
  userRole: UserRole;
  isAdminView?: boolean;
}

export function ProjectKanban({
  projects,
  isLoading,
  userRole,
  isAdminView,
}: ProjectKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [validTargets, setValidTargets] = useState<ProjectStatus[]>([]);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const moveStatus = trpc.projects.moveStatus.useMutation({
    onMutate: async ({ id, toStatus }) => {
      await utils.projects.list.cancel();
      const prev = utils.projects.list.getData({});
      utils.projects.list.setData({}, (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === id ? { ...p, status: toStatus, hasStatusOverride: true } : p
        );
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        utils.projects.list.setData({}, ctx.prev);
      }
      setErrorToast(
        `Couldn't move project — ${_err.message || "unknown error"}`
      );
      setTimeout(() => setErrorToast(null), 5000);
    },
    onSettled: () => {
      utils.projects.list.invalidate();
    },
  });

  const canDrag = userRole !== "CLIENT_USER";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // Group projects by effective status
  const grouped = COLUMN_ORDER.reduce(
    (acc, status) => {
      acc[status] = projects.filter((p) => p.status === status);
      return acc;
    },
    {} as Record<ProjectStatus, ProjectSummary[]>
  );

  // Determine visible columns
  const visibleColumns = COLUMN_ORDER.filter((status) => {
    if (ALWAYS_VISIBLE_COLUMNS.includes(status)) return true;
    if (grouped[status].length > 0) return true;
    if (activeId && validTargets.includes(status)) return true;
    return false;
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const project = (event.active.data.current as any)?.project as
        | ProjectSummary
        | undefined;
      if (!project) return;
      setActiveId(project.id);
      setValidTargets(getValidTargets(project.status, userRole));
    },
    [userRole]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setValidTargets([]);

      if (!over) return;

      const project = (active.data.current as any)?.project as
        | ProjectSummary
        | undefined;
      const targetStatus = (over.data.current as any)?.status as
        | ProjectStatus
        | undefined;

      if (!project || !targetStatus) return;
      if (project.status === targetStatus) return;

      // Check if valid transition
      const targets = getValidTargets(project.status, userRole);
      if (!targets.includes(targetStatus)) {
        // Trigger shake animation
        const el = document.querySelector(
          `[data-project-id="${project.id}"]`
        );
        if (el) {
          el.classList.add("shake");
          setTimeout(() => el.classList.remove("shake"), 300);
        }
        return;
      }

      moveStatus.mutate({ id: project.id, toStatus: targetStatus });
    },
    [userRole, moveStatus]
  );

  if (!canDrag) {
    // Read-only board (no DnD)
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {visibleColumns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            projects={grouped[status]}
            isLoading={isLoading}
            isAdminView={isAdminView}
            canDrag={false}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {visibleColumns.map((status) => {
            const isValidTarget =
              !!activeId && validTargets.includes(status);
            const isInvalidTarget =
              !!activeId &&
              !validTargets.includes(status) &&
              status !== projects.find((p) => p.id === activeId)?.status;

            return (
              <KanbanColumn
                key={status}
                status={status}
                projects={grouped[status]}
                isLoading={isLoading}
                isValidTarget={isValidTarget}
                isInvalidTarget={isInvalidTarget}
                isDragging={!!activeId}
                isAdminView={isAdminView}
                canDrag={canDrag}
              />
            );
          })}
        </div>
      </DndContext>

      {/* Error toast */}
      {errorToast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg"
          style={{
            backgroundColor: COLORS.card,
            borderColor: "#E85D5D40",
            color: COLORS.textPrimary,
          }}
        >
          <span className="text-sm">{errorToast}</span>
          <button
            onClick={() => {
              setErrorToast(null);
              moveStatus.reset();
            }}
            className="text-xs font-medium underline"
            style={{ color: COLORS.coral }}
          >
            Retry
          </button>
          <button
            onClick={() => setErrorToast(null)}
            className="text-xs"
            style={{ color: COLORS.textMuted }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
