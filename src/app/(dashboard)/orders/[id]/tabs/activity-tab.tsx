"use client";

import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Edit,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";

const ACTION_ICONS: Record<string, any> = {
  CREATED: Plus,
  UPDATED: Edit,
  DELETED: Trash2,
  STATUS_CHANGED: RefreshCw,
};

const ACTION_COLORS: Record<string, string> = {
  CREATED: "bg-blue-500/10 text-blue-400",
  UPDATED: "bg-amber-500/10 text-amber-400",
  DELETED: "bg-red-500/10 text-red-400",
  STATUS_CHANGED: "bg-purple-500/10 text-purple-400",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  READY_FOR_PRODUCTION: "Ready for Production",
  IN_PRODUCTION: "In Production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function OrderActivityTab({ orderId }: { orderId: string }) {
  const { data: events, isLoading } = trpc.order.activity.useQuery(
    { orderId },
    { refetchInterval: 15_000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-16 text-center">
        <p className="text-gray-400">No activity recorded yet</p>
        <p className="mt-1 text-xs text-gray-600">
          Status changes and edits will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card">
      <div className="divide-y divide-surface-border">
        {events.map((event: any) => {
          const Icon = ACTION_ICONS[event.action] ?? RefreshCw;
          const changes = event.changes as any;

          return (
            <div key={event.id} className="flex gap-4 px-6 py-4">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  ACTION_COLORS[event.action] ?? "bg-gray-500/10 text-gray-400"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {event.user?.name ?? "System"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(event.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  {event.action === "STATUS_CHANGED" && changes ? (
                    <span className="flex items-center gap-2">
                      Status changed from{" "}
                      <span className="font-medium text-gray-300">
                        {STATUS_LABELS[changes.from] ?? changes.from}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium text-gray-300">
                        {STATUS_LABELS[changes.to] ?? changes.to}
                      </span>
                    </span>
                  ) : (
                    <span>
                      {event.action.charAt(0) +
                        event.action.slice(1).toLowerCase().replace("_", " ")}
                    </span>
                  )}
                  {changes?.note && (
                    <p className="mt-1 rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-gray-400 italic">
                      {changes.note}
                    </p>
                  )}
                  {changes?.reason && (
                    <p className="mt-1 rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-gray-400 italic">
                      Reason: {changes.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
