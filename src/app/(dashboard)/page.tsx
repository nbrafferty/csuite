"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  ShoppingCart,
  CheckCircle,
  ArrowUpRight,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n
  );

const ORDER_STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "text-blue-400",
  IN_REVIEW: "text-purple-400",
  PROOFING: "text-yellow-400",
  APPROVED: "text-green-400",
  IN_PRODUCTION: "text-coral",
  READY: "text-cyan-400",
  SHIPPED: "text-gray-400",
  COMPLETED: "text-green-400",
  CANCELLED: "text-gray-500",
};

const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "text-gray-400",
  SENT: "text-blue-400",
  CHANGES_REQUESTED: "text-yellow-400",
  APPROVED: "text-green-400",
  DECLINED: "text-red-400",
  EXPIRED: "text-gray-500",
  CONVERTED: "text-purple-400",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const { data, isLoading } = trpc.dashboard.stats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const statCards = [
    {
      label: "Active Orders",
      value: data?.activeOrders ?? "—",
      sub: isStaff ? "Across all clients" : "In progress",
      icon: ShoppingCart,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10",
    },
    {
      label: "Open Quotes",
      value: data?.openQuotes ?? "—",
      sub: "Awaiting response",
      icon: FileText,
      iconColor: "text-coral",
      iconBg: "bg-coral/10",
    },
    {
      label: "Overdue Invoices",
      value: data?.overdueInvoices ?? "—",
      sub: data?.overdueInvoices ? "Need attention" : "All clear",
      icon: AlertCircle,
      iconColor: data?.overdueInvoices ? "text-red-400" : "text-emerald-400",
      iconBg: data?.overdueInvoices ? "bg-red-400/10" : "bg-emerald-400/10",
    },
    {
      label: isStaff ? "Pending Requests" : "Completed Orders",
      value: isStaff
        ? (data?.pendingRequests ?? "—")
        : (data?.completedOrders ?? "—"),
      sub: isStaff ? "Quote requests" : "All time",
      icon: isStaff ? Inbox : CheckCircle,
      iconColor: isStaff ? "text-blue-400" : "text-emerald-400",
      iconBg: isStaff ? "bg-blue-400/10" : "bg-emerald-400/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Here&apos;s an overview of your{" "}
          {isStaff ? "business" : "account"} activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? (
                  <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-border" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-sm text-foreground-secondary">{stat.label}</p>
            </div>
            <p className="mt-1 text-xs text-foreground-muted">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main content: Recent Orders + Recent Quotes sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders – takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Orders
            </h2>
            <button
              onClick={() => router.push("/orders")}
              className="flex items-center gap-1 text-sm font-medium text-coral hover:text-coral-light"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-surface-border bg-surface-card"
                />
              ))}
            </div>
          ) : data?.recentOrders.length === 0 ? (
            <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
              <ShoppingCart className="mx-auto h-8 w-8 text-foreground-muted" />
              <p className="mt-2 text-sm text-foreground-secondary">
                No orders yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="cursor-pointer rounded-xl border border-surface-border bg-surface-card p-5 transition-colors hover:border-foreground-muted"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground-muted">
                          {order.number}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">
                          {order.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-foreground-secondary">
                        {isStaff ? order.company : `${order.itemCount} items`}{" "}
                        &middot; {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${ORDER_STATUS_COLORS[order.status] ?? "text-gray-400"}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Quotes sidebar – takes 1 col */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Quotes
            </h2>
            <button
              onClick={() => router.push("/quotes")}
              className="flex items-center gap-1 text-sm font-medium text-coral hover:text-coral-light"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="h-40 animate-pulse rounded-xl border border-surface-border bg-surface-card" />
          ) : data?.recentQuotes.length === 0 ? (
            <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-foreground-muted" />
              <p className="mt-2 text-sm text-foreground-secondary">
                No quotes yet
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-border bg-surface-card divide-y divide-surface-border">
              {data?.recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                  className="cursor-pointer px-4 py-3.5 transition-colors hover:bg-foreground/[0.03]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate mr-2">
                      {quote.title}
                    </span>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-foreground-muted">
                      {quote.number} &middot;{" "}
                      {formatDistanceToNow(new Date(quote.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span
                      className={`font-medium ${QUOTE_STATUS_COLORS[quote.status] ?? "text-foreground-secondary"}`}
                    >
                      {quote.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
