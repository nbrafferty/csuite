"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, RotateCcw, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface ReorderDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  isStaff: boolean;
}

/**
 * Confirmation screen for one-click reorder: shows the cloned line items
 * with editable size grids / quantities, then creates a DRAFT quote.
 * Staff jump straight into the quote editor; clients get a confirmation
 * that the request landed in the staff queue.
 */
export function ReorderDialog({ open, onClose, orderId, isStaff }: ReorderDialogProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submittedNumber, setSubmittedNumber] = useState("");
  // Per-item edited size grids (itemId → size → string qty) and plain quantities
  const [sizeEdits, setSizeEdits] = useState<Record<string, Record<string, string>>>({});
  const [qtyEdits, setQtyEdits] = useState<Record<string, string>>({});

  const { data: order } = trpc.order.get.useQuery(
    { id: orderId },
    { enabled: open }
  );

  const reorder = trpc.order.reorder.useMutation({
    onSuccess: (quote) => {
      if (isStaff) {
        router.push(`/quotes/${quote.id}`);
      } else {
        setSubmittedNumber(quote.number);
      }
    },
    onError: (err) => setError(err.message),
  });

  const items = useMemo(() => (order as any)?.items ?? [], [order]);
  const fees = (order as any)?.fees ?? [];

  const itemState = (item: any) => {
    const originalSizes =
      item.sizeBreakdown && typeof item.sizeBreakdown === "object"
        ? (item.sizeBreakdown as Record<string, number>)
        : null;
    const edited = sizeEdits[item.id];
    const sizes = originalSizes
      ? Object.fromEntries(
          SIZE_OPTIONS.filter((sz) => edited?.[sz] !== undefined || originalSizes[sz] !== undefined).map(
            (sz) => [sz, edited?.[sz] ?? String(originalSizes[sz] ?? "")]
          )
        )
      : null;
    const sizeSum = sizes
      ? Object.values(sizes).reduce((a, v) => a + (parseInt(v) || 0), 0)
      : 0;
    const qty = sizes
      ? sizeSum
      : parseInt(qtyEdits[item.id] ?? String(item.quantity)) || 0;
    return { sizes, qty };
  };

  const total =
    items.reduce((sum: number, item: any) => {
      const { qty } = itemState(item);
      return sum + Number(item.unitPrice) * qty;
    }, 0) +
    fees.reduce((sum: number, f: any) => sum + Number(f.unitAmount) * f.quantity, 0);

  const handleSubmit = () => {
    setError("");
    const overrides = items.map((item: any) => {
      const { sizes, qty } = itemState(item);
      return {
        itemId: item.id,
        quantity: sizes ? undefined : qty,
        sizeBreakdown: sizes
          ? Object.fromEntries(
              Object.entries(sizes)
                .filter(([, v]) => parseInt(v) > 0)
                .map(([k, v]) => [k, parseInt(v)])
            )
          : undefined,
      };
    });
    reorder.mutate({ orderId, overrides });
  };

  const handleClose = () => {
    setSizeEdits({});
    setQtyEdits({});
    setError("");
    setSubmittedNumber("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-surface-border bg-surface-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg uppercase tracking-display text-foreground">
            <RotateCcw className="h-5 w-5 text-coral" />
            Reorder
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-foreground-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedNumber ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Reorder request {submittedNumber} sent! Our team will review it
              and send you a quote to approve.
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark"
              >
                Done
              </button>
            </div>
          </div>
        ) : !order ? (
          <p className="py-8 text-center text-sm text-foreground-muted">Loading order...</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-foreground-secondary">
              Everything from <strong className="text-foreground">{(order as any).number}</strong> —
              specs, imprints, and approved artwork — is carried over. Adjust
              quantities if you need different numbers this time.
            </p>

            <div className="space-y-3">
              {items.map((item: any) => {
                const { sizes, qty } = itemState(item);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-surface-border bg-surface-secondary p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.description}</p>
                        {(item.imprints ?? []).length > 0 && (
                          <p className="mt-0.5 text-xs text-foreground-muted">
                            {(item.imprints ?? [])
                              .map((imp: any) =>
                                [
                                  imp.method.replace(/_/g, " ").toLowerCase(),
                                  imp.placement,
                                ]
                                  .filter(Boolean)
                                  .join(" — ")
                              )
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-medium text-foreground">
                        {qty} × {formatCurrency(Number(item.unitPrice))} ={" "}
                        {formatCurrency(qty * Number(item.unitPrice))}
                      </p>
                    </div>

                    {sizes ? (
                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {Object.keys(sizes).map((size) => (
                          <div key={size}>
                            <label className="mb-0.5 block text-center text-xs text-foreground-muted">
                              {size}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={sizes[size]}
                              onChange={(e) =>
                                setSizeEdits((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...(prev[item.id] ?? sizes),
                                    [size]: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-center text-sm text-foreground focus:border-coral focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-xs text-foreground-muted">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={qtyEdits[item.id] ?? String(item.quantity)}
                          onChange={(e) =>
                            setQtyEdits((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="w-24 rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-sm text-foreground focus:border-coral focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {fees.map((fee: any) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-secondary px-4 py-2.5 text-sm"
                >
                  <span className="text-foreground-secondary">{fee.description}</span>
                  <span className="text-foreground">
                    {fee.quantity} × {formatCurrency(Number(fee.unitAmount))}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-surface-border pt-3">
              <span className="text-sm font-medium text-foreground-secondary">Estimated total</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-foreground-muted">
              Final pricing is confirmed on the quote{isStaff ? "" : " our team sends back"}.
            </p>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={reorder.isPending || total <= 0}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
              >
                {reorder.isPending
                  ? "Creating..."
                  : isStaff
                    ? "Create Draft Quote"
                    : "Submit Reorder"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
