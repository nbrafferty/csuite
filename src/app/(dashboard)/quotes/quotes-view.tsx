"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuotesTable } from "./quotes-table";
import { QuoteRequestsTable } from "./quote-requests-table";
import { QuoteDetailPanel } from "./quote-detail-panel";

type Tab = "quotes" | "requests";
type QuoteStatusFilter = "all" | "draft" | "sent" | "pending_approval" | "approved" | "declined" | "expired";
type RequestStatusFilter = "all" | "new" | "reviewing" | "quoted" | "closed";

const QUOTE_STATUS_FILTERS: { label: string; value: QuoteStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Pending", value: "pending_approval" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
  { label: "Expired", value: "expired" },
];

const REQUEST_STATUS_FILTERS: { label: string; value: RequestStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Reviewing", value: "reviewing" },
  { label: "Quoted", value: "quoted" },
  { label: "Closed", value: "closed" },
];

export function QuotesView() {
  const [tab, setTab] = useState<Tab>("quotes");
  const [search, setSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<QuoteStatusFilter>("all");
  const [requestStatusFilter, setRequestStatusFilter] = useState<RequestStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const { data: statsData } = trpc.quote.stats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: quotesData } = trpc.quote.list.useQuery(
    {
      status: quoteStatusFilter === "all" ? undefined : quoteStatusFilter,
      search: search || undefined,
      page,
      pageSize: 10,
    },
    { refetchInterval: 30_000 }
  );

  const { data: requestsData } = trpc.quote.requestsList.useQuery(
    {
      status: requestStatusFilter === "all" ? undefined : requestStatusFilter,
    },
    { refetchInterval: 30_000, enabled: tab === "requests" }
  );

  // Find quotes expiring within 7 days
  const expiringQuotes = useMemo(() => {
    if (!quotesData?.quotes) return [];
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400_000);
    return quotesData.quotes.filter(
      (q) =>
        q.expiresAt &&
        new Date(q.expiresAt) > now &&
        new Date(q.expiresAt) <= weekFromNow &&
        (q.status === "sent" || q.status === "pending_approval")
    );
  }, [quotesData]);

  // We also need to check across all quotes for the deadline banner (not just current page)
  const { data: allActiveQuotes } = trpc.quote.list.useQuery(
    {
      pageSize: 100,
    },
    { refetchInterval: 60_000 }
  );

  const allExpiringQuotes = useMemo(() => {
    if (!allActiveQuotes?.quotes) return [];
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400_000);
    return allActiveQuotes.quotes.filter(
      (q) =>
        q.expiresAt &&
        new Date(q.expiresAt) > now &&
        new Date(q.expiresAt) <= weekFromNow &&
        (q.status === "sent" || q.status === "pending_approval")
    );
  }, [allActiveQuotes]);

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quotes & Estimates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage project proposals and pricing across all clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-[#333338] bg-[#1A1A1E] py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
            />
          </div>
          {/* New Quote button */}
          <button
            disabled
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            New Quote
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          label="Pending Approval"
          value={String(statsData?.pendingApproval ?? 0)}
          subtitle="Requires action"
          subtitleColor="text-[#f59e0b]"
        />
        <StatCard
          label="Approved This Month"
          value={String(statsData?.approvedThisMonth ?? 0)}
          subtitle="+12% vs LY"
          subtitleColor="text-[#22c55e]"
        />
        <StatCard
          label="Total Value"
          value={`$${((statsData?.totalValue ?? 0) / 1000).toFixed(1)}k`}
          subtitle="USD"
          subtitleColor="text-[#64748b]"
        />
        <StatCard
          label="Avg. Turnaround"
          value={statsData?.avgTurnaround ?? "24h"}
          subtitle="Excellent"
          subtitleColor="text-[#3b82f6]"
        />
      </div>

      {/* Tab Bar */}
      <div className="mb-4 flex items-center gap-6 border-b border-[#1e293b]">
        <button
          onClick={() => setTab("quotes")}
          className={cn(
            "pb-3 text-sm font-medium transition-colors",
            tab === "quotes"
              ? "border-b-2 border-coral text-white"
              : "text-[#64748b] hover:text-white"
          )}
        >
          All Quotes
        </button>
        <button
          onClick={() => setTab("requests")}
          className={cn(
            "pb-3 text-sm font-medium transition-colors",
            tab === "requests"
              ? "border-b-2 border-coral text-white"
              : "text-[#64748b] hover:text-white"
          )}
        >
          Quote Requests
        </button>
      </div>

      {/* Filter Pills */}
      <div className="mb-4 flex gap-1.5">
        {tab === "quotes"
          ? QUOTE_STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setQuoteStatusFilter(f.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  quoteStatusFilter === f.value
                    ? "bg-coral text-white"
                    : "bg-[#1e293b] text-[#94a3b8] hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))
          : REQUEST_STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRequestStatusFilter(f.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  requestStatusFilter === f.value
                    ? "bg-coral text-white"
                    : "bg-[#1e293b] text-[#94a3b8] hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
      </div>

      {/* Content */}
      {tab === "quotes" ? (
        <QuotesTable
          quotes={quotesData?.quotes ?? []}
          total={quotesData?.total ?? 0}
          page={page}
          pageSize={10}
          totalPages={quotesData?.totalPages ?? 1}
          onPageChange={setPage}
          onSelectQuote={setSelectedQuoteId}
          selectedQuoteId={selectedQuoteId}
        />
      ) : (
        <QuoteRequestsTable requests={requestsData ?? []} />
      )}

      {/* Deadline Alert Banner */}
      {allExpiringQuotes.length > 0 && (
        <div className="mt-6 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
            <div>
              <p className="text-sm font-semibold text-coral">Upcoming Deadlines</p>
              <p className="mt-0.5 text-sm text-[#94a3b8]">
                {allExpiringQuotes.length} quote{allExpiringQuotes.length !== 1 ? "s" : ""} expiring
                within the next 7 days. Review and follow up with clients.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <QuoteDetailPanel
        quoteId={selectedQuoteId}
        onClose={() => setSelectedQuoteId(null)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  subtitleColor,
}: {
  label: string;
  value: string;
  subtitle: string;
  subtitleColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#171717] p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className={cn("mt-1 text-xs", subtitleColor)}>{subtitle}</p>
    </div>
  );
}
