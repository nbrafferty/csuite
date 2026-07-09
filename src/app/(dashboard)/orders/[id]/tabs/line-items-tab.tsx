"use client";

import { Fragment, useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ChevronDown, ChevronRight, BookmarkPlus } from "lucide-react";

export function OrderLineItemsTab({ order, isStaff }: { order: any; isStaff: boolean }) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  const utils = trpc.useUtils();
  const promoteMutation = trpc.clientProduct.promoteFromLineItem.useMutation({
    onSuccess: (product) => {
      alert(`Saved "${product.name}" to the client's My Products.`);
    },
    onError: (err) => alert(err.message),
  });
  const deleteMutation = trpc.order.removeItem.useMutation({
    onSuccess: () => utils.order.get.invalidate({ id: order.id }),
  });

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const items = order.items ?? [];

  return (
    <div className="space-y-4">
      {isStaff && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Line Item
          </button>
        </div>
      )}

      {showAddForm && isStaff && (
        <AddLineItemForm
          orderId={order.id}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-16 text-center">
          <p className="text-gray-400">No line items yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="w-8 px-3 py-3"></th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Color</th>
                <th className="px-3 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-right">Unit Price</th>
                <th className="px-3 py-3 text-right">Line Total</th>
                {isStaff && <th className="px-3 py-3">Vendor</th>}
                {isStaff && <th className="w-10 px-3 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {items.map((item: any) => {
                const isExpanded = expandedItems.has(item.id);
                const sizeBreakdown =
                  item.sizeBreakdown &&
                  typeof item.sizeBreakdown === "object" &&
                  !Array.isArray(item.sizeBreakdown)
                    ? item.sizeBreakdown
                    : null;

                return (
                  <Fragment key={item.id}><tr
                      className="bg-surface-card transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-3">
                        {(sizeBreakdown || (item.imprints ?? []).length > 0) && (
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="text-gray-500 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm font-medium text-white">
                          {item.description}
                        </span>
                        {item.decorationNotes && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                            {item.decorationNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-400">
                        {item.sku || "--"}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-400">
                        {item.color || "--"}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-white">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-3 text-right text-sm text-gray-300">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-white">
                        ${Number(item.lineTotal).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      {isStaff && (
                        <td className="px-3 py-3 text-sm text-gray-400">
                          {item.vendor?.name ?? (
                            <span className="text-gray-600">Unassigned</span>
                          )}
                        </td>
                      )}
                      {isStaff && (
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => promoteMutation.mutate({ orderItemId: item.id })}
                              disabled={promoteMutation.isPending}
                              title="Save as My Product"
                              className="text-gray-600 hover:text-coral transition-colors disabled:opacity-50"
                            >
                              <BookmarkPlus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Remove this line item?")) {
                                  deleteMutation.mutate({ id: item.id });
                                }
                              }}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (sizeBreakdown || (item.imprints ?? []).length > 0) && (
                      <tr className="bg-white/[0.01]">
                        <td colSpan={isStaff ? 9 : 7} className="px-8 py-3">
                          {sizeBreakdown && (
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(sizeBreakdown as Record<string, number>).map(
                                ([size, qty]) => (
                                  <div
                                    key={size}
                                    className="rounded-lg bg-surface-border/30 px-3 py-1.5 text-xs"
                                  >
                                    <span className="font-medium text-gray-300">
                                      {size}
                                    </span>
                                    <span className="ml-2 text-gray-500">{qty}</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                          {(item.imprints ?? []).length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {(item.imprints ?? []).map((imp: any) => {
                                const methodLabel = String(imp.method)
                                  .replace(/_/g, " ")
                                  .toLowerCase()
                                  .replace(/\b\w/g, (c: string) => c.toUpperCase());
                                const thumb = imp.artworkAsset?.versions?.[0]?.thumbnailUrl;
                                return (
                                  <div key={imp.id} className="flex items-center gap-2 text-xs text-gray-400">
                                    {thumb ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={thumb} alt="" className="h-6 w-6 rounded object-cover" />
                                    ) : null}
                                    <span>
                                      <span className="font-medium text-gray-300">{methodLabel}</span>
                                      {imp.colorCount ? `, ${imp.colorCount}-color` : ""}
                                      {imp.placement ? ` — ${imp.placement}` : ""}
                                      {imp.widthIn || imp.heightIn
                                        ? ` ${imp.widthIn ?? "?"}\" × ${imp.heightIn ?? "?"}\"`
                                        : ""}
                                      {imp.artworkAsset
                                        ? ` · ${imp.artworkAsset.name || imp.artworkAsset.filename}`
                                        : ""}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Fee lines */}
          {((order as any).fees ?? []).length > 0 && (
            <div className="border-t border-surface-border">
              {((order as any).fees ?? []).map((fee: any) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-gray-400">{fee.description}</span>
                  <span className="text-gray-300">
                    {fee.quantity} × ${Number(fee.unitAmount).toFixed(2)} = $
                    {(Number(fee.unitAmount) * fee.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total row */}
          <div className="flex items-center justify-between border-t border-surface-border bg-surface-card px-3 py-3">
            <span className="text-sm font-medium text-gray-400">Order Total</span>
            <span className="text-lg font-bold text-white">
              ${Number(order.totalAmount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function AddLineItemForm({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [sku, setSku] = useState("");
  const [color, setColor] = useState("");

  const utils = trpc.useUtils();
  const addMutation = trpc.order.addItem.useMutation({
    onSuccess: () => {
      utils.order.get.invalidate({ id: orderId });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      orderId,
      description,
      quantity,
      unitPrice,
      sku: sku || undefined,
      color: color || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-surface-border bg-surface-card p-6"
    >
      <h3 className="mb-4 text-sm font-semibold text-white">Add Line Item</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
          <input
            type="number"
            min={0}
            step={0.01}
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
        >
          {addMutation.isPending ? "Adding..." : "Add Item"}
        </button>
      </div>
    </form>
  );
}
