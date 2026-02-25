"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  SENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  REVISION_REQUESTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REVISED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CONVERTED: "bg-green-500/10 text-green-400 border-green-500/20",
  DECLINED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent to Client",
  REVISION_REQUESTED: "Changes Requested",
  REVISED: "Revised",
  APPROVED: "Approved",
  CONVERTED: "Converted to Order",
  DECLINED: "Declined",
};

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const isAdmin = ["CLIENT_ADMIN", "CCC_STAFF"].includes(
    (session?.user as any)?.role ?? ""
  );
  const [changeComment, setChangeComment] = useState("");
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const { data: quote, isLoading } = trpc.quote.get.useQuery(
    { id },
    { refetchInterval: 10_000 }
  );

  const utils = trpc.useUtils();

  const sendMutation = trpc.quote.send.useMutation({
    onSuccess: () => utils.quote.get.invalidate({ id }),
  });

  const approveMutation = trpc.quote.approve.useMutation({
    onSuccess: (order) => router.push(`/orders/${order.id}`),
  });

  const declineMutation = trpc.quote.decline.useMutation({
    onSuccess: () => {
      utils.quote.get.invalidate({ id });
      setShowDeclineForm(false);
    },
  });

  const requestChangesMutation = trpc.quote.requestChanges.useMutation({
    onSuccess: () => {
      utils.quote.get.invalidate({ id });
      setShowChangeForm(false);
      setChangeComment("");
    },
  });

  const reviseMutation = trpc.quote.revise.useMutation({
    onSuccess: () => utils.quote.get.invalidate({ id }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-400">Quote not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => router.push("/quotes")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quotes
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {quote.displayId}
            </h1>
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-0.5 text-xs font-medium",
                QUOTE_STATUS_COLORS[quote.status]
              )}
            >
              {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
            </span>
            <span className="text-xs text-gray-500">v{quote.version}</span>
          </div>
          <h2 className="mt-1 text-lg text-gray-300">{quote.title}</h2>
          {isStaff && (
            <p className="mt-0.5 text-sm text-gray-500">
              {quote.company.name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Staff: Send / Revise */}
          {isStaff && (quote.status === "DRAFT" || quote.status === "REVISED") && (
            <button
              onClick={() => sendMutation.mutate({ id: quote.id })}
              disabled={sendMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send to Client
            </button>
          )}
          {isStaff && quote.status === "REVISION_REQUESTED" && (
            <button
              onClick={() => reviseMutation.mutate({ id: quote.id })}
              disabled={reviseMutation.isPending}
              className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              Submit Revision
            </button>
          )}

          {/* Client: Approve / Request Changes / Decline */}
          {!isStaff && quote.status === "SENT" && (
            <>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (confirm("Approve this quote? It will be converted to an active order.")) {
                      approveMutation.mutate({ id: quote.id });
                    }
                  }}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {approveMutation.isPending ? "Approving..." : "Approve Quote"}
                </button>
              )}
              <button
                onClick={() => setShowChangeForm(!showChangeForm)}
                className="flex items-center gap-2 rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Request Changes
              </button>
              <button
                onClick={() => setShowDeclineForm(!showDeclineForm)}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:border-red-500 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Decline
              </button>
            </>
          )}

          {/* Link to order if converted */}
          {quote.order && (
            <button
              onClick={() => router.push(`/orders/${quote.order!.id}`)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-600/20 transition-colors"
            >
              View Order {quote.order.displayId}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Request changes form */}
      {showChangeForm && (
        <div className="mb-6 rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Request Changes
          </h3>
          <textarea
            value={changeComment}
            onChange={(e) => setChangeComment(e.target.value)}
            rows={3}
            placeholder="Describe the changes you'd like..."
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none resize-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowChangeForm(false)}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                requestChangesMutation.mutate({
                  id: quote.id,
                  comment: changeComment,
                })
              }
              disabled={
                !changeComment.trim() || requestChangesMutation.isPending
              }
              className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Decline form */}
      {showDeclineForm && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-surface-card p-6">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Decline Quote
          </h3>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
            placeholder="Reason for declining (optional)"
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none resize-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowDeclineForm(false)}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                declineMutation.mutate({
                  id: quote.id,
                  reason: declineReason || undefined,
                })
              }
              disabled={declineMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      )}

      {/* Quote details & notes */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Valid Until
          </h3>
          <p className="text-sm text-gray-300">
            {quote.validUntil
              ? new Date(quote.validUntil).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "No expiration"}
          </p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Created By
          </h3>
          <p className="text-sm text-gray-300">{quote.creator.name}</p>
          <p className="text-xs text-gray-500">{quote.creator.email}</p>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Source Request
          </h3>
          <p className="text-sm text-gray-300">
            {quote.quoteRequest?.title ?? "Standalone quote"}
          </p>
        </div>
      </div>

      {quote.notes && (
        <div className="mb-6 rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Notes
          </h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {quote.notes}
          </p>
        </div>
      )}

      {/* Line items */}
      <div className="mb-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Line Items
        </h3>
        {quote.lineItems?.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-surface-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {quote.lineItems.map((item: any) => (
                  <tr
                    key={item.id}
                    className="bg-surface-card"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.position}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">
                        {item.title}
                      </span>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-white">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white">
                      ${Number(item.lineTotal).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-border bg-surface-card py-12 text-center text-sm text-gray-500">
            No line items
          </div>
        )}
      </div>

      {/* Pricing summary */}
      <div className="mb-6 rounded-xl border border-surface-border bg-surface-card p-6">
        <div className="space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-300">
              ${Number(quote.subtotal).toFixed(2)}
            </span>
          </div>
          {Number(quote.feeAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fees</span>
              <span className="text-gray-300">
                ${Number(quote.feeAmount).toFixed(2)}
              </span>
            </div>
          )}
          {Number(quote.shippingAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="text-gray-300">
                ${Number(quote.shippingAmount).toFixed(2)}
              </span>
            </div>
          )}
          {Number(quote.taxAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-300">
                ${Number(quote.taxAmount).toFixed(2)}
              </span>
            </div>
          )}
          {Number(quote.discountAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-emerald-400">
                -${Number(quote.discountAmount).toFixed(2)}
              </span>
            </div>
          )}
          <div className="border-t border-surface-border pt-2">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-white">
                ${Number(quote.totalAmount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revision comments */}
      {quote.revisionComments?.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Comments & Revision History
          </h3>
          <div className="space-y-3">
            {quote.revisionComments.map((comment: any) => (
              <div
                key={comment.id}
                className="rounded-lg bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-300">
                    {comment.author.name}
                  </span>
                  <span>&middot;</span>
                  <span>v{comment.version}</span>
                  <span>&middot;</span>
                  <span>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-300">{comment.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
