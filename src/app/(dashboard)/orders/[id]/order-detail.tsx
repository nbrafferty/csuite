"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronDown,
  XCircle,
  Package,
  FileText,
  Truck,
  CreditCard,
  Clock,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { OrderOverviewTab } from "./tabs/overview-tab";
import { OrderLineItemsTab } from "./tabs/line-items-tab";
import { OrderShippingTab } from "./tabs/shipping-tab";
import { OrderBillingTab } from "./tabs/billing-tab";
import { OrderActivityTab } from "./tabs/activity-tab";
import { OrderTasksTab } from "./tabs/tasks-tab";

const NEXT_STATUS: Record<string, { label: string; value: string } | null> = {
  SUBMITTED: { label: "Start Review", value: "IN_REVIEW" },
  IN_REVIEW: { label: "Send Proofs", value: "PROOFING" },
  PROOFING: { label: "Approve", value: "APPROVED" },
  APPROVED: { label: "Start Production", value: "IN_PRODUCTION" },
  IN_PRODUCTION: { label: "Mark Ready", value: "READY" },
  READY: { label: "Mark Shipped", value: "SHIPPED" },
  SHIPPED: { label: "Complete", value: "COMPLETED" },
  COMPLETED: null,
  CANCELLED: null,
};

const TABS = [
  { id: "overview", label: "Overview", icon: Package },
  { id: "items", label: "Line Items", icon: FileText },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
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
                {order.number}
              </h1>
              <OrderStatusBadge status={order.status} />
              {order.source === "QUOTE" && order.quote && (
                <span className="inline-flex rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-medium text-brand-400">
                  FROM QUOTE {order.quote.number}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg text-gray-300">{order.title}</h2>
            {isStaff && (
              <p className="mt-0.5 text-sm text-gray-500">
                {order.company.name} &middot; {order.createdBy.name}
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
                      {order.status !== "COMPLETED" &&
                        order.status !== "CANCELLED" && (
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

        {/* Status Timeline */}
        <div className="mt-4">
          <OrderStatusTimeline status={order.status} />
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
      {activeTab === "tasks" && <OrderTasksTab orderId={order.id} isStaff={isStaff} />}
      {activeTab === "billing" && <OrderBillingTab order={order} isStaff={isStaff} />}
      {activeTab === "activity" && <OrderActivityTab orderId={order.id} />}
    </div>
  );
}
