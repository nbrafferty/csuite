"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { X, MessageSquare, ShoppingCart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-teal-400",
  "from-violet-500 to-fuchsia-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-cyan-400",
  "from-rose-500 to-pink-400",
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/20 text-[#34C759]" },
  paused: { label: "Paused", className: "bg-yellow-500/20 text-[#FFD60A]" },
  overdue: { label: "Overdue", className: "bg-red-500/20 text-[#E85D5D]" },
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  CLIENT_ADMIN: { label: "Admin", className: "bg-purple-500/20 text-[#A78BFA]" },
  CLIENT_USER: { label: "User", className: "bg-gray-500/20 text-gray-400" },
};

interface ClientDetailPanelProps {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDetailPanel({ clientId, onClose }: ClientDetailPanelProps) {
  const { data: client } = trpc.client.get.useQuery(
    { id: clientId! },
    { enabled: !!clientId }
  );

  const [notes, setNotes] = useState("");
  const notesInitialized = useRef(false);

  useEffect(() => {
    if (client?.notes !== undefined && !notesInitialized.current) {
      setNotes(client.notes ?? "");
      notesInitialized.current = true;
    }
  }, [client?.notes]);

  // Reset when panel changes client
  useEffect(() => {
    notesInitialized.current = false;
  }, [clientId]);

  const utils = trpc.useUtils();

  const updateNotes = trpc.client.updateNotes.useMutation({
    onSuccess: () => utils.client.get.invalidate({ id: clientId! }),
  });

  const updateStatus = trpc.client.updateStatus.useMutation({
    onSuccess: () => {
      utils.client.get.invalidate({ id: clientId! });
      utils.client.list.invalidate();
    },
  });

  const isOpen = !!clientId;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[400px] border-l border-[#333338] bg-[#0D0D0F] transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {client && (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-[#333338] p-6">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white",
                AVATAR_GRADIENTS[hashStr(client.name) % AVATAR_GRADIENTS.length]
              )}>
                {client.name[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white">{client.name}</h2>
                <span className={cn(
                  "mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-medium",
                  (STATUS_BADGE[client.status] ?? STATUS_BADGE.active).className
                )}>
                  {(STATUS_BADGE[client.status] ?? STATUS_BADGE.active).label}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-[#22222A] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="border-b border-[#333338] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Overview</h3>
              <div className="space-y-2.5">
                {client.primaryContact && (
                  <div>
                    <p className="text-xs text-gray-500">Primary Contact</p>
                    <p className="text-sm text-white">{client.primaryContact.name}</p>
                    <p className="text-xs text-gray-400">{client.primaryContact.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-white">{client.phone}</p>
                  </div>
                )}
                {client.address && (
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-white">{client.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Account Created</p>
                  <p className="text-sm text-white">
                    {new Date(client.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="border-b border-[#333338] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Activity Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#333338] bg-[#22222A] p-3 text-center">
                  <p className="text-xl font-bold text-white">{client.activeOrders}</p>
                  <p className="text-[10px] text-gray-500">Active Orders</p>
                </div>
                <div className="rounded-lg border border-[#333338] bg-[#22222A] p-3 text-center">
                  <p className="text-xl font-bold text-white">${(client.revenue / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-gray-500">Revenue</p>
                </div>
                <div className="rounded-lg border border-[#333338] bg-[#22222A] p-3 text-center">
                  <p className="text-xl font-bold text-white">{client.userCount}</p>
                  <p className="text-[10px] text-gray-500">Users</p>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="border-b border-[#333338] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Team Members</h3>
              <div className="space-y-2">
                {client.users.map((user) => {
                  const roleBadge = ROLE_BADGE[user.role] ?? ROLE_BADGE.CLIENT_USER;
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{user.name}</p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", roleBadge.className)}>
                        {roleBadge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="border-b border-[#333338] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Internal Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (clientId && notes !== (client.notes ?? "")) {
                    updateNotes.mutate({ id: clientId, notes });
                  }
                }}
                rows={4}
                placeholder="Add internal notes about this client..."
                className="w-full resize-none rounded-lg border border-[#333338] bg-[#1A1A1E] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
              />
            </div>

            {/* Quick Actions */}
            <div className="p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Quick Actions</h3>
              <div className="space-y-2">
                <div>
                  <label className="mb-1.5 block text-xs text-gray-500">Change Status</label>
                  <select
                    value={client.status}
                    onChange={(e) => {
                      if (clientId) {
                        updateStatus.mutate({
                          id: clientId,
                          status: e.target.value as "active" | "paused" | "overdue",
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-[#333338] bg-[#1A1A1E] px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#333338] bg-[#22222A] px-4 py-2.5 text-sm text-gray-400 opacity-50 cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Orders
                </button>
                <Link
                  href="/messages"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#333338] bg-[#22222A] px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-[rgba(255,255,255,0.03)] hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
