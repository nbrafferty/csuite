"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Search,
  LayoutList,
  Columns3,
  Plus,
  FileText,
  ChevronDown,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { OrdersTable } from "./orders-table";
import { OrdersKanban } from "./orders-kanban";

const ORDER_STATUSES = [
  { label: "All", value: "" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Ready", value: "READY_FOR_PRODUCTION" },
  { label: "In Production", value: "IN_PRODUCTION" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export function OrdersView() {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = trpc.order.list.useQuery(
    {
      status: statusFilter ? (statusFilter as any) : undefined,
      search: search || undefined,
      limit: 50,
    },
    { refetchInterval: 15_000 }
  );

  const orders = data?.orders ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage and track your orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/quotes/request/new")}
            className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-sm font-medium text-white hover:border-gray-500 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Request Quote
          </button>
          <button
            onClick={() => router.push("/catalog")}
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-card py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 overflow-x-auto">
          {ORDER_STATUSES.map((s) => (
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

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-surface-border bg-surface-card">
            <button
              onClick={() => setView("list")}
              title="List view"
              className={cn(
                "rounded-l-lg p-2 transition-colors",
                view === "list"
                  ? "bg-[#22222A] text-white"
                  : "text-gray-500 hover:text-white"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("kanban")}
              title="Kanban view"
              className={cn(
                "rounded-r-lg p-2 transition-colors",
                view === "kanban"
                  ? "bg-[#22222A] text-white"
                  : "text-gray-500 hover:text-white"
              )}
            >
              <Columns3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
        </div>
      ) : view === "list" ? (
        <OrdersTable orders={orders} isStaff={isStaff} />
      ) : (
        <OrdersKanban orders={orders} isStaff={isStaff} />
      )}
    </div>
  );
}
