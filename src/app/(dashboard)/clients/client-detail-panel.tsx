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
  CLIENT_USER: { label: "User", className: "bg-gray-500/20 text-foreground-secondary" },
};

const QUOTE_REQUEST_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-coral/20 text-coral animate-pulse" },
  reviewing: { label: "Reviewing", className: "bg-yellow-500/20 text-[#FFD60A]" },
  quoted: { label: "Quoted", className: "bg-green-500/20 text-[#34C759]" },
};

const QUOTE_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-500/20 text-foreground-secondary" },
  sent: { label: "Sent", className: "bg-blue-500/20 text-blue-400" },
  accepted: { label: "Accepted", className: "bg-green-500/20 text-[#34C759]" },
  declined: { label: "Declined", className: "bg-coral/20 text-coral" },
  expired: { label: "Expired", className: "bg-gray-500/20 text-foreground-muted" },
};

const ORDER_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-blue-500/20 text-blue-400" },
  in_review: { label: "In Review", className: "bg-purple-500/20 text-[#A78BFA]" },
  proofing: { label: "Proofing", className: "bg-yellow-500/20 text-[#FFD60A]" },
  in_production: { label: "In Production", className: "bg-green-500/20 text-[#34C759]" },
  ready: { label: "Ready", className: "bg-coral/20 text-coral" },
  shipped: { label: "Shipped", className: "bg-gray-500/20 text-foreground-secondary" },
};

type QuoteRequest = { id: string; title: string; date: string; status: string };
type Quote = { id: string; quoteId: string; title: string; amount: string; status: string; subtext: string };
type Order = { id: string; title: string; status: string; date: string; total: string };

const QUOTE_REQUESTS: Record<string, QuoteRequest[]> = {
  "acme-corp": [
    { id: "qr-1", title: "Custom Embroidered Jackets", date: "1 day ago", status: "new" },
    { id: "qr-2", title: "Warehouse Team Vests", date: "5 days ago", status: "reviewing" },
  ],
  "globex-corp": [
    { id: "qr-3", title: "Executive Gift Set", date: "2 days ago", status: "new" },
  ],
  "bloom-studio": [
    { id: "qr-4", title: "Seasonal Window Decals", date: "3 days ago", status: "reviewing" },
    { id: "qr-5", title: "Branded Aprons", date: "1 week ago", status: "quoted" },
  ],
  "redline-events": [
    { id: "qr-6", title: "VIP Lanyards & Badges", date: "12 hours ago", status: "new" },
    { id: "qr-7", title: "Stage Backdrop Reprint", date: "4 days ago", status: "quoted" },
  ],
  "greenfield-co": [
    { id: "qr-8", title: "Compostable Mailer Bags", date: "6 days ago", status: "reviewing" },
  ],
};

const QUOTES: Record<string, Quote[]> = {
  "acme-corp": [
    { id: "q-1", quoteId: "QT-2026-041", title: "Q4 Apparel Collection", amount: "$4,250.00", status: "accepted", subtext: "Accepted Jan 15, 2026" },
    { id: "q-2", quoteId: "QT-2026-048", title: "Holiday Gift Boxes", amount: "$2,800.00", status: "sent", subtext: "Expires Mar 1, 2026" },
  ],
  "globex-corp": [
    { id: "q-3", quoteId: "QT-2026-039", title: "Tech Summit Signage", amount: "$6,100.00", status: "accepted", subtext: "Accepted Jan 8, 2026" },
    { id: "q-4", quoteId: "QT-2026-052", title: "Onboarding Kit Bundle", amount: "$3,200.00", status: "draft", subtext: "Draft" },
  ],
  "bloom-studio": [
    { id: "q-5", quoteId: "QT-2026-044", title: "Spring Collection Print Run", amount: "$3,400.00", status: "accepted", subtext: "Accepted Jan 22, 2026" },
    { id: "q-6", quoteId: "QT-2026-050", title: "Custom Packaging Redesign", amount: "$1,900.00", status: "sent", subtext: "Expires Mar 10, 2026" },
    { id: "q-7", quoteId: "QT-2026-053", title: "Sticker Subscription Q2", amount: "$600.00", status: "expired", subtext: "Expired Feb 1, 2026" },
  ],
  "novatech-industries": [
    { id: "q-8", quoteId: "QT-2026-035", title: "Annual Report Printing", amount: "$5,500.00", status: "declined", subtext: "Declined Dec 20, 2025" },
  ],
  "redline-events": [
    { id: "q-9", quoteId: "QT-2026-046", title: "Festival Full Package", amount: "$12,400.00", status: "sent", subtext: "Expires Mar 15, 2026" },
  ],
  "greenfield-co": [
    { id: "q-10", quoteId: "QT-2026-049", title: "Eco Product Launch Kit", amount: "$2,100.00", status: "accepted", subtext: "Accepted Feb 5, 2026" },
    { id: "q-11", quoteId: "QT-2026-054", title: "Trade Show Bundle", amount: "$1,800.00", status: "draft", subtext: "Draft" },
  ],
};

const RECENT_ORDERS: Record<string, Order[]> = {
  "acme-corp": [
    { id: "CS-9012", title: "Summer Tee Collection", status: "in_production", date: "3 days ago", total: "$4,200.00" },
    { id: "CS-9008", title: "Event Banners Q2", status: "ready", date: "1 week ago", total: "$1,800.00" },
    { id: "CS-8994", title: "Staff Polos Reorder", status: "shipped", date: "2 weeks ago", total: "$3,100.00" },
  ],
  "globex-corp": [
    { id: "CS-9010", title: "Conference Merch Kit", status: "proofing", date: "2 days ago", total: "$6,500.00" },
    { id: "CS-9003", title: "Onboarding Swag Bags", status: "submitted", date: "5 days ago", total: "$2,200.00" },
  ],
  "bloom-studio": [
    { id: "CS-9015", title: "Spring Lookbook Prints", status: "in_production", date: "1 day ago", total: "$3,400.00" },
    { id: "CS-9011", title: "Logo Hoodie Run", status: "proofing", date: "4 days ago", total: "$2,800.00" },
    { id: "CS-9006", title: "Sticker Pack v3", status: "in_review", date: "6 days ago", total: "$450.00" },
  ],
  "redline-events": [
    { id: "CS-9014", title: "Festival Booth Setup", status: "in_production", date: "2 days ago", total: "$8,900.00" },
  ],
  "greenfield-co": [
    { id: "CS-9009", title: "Eco Tee Launch", status: "in_review", date: "4 days ago", total: "$2,100.00" },
    { id: "CS-9004", title: "Recycled Caps Order", status: "submitted", date: "1 week ago", total: "$1,350.00" },
  ],
};

function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
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
                <h2 className="text-lg font-semibold text-foreground">{client.name}</h2>
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
              <SectionHeader title="Quote Requests" viewAllHref={`/quotes/requests?client=${client.id}`} />
              {(() => {
                const items = QUOTE_REQUESTS[client.slug] ?? [];
                if (items.length === 0) {
                  return <p className="text-sm text-foreground-muted">No open quote requests</p>;
                }
                return (
                  <div className="space-y-2">
                    {items.map((qr) => {
                      const badge = QUOTE_REQUEST_STATUS_BADGE[qr.status] ?? QUOTE_REQUEST_STATUS_BADGE.new;
                      return (
                        <Link
                          key={qr.id}
                          href={`/quotes/requests/${qr.id}`}
                          className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-secondary px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground">{qr.title}</p>
                            <p className="text-xs text-foreground-muted">{qr.date}</p>
                          </div>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                            {badge.label}
                          </span>
                        </Link>
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
                const items = QUOTES[client.slug] ?? [];
                if (items.length === 0) {
                  return <p className="text-sm text-foreground-muted">No quotes</p>;
                }
                return (
                  <div className="space-y-2">
                    {items.map((q) => {
                      const badge = QUOTE_STATUS_BADGE[q.status] ?? QUOTE_STATUS_BADGE.draft;
                      return (
                        <Link
                          key={q.id}
                          href={`/quotes/${q.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-secondary px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground-muted">{q.quoteId}</p>
                            <p className="truncate text-sm text-foreground">{q.title}</p>
                            <p className="text-xs text-foreground-muted">{q.subtext}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                              {badge.label}
                            </span>
                            <span className="text-sm font-medium text-foreground">{q.amount}</span>
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
                const items = RECENT_ORDERS[client.slug] ?? [];
                if (items.length === 0) {
                  return <p className="text-sm text-foreground-muted">No recent orders</p>;
                }
                return (
                  <div className="space-y-2">
                    {items.map((order) => {
                      const badge = ORDER_STATUS_BADGE[order.status] ?? ORDER_STATUS_BADGE.submitted;
                      return (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-secondary px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground-muted">{order.id}</p>
                            <p className="truncate text-sm text-foreground">{order.title}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                              {badge.label}
                            </span>
                            <span className="text-sm font-medium text-foreground">{order.total}</span>
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
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-secondary px-4 py-2.5 text-sm text-foreground-secondary opacity-50 cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Orders
                </button>
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
