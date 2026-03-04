"use client";

import { COLORS } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { TaskKanbanCard } from "./task-kanban-card";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  sortOrder?: number;
  dueDate: string | Date | null;
  visibility: string;
  order?: { id: string; number: string; title: string } | null;
  assignees: Array<{
    user: { id: string; name: string | null; role: string };
  }>;
};

const COLUMNS = [
  { status: "TODO", label: "To Do", color: COLORS.blue, bg: COLORS.blueDim },
  { status: "IN_PROGRESS", label: "In Progress", color: COLORS.yellow, bg: COLORS.yellowDim },
  { status: "DONE", label: "Done", color: COLORS.green, bg: COLORS.greenDim },
] as const;

interface TaskKanbanProps {
  tasks: Task[];
  onSelect: (id: string) => void;
}

export function TaskKanban({ tasks, onSelect }: TaskKanbanProps) {
  const utils = trpc.useUtils();

  const reorderMutation = trpc.task.reorder.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const archiveMutation = trpc.task.archive.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const grouped = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.status),
  }));

  const handleDrop = (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const targetColumnTasks = tasks.filter((t) => t.status === newStatus);
    const payload = [
      ...targetColumnTasks.map((t, i) => ({
        id: t.id,
        sortOrder: i,
        status: newStatus as "TODO" | "IN_PROGRESS" | "DONE",
      })),
      {
        id: taskId,
        sortOrder: targetColumnTasks.length,
        status: newStatus as "TODO" | "IN_PROGRESS" | "DONE",
      },
    ];

    reorderMutation.mutate({ tasks: payload });
  };

  const handleArchive = (taskId: string) => {
    archiveMutation.mutate({ id: taskId });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {grouped.map((col) => (
        <div
          key={col.status}
          className="flex w-80 shrink-0 flex-col rounded-lg border transition-all"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.cardBorder,
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = col.color;
            e.currentTarget.style.boxShadow = `0 0 12px ${col.color}30`;
            e.currentTarget.style.backgroundColor = `${col.color}08`;
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.backgroundColor = COLORS.surface;
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = COLORS.cardBorder;
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.backgroundColor = COLORS.surface;
            const taskId = e.dataTransfer.getData("taskId");
            if (taskId) handleDrop(taskId, col.status);
          }}
        >
          {/* Column header */}
          <div
            className="flex items-center justify-between px-3 py-2.5 border-b"
            style={{ borderColor: COLORS.cardBorder }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <span className="text-xs font-medium" style={{ color: col.color }}>
                {col.label}
              </span>
            </div>
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium"
              style={{ backgroundColor: col.bg, color: col.color }}
            >
              {col.tasks.length}
            </span>
          </div>

          {/* Cards */}
          <div
            className="relative flex-1 space-y-2 overflow-y-auto p-2"
            style={{ maxHeight: "calc(100vh - 280px)", minHeight: 80 }}
          >
            {col.tasks.map((task) => (
              <TaskKanbanCard
                key={task.id}
                task={task}
                onSelect={onSelect}
                onArchive={col.status === "DONE" ? handleArchive : undefined}
              />
            ))}

            {col.tasks.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                  No tasks
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
