"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, MoreHorizontal, Eye, EyeOff, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-teal-400",
  "from-violet-500 to-fuchsia-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-cyan-400",
  "from-rose-500 to-pink-400",
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
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
  resolved: { label: "Resolved", className: "bg-gray-500/20 text-foreground-secondary" },
};

type Thread = {
  id: string;
  subject: string;
  status: string;
  updatedAt: Date;
  isUnread: boolean;
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
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onMarkAllRead: () => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
}: ThreadListProps) {
  const [menuThreadId, setMenuThreadId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuThreadId(null);
      }
    };
    if (menuThreadId) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [menuThreadId]);

  const unreadCount = threads.filter((t) => t.isUnread).length;
  return (
    <div className="flex h-full flex-col border-r border-surface-border" style={{ width: 380 }}>
      {/* Search */}
      <div className="border-b border-surface-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search threads..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg py-2 pl-10 pr-3 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-border px-3 py-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onStatusFilterChange(f.value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-coral text-white"
                : "bg-surface-card text-foreground-secondary hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="ml-auto flex items-center gap-1 text-xs text-foreground-muted transition-colors hover:text-coral"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Thread items */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-foreground-muted">
            No threads found.
          </div>
        )}
        {threads.map((thread) => {
          const lastMessage = thread.messages[0];
          const badge = STATUS_BADGE[thread.status] ?? STATUS_BADGE.open;
          const isSelected = selectedThreadId === thread.id;
          const isMenuOpen = menuThreadId === thread.id;

          return (
            <div key={thread.id} className="relative">
              <button
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "w-full border-b border-surface-border px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "bg-surface-card"
                    : "hover:bg-surface-card/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Company avatar */}
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
                      AVATAR_GRADIENTS[hashStr(thread.company.name) % AVATAR_GRADIENTS.length]
                    )}
                  >
                    {getInitials(thread.company.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {thread.isUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-coral" />
                          )}
                          <span
                            className={cn(
                              "truncate text-sm",
                              thread.isUnread
                                ? "font-semibold text-foreground"
                                : "font-normal text-foreground-secondary"
                            )}
                          >
                            {thread.subject}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 text-xs",
                            thread.isUnread ? "text-foreground" : "text-foreground-secondary"
                          )}
                        >
                          {thread.company.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-xs text-foreground-muted">
                          {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuThreadId(isMenuOpen ? null : thread.id);
                          }}
                          className="rounded p-0.5 text-foreground-muted transition-colors hover:bg-surface-border hover:text-foreground-secondary"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {lastMessage && (
                      <p
                        className={cn(
                          "mt-1.5 truncate text-xs",
                          thread.isUnread ? "text-foreground-secondary" : "text-foreground-muted"
                        )}
                      >
                        {lastMessage.body}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-foreground-muted">
                        {thread._count.messages} message{thread._count.messages !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Context menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-3 top-8 z-10 w-44 rounded-lg border border-surface-border bg-surface-card py-1 shadow-lg"
                >
                  {thread.isUnread ? (
                    <button
                      onClick={() => {
                        onMarkRead(thread.id);
                        setMenuThreadId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground-secondary hover:bg-surface-border hover:text-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Mark as Read
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onMarkUnread(thread.id);
                        setMenuThreadId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground-secondary hover:bg-surface-border hover:text-foreground"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Mark as Unread
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
