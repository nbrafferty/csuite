"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { QuoteStatusBadge } from "./quote-status-badge";
import { QuoteItemCard } from "./quote-item-card";
import { PaymentTermsSummaryCard } from "./payment-terms-display";
import { ChangeRequestForm } from "./change-request-form";
import { MockupUpload } from "./mockup-upload";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

type QuoteClientDetailProps = {
  quoteId: string;
};

export function QuoteClientDetail({ quoteId }: QuoteClientDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const isAdmin = (session?.user as any)?.role === "CLIENT_ADMIN";

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showChangeRequestForm, setShowChangeRequestForm] = useState(false);

  const { data: quote, isLoading } = trpc.quote.getById.useQuery(
    { id: quoteId },
    { refetchInterval: 30_000 }
  );

  const approve = trpc.quote.approve.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId });
      setShowApproveDialog(false);
    },
  });

  const decline = trpc.quote.decline.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId });
      setShowDeclineDialog(false);
    },
  });

  const requestChanges = trpc.quote.requestChanges.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId });
      setShowChangeRequestForm(false);
    },
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
      <div className="py-20 text-center">
        <p className="text-gray-500">Quote not found.</p>
      </div>
    );
  }

  const total = quote.items.reduce(
    (sum, i) => sum + Number(i.lineTotal),
    0
  );

  // Check expiration
  const daysUntilExpiry = quote.expiresAt
    ? differenceInDays(new Date(quote.expiresAt), new Date())
    : null;
  const isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back nav */}
      <button
        onClick={() => router.push("/quotes")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Quotes
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {quote.title}
            </h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {quote.number} · Sent{" "}
            {quote.sentAt
              ? format(new Date(quote.sentAt), "MMM d, yyyy")
              : "—"}
          </p>
        </div>
      </div>

      {/* Expiration warning */}
      {isExpiringSoon && quote.status === "SENT" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <p className="text-sm text-yellow-400">
            This quote expires in {daysUntilExpiry} day
            {daysUntilExpiry !== 1 ? "s" : ""} (
            {format(new Date(quote.expiresAt!), "MMM d, yyyy")})
          </p>
        </div>
      )}

      {isExpired && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p className="text-sm text-red-400">
            This quote expired on{" "}
            {format(new Date(quote.expiresAt!), "MMM d, yyyy")}
          </p>
        </div>
      )}

      {/* Client message callout */}
      {quote.clientMessage && (
        <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-blue-400">
            Message from CCC
          </p>
          <p className="text-sm text-blue-300/80">{quote.clientMessage}</p>
        </div>
      )}

      {/* Status-specific notices */}
      {quote.status === "CHANGES_REQUESTED" && (
        <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <p className="text-sm font-medium text-yellow-400">
              Waiting for CCC to update this quote
            </p>
          </div>
          {quote.changeRequests?.[0] && (
            <div className="mt-2 border-t border-yellow-500/10 pt-2">
              <p className="text-xs text-gray-500">Your change request:</p>
              <p className="mt-0.5 text-sm text-yellow-300/80">
                {quote.changeRequests[0].message}
              </p>
            </div>
          )}
        </div>
      )}

      {quote.status === "APPROVED" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-400">
              This quote has been approved
            </p>
            {quote.approvedAt && (
              <p className="text-xs text-gray-500">
                Approved on{" "}
                {format(new Date(quote.approvedAt), "MMM d, yyyy")}
              </p>
            )}
            <p className="mt-0.5 text-xs text-gray-500">
              Waiting for CCC to begin processing your order.
            </p>
          </div>
        </div>
      )}

      {quote.status === "CONVERTED" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3">
          <ArrowRight className="h-4 w-4 text-purple-400" />
          <div>
            <p className="text-sm font-medium text-purple-400">
              This quote has been converted to an order
            </p>
            {quote.convertedOrder && (
              <a
                href={`/orders/${quote.convertedOrder.id}`}
                className="mt-0.5 text-xs text-purple-400 underline hover:text-purple-300"
              >
                View order
              </a>
            )}
          </div>
        </div>
      )}

      {/* Line items */}
      <div className="mb-6 rounded-xl border border-[#333338] bg-[#1A1A1E] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Items</h2>

        <div className="space-y-3">
          {quote.items.map((item) => (
            <QuoteItemCard
              key={item.id}
              item={{
                ...item,
                unitPrice: Number(item.unitPrice),
                lineTotal: Number(item.lineTotal),
                sizeBreakdown: item.sizeBreakdown as Record<
                  string,
                  number
                > | null,
              }}
            />
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex items-center justify-between border-t border-[#333338] pt-4">
          <span className="text-sm font-medium text-gray-400">
            Quote Total
          </span>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Mockups */}
      {quote.mockupUrl && (
        <div className="mb-6 rounded-xl border border-[#333338] bg-[#1A1A1E] p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Mockups</h2>
          <MockupUpload
            mockupUrl={quote.mockupUrl}
            onUpload={() => {}}
            onRemove={() => {}}
            editable={false}
          />
        </div>
      )}

      {/* Payment terms */}
      <div className="mb-6">
        <PaymentTermsSummaryCard
          paymentTermType={quote.paymentTermType}
          depositPercent={quote.depositPercent}
          netDays={quote.netDays}
          total={total}
        />
      </div>

      {/* Actions (only for SENT quotes) */}
      {quote.status === "SENT" && (
        <div className="space-y-3">
          {/* Change request form */}
          {showChangeRequestForm ? (
            <div className="rounded-xl border border-[#333338] bg-[#1A1A1E] p-5">
              <h3 className="mb-3 text-lg font-semibold text-white">
                Request Changes
              </h3>
              <ChangeRequestForm
                items={quote.items.map((i) => ({
                  id: i.id,
                  description: i.description,
                }))}
                onSubmit={(data) =>
                  requestChanges.mutate({ id: quoteId, ...data })
                }
                onCancel={() => setShowChangeRequestForm(false)}
                isLoading={requestChanges.isPending}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              {isAdmin && (
                <button
                  onClick={() => setShowApproveDialog(true)}
                  className="flex-1 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
                >
                  Approve Quote
                </button>
              )}
              <button
                onClick={() => setShowChangeRequestForm(true)}
                className="flex-1 rounded-lg border border-[#333338] px-6 py-3 text-sm font-medium text-gray-400 hover:text-white"
              >
                Request Changes
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowDeclineDialog(true)}
                  className="rounded-lg px-6 py-3 text-sm font-medium text-gray-600 hover:text-red-400"
                >
                  Decline
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Approve confirmation dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-[#333338] bg-[#0D0D0F] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Approve Quote?
            </h3>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-400">
                Total: <strong className="text-white">{formatCurrency(total)}</strong>
              </p>
              <p className="text-sm text-gray-400">
                Payment:{" "}
                {quote.paymentTermType === "FULL"
                  ? "Pay in full before production"
                  : quote.paymentTermType === "DEPOSIT"
                  ? `${quote.depositPercent ?? 50}% deposit (${formatCurrency(
                      total * ((quote.depositPercent ?? 50) / 100)
                    )})`
                  : `Net ${quote.netDays ?? 30} days`}
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              By approving, you agree to the terms above.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowApproveDialog(false)}
                className="rounded-lg border border-[#333338] px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => approve.mutate({ id: quoteId })}
                disabled={approve.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approve.isPending ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline confirmation dialog */}
      {showDeclineDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-[#333338] bg-[#0D0D0F] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Decline Quote?
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Are you sure you want to decline this quote? This action cannot be
              undone. If you need changes, use &quot;Request Changes&quot;
              instead.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeclineDialog(false)}
                className="rounded-lg border border-[#333338] px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => decline.mutate({ id: quoteId })}
                disabled={decline.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {decline.isPending ? "Declining..." : "Decline Quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
