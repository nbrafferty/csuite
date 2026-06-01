"use client";

import { useMemo, useCallback, useState } from "react";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_COLORS,
  COLORS,
  type ProjectStatus,
  type UserRole,
} from "@/lib/tokens";
import { KanbanBoard, type KanbanColumnConfig } from "@/components/kanban/kanban-board";
import { ProjectCard } from "./ProjectCard";
import type { ProjectSummary } from "@/lib/types";
import { trpc } from "@/lib/trpc";

interface ProjectKanbanProps {
  projects: ProjectSummary[];
  isLoading?: boolean;
  userRole: UserRole;
  isAdminView?: boolean;
  showArchived?: boolean;
}

export function ProjectKanban({
  projects,
  isLoading,
  userRole,
  isAdminView,
  showArchived,
}: ProjectKanbanProps) {
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const updateStatus = trpc.projects.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.projects.list.cancel();
      const prev = utils.projects.list.getData({});
      utils.projects.list.setData({}, (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === id ? { ...p, status: status as ProjectStatus } : p));
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.projects.list.setData({}, ctx.prev);
      setErrorToast(`Couldn't move project — ${_err.message || "unknown error"}`);
      setTimeout(() => setErrorToast(null), 5000);
    },
    onSettled: () => {
      utils.projects.list.invalidate();
    },
  });

  const canDrag = userRole !== "CLIENT_USER";

  const columns: KanbanColumnConfig[] = useMemo(() => {
    const statuses = showArchived
      ? PROJECT_STATUSES
      : PROJECT_STATUSES.filter((s) => s !== "ARCHIVED");
    return statuses.map((status) => ({
      id: status,
      label: PROJECT_STATUS_COLORS[status].label,
      color: PROJECT_STATUS_COLORS[status].color,
      bg: PROJECT_STATUS_COLORS[status].bg,
    }));
  }, [showArchived]);

  const items = useMemo(() => {
    const grouped: Record<string, ProjectSummary[]> = {};
    for (const col of columns) {
      grouped[col.id] = projects.filter((p) => p.status === col.id);
    }
    return grouped;
  }, [projects, columns]);

  const handleMove = useCallback(
    (projectId: string, _fromColumn: string, toColumn: string) => {
      // Client Users can't drag
      if (userRole === "CLIENT_USER") return;
      // Client Admins can't set ARCHIVED
      if (userRole === "CLIENT_ADMIN" && toColumn === "ARCHIVED") {
        setErrorToast("Only staff can archive projects");
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }

      updateStatus.mutate({
        id: projectId,
        status: toColumn as "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED",
      });
    },
    [userRole, updateStatus]
  );

  const renderCard = useCallback(
    (project: ProjectSummary) => (
      <ProjectCard project={project} variant="kanban" isAdminView={isAdminView} />
    ),
    [isAdminView]
  );

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex w-72 shrink-0 flex-col rounded-lg border"
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.cardBorder }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b"
              style={{ borderColor: COLORS.cardBorder }}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-xs font-medium" style={{ color: col.color }}>{col.label}</span>
              </div>
            </div>
            <div className="space-y-2 p-2">
              <div className="h-24 animate-pulse rounded-lg" style={{ backgroundColor: COLORS.card }} />
              <div className="h-24 animate-pulse rounded-lg" style={{ backgroundColor: COLORS.card }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <KanbanBoard<ProjectSummary>
        columns={columns}
        items={items}
        renderCard={renderCard}
        onMove={handleMove}
        disabled={!canDrag}
        columnWidth="18rem"
        emptyLabel="No projects"
      />

      {errorToast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg"
          style={{ backgroundColor: COLORS.card, borderColor: "#da524540", color: COLORS.textPrimary }}
        >
          <span className="text-sm">{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="text-xs" style={{ color: COLORS.textMuted }}>
            x
          </button>
        </div>
      )}
    </>
  );
}
