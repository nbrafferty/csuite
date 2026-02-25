"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-coral/20 text-coral animate-pulse" },
  reviewing: { label: "Reviewing", className: "bg-[rgba(120,53,15,0.3)] text-[#f59e0b]" },
  quoted: { label: "Quoted", className: "bg-[rgba(20,83,45,0.3)] text-[#22c55e]" },
  closed: { label: "Closed", className: "bg-[#1e293b] text-[#64748b]" },
};

type QuoteRequest = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  quotedAmount: number | null;
  linkedQuoteId: string | null;
  createdAt: string | Date;
  company: { id: string; name: string; slug: string };
  requestedBy: { id: string; name: string; email: string };
};

interface QuoteRequestsTableProps {
  requests: QuoteRequest[];
}

export function QuoteRequestsTable({ requests }: QuoteRequestsTableProps) {
  const utils = trpc.useUtils();

  const updateStatus = trpc.quote.updateRequestStatus.useMutation({
    onSuccess: () => {
      utils.quote.requestsList.invalidate();
    },
  });

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-[#1e293b] bg-[#171717] px-6 py-12 text-center">
        <p className="text-sm text-[#64748b]">No quote requests match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e293b]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1e293b] bg-[rgba(255,255,255,0.05)]">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
              Client
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#64748b]">
              Submitted
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#64748b]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const badge = STATUS_BADGE[request.status] ?? STATUS_BADGE.new;

            return (
              <tr
                key={request.id}
                className="border-b border-[#1e293b] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{request.company.name}</p>
                    <p className="text-xs text-[#64748b]">{request.requestedBy.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-white">{request.title}</span>
                </td>
                <td className="max-w-xs px-4 py-3">
                  <span className="line-clamp-2 text-sm text-[#94a3b8]">
                    {request.description ?? "—"}
                  </span>
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
                <td className="px-4 py-3">
                  <span className="text-sm text-[#94a3b8]">
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {request.status === "new" && (
                      <button
                        onClick={() =>
                          updateStatus.mutate({ id: request.id, status: "reviewing" })
                        }
                        className="rounded-lg border border-[#334155] px-3 py-1.5 text-[10px] font-bold uppercase text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                      >
                        Review
                      </button>
                    )}
                    {request.status === "reviewing" && (
                      <button
                        disabled
                        className="rounded-lg bg-coral px-3 py-1.5 text-[10px] font-bold uppercase text-white opacity-50 cursor-not-allowed"
                      >
                        Create Quote
                      </button>
                    )}
                    {request.status === "quoted" && request.quotedAmount != null && (
                      <span className="text-xs font-medium text-[#22c55e]">
                        ${request.quotedAmount.toLocaleString()}
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
  );
}
