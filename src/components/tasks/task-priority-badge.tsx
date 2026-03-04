import { cn } from "@/lib/utils";

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-red-400/10 text-red-400" },
  MEDIUM: { label: "Medium", className: "bg-yellow-400/10 text-yellow-400" },
  LOW: { label: "Low", className: "bg-gray-400/10 text-gray-400" },
};

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
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
