"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Search, Plus, FileText, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400",
  SENT: "bg-blue-500/10 text-blue-400",
  REVISION_REQUESTED: "bg-amber-500/10 text-amber-400",
  REVISED: "bg-purple-500/10 text-purple-400",
  APPROVED: "bg-emerald-500/10 text-emerald-400",
  CONVERTED: "bg-green-500/10 text-green-400",
  DECLINED: "bg-red-500/10 text-red-400",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  REVISION_REQUESTED: "Changes Requested",
  REVISED: "Revised",
  APPROVED: "Approved",
  CONVERTED: "Converted to Order",
  DECLINED: "Declined",
};

const QR_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400",
  SUBMITTED: "bg-blue-500/10 text-blue-400",
  IN_REVIEW: "bg-amber-500/10 text-amber-400",
  QUOTED: "bg-emerald-500/10 text-emerald-400",
  CLOSED: "bg-red-500/10 text-red-400",
};

const QR_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  QUOTED: "Quoted",
  CLOSED: "Closed",
};

type Tab = "quotes" | "requests";

export default function QuotesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const [activeTab, setActiveTab] = useState<Tab>("quotes");
  const [search, setSearch] = useState("");

  const { data: quotesData, isLoading: quotesLoading } =
    trpc.quote.list.useQuery({ limit: 50 }, { refetchInterval: 15_000 });

  const { data: requestsData, isLoading: requestsLoading } =
    trpc.quoteRequest.list.useQuery({ limit: 50 }, { refetchInterval: 15_000 });

  const quotes = quotesData?.quotes ?? [];
  const requests = requestsData?.requests ?? [];

  const filteredQuotes = quotes.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.title.toLowerCase().includes(s) ||
      q.displayId.toLowerCase().includes(s)
    );
  });

  const filteredRequests = requests.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.title.toLowerCase().includes(s);
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quotes</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage quotes and quote requests.
          </p>
        </div>
        <button
          onClick={() => router.push("/quotes/request/new")}
          className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Request Quote
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-4 border-b border-surface-border">
        <button
          onClick={() => setActiveTab("quotes")}
          className={cn(
            "border-b-2 pb-3 text-sm font-medium transition-colors",
            activeTab === "quotes"
              ? "border-coral text-white"
              : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          Quotes ({quotes.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={cn(
            "border-b-2 pb-3 text-sm font-medium transition-colors",
            activeTab === "requests"
              ? "border-coral text-white"
              : "border-transparent text-gray-500 hover:text-gray-300"
          )}
        >
          Quote Requests ({requests.length})
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={
              activeTab === "quotes"
                ? "Search quotes..."
                : "Search requests..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-card py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      {/* Quotes tab */}
      {activeTab === "quotes" && (
        <>
          {quotesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-16 text-center">
              <FileText className="h-10 w-10 text-gray-600" />
              <p className="mt-3 text-gray-400">No quotes found</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-surface-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Quote #</th>
                    {isStaff && <th className="px-4 py-3">Client</th>}
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Valid Until</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => router.push(`/quotes/${quote.id}`)}
                      className="cursor-pointer bg-surface-card transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-coral">
                          {quote.displayId}
                        </span>
                      </td>
                      {isStaff && (
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {quote.company.name}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {quote.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        v{quote.version}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            QUOTE_STATUS_COLORS[quote.status] ??
                              "bg-gray-500/10 text-gray-400"
                          )}
                        >
                          {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {quote._count.lineItems}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-white">
                        $
                        {Number(quote.totalAmount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {quote.validUntil
                          ? new Date(quote.validUntil).toLocaleDateString()
                          : "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {formatDistanceToNow(new Date(quote.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Quote Requests tab */}
      {activeTab === "requests" && (
        <>
          {requestsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-16 text-center">
              <FileText className="h-10 w-10 text-gray-600" />
              <p className="mt-3 text-gray-400">No quote requests found</p>
              <button
                onClick={() => router.push("/quotes/request/new")}
                className="mt-3 text-sm text-coral hover:text-coral-light"
              >
                Submit a new request
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-surface-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {isStaff && <th className="px-4 py-3">Client</th>}
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">In-Hands Date</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Quote</th>
                    <th className="px-4 py-3">Submitted By</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() =>
                        router.push(`/quotes/request/${req.id}`)
                      }
                      className="cursor-pointer bg-surface-card transition-colors hover:bg-white/[0.02]"
                    >
                      {isStaff && (
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {req.company.name}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {req.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            QR_STATUS_COLORS[req.status] ??
                              "bg-gray-500/10 text-gray-400"
                          )}
                        >
                          {QR_STATUS_LABELS[req.status] ?? req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {req.inHandsDate
                          ? new Date(req.inHandsDate).toLocaleDateString()
                          : "--"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {req._count.catalogItems}
                      </td>
                      <td className="px-4 py-3">
                        {req.quote ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/quotes/${req.quote!.id}`);
                            }}
                            className="flex items-center gap-1 font-mono text-xs text-coral hover:text-coral-light cursor-pointer"
                          >
                            {req.quote.displayId}
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {req.creator.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {formatDistanceToNow(new Date(req.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
