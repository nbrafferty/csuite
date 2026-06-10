"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TaskRow } from "@/components/tasks/task-row";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";

interface OrderTasksTabProps {
  orderId: string;
  isStaff: boolean;
}

export function OrderTasksTab({ orderId, isStaff }: OrderTasksTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasks, isLoading } = trpc.task.listByOrder.useQuery(
    { orderId },
    { refetchInterval: 15_000 }
  );

  const allTasks = tasks ?? [];
  const todoTasks = allTasks.filter((t: any) => t.status === "TODO");
  const inProgressTasks = allTasks.filter(
    (t: any) => t.status === "IN_PROGRESS"
  );
  const doneTasks = allTasks.filter((t: any) => t.status === "DONE");

  const groups = [
    { label: "To Do", tasks: todoTasks, color: "text-blue-400" },
    { label: "In Progress", tasks: inProgressTasks, color: "text-yellow-400" },
    { label: "Done", tasks: doneTasks, color: "text-green-400" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Tasks
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-dark transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-surface-border bg-surface-card"
            />
          ))}
        </div>
      ) : allTasks.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
          <p className="text-sm text-gray-500">No tasks for this order yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 text-xs text-coral hover:text-coral-light"
          >
            Create the first task
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groups
            .filter((g) => g.tasks.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h4
                  className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${group.color}`}
                >
                  {group.label}
                  <span className="rounded-full bg-surface-secondary px-1.5 py-0.5 text-[10px] text-gray-500">
                    {group.tasks.length}
                  </span>
                </h4>
                <div className="space-y-1.5">
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

      <TaskCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        orderId={orderId}
      />

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
