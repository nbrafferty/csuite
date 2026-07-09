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
  overdue: { label: "Overdue", className: "bg-red-500/20 text-[#da5245]" },
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  CLIENT_ADMIN: { label: "Admin", className: "bg-purple-500/20 text-[#A78BFA]" },
  CLIENT_USER: { label: "User", className: "bg-gray-500/20 text-foreground-secondary" },
};

const QUOTE_REQUEST_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "New", className: "bg-coral/20 text-coral animate-pulse" },
  IN_REVIEW: { label: "Reviewing", className: "bg-yellow-500/20 text-[#FFD60A]" },
  QUOTED: { label: "Quoted", className: "bg-green-500/20 text-[#34C759]" },
  CLOSED: { label: "Closed", className: "bg-gray-500/20 text-foreground-muted" },
  DECLINED: { label: "Declined", className: "bg-coral/20 text-coral" },
};

const QUOTE_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-500/20 text-foreground-secondary" },
  SENT: { label: "Sent", className: "bg-blue-500/20 text-blue-400" },
  CHANGES_REQUESTED: { label: "Changes", className: "bg-yellow-500/20 text-[#FFD60A]" },
  APPROVED: { label: "Approved", className: "bg-green-500/20 text-[#34C759]" },
  CONVERTED: { label: "Converted", className: "bg-green-500/20 text-[#34C759]" },
  DECLINED: { label: "Declined", className: "bg-coral/20 text-coral" },
  EXPIRED: { label: "Expired", className: "bg-gray-500/20 text-foreground-muted" },
};

const ORDER_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "Submitted", className: "bg-blue-500/20 text-blue-400" },
  IN_REVIEW: { label: "In Review", className: "bg-purple-500/20 text-[#A78BFA]" },
  PROOFING: { label: "Proofing", className: "bg-yellow-500/20 text-[#FFD60A]" },
  APPROVED: { label: "Approved", className: "bg-green-500/20 text-[#34C759]" },
  IN_PRODUCTION: { label: "In Production", className: "bg-green-500/20 text-[#34C759]" },
  READY: { label: "Ready", className: "bg-coral/20 text-coral" },
  SHIPPED: { label: "Shipped", className: "bg-gray-500/20 text-foreground-secondary" },
  COMPLETED: { label: "Completed", className: "bg-green-500/20 text-[#34C759]" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-500/20 text-foreground-muted" },
};

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-label text-[11px] uppercase tracking-label text-foreground">{title}</h3>
      <Link href={viewAllHref} className="text-xs text-coral hover:text-coral-light">
        View All →
      </Link>
    </div>
  );
}

interface ClientDetailPanelProps {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDetailPanel({ clientId, onClose }: ClientDetailPanelProps) {
  const { data: client } = trpc.clientOrg.get.useQuery(
    { id: clientId! },
    { enabled: !!clientId }
  );
  const { data: qrData } = trpc.quoteRequest.list.useQuery(
    { companyId: clientId!, limit: 3 },
    { enabled: !!clientId }
  );
  const { data: quoteData } = trpc.quote.list.useQuery(
    { companyId: clientId!, perPage: 3 },
    { enabled: !!clientId }
  );
  const { data: orderData } = trpc.order.list.useQuery(
    { companyId: clientId!, limit: 3 },
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

  const updateNotes = trpc.clientOrg.updateNotes.useMutation({
    onSuccess: () => utils.clientOrg.get.invalidate({ id: clientId! }),
  });

  const updateStatus = trpc.clientOrg.updateStatus.useMutation({
    onSuccess: () => {
      utils.clientOrg.get.invalidate({ id: clientId! });
      utils.clientOrg.list.invalidate();
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
          "fixed inset-y-0 right-0 z-50 w-[400px] border-l border-surface-border bg-surface-bg transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {client && (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-surface-border p-6">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white",
                AVATAR_GRADIENTS[hashStr(client.name) % AVATAR_GRADIENTS.length]
              )}>
                {client.name[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg uppercase tracking-display text-foreground">{client.name}</h2>
                <span className={cn(
                  "mt-1 inline-block rounded-full px-2.5 py-1 text-[10px] font-medium",
                  (STATUS_BADGE[client.status] ?? STATUS_BADGE.active).className
                )}>
                  {(STATUS_BADGE[client.status] ?? STATUS_BADGE.active).label}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="border-b border-surface-border p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Overview</h3>
              <div className="space-y-2.5">
                {client.primaryContact && (
                  <div>
                    <p className="text-xs text-foreground-muted">Primary Contact</p>
                    <p className="text-sm text-foreground">{client.primaryContact.name}</p>
                    <p className="text-xs text-foreground-secondary">{client.primaryContact.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <p className="text-xs text-foreground-muted">Phone</p>
                    <p className="text-sm text-foreground">{client.phone}</p>
                  </div>
                )}
                {client.address && (
                  <div>
                    <p className="text-xs text-foreground-muted">Address</p>
                    <p className="text-sm text-foreground">{client.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-foreground-muted">Account Created</p>
                  <p className="text-sm text-foreground">
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
            <div className="border-b border-surface-border p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Activity Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-surface-border bg-surface-secondary p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{client.activeOrders}</p>
                  <p className="text-[10px] text-foreground-muted">Active Orders</p>
                </div>
                <div className="rounded-lg border border-surface-border bg-surface-secondary p-3 text-center">
                  <p className="text-xl font-bold text-foreground">${(client.revenue / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-foreground-muted">Revenue</p>
                </div>
                <div className="rounded-lg border border-surface-border bg-surface-secondary p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{client.userCount}</p>
                  <p className="text-[10px] text-foreground-muted">Users</p>
                </div>
              </div>
            </div>

            {/* Quote Requests */}
            <div className="border-b border-surface-border p-6">
              <SectionHeader title="Quote Requests" viewAllHref="/quotes" />
              {(() => {
                const items = qrData?.requests ?? [];
                if (items.length === 0) {
                  return <p className="text-sm text-foreground-muted">No open quote requests</p>;
                }
                return (
                  <div className="space-y-2">
                    {items.map((qr: any) => {
                      const badge = QUOTE_REQUEST_STATUS_BADGE[qr.status] ?? QUOTE_REQUEST_STATUS_BADGE.SUBMITTED;
                      return (
                        <div
                          key={qr.id}
                          className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-secondary px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground">{qr.title}</p>
                            <p className="text-xs text-foreground-muted">
                              {formatDistanceToNow(new Date(qr.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Quotes */}
            <div className="border-b border-surface-border p-6">
              <SectionHeader title="Quotes" viewAllHref={`/quotes?client=${client.id}`} />
              {(() => {
                const items = quoteData?.quotes ?? [];
                if (items.length === 0) {
                  return <p className="text-sm text-foreground-muted">No quotes</p>;
                }
                return (
                  <div className="space-y-2">
                    {items.map((q: any) => {
                      const badge = QUOTE_STATUS_BADGE[q.status] ?? QUOTE_STATUS_BADGE.DRAFT;
                      return (
                        <Link
                          key={q.id}
                          href={`/quotes/${q.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-secondary px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground-muted">{q.number}</p>
                            <p className="truncate text-sm text-foreground">{q.title}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                              {badge.label}
                            </span>
                            <span className="text-sm font-medium text-foreground">{usd(q.total ?? 0)}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Recent Orders */}
            <div className="border-b border-surface-border p-6">
              <SectionHeader title="Recent Orders" viewAllHref={`/orders?client=${client.id}`} />
              {(() => {
                const items = orderData?.orders ?? [];
                if (items.length === 0) {
                  return <p className="text-sm text-foreground-muted">No recent orders</p>;
                }
                return (
                  <div className="space-y-2">
                    {items.map((order: any) => {
                      const badge = ORDER_STATUS_BADGE[order.status] ?? ORDER_STATUS_BADGE.SUBMITTED;
                      return (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-secondary px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground-muted">{order.number}</p>
                            <p className="truncate text-sm text-foreground">{order.title}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                              {badge.label}
                            </span>
                            <span className="text-sm font-medium text-foreground">{usd(Number(order.totalAmount ?? 0))}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
              <Link
                href={`/orders?client=${client.id}`}
                className="mt-3 flex w-full items-center justify-center rounded-lg bg-coral px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
              >
                View All Orders →
              </Link>
            </div>

            {/* Team Members */}
            <div className="border-b border-surface-border p-6">
              <SectionHeader title="Team Members" viewAllHref={`/team?client=${client.id}`} />
              <div className="space-y-2">
                {client.users.map((user) => {
                  const roleBadge = ROLE_BADGE[user.role] ?? ROLE_BADGE.CLIENT_USER;
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-secondary px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-foreground-muted">{user.email}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", roleBadge.className)}>
                        {roleBadge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <InviteUserForm companyId={client.id} />
            </div>

            {/* Internal Notes */}
            <div className="border-b border-surface-border p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Internal Notes</h3>
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
                className="w-full resize-none rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
              />
            </div>

            {/* Quick Actions */}
            <div className="p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Quick Actions</h3>
              <div className="space-y-2">
                <div>
                  <label className="mb-1.5 block text-xs text-foreground-muted">Change Status</label>
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
                    className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-foreground focus:border-coral focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <Link
                  href={`/orders?client=${clientId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-secondary px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-foreground/[0.03] hover:text-foreground"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Orders
                </Link>
                <Link
                  href="/messages"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-secondary px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-foreground/[0.03] hover:text-foreground"
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

function InviteUserForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"CLIENT_ADMIN" | "CLIENT_USER">("CLIENT_USER");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const invite = trpc.user.invite.useMutation({
    onSuccess: () => {
      utils.clientOrg.get.invalidate({ id: companyId });
      utils.clientOrg.list.invalidate();
      setName("");
      setEmail("");
      setRole("CLIENT_USER");
      setError("");
      setOpen(false);
    },
    onError: (err) => setError(err.message),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-dashed border-surface-border px-3 py-2 text-xs font-medium text-foreground-secondary transition-colors hover:border-coral/50 hover:text-coral"
      >
        + Invite User
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        invite.mutate({ companyId, name: name.trim(), email: email.trim(), role });
      }}
      className="mt-3 space-y-2 rounded-lg border border-surface-border bg-surface-secondary p-3"
    >
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@company.com"
        className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "CLIENT_ADMIN" | "CLIENT_USER")}
        className="w-full rounded-lg border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-foreground focus:border-coral focus:outline-none"
      >
        <option value="CLIENT_USER">Member — can view & collaborate</option>
        <option value="CLIENT_ADMIN">Admin — can approve quotes & manage team</option>
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={invite.isPending}
          className="rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-dark disabled:opacity-50"
        >
          {invite.isPending ? "Inviting..." : "Send Invite"}
        </button>
      </div>
    </form>
  );
}
