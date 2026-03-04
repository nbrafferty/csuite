"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  X,
  ArrowRight,
  Calendar,
  FileText,
  Package,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "bg-gray-500/15", text: "text-gray-400", label: "Draft" },
  SUBMITTED: { bg: "bg-coral/15", text: "text-coral", label: "Pending" },
  IN_REVIEW: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "In Review" },
  QUOTED: { bg: "bg-green-500/15", text: "text-green-400", label: "Converted" },
  CLOSED: { bg: "bg-gray-500/15", text: "text-gray-500", label: "Declined" },
};

function RequestStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        style.bg,
        style.text
      )}
    >
      {style.label}
    </span>
  );
}

export function QuoteRequestsList() {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const utils = trpc.useUtils();

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = trpc.quoteRequest.list.useQuery(
    {
      status: statusFilter as any,
      limit: 50,
    },
    { refetchInterval: 15_000 }
  );

  const { data: selectedRequest } = trpc.quoteRequest.get.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const startReview = trpc.quoteRequest.startReview.useMutation({
    onSuccess: () => {
      utils.quoteRequest.invalidate();
    },
  });

  const decline = trpc.quoteRequest.decline.useMutation({
    onSuccess: () => {
      utils.quoteRequest.invalidate();
      setSelectedId(null);
    },
  });

  const convertToQuote = trpc.quoteRequest.convertToQuote.useMutation({
    onSuccess: (quote) => {
      utils.quoteRequest.invalidate();
      router.push(`/quotes/${quote.id}`);
    },
  });

  const statusFilters = [
    { label: "All", value: undefined },
    { label: "Pending", value: "SUBMITTED" },
    { label: "In Review", value: "IN_REVIEW" },
    { label: "Converted", value: "QUOTED" },
    { label: "Declined", value: "CLOSED" },
  ];

  const requests = data?.requests ?? [];

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-coral text-white"
                  : "bg-[#22222A] text-gray-400 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Request a Quote button (clients) */}
        {!isStaff && (
          <div className="ml-auto">
            <button
              onClick={() => router.push("/quotes/request/new")}
              className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark"
            >
              <Plus className="h-4 w-4" />
              Request a Quote
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#333338] bg-[#1A1A1E]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333338]">
              {isStaff && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Project
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Products
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Deadline
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Submitted
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#333338]/50">
                  <td
                    colSpan={isStaff ? 6 : 5}
                    className="px-4 py-4"
                  >
                    <div className="h-4 w-full animate-pulse rounded bg-[#22222A]" />
                  </td>
                </tr>
              ))}

            {!isLoading && requests.length === 0 && (
              <tr>
                <td
                  colSpan={isStaff ? 6 : 5}
                  className="px-4 py-12 text-center"
                >
                  <p className="text-gray-500">
                    {statusFilter
                      ? "No requests match this filter."
                      : isStaff
                      ? "No quote requests yet."
                      : "You haven't submitted any quote requests yet."}
                  </p>
                  {!isStaff && !statusFilter && (
                    <button
                      onClick={() => router.push("/quotes/request/new")}
                      className="mt-3 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark"
                    >
                      Request a Quote
                    </button>
                  )}
                </td>
              </tr>
            )}

            {requests.map((req) => (
              <tr
                key={req.id}
                onClick={() => setSelectedId(req.id)}
                className={cn(
                  "cursor-pointer border-b border-[#333338]/50 transition-colors hover:bg-[#22222A]/50",
                  selectedId === req.id && "bg-[#22222A]/50"
                )}
              >
                {isStaff && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-coral to-purple-500 text-xs font-medium text-white">
                        {req.company.name.charAt(0)}
                      </div>
                      <span className="text-sm text-white">
                        {req.company.name}
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-white">
                  {req.title}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-400">
                  {req._count.catalogItems || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {req.inHandsDate
                    ? format(new Date(req.inHandsDate), "MMM d, yyyy")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <RequestStatusBadge status={req.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(req.createdAt), {
                    addSuffix: true,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-out detail panel */}
      {selectedId && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSelectedId(null)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-[#333338] bg-[#0D0D0F] shadow-xl">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[#333338] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Quote Request
                </h2>
                {selectedRequest && (
                  <RequestStatusBadge status={selectedRequest.status} />
                )}
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#22222A] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel content */}
            {selectedRequest ? (
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Title & Company */}
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedRequest.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {selectedRequest.company.name} &middot;{" "}
                    {selectedRequest.creator.name}
                  </p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[#333338] bg-[#1A1A1E] p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      In-Hands Date
                    </div>
                    <p className="text-sm text-white">
                      {selectedRequest.inHandsDate
                        ? format(
                            new Date(selectedRequest.inHandsDate),
                            "MMM d, yyyy"
                          )
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#333338] bg-[#1A1A1E] p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Package className="h-3.5 w-3.5" />
                      Products
                    </div>
                    <p className="text-sm text-white">
                      {selectedRequest.catalogItems.length} item
                      {selectedRequest.catalogItems.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedRequest.description && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                      Description
                    </h4>
                    <div className="rounded-lg border border-[#333338] bg-[#1A1A1E] p-4">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedRequest.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Catalog items */}
                {selectedRequest.catalogItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                      Requested Products
                    </h4>
                    <div className="space-y-2">
                      {selectedRequest.catalogItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-[#333338] bg-[#1A1A1E] p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {item.catalogProduct?.name ||
                                  item.description ||
                                  "Custom item"}
                              </p>
                              {item.catalogProduct?.sku && (
                                <p className="text-xs text-gray-500 font-mono">
                                  {item.catalogProduct.sku}
                                </p>
                              )}
                            </div>
                            {item.quantity && (
                              <span className="text-sm text-gray-400">
                                Qty: {item.quantity}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="mt-1.5 text-xs text-gray-400">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Converted quote link */}
                {selectedRequest.quote && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-400">
                          Converted to Quote
                        </p>
                        <p className="text-sm text-gray-400">
                          {selectedRequest.quote.number}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/quotes/${selectedRequest.quote!.id}`)
                        }
                        className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
                      >
                        View Quote
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#333338] border-t-coral" />
              </div>
            )}

            {/* Panel actions */}
            {selectedRequest &&
              isStaff &&
              selectedRequest.status !== "QUOTED" &&
              selectedRequest.status !== "CLOSED" && (
                <div className="border-t border-[#333338] px-6 py-4 flex items-center gap-3">
                  {selectedRequest.status === "SUBMITTED" && (
                    <button
                      onClick={() => startReview.mutate({ id: selectedRequest.id })}
                      disabled={startReview.isPending}
                      className="rounded-lg border border-[#333338] px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                    >
                      Mark In Review
                    </button>
                  )}
                  <button
                    onClick={() => convertToQuote.mutate({ id: selectedRequest.id })}
                    disabled={convertToQuote.isPending}
                    className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    {convertToQuote.isPending
                      ? "Converting..."
                      : "Convert to Quote"}
                  </button>
                  <button
                    onClick={() => decline.mutate({ id: selectedRequest.id })}
                    disabled={decline.isPending}
                    className="ml-auto rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}

            {/* Client view - status messages */}
            {selectedRequest && !isStaff && (
              <div className="border-t border-[#333338] px-6 py-4">
                {selectedRequest.status === "SUBMITTED" && (
                  <p className="text-sm text-gray-400">
                    Your request has been submitted and is awaiting review by our team.
                  </p>
                )}
                {selectedRequest.status === "IN_REVIEW" && (
                  <p className="text-sm text-yellow-400">
                    Our team is currently reviewing your request and preparing a quote.
                  </p>
                )}
                {selectedRequest.status === "CLOSED" && (
                  <p className="text-sm text-gray-500">
                    This request has been declined.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
