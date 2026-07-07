import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  TODO: { label: "To Do", className: "bg-blue-400/10 text-blue-400" },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-yellow-400/10 text-yellow-400",
  },
  DONE: { label: "Done", className: "bg-green-400/10 text-green-400" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
