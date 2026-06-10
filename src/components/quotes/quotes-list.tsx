"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { QuoteStatusBadge } from "./quote-status-badge";
import { formatDistanceToNow } from "date-fns";

const STAFF_STATUS_FILTERS = [
  { label: "All", value: undefined },
  { label: "Draft", value: "DRAFT" as const },
  { label: "Sent", value: "SENT" as const },
  { label: "Changes Requested", value: "CHANGES_REQUESTED" as const },
  { label: "Approved", value: "APPROVED" as const },
  { label: "Declined", value: "DECLINED" as const },
  { label: "Expired", value: "EXPIRED" as const },
  { label: "Converted", value: "CONVERTED" as const },
];

const CLIENT_STATUS_FILTERS = [
  { label: "All", value: undefined },
  { label: "Sent", value: "SENT" as const },
  { label: "Changes Requested", value: "CHANGES_REQUESTED" as const },
  { label: "Approved", value: "APPROVED" as const },
  { label: "Declined", value: "DECLINED" as const },
  { label: "Expired", value: "EXPIRED" as const },
  { label: "Converted", value: "CONVERTED" as const },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

export function QuotesList() {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [clientFilter, setClientFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: clients } = trpc.clientOrg.list.useQuery(undefined, {
    enabled: isStaff,
  });

  const { data, isLoading } = trpc.quote.list.useQuery(
    {
      status: statusFilter as any,
      companyId: clientFilter || undefined,
      search: search || undefined,
      page,
      perPage: 20,
    },
    { refetchInterval: 30_000 }
  );

  const statusFilters = isStaff ? STAFF_STATUS_FILTERS : CLIENT_STATUS_FILTERS;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl uppercase tracking-display text-white">
          {isStaff ? "Quotes" : "Your Quotes"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {data
            ? `${data.total} quote${data.total !== 1 ? "s" : ""}`
            : "Loading..."}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={
              isStaff
                ? "Search by number, title, or client..."
                : "Search quotes..."
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#333338] bg-[#1A1A1E] py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
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

        {/* Client filter (staff only) */}
        {isStaff && clients && clients.length > 0 && (
          <select
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setPage(1);
            }}
            className={cn(
              "rounded-lg border border-[#333338] bg-[#1A1A1E] px-3 py-1.5 text-xs font-medium text-gray-400 outline-none",
              clientFilter && "border-coral text-white"
            )}
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* New Quote button (staff only) */}
        {isStaff && (
          <div className="ml-auto">
            <button
              onClick={() => router.push("/quotes/new")}
              className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark"
            >
              <Plus className="h-4 w-4" />
              New Quote
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#333338] bg-[#1A1A1E]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333338]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Quote #
              </th>
              {isStaff && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Items
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {isStaff ? "Created" : "Received"}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#333338]/50">
                  <td colSpan={isStaff ? 7 : 6} className="px-4 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-[#22222A]" />
                  </td>
                </tr>
              ))}

            {!isLoading && data?.quotes.length === 0 && (
              <tr>
                <td
                  colSpan={isStaff ? 7 : 6}
                  className="px-4 py-12 text-center"
                >
                  <p className="text-gray-500">
                    {search || statusFilter
                      ? "No quotes match your filters."
                      : isStaff
                      ? "No quotes yet. Create your first quote to get started."
                      : "No quotes yet."}
                  </p>
                  {isStaff && !search && !statusFilter && (
                    <button
                      onClick={() => router.push("/quotes/new")}
                      className="mt-3 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark"
                    >
                      Create Quote
                    </button>
                  )}
                </td>
              </tr>
            )}

            {data?.quotes.map((quote) => (
              <tr
                key={quote.id}
                onClick={() => router.push(`/quotes/${quote.id}`)}
                className="cursor-pointer border-b border-[#333338]/50 transition-colors hover:bg-[#22222A]/50"
              >
                <td className="px-4 py-3 text-sm font-mono text-gray-400">
                  {quote.number}
                </td>
                {isStaff && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-coral to-purple-500 text-xs font-medium text-white">
                        {quote.company.name.charAt(0)}
                      </div>
                      <span className="text-sm text-white">
                        {quote.company.name}
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-white">
                  {quote.title}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-400">
                  {quote.itemCount}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-white">
                  {formatCurrency(quote.total)}
                </td>
                <td className="px-4 py-3">
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(quote.createdAt), {
                    addSuffix: true,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(data.page - 1) * data.perPage + 1} to{" "}
            {Math.min(data.page * data.perPage, data.total)} of {data.total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md p-2 text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="rounded-md p-2 text-gray-500 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
