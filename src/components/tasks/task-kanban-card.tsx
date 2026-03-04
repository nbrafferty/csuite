"use client";

import { TaskPriorityBadge } from "./task-priority-badge";
import { Calendar, Link as LinkIcon, Archive } from "lucide-react";
import { COLORS } from "@/lib/tokens";

interface TaskKanbanCardProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | Date | null;
    visibility: string;
    order?: { id: string; number: string; title: string } | null;
    assignees: Array<{
      user: { id: string; name: string | null; role: string };
    }>;
  };
  onSelect: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function TaskKanbanCard({ task, onSelect, onArchive }: TaskKanbanCardProps) {
  const isDone = task.status === "DONE";
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onSelect(task.id)}
      className="group rounded-lg border p-3 transition-all"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.cardBorder,
        cursor: "grab",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorder;
      }}
    >
      {/* Title + Priority */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className={`text-sm font-medium leading-snug ${
            isDone ? "line-through" : ""
          }`}
          style={{ color: isDone ? COLORS.textSecondary : COLORS.textPrimary }}
        >
          {task.title}
        </span>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2.5 flex-wrap text-[11px]" style={{ color: COLORS.textSecondary }}>
        {task.order && (
          <span className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            {task.order.number}
          </span>
        )}
        {task.dueDate && (
          <span
            className="flex items-center gap-1"
            style={{ color: isOverdue ? COLORS.coral : undefined }}
          >
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {task.visibility === "INTERNAL" && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
            style={{ backgroundColor: COLORS.purpleDim, color: COLORS.purple }}
          >
            Internal
          </span>
        )}
      </div>

      {/* Assignees + Archive action */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a) => (
            <span
              key={a.user.id}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold border"
              style={{
                backgroundColor: COLORS.coralDim,
                color: COLORS.coral,
                borderColor: COLORS.card,
              }}
              title={a.user.name ?? ""}
            >
              {a.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          ))}
          {task.assignees.length > 3 && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] border"
              style={{ backgroundColor: COLORS.surface, borderColor: COLORS.card, color: COLORS.textSecondary }}
            >
              +{task.assignees.length - 3}
            </span>
          )}
        </div>

        {isDone && onArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(task.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300"
            title="Archive"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
