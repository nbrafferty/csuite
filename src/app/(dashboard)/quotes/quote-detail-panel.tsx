"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { X, Building2, Clock, CheckCircle, XCircle, Send, FileEdit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-[#1e293b] text-[#94a3b8]" },
  sent: { label: "Sent", className: "bg-[rgba(30,58,138,0.3)] text-[#3b82f6]" },
  pending_approval: {
    label: "Pending Approval",
    className: "bg-[rgba(120,53,15,0.3)] text-[#f59e0b]",
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-[rgba(30,58,138,0.3)] text-[#3b82f6]",
  },
  approved: { label: "Approved", className: "bg-[rgba(20,83,45,0.3)] text-[#22c55e]" },
  declined: { label: "Declined", className: "bg-[rgba(127,29,29,0.3)] text-[#ef4444]" },
  expired: { label: "Expired", className: "bg-[#1e293b] text-[#64748b]" },
};

interface QuoteDetailPanelProps {
  quoteId: string | null;
  onClose: () => void;
}

export function QuoteDetailPanel({ quoteId, onClose }: QuoteDetailPanelProps) {
  const { data: quote } = trpc.quote.get.useQuery(
    { id: quoteId! },
    { enabled: !!quoteId }
  );

  const [notes, setNotes] = useState("");
  const notesInitialized = useRef(false);

  useEffect(() => {
    if (quote?.notes !== undefined && !notesInitialized.current) {
      setNotes(quote.notes ?? "");
      notesInitialized.current = true;
    }
  }, [quote?.notes]);

  useEffect(() => {
    notesInitialized.current = false;
  }, [quoteId]);

  const utils = trpc.useUtils();

  const updateNotes = trpc.quote.updateNotes.useMutation({
    onSuccess: () => utils.quote.get.invalidate({ id: quoteId! }),
  });

  const updateStatus = trpc.quote.updateStatus.useMutation({
    onSuccess: () => {
      utils.quote.get.invalidate({ id: quoteId! });
      utils.quote.list.invalidate();
      utils.quote.stats.invalidate();
    },
  });

  const isOpen = !!quoteId;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[440px] border-l border-[#1e293b] bg-[#0D0D0F] transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {quote && (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1e293b] p-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">#{quote.quoteNumber}</h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-medium",
                      (STATUS_BADGE[quote.status] ?? STATUS_BADGE.draft).className
                    )}
                  >
                    {(STATUS_BADGE[quote.status] ?? STATUS_BADGE.draft).label}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-[#22222A] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Project Info */}
            <div className="border-b border-[#1e293b] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                Project Info
              </h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-xs text-[#64748b]">Project Name</p>
                  <p className="text-sm font-medium text-white">{quote.projectName}</p>
                </div>
                {quote.description && (
                  <div>
                    <p className="text-xs text-[#64748b]">Description</p>
                    <p className="text-sm text-[#94a3b8]">{quote.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#64748b]">Company</p>
                  <Link
                    href="/clients"
                    className="flex items-center gap-1.5 text-sm text-coral hover:text-coral-light"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {quote.company.name}
                  </Link>
                </div>
                {quote.company.phone && (
                  <div>
                    <p className="text-xs text-[#64748b]">Client Contact</p>
                    <p className="text-sm text-white">{quote.company.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial */}
            <div className="border-b border-[#1e293b] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                Financial
              </h3>
              <p className="text-3xl font-bold text-white">
                ${quote.totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              {quote.expiresAt &&
                (quote.status === "sent" || quote.status === "pending_approval") && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#f59e0b]" />
                    <span className="text-xs text-[#f59e0b]">
                      Expires{" "}
                      {formatDistanceToNow(new Date(quote.expiresAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
              {quote.expiresAt && quote.status === "expired" && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#64748b]" />
                  <span className="text-xs text-[#64748b]">
                    Expired{" "}
                    {formatDistanceToNow(new Date(quote.expiresAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="border-b border-[#1e293b] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                Timeline
              </h3>
              <div className="space-y-3">
                <TimelineItem
                  icon={<FileEdit className="h-3.5 w-3.5" />}
                  label="Created"
                  date={new Date(quote.createdAt)}
                  active
                />
                {(quote.status === "sent" ||
                  quote.status === "pending_approval" ||
                  quote.status === "approved" ||
                  quote.status === "declined" ||
                  quote.status === "revision_requested") && (
                  <TimelineItem
                    icon={<Send className="h-3.5 w-3.5" />}
                    label="Sent"
                    date={new Date(quote.createdAt)}
                    active
                  />
                )}
                {quote.status === "approved" && quote.approvedAt && (
                  <TimelineItem
                    icon={<CheckCircle className="h-3.5 w-3.5" />}
                    label="Approved"
                    date={new Date(quote.approvedAt)}
                    active
                    color="text-[#22c55e]"
                  />
                )}
                {quote.status === "declined" && quote.declinedAt && (
                  <TimelineItem
                    icon={<XCircle className="h-3.5 w-3.5" />}
                    label="Declined"
                    date={new Date(quote.declinedAt)}
                    active
                    color="text-[#ef4444]"
                  />
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="border-b border-[#1e293b] p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                Internal Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (quoteId && notes !== (quote.notes ?? "")) {
                    updateNotes.mutate({ id: quoteId, notes });
                  }
                }}
                rows={4}
                placeholder="Add internal notes about this quote..."
                className="w-full resize-none rounded-lg border border-[#1e293b] bg-[#171717] px-3 py-2 text-sm text-white placeholder-[#64748b] focus:border-coral focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                Actions
              </h3>
              <div className="space-y-2">
                {quote.status === "draft" && (
                  <button
                    onClick={() =>
                      updateStatus.mutate({ id: quote.id, status: "sent" })
                    }
                    className="flex w-full items-center justify-center rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-dark"
                  >
                    Send to Client
                  </button>
                )}
                {quote.status === "sent" && (
                  <button
                    onClick={() =>
                      updateStatus.mutate({
                        id: quote.id,
                        status: "pending_approval",
                      })
                    }
                    className="flex w-full items-center justify-center rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-dark"
                  >
                    Mark as Pending Approval
                  </button>
                )}
                {quote.status === "pending_approval" && (
                  <>
                    <button
                      onClick={() =>
                        updateStatus.mutate({ id: quote.id, status: "approved" })
                      }
                      className="flex w-full items-center justify-center rounded-lg bg-[rgba(20,83,45,0.5)] px-4 py-2.5 text-sm font-medium text-[#22c55e] transition-colors hover:bg-[rgba(20,83,45,0.7)]"
                    >
                      Approve Quote
                    </button>
                    <button
                      onClick={() =>
                        updateStatus.mutate({
                          id: quote.id,
                          status: "revision_requested",
                        })
                      }
                      className="flex w-full items-center justify-center rounded-lg border border-[#334155] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() =>
                        updateStatus.mutate({ id: quote.id, status: "declined" })
                      }
                      className="flex w-full items-center justify-center rounded-lg border border-[rgba(127,29,29,0.3)] px-4 py-2.5 text-sm font-medium text-[#ef4444] transition-colors hover:bg-[rgba(127,29,29,0.1)]"
                    >
                      Decline Quote
                    </button>
                  </>
                )}
                {quote.status === "revision_requested" && (
                  <button
                    onClick={() =>
                      updateStatus.mutate({ id: quote.id, status: "sent" })
                    }
                    className="flex w-full items-center justify-center rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-dark"
                  >
                    Resend to Client
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  active,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  date: Date;
  active: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full",
          active
            ? color
              ? `bg-[rgba(255,255,255,0.1)] ${color}`
              : "bg-[rgba(255,255,255,0.1)] text-white"
            : "bg-[#1e293b] text-[#64748b]"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className={cn("text-sm", active ? (color ?? "text-white") : "text-[#64748b]")}>
          {label}
        </p>
      </div>
      <span className="text-xs text-[#64748b]">
        {date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}
