"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, ListFilter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { TaskRow } from "@/components/tasks/task-row";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";

type StatusFilter = "" | "TODO" | "IN_PROGRESS" | "DONE";
type PriorityFilter = "" | "HIGH" | "MEDIUM" | "LOW";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export default function TasksPage() {
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("");
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data, isLoading } = trpc.task.list.useQuery(
    {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      search: search || undefined,
    },
    { refetchInterval: 15_000 }
  );

  const tasks = data?.tasks ?? [];

  // Group tasks by status for the grouped view
  const todoTasks = tasks.filter((t: any) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t: any) => t.status === "DONE");

  const groups = [
    { label: "To Do", tasks: todoTasks, color: "text-blue-400" },
    { label: "In Progress", tasks: inProgressTasks, color: "text-yellow-400" },
    { label: "Done", tasks: doneTasks, color: "text-green-400" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            {isStaff ? "Manage all tasks across orders" : "Your assigned tasks"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-surface-border bg-surface-card pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1">
          <ListFilter className="h-4 w-4 text-gray-500 mr-1" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-coral/20 text-coral"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(e.target.value as PriorityFilter)
          }
          className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs text-gray-300 focus:border-coral focus:outline-none"
        >
          <option value="">All Priorities</option>
          {PRIORITY_FILTERS.filter((f) => f.value).map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-surface-border bg-surface-card"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-12 text-center">
          <p className="text-gray-500">No tasks found</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="mt-3 text-sm text-coral hover:text-coral-light"
          >
            Create your first task
          </button>
        </div>
      ) : statusFilter ? (
        // Flat list when filtering by status
        <div className="space-y-2">
          {tasks.map((task: any) => (
            <TaskRow
              key={task.id}
              task={task}
              onSelect={setSelectedTaskId}
            />
          ))}
        </div>
      ) : (
        // Grouped by status
        <div className="space-y-6">
          {groups
            .filter((g) => g.tasks.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h3
                  className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${group.color}`}
                >
                  {group.label}
                  <span className="rounded-full bg-[#22222A] px-1.5 py-0.5 text-[10px] text-gray-500">
                    {group.tasks.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {group.tasks.map((task: any) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onSelect={setSelectedTaskId}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create dialog */}
      <TaskCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Detail panel */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
