"use client";

import { trpc } from "@/lib/trpc";
import { TaskPriorityBadge } from "./task-priority-badge";
import { Calendar, Link as LinkIcon } from "lucide-react";

interface TaskRowProps {
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
}

export function TaskRow({ task, onSelect }: TaskRowProps) {
  const utils = trpc.useUtils();

  const toggleMutation = trpc.task.toggleDone.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      utils.task.listByOrder.invalidate();
    },
  });

  const isDone = task.status === "DONE";
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date();

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-surface-border bg-surface-card px-4 py-3 transition-colors hover:border-foreground-muted cursor-pointer"
      onClick={() => onSelect(task.id)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMutation.mutate({ id: task.id });
        }}
        disabled={toggleMutation.isPending}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          isDone
            ? "border-green-500 bg-green-500/20 text-green-400"
            : "border-gray-600 hover:border-coral"
        }`}
      >
        {isDone && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${
              isDone ? "text-gray-500 line-through" : "text-white"
            }`}
          >
            {task.title}
          </span>
          <TaskPriorityBadge priority={task.priority} />
          {task.visibility === "INTERNAL" && (
            <span className="rounded-full bg-purple-400/10 px-1.5 py-0.5 text-[9px] font-medium text-purple-400">
              Internal
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
          {task.order && (
            <span className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              {task.order.number}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {task.assignees.length > 0 && (
            <span>
              {task.assignees.map((a) => a.user.name?.split(" ")[0]).join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
