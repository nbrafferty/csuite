"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { COLORS } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { TaskKanbanCard } from "./task-kanban-card";
import { Archive } from "lucide-react";

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

function DroppableColumn({
  columnId,
  label,
  color,
  dimColor,
  tasks,
  activeId,
  onSelect,
  onArchive,
}: {
  columnId: string;
  label: string;
  color: string;
  dimColor: string;
  tasks: Task[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${columnId}`,
    data: { status: columnId },
  });

  const isHighlighted = activeId && isOver;

  return (
    <div
      ref={setNodeRef}
      className="flex w-80 shrink-0 flex-col rounded-lg border transition-all"
      style={{
        backgroundColor: isHighlighted ? `${color}08` : COLORS.surface,
        borderColor: isHighlighted ? color : COLORS.cardBorder,
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
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="flex-1 space-y-2 overflow-y-auto p-2"
          style={{ maxHeight: "calc(100vh - 280px)", minHeight: 80 }}
        >
          {tasks.length === 0 ? (
            activeId ? (
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
                onArchive={columnId === "DONE" ? onArchive : undefined}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskKanban({ tasks, onSelect }: TaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Keep local state synced when server data changes
  // but only if we're not actively dragging
  if (!activeId && tasks !== localTasks) {
    const taskIds = tasks.map((t) => t.id).join(",");
    const localIds = localTasks.map((t) => t.id).join(",");
    const taskStatuses = tasks.map((t) => `${t.id}:${t.status}`).join(",");
    const localStatuses = localTasks.map((t) => `${t.id}:${t.status}`).join(",");
    if (taskIds !== localIds || taskStatuses !== localStatuses) {
      setLocalTasks(tasks);
    }
  }

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

  const todoTasks = localTasks.filter((t) => t.status === "TODO");
  const inProgressTasks = localTasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = localTasks.filter((t) => t.status === "DONE");

  const getColumnTasks = (status: string): Task[] => {
    switch (status) {
      case "TODO": return todoTasks;
      case "IN_PROGRESS": return inProgressTasks;
      case "DONE": return doneTasks;
      default: return [];
    }
  };

  const findTaskColumn = (taskId: string): string | null => {
    const task = localTasks.find((t) => t.id === taskId);
    return task?.status ?? null;
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      // Determine target column
      let targetStatus: string | null = null;
      if (overId.startsWith("column-")) {
        targetStatus = overId.replace("column-", "");
      } else {
        // Dropped over another task — find that task's column
        targetStatus = findTaskColumn(overId);
      }

      if (!targetStatus) return;

      const currentStatus = findTaskColumn(activeTaskId);
      if (currentStatus === targetStatus) return;

      // Move task to new column (optimistic)
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, status: targetStatus! } : t
        )
      );
    },
    [localTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      // Determine final column
      let targetStatus: string | null = null;
      if (overId.startsWith("column-")) {
        targetStatus = overId.replace("column-", "");
      } else {
        targetStatus = findTaskColumn(overId);
      }

      if (!targetStatus) return;

      // Build reorder payload for the target column
      const columnTasks = localTasks
        .filter((t) => t.status === targetStatus)
        .map((t, i) => ({
          id: t.id,
          sortOrder: i,
          status: targetStatus as "TODO" | "IN_PROGRESS" | "DONE",
        }));

      // Handle reorder within same column
      if (overId !== activeTaskId && !overId.startsWith("column-")) {
        const oldIndex = columnTasks.findIndex((t) => t.id === activeTaskId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnTasks, oldIndex, newIndex).map(
            (t, i) => ({ ...t, sortOrder: i })
          );
          setLocalTasks((prev) => {
            const others = prev.filter((t) => t.status !== targetStatus);
            const updated = reordered.map((r) => {
              const original = prev.find((t) => t.id === r.id)!;
              return { ...original, sortOrder: r.sortOrder };
            });
            return [...others, ...updated];
          });
          reorderMutation.mutate({ tasks: reordered });
          return;
        }
      }

      // Persist the column move
      reorderMutation.mutate({ tasks: columnTasks });
    },
    [localTasks, reorderMutation]
  );

  const handleArchive = useCallback(
    (taskId: string) => {
      setLocalTasks((prev) => prev.filter((t) => t.id !== taskId));
      archiveMutation.mutate({ id: taskId });
    },
    [archiveMutation]
  );

  const activeTask = activeId
    ? localTasks.find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            color={col.color}
            dimColor={col.dimColor}
            tasks={getColumnTasks(col.id)}
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
              width: 320,
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.textPrimary }}
            >
              {activeTask.title}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
