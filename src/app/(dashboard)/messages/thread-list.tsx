"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Waiting on Client", value: "waiting_on_client" },
  { label: "Waiting on CCC", value: "waiting_on_ccc" },
  { label: "Resolved", value: "resolved" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-green-500/20 text-green-400" },
  waiting_on_client: { label: "Waiting on Client", className: "bg-yellow-500/20 text-yellow-400" },
  waiting_on_ccc: { label: "Waiting on CCC", className: "bg-blue-500/20 text-blue-400" },
  resolved: { label: "Resolved", className: "bg-gray-500/20 text-gray-400" },
};

type Thread = {
  id: string;
  subject: string;
  status: string;
  updatedAt: Date;
  company: { name: string };
  creator: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  messages: { body: string; createdAt: Date; senderType: string; authorId: string }[];
  _count: { messages: number };
};

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
}: ThreadListProps) {
  return (
    <div className="flex h-full flex-col border-r border-surface-border" style={{ width: 380 }}>
      {/* Search */}
      <div className="border-b border-surface-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search threads..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5 border-b border-surface-border px-3 py-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onStatusFilterChange(f.value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-coral text-white"
                : "bg-surface-card text-gray-400 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Thread items */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No threads found.
          </div>
        )}
        {threads.map((thread) => {
          const lastMessage = thread.messages[0];
          const badge = STATUS_BADGE[thread.status] ?? STATUS_BADGE.open;
          const isSelected = selectedThreadId === thread.id;

          return (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                "w-full border-b border-surface-border px-4 py-3 text-left transition-colors",
                isSelected
                  ? "bg-surface-card"
                  : "hover:bg-surface-card/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {thread.subject}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{thread.company.name}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                </span>
              </div>

              {lastMessage && (
                <p className="mt-1.5 truncate text-xs text-gray-400">
                  {lastMessage.body}
                </p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                  {badge.label}
                </span>
                <span className="text-[10px] text-gray-500">
                  {thread._count.messages} message{thread._count.messages !== 1 ? "s" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
