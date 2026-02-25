"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  XCircle,
  Package,
  FileText,
  Truck,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { OrderOverviewTab } from "./tabs/overview-tab";
import { OrderLineItemsTab } from "./tabs/line-items-tab";
import { OrderShippingTab } from "./tabs/shipping-tab";
import { OrderBillingTab } from "./tabs/billing-tab";
import { OrderActivityTab } from "./tabs/activity-tab";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IN_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  READY_FOR_PRODUCTION: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  IN_PRODUCTION: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  SHIPPED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  DELIVERED: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  READY_FOR_PRODUCTION: "Ready for Production",
  IN_PRODUCTION: "In Production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const NEXT_STATUS: Record<string, { label: string; value: string } | null> = {
  SUBMITTED: { label: "Start Review", value: "IN_REVIEW" },
  IN_REVIEW: { label: "Approve", value: "APPROVED" },
  APPROVED: { label: "Mark Ready", value: "READY_FOR_PRODUCTION" },
  READY_FOR_PRODUCTION: { label: "Start Production", value: "IN_PRODUCTION" },
  IN_PRODUCTION: { label: "Mark Shipped", value: "SHIPPED" },
  SHIPPED: { label: "Mark Delivered", value: "DELIVERED" },
  DELIVERED: { label: "Complete", value: "COMPLETED" },
  COMPLETED: null,
  CANCELLED: null,
};

const TABS = [
  { id: "overview", label: "Overview", icon: Package },
  { id: "items", label: "Line Items", icon: FileText },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "activity", label: "Activity", icon: Clock },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function OrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { data: order, isLoading } = trpc.order.get.useQuery(
    { id: orderId },
    { refetchInterval: 10_000 }
  );

  const utils = trpc.useUtils();

  const transitionMutation = trpc.order.transitionStatus.useMutation({
    onSuccess: () => {
      utils.order.get.invalidate({ id: orderId });
      setShowStatusDropdown(false);
    },
  });

  const cancelMutation = trpc.order.cancel.useMutation({
    onSuccess: () => utils.order.get.invalidate({ id: orderId }),
  });

  const duplicateMutation = trpc.order.duplicate.useMutation({
    onSuccess: (data) => router.push(`/orders/${data.id}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-gray-600" />
        <p className="mt-4 text-gray-400">Order not found</p>
        <button
          onClick={() => router.push("/orders")}
          className="mt-4 text-sm text-coral hover:text-coral-light"
        >
          Back to orders
        </button>
      </div>
    );
  }

  const nextAction = NEXT_STATUS[order.status];

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/orders")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {order.displayId}
              </h1>
              <span
                className={cn(
                  "inline-flex rounded-full border px-3 py-0.5 text-xs font-medium",
                  STATUS_COLORS[order.status] ?? "bg-gray-500/10 text-gray-400"
                )}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                  order.sourceType === "QUOTE"
                    ? "bg-brand-500/10 text-brand-400"
                    : "bg-blue-500/10 text-blue-400"
                )}
              >
                {order.sourceType === "QUOTE"
                  ? `FROM QUOTE ${order.quote?.displayId ?? ""}`
                  : "FROM CATALOG"}
              </span>
            </div>
            <h2 className="mt-1 text-lg text-gray-300">{order.title}</h2>
            {isStaff && (
              <p className="mt-0.5 text-sm text-gray-500">
                {order.company.name} &middot; {order.creator.name}
              </p>
            )}
          </div>

          {/* Actions */}
          {isStaff && (
            <div className="flex items-center gap-2">
              {nextAction && (
                <button
                  onClick={() =>
                    transitionMutation.mutate({
                      id: order.id,
                      status: nextAction.value as any,
                    })
                  }
                  disabled={transitionMutation.isPending}
                  className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
                >
                  {transitionMutation.isPending
                    ? "Updating..."
                    : nextAction.label}
                </button>
              )}

              {/* More actions dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-gray-300 hover:border-gray-500 transition-colors"
                >
                  More
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showStatusDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowStatusDropdown(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-surface-border bg-surface-card py-1 shadow-xl">
                      <button
                        onClick={() => {
                          duplicateMutation.mutate({ id: order.id });
                          setShowStatusDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate Order
                      </button>
                      {order.status !== "COMPLETED" &&
                        order.status !== "CANCELLED" &&
                        order.status !== "SHIPPED" &&
                        order.status !== "DELIVERED" && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to cancel this order?"
                                )
                              ) {
                                cancelMutation.mutate({ id: order.id });
                              }
                              setShowStatusDropdown(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Order
                          </button>
                        )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-surface-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-coral text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OrderOverviewTab order={order} isStaff={isStaff} />}
      {activeTab === "items" && <OrderLineItemsTab order={order} isStaff={isStaff} />}
      {activeTab === "shipping" && <OrderShippingTab order={order} isStaff={isStaff} />}
      {activeTab === "billing" && <OrderBillingTab order={order} isStaff={isStaff} />}
      {activeTab === "activity" && <OrderActivityTab orderId={order.id} />}
    </div>
  );
}
