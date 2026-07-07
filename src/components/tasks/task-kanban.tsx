"use client";

import { useMemo, useCallback } from "react";
import { COLORS } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { KanbanBoard, type KanbanColumnConfig } from "@/components/kanban/kanban-board";
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

const COLUMNS: KanbanColumnConfig[] = [
  { id: "TODO", label: "To Do", color: COLORS.blue, bg: COLORS.blueDim },
  { id: "IN_PROGRESS", label: "In Progress", color: COLORS.yellow, bg: COLORS.yellowDim },
  { id: "DONE", label: "Done", color: COLORS.green, bg: COLORS.greenDim },
];

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

  const items = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const col of COLUMNS) {
      grouped[col.id] = tasks.filter((t) => t.status === col.id);
    }
    return grouped;
  }, [tasks]);

  const handleMove = useCallback(
    (taskId: string, _fromColumn: string, toColumn: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const targetColumnTasks = tasks.filter(
        (t) => t.status === toColumn && t.id !== taskId
      );
      const payload = [
        ...targetColumnTasks.map((t, i) => ({
          id: t.id,
          sortOrder: i,
          status: toColumn as "TODO" | "IN_PROGRESS" | "DONE",
        })),
        {
          id: taskId,
          sortOrder: targetColumnTasks.length,
          status: toColumn as "TODO" | "IN_PROGRESS" | "DONE",
        },
      ];

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

  const renderCard = useCallback(
    (task: Task, columnId: string) => (
      <TaskKanbanCard
        task={task}
        onSelect={onSelect}
        onArchive={columnId === "DONE" ? handleArchive : undefined}
      />
    ),
    [onSelect, handleArchive]
  );

  return (
    <KanbanBoard<Task>
      columns={COLUMNS}
      items={items}
      renderCard={renderCard}
      onMove={handleMove}
      columnWidth="20rem"
      emptyLabel="No tasks"
    />
  );
}
