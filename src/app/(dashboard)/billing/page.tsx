"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/orders/invoice-status-badge";
import { formatDistanceToNow } from "date-fns";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Void", value: "VOID" },
] as const;

export default function BillingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = trpc.invoice.list.useQuery(
    {
      status: statusFilter ? (statusFilter as any) : undefined,
      search: search || undefined,
      limit: 50,
    },
    { refetchInterval: 15_000 }
  );

  const invoices = data?.invoices ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="mt-1 text-sm text-gray-400">
          View invoices and payment history.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-card py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s.value
                  ? "bg-coral text-white"
                  : "bg-[#22222A] text-gray-400 hover:text-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-20 text-center">
          <p className="text-gray-400">No invoices found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Order</th>
                {isStaff && <th className="px-4 py-3">Client</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {invoices.map((invoice: any) => {
                const invoiceTotal = (invoice.items ?? []).reduce(
                  (s: number, i: any) => s + Number(i.lineTotal),
                  0
                );
                const invoicePaid = (invoice.payments ?? []).reduce(
                  (s: number, p: any) => s + Number(p.amount),
                  0
                );

                return (
                  <tr
                    key={invoice.id}
                    onClick={() => router.push(`/billing/${invoice.id}`)}
                    className="cursor-pointer bg-surface-card transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-coral">
                        {invoice.number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {invoice.order?.number ?? "--"}
                    </td>
                    {isStaff && (
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {invoice.company?.name ?? "--"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white">
                      ${invoiceTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-400">
                      ${invoicePaid.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {invoice.issuedAt
                        ? new Date(invoice.issuedAt).toLocaleDateString()
                        : "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
