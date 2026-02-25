"use client";

import { cn } from "@/lib/utils";
import { Copy, Download, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc";

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

type Quote = {
  id: string;
  quoteNumber: string;
  projectName: string;
  description: string | null;
  status: string;
  totalAmount: number;
  createdAt: string | Date;
  expiresAt: string | Date | null;
  company: { id: string; name: string; slug: string };
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
};

interface QuotesTableProps {
  quotes: Quote[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectQuote: (id: string) => void;
  selectedQuoteId: string | null;
}

export function QuotesTable({
  quotes,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onSelectQuote,
  selectedQuoteId,
}: QuotesTableProps) {
  const utils = trpc.useUtils();

  const updateStatus = trpc.quote.updateStatus.useMutation({
    onSuccess: () => {
      utils.quote.list.invalidate();
      utils.quote.stats.invalidate();
    },
  });

  if (quotes.length === 0) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#171717] px-6 py-12 text-center">
        <p className="text-sm text-[#64748b]">No quotes match your filters.</p>
      </div>
    );
  }

  const showingFrom = (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[#1e293b]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e293b] bg-[rgba(255,255,255,0.05)]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Quote ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Project Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Total Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#64748b]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => {
              const badge = STATUS_BADGE[quote.status] ?? STATUS_BADGE.draft;
              const isSelected = selectedQuoteId === quote.id;

              return (
                <tr
                  key={quote.id}
                  onClick={() => onSelectQuote(quote.id)}
                  className={cn(
                    "cursor-pointer border-b border-[#1e293b] transition-colors",
                    isSelected
                      ? "bg-[rgba(255,255,255,0.03)]"
                      : "hover:bg-[rgba(255,255,255,0.02)]"
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-white">
                      #{quote.quoteNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">{quote.company.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#94a3b8]">
                      {new Date(quote.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{quote.projectName}</p>
                      {quote.description && (
                        <p className="text-xs text-[#94a3b8]">{quote.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-1 text-[10px] font-medium",
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-white">
                      ${quote.totalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {quote.status === "pending_approval" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus.mutate({ id: quote.id, status: "approved" })
                            }
                            className="rounded-lg bg-coral px-3 py-1.5 text-[10px] font-bold uppercase text-white transition-colors hover:bg-coral-dark"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              updateStatus.mutate({
                                id: quote.id,
                                status: "revision_requested",
                              })
                            }
                            className="rounded-lg border border-[#334155] px-3 py-1.5 text-[10px] font-bold uppercase text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                          >
                            Revise
                          </button>
                        </>
                      )}
                      {quote.status === "approved" && (
                        <>
                          <button
                            className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                            title="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {quote.status === "draft" && (
                        <button
                          className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                          title="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      )}
                      {quote.status === "revision_requested" && (
                        <span className="text-[10px] text-[#94a3b8]">
                          Awaiting C-SUITE review
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-[#64748b]">
          Showing {showingFrom}–{showingTo} of {total} results
        </p>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-xs font-medium transition-colors",
                p === page
                  ? "bg-coral text-white"
                  : "text-[#64748b] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
