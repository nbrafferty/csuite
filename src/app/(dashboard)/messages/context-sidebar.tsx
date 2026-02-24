"use client";

import { cn } from "@/lib/utils";
import { Package, UserCircle, Users, Tag } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "waiting_on_client", label: "Waiting on Client" },
  { value: "waiting_on_ccc", label: "Waiting on CCC" },
  { value: "resolved", label: "Resolved" },
] as const;

type Participant = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

type ThreadDetail = {
  id: string;
  subject: string;
  status: string;
  orderTitle: string | null;
  company: { name: string; slug: string };
  creator: { id: string; name: string; email: string; role: string };
  assignee: { id: string; name: string; email: string } | null;
};

interface ContextSidebarProps {
  thread: ThreadDetail;
  participants: Participant[];
  onStatusChange: (status: string) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  isStaff: boolean;
  staffMembers: Participant[];
}

export function ContextSidebar({
  thread,
  participants,
  onStatusChange,
  onAssigneeChange,
  isStaff,
  staffMembers,
}: ContextSidebarProps) {
  return (
    <div
      className="flex h-full flex-col overflow-y-auto border-l border-surface-border bg-surface-bg"
      style={{ width: 300 }}
    >
      {/* Linked Order */}
      {thread.orderTitle && (
        <div className="border-b border-surface-border p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Package className="h-3.5 w-3.5" />
            Linked Order
          </div>
          <div className="rounded-lg border border-surface-border bg-surface-card p-3">
            <p className="text-sm font-medium text-white">{thread.orderTitle}</p>
            <p className="mt-0.5 text-xs text-gray-500">{thread.company.name}</p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="border-b border-surface-border p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <Tag className="h-3.5 w-3.5" />
          Status
        </div>
        {isStaff ? (
          <select
            value={thread.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-block rounded-full bg-surface-card px-3 py-1 text-sm text-gray-300">
            {STATUS_OPTIONS.find((s) => s.value === thread.status)?.label ?? thread.status}
          </span>
        )}
      </div>

      {/* Assignee */}
      <div className="border-b border-surface-border p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <UserCircle className="h-3.5 w-3.5" />
          Assigned To
        </div>
        {isStaff ? (
          <select
            value={thread.assignee?.id ?? ""}
            onChange={(e) => onAssigneeChange(e.target.value || null)}
            className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          >
            <option value="">Unassigned</option>
            {staffMembers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-300">
            {thread.assignee?.name ?? "Unassigned"}
          </p>
        )}
      </div>

      {/* Client Info */}
      <div className="border-b border-surface-border p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <UserCircle className="h-3.5 w-3.5" />
          Client
        </div>
        <p className="text-sm font-medium text-white">{thread.company.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Created by {thread.creator.name} ({thread.creator.email})
        </p>
      </div>

      {/* Participants */}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <Users className="h-3.5 w-3.5" />
          Participants
        </div>
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-card text-xs font-medium text-gray-300">
                {p.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{p.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {p.role === "CCC_STAFF" ? "Staff" : p.role === "CLIENT_ADMIN" ? "Admin" : "User"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
