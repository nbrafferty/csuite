"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  APPAREL: "Apparel",
  COMMERCIAL_PRINTING: "Print",
  SIGNAGE: "Signage",
  PROMO_ITEM: "Promo",
  OTHER: "Other",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  APPAREL: "bg-indigo-500/10 text-indigo-400",
  COMMERCIAL_PRINTING: "bg-pink-500/10 text-pink-400",
  SIGNAGE: "bg-yellow-500/10 text-yellow-400",
  PROMO_ITEM: "bg-emerald-500/10 text-emerald-400",
  OTHER: "bg-gray-500/10 text-gray-400",
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-gray-400",
  IN_PRODUCTION: "text-orange-400",
  COMPLETED: "text-emerald-400",
  CANCELLED: "text-red-400",
};

export function OrderLineItemsTab({ order, isStaff }: { order: any; isStaff: boolean }) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  const utils = trpc.useUtils();
  const deleteMutation = trpc.order.deleteLineItem.useMutation({
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
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-right">Unit Price</th>
                <th className="px-3 py-3 text-right">Line Total</th>
                {isStaff && <th className="px-3 py-3">Vendor</th>}
                <th className="px-3 py-3">Status</th>
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
                  <>
                    <tr
                      key={item.id}
                      className="bg-surface-card transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-3">
                        {sizeBreakdown && (
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
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {item.position}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm font-medium text-white">
                          {item.title}
                        </span>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                            CONTENT_TYPE_COLORS[item.contentType] ??
                              CONTENT_TYPE_COLORS.OTHER
                          )}
                        >
                          {CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-400">
                        {item.sku || "--"}
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
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            ITEM_STATUS_COLORS[item.status] ?? "text-gray-400"
                          )}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      {isStaff && (
                        <td className="px-3 py-3">
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
                        </td>
                      )}
                    </tr>
                    {isExpanded && sizeBreakdown && (
                      <tr key={`${item.id}-sizes`} className="bg-white/[0.01]">
                        <td colSpan={isStaff ? 11 : 9} className="px-8 py-3">
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
                                  <span className="ml-2 text-gray-500">×{qty}</span>
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff-only: Cost breakdown */}
      {isStaff && items.some((i: any) => i.costPerUnit || i.totalCost) && (
        <div className="rounded-xl border border-surface-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Cost Breakdown (Internal)
          </h3>
          <div className="overflow-hidden rounded-lg border border-surface-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-white/[0.02] text-xs font-medium uppercase text-gray-500">
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Cost/Unit</th>
                  <th className="px-3 py-2 text-right">Total Cost</th>
                  <th className="px-3 py-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-gray-300">{item.title}</td>
                    <td className="px-3 py-2 text-right text-gray-300">
                      ${Number(item.lineTotal).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {item.costPerUnit ? `$${Number(item.costPerUnit).toFixed(2)}` : "--"}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {item.totalCost ? `$${Number(item.totalCost).toFixed(2)}` : "--"}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-medium",
                        item.profitMargin && Number(item.profitMargin) > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}
                    >
                      {item.profitMargin
                        ? `$${Number(item.profitMargin).toFixed(2)}`
                        : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("OTHER");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [sku, setSku] = useState("");

  const utils = trpc.useUtils();
  const addMutation = trpc.order.addLineItem.useMutation({
    onSuccess: () => {
      utils.order.get.invalidate({ id: orderId });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      orderId,
      title,
      contentType: contentType as any,
      quantity,
      unitPrice,
      sku: sku || undefined,
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
          <label className="block text-xs text-gray-500 mb-1">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          >
            <option value="APPAREL">Apparel</option>
            <option value="COMMERCIAL_PRINTING">Commercial Printing</option>
            <option value="SIGNAGE">Signage</option>
            <option value="PROMO_ITEM">Promo Item</option>
            <option value="OTHER">Other</option>
          </select>
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
