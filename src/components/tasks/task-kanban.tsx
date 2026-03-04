"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { COLORS } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { TaskKanbanCard } from "./task-kanban-card";
import { TaskPriorityBadge } from "./task-priority-badge";
import { Calendar, Link as LinkIcon } from "lucide-react";

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
  { id: "TODO", label: "To Do", color: COLORS.blue, dimColor: COLORS.blueDim },
  { id: "IN_PROGRESS", label: "In Progress", color: COLORS.yellow, dimColor: COLORS.yellowDim },
  { id: "DONE", label: "Done", color: COLORS.green, dimColor: COLORS.greenDim },
] as const;

interface TaskKanbanProps {
  tasks: Task[];
  onSelect: (id: string) => void;
}

function KanbanColumn({
  status,
  label,
  color,
  dimColor,
  tasks,
  isDragging,
  activeId,
  onSelect,
  onArchive,
}: {
  status: string;
  label: string;
  color: string;
  dimColor: string;
  tasks: Task[];
  isDragging: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const isHighlighted = isDragging && isOver;
  const isDimmed = isDragging && !isOver;

  return (
    <div
      ref={setNodeRef}
      className="flex w-80 shrink-0 flex-col rounded-lg border transition-all"
      style={{
        backgroundColor: isHighlighted ? `${color}08` : COLORS.surface,
        borderColor: isHighlighted ? color : COLORS.cardBorder,
        opacity: isDimmed ? 0.6 : 1,
        boxShadow: isHighlighted ? `0 0 12px ${color}30` : undefined,
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
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium" style={{ color }}>
            {label}
          </span>
        </div>
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium"
          style={{ backgroundColor: dimColor, color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Card list */}
      <div
        className="relative flex-1 space-y-2 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 280px)", minHeight: 80 }}
      >
        {tasks.length === 0 ? (
          isDragging ? (
            <div
              className="flex items-center justify-center rounded-lg border-2 border-dashed p-6"
              style={{
                borderColor: `${color}66`,
                backgroundColor: `${color}08`,
              }}
            >
              <span className="text-xs font-medium" style={{ color }}>
                Drop here
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                No tasks
              </span>
            </div>
          )
        ) : (
          tasks.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              onSelect={onSelect}
              onArchive={status === "DONE" ? onArchive : undefined}
            />
          ))
        )}

        {/* Bottom fade */}
        {tasks.length > 4 && (
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

export function TaskKanban({ tasks, onSelect }: TaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const reorderMutation = trpc.task.reorder.useMutation({
    onSettled: () => {
      utils.task.list.invalidate();
    },
  });

  const archiveMutation = trpc.task.archive.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status
  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  const getColumnTasks = (status: string): Task[] => {
    switch (status) {
      case "TODO": return todoTasks;
      case "IN_PROGRESS": return inProgressTasks;
      case "DONE": return doneTasks;
      default: return [];
    }
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = (event.active.data.current as any)?.task as Task | undefined;
      if (!task) return;
      setActiveId(task.id);
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const task = (active.data.current as any)?.task as Task | undefined;
      const targetStatus = (over.data.current as any)?.status as string | undefined;

      if (!task || !targetStatus) return;
      if (task.status === targetStatus) return;

      // Build payload: move task to new column, assign sortOrder
      const targetColumnTasks = getColumnTasks(targetStatus);
      const payload: Array<{
        id: string;
        sortOrder: number;
        status: "TODO" | "IN_PROGRESS" | "DONE";
      }> = [];

      // Add the moved task at the end of the target column
      for (let i = 0; i < targetColumnTasks.length; i++) {
        payload.push({
          id: targetColumnTasks[i].id,
          sortOrder: i,
          status: targetStatus as "TODO" | "IN_PROGRESS" | "DONE",
        });
      }
      payload.push({
        id: task.id,
        sortOrder: targetColumnTasks.length,
        status: targetStatus as "TODO" | "IN_PROGRESS" | "DONE",
      });

      reorderMutation.mutate({ tasks: payload });
    },
    [tasks, reorderMutation]
  );

  const handleArchive = useCallback(
    (taskId: string) => {
      archiveMutation.mutate({ id: taskId });
    },
    [archiveMutation]
  );

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            label={col.label}
            color={col.color}
            dimColor={col.dimColor}
            tasks={getColumnTasks(col.id)}
            isDragging={!!activeId}
            activeId={activeId}
            onSelect={onSelect}
            onArchive={handleArchive}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div
            className="rounded-lg border p-3 shadow-2xl rotate-2"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.coral,
              width: 304,
              opacity: 0.95,
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span
                className="text-sm font-medium"
                style={{ color: COLORS.textPrimary }}
              >
                {activeTask.title}
              </span>
              <TaskPriorityBadge priority={activeTask.priority} />
            </div>
            <div className="flex items-center gap-2.5 text-[11px]" style={{ color: COLORS.textSecondary }}>
              {activeTask.order && (
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {activeTask.order.number}
                </span>
              )}
              {activeTask.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(activeTask.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
