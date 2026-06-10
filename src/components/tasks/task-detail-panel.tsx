"use client";

import { useState } from "react";
import { X, Calendar, User, Trash2, Archive } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusBadge } from "./task-status-badge";
import { formatDistanceToNow } from "date-fns";

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
}

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const utils = trpc.useUtils();

  const { data: task, isLoading } = trpc.task.getById.useQuery({ id: taskId });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"HIGH" | "MEDIUM" | "LOW">(
    "MEDIUM"
  );
  const [editDueDate, setEditDueDate] = useState("");

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.getById.invalidate({ id: taskId });
      utils.task.list.invalidate();
      setIsEditing(false);
    },
  });

  const statusMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.getById.invalidate({ id: taskId });
      utils.task.list.invalidate();
    },
  });

  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      onClose();
    },
  });

  const archiveMutation = trpc.task.archive.useMutation({
    onSuccess: () => {
      utils.task.getById.invalidate({ id: taskId });
      utils.task.list.invalidate();
    },
  });

  function startEditing() {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority as "HIGH" | "MEDIUM" | "LOW");
    setEditDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
    );
    setIsEditing(true);
  }

  function handleSave() {
    if (!editTitle.trim()) return;
    updateMutation.mutate({
      id: taskId,
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      priority: editPriority,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
    });
  }

  function handleStatusChange(status: "TODO" | "IN_PROGRESS" | "DONE") {
    statusMutation.mutate({ id: taskId, status });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-surface-border bg-surface-card shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-card px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
          </div>
        ) : !task ? (
          <div className="px-6 py-20 text-center text-gray-500">
            Task not found
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Title + Edit */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Title
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-300">
                      Priority
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) =>
                        setEditPriority(
                          e.target.value as "HIGH" | "MEDIUM" | "LOW"
                        )
                      }
                      className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-300">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold text-white">
                      {task.title}
                    </h3>
                    <button
                      onClick={startEditing}
                      className="shrink-0 text-xs text-coral hover:text-coral-light"
                    >
                      Edit
                    </button>
                  </div>
                  {task.description && (
                    <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-3">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                  {task.visibility === "INTERNAL" && (
                    <span className="rounded-full bg-purple-400/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                      Internal
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Status actions */}
            {!isEditing && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change Status
                </p>
                <div className="flex gap-2">
                  {(["TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={
                        task.status === s || statusMutation.isPending
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        task.status === s
                          ? "bg-coral text-white"
                          : "border border-surface-border text-gray-400 hover:border-gray-500 hover:text-white"
                      } disabled:opacity-50`}
                    >
                      {s === "IN_PROGRESS" ? "In Progress" : s === "TODO" ? "To Do" : "Done"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-3 text-sm">
              {task.dueDate && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span>
                    Due{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}

              {task.order && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="font-mono text-xs text-gray-600">
                    {task.order.number}
                  </span>
                  <span>{task.order.title}</span>
                </div>
              )}

              {task.createdBy && (
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="h-4 w-4 text-gray-600" />
                  <span>Created by {task.createdBy.name}</span>
                  <span className="text-gray-600">
                    {formatDistanceToNow(new Date(task.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Assignees */}
            {task.assignees.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignees
                </p>
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((a: any) => (
                    <span
                      key={a.user.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs text-gray-300"
                    >
                      <span className="h-5 w-5 rounded-full bg-coral/20 text-coral flex items-center justify-center text-[10px] font-bold">
                        {a.user.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </span>
                      {a.user.name}
                      {isStaff && (
                        <span className="text-gray-600 text-[10px]">
                          {a.user.role === "CCC_STAFF" ? "Staff" : "Client"}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-surface-border space-y-2">
              {task.status === "DONE" && (
                <button
                  onClick={() => archiveMutation.mutate({ id: taskId })}
                  disabled={archiveMutation.isPending}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" />
                  {(task as any).archivedAt
                    ? archiveMutation.isPending ? "Unarchiving..." : "Unarchive"
                    : archiveMutation.isPending ? "Archiving..." : "Archive"}
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("Delete this task?")) {
                    deleteMutation.mutate({ id: taskId });
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
