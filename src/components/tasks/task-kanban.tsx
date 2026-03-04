"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
  pointerWithin,
  getFirstCollision,
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

type ColumnId = (typeof COLUMNS)[number]["id"];

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
  isDragging,
  isOver,
  onSelect,
  onArchive,
}: {
  columnId: string;
  label: string;
  color: string;
  dimColor: string;
  tasks: Task[];
  isDragging: boolean;
  isOver: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: columnId,
    data: { type: "column", status: columnId },
  });

  const isHighlighted = isDragging && isOver;

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
  // Use a map of column -> ordered task IDs for local state
  const [columns, setColumns] = useState<Record<string, Task[]>>(() =>
    buildColumns(tasks)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const lastOverIdRef = useRef<string | null>(null);

  // Sync from server when not dragging
  useEffect(() => {
    if (!activeId) {
      setColumns(buildColumns(tasks));
    }
  }, [tasks, activeId]);

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

  function buildColumns(taskList: Task[]): Record<string, Task[]> {
    const result: Record<string, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const t of taskList) {
      if (result[t.status]) {
        result[t.status].push(t);
      }
    }
    return result;
  }

  function findColumn(taskId: string): string | null {
    for (const [col, colTasks] of Object.entries(columns)) {
      if (colTasks.some((t) => t.id === taskId)) return col;
    }
    return null;
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) {
        setOverColumnId(null);
        return;
      }

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      // Find the source column of the dragged task
      const sourceCol = findColumn(activeTaskId);
      if (!sourceCol) return;

      // Determine target column: either directly a column, or the column of the hovered task
      let targetCol: string | null = null;
      if (COLUMNS.some((c) => c.id === overId)) {
        targetCol = overId;
      } else {
        targetCol = findColumn(overId);
      }

      if (!targetCol) return;
      setOverColumnId(targetCol);

      // If same column, no cross-column move needed (sortable handles reorder)
      if (sourceCol === targetCol) return;

      // Move the task from source to target column optimistically
      setColumns((prev) => {
        const sourceTasks = [...prev[sourceCol]];
        const targetTasks = [...prev[targetCol!]];

        const taskIndex = sourceTasks.findIndex((t) => t.id === activeTaskId);
        if (taskIndex === -1) return prev;

        const [movedTask] = sourceTasks.splice(taskIndex, 1);
        const updatedTask = { ...movedTask, status: targetCol! };

        // Insert at the position of the hovered task, or at end
        const overIndex = targetTasks.findIndex((t) => t.id === overId);
        if (overIndex !== -1) {
          targetTasks.splice(overIndex, 0, updatedTask);
        } else {
          targetTasks.push(updatedTask);
        }

        return {
          ...prev,
          [sourceCol]: sourceTasks,
          [targetCol!]: targetTasks,
        };
      });
    },
    [columns]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverColumnId(null);

      if (!over) return;

      const activeTaskId = active.id as string;
      const overId = over.id as string;

      const activeCol = findColumn(activeTaskId);
      if (!activeCol) return;

      // Handle reorder within same column
      let targetCol: string | null = null;
      if (COLUMNS.some((c) => c.id === overId)) {
        targetCol = overId;
      } else {
        targetCol = findColumn(overId);
      }

      if (!targetCol) return;

      if (activeCol === targetCol && overId !== activeTaskId && !COLUMNS.some((c) => c.id === overId)) {
        // Reorder within same column
        setColumns((prev) => {
          const colTasks = [...prev[activeCol]];
          const oldIndex = colTasks.findIndex((t) => t.id === activeTaskId);
          const newIndex = colTasks.findIndex((t) => t.id === overId);
          if (oldIndex === -1 || newIndex === -1) return prev;

          const reordered = arrayMove(colTasks, oldIndex, newIndex);
          return { ...prev, [activeCol]: reordered };
        });
      }

      // Persist all positions for the affected column(s)
      // Use a setTimeout to ensure state has settled
      setTimeout(() => {
        setColumns((current) => {
          const affectedCols: string[] = [activeCol];
          if (targetCol && targetCol !== activeCol) affectedCols.push(targetCol);

          const reorderPayload: Array<{
            id: string;
            sortOrder: number;
            status: "TODO" | "IN_PROGRESS" | "DONE";
          }> = [];

          for (const col of affectedCols) {
            const colTasks = current[col] ?? [];
            for (let i = 0; i < colTasks.length; i++) {
              reorderPayload.push({
                id: colTasks[i].id,
                sortOrder: i,
                status: col as "TODO" | "IN_PROGRESS" | "DONE",
              });
            }
          }

          if (reorderPayload.length > 0) {
            reorderMutation.mutate({ tasks: reorderPayload });
          }

          return current;
        });
      }, 0);
    },
    [columns, reorderMutation]
  );

  const handleArchive = useCallback(
    (taskId: string) => {
      setColumns((prev) => {
        const updated: Record<string, Task[]> = {};
        for (const [col, colTasks] of Object.entries(prev)) {
          updated[col] = colTasks.filter((t) => t.id !== taskId);
        }
        return updated;
      });
      archiveMutation.mutate({ id: taskId });
    },
    [archiveMutation]
  );

  const allTasks = Object.values(columns).flat();
  const activeTask = activeId
    ? allTasks.find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
            tasks={columns[col.id] ?? []}
            isDragging={!!activeId}
            isOver={overColumnId === col.id}
            onSelect={onSelect}
            onArchive={handleArchive}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div
            className="rounded-lg border p-3 shadow-2xl rotate-1"
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
            </div>
            {activeTask.order && (
              <span className="text-[11px]" style={{ color: COLORS.textSecondary }}>
                {activeTask.order.number}
              </span>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
