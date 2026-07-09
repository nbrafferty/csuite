"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Package, RotateCcw, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const formatCurrency = (n: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n));

const methodLabel = (m: string) =>
  m.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function MyProductsPage() {
  const [reorderProduct, setReorderProduct] = useState<any | null>(null);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  const { data: products, isLoading } = trpc.clientProduct.list.useQuery();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl uppercase tracking-display text-white">
          My Products
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Your saved products with approved artwork — reorder in a few clicks.
        </p>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-gray-500">Loading...</p>
      ) : (products ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-20 text-center">
          <Package className="h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No saved products yet</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            After your first order, we&apos;ll save your products here with
            approved artwork so repeat orders take seconds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((product: any) => (
            <div
              key={product.id}
              className="flex flex-col rounded-xl border border-surface-border bg-surface-card p-5 transition-colors hover:border-gray-600"
            >
              <button
                onClick={() => setDetailProductId(product.id)}
                className="min-w-0 text-left"
              >
                <p className="truncate text-base font-semibold text-white hover:text-coral-light">
                  {product.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {[
                    [product.blankBrand, product.blankStyle].filter(Boolean).join(" "),
                    product.color,
                    product.category,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </button>

              {/* Imprint thumbnails */}
              {(product.imprints ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.imprints.map((imp: any) => {
                    const thumb = imp.artworkAsset?.versions?.[0]?.thumbnailUrl;
                    return (
                      <div
                        key={imp.id}
                        className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-secondary px-2 py-1"
                        title={`${methodLabel(imp.method)}${imp.placement ? ` — ${imp.placement}` : ""}`}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-6 w-6 rounded object-cover" />
                        ) : null}
                        <span className="text-[10px] text-gray-400">
                          {imp.placement ?? methodLabel(imp.method)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {product.stats.lastOrdered
                    ? `Last ordered ${product.stats.lastOrderedQty} on ${format(new Date(product.stats.lastOrdered), "MMM d, yyyy")}`
                    : "Not ordered yet"}
                </span>
                <span className="font-medium text-gray-300">
                  {formatCurrency(product.defaultUnitPrice)}/ea
                </span>
              </div>

              <button
                onClick={() => setReorderProduct(product)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
              >
                <RotateCcw className="h-4 w-4" />
                Reorder this
              </button>
            </div>
          ))}
        </div>
      )}

      {reorderProduct && (
        <ProductReorderDialog
          product={reorderProduct}
          onClose={() => setReorderProduct(null)}
        />
      )}
      {detailProductId && (
        <ProductDetailDialog
          productId={detailProductId}
          onClose={() => setDetailProductId(null)}
          onReorder={(p) => {
            setDetailProductId(null);
            setReorderProduct(p);
          }}
        />
      )}
    </div>
  );
}

function ProductReorderDialog({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const curve = (product.defaultSizeCurve ?? null) as Record<string, number> | null;
  const [sizes, setSizes] = useState<Record<string, string>>(() =>
    curve
      ? Object.fromEntries(
          SIZE_OPTIONS.filter((s) => curve[s] !== undefined).map((s) => [
            s,
            String(curve[s]),
          ])
        )
      : {}
  );
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [submittedNumber, setSubmittedNumber] = useState("");

  const reorder = trpc.clientProduct.reorder.useMutation({
    onSuccess: (q) => setSubmittedNumber(q.number),
    onError: (err) => setError(err.message),
  });

  const usingSizes = curve !== null;
  const sizeSum = Object.values(sizes).reduce((a, v) => a + (parseInt(v) || 0), 0);
  const qty = usingSizes ? sizeSum : parseInt(quantity) || 0;
  const total = qty * Number(product.defaultUnitPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-surface-border bg-surface-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-display text-white">
            Reorder
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedNumber ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
              Reorder request {submittedNumber} sent! We&apos;ll send you a
              quote to approve shortly.
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              <span className="font-medium text-white">{product.name}</span>
              {" — "}
              {formatCurrency(product.defaultUnitPrice)}/ea. Specs and artwork
              carry over from your approved original.
            </p>

            {usingSizes ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {Object.keys(sizes).map((size) => (
                  <div key={size}>
                    <label className="mb-0.5 block text-center text-xs text-gray-500">
                      {size}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sizes[size]}
                      onChange={(e) =>
                        setSizes((prev) => ({ ...prev, [size]: e.target.value }))
                      }
                      className="w-full rounded-md border border-surface-border bg-surface-secondary px-2 py-1.5 text-center text-sm text-white focus:border-coral focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-32 rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-surface-border pt-3 text-sm">
              <span className="text-gray-400">{qty} units</span>
              <span className="font-bold text-white">{formatCurrency(total)}</span>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setError("");
                  reorder.mutate({
                    productId: product.id,
                    sizeBreakdown: usingSizes
                      ? Object.fromEntries(
                          Object.entries(sizes)
                            .filter(([, v]) => parseInt(v) > 0)
                            .map(([k, v]) => [k, parseInt(v)])
                        )
                      : undefined,
                    quantity: usingSizes ? undefined : qty,
                  });
                }}
                disabled={reorder.isPending || qty <= 0}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
              >
                {reorder.isPending ? "Submitting..." : "Submit Reorder"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductDetailDialog({
  productId,
  onClose,
  onReorder,
}: {
  productId: string;
  onClose: () => void;
  onReorder: (product: any) => void;
}) {
  const { data: product } = trpc.clientProduct.byId.useQuery({ id: productId });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-surface-border bg-surface-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-display text-white">
            Product Detail
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!product ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">{product.name}</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {[
                  [product.blankBrand, product.blankStyle].filter(Boolean).join(" "),
                  product.itemNumber && `#${product.itemNumber}`,
                  product.color,
                  product.category,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-300">
                {formatCurrency(Number(product.defaultUnitPrice))}/ea
              </p>
            </div>

            {(product.imprints ?? []).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Imprints
                </p>
                <div className="space-y-2">
                  {product.imprints.map((imp: any) => {
                    const thumb = imp.artworkAsset?.versions?.[0]?.thumbnailUrl;
                    return (
                      <div
                        key={imp.id}
                        className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-secondary px-3 py-2"
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-9 w-9 rounded object-cover" />
                        ) : null}
                        <p className="text-xs text-gray-400">
                          <span className="font-medium text-gray-200">
                            {methodLabel(imp.method)}
                          </span>
                          {imp.colorCount ? `, ${imp.colorCount}-color` : ""}
                          {imp.placement ? ` — ${imp.placement}` : ""}
                          {imp.widthIn || imp.heightIn
                            ? ` ${imp.widthIn ?? "?"}" × ${imp.heightIn ?? "?"}"`
                            : ""}
                          <br />
                          <span className="text-gray-500">
                            {imp.artworkAsset?.name || imp.artworkAsset?.filename}
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {product.defaultSizeCurve && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Usual sizes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(product.defaultSizeCurve as Record<string, number>).map(
                    ([size, q]) => (
                      <span
                        key={size}
                        className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-gray-400"
                      >
                        {size}: {q}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Order history
              </p>
              {(product.history ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No orders yet</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-surface-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border bg-surface-secondary text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2">Order</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {product.history.map((h: any) => (
                        <tr key={h.id}>
                          <td className="px-3 py-2 font-mono text-xs text-coral">
                            {h.order.number}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-400">
                            {format(new Date(h.order.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-gray-300">
                            {h.quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-gray-300">
                            {formatCurrency(h.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => onReorder(product)}
                className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
              >
                <RotateCcw className="h-4 w-4" />
                Reorder this
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
