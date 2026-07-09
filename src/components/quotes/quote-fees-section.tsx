"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Fee = {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number | string;
};

const formatCurrency = (n: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n));

export function QuoteFeesSection({
  quoteId,
  fees,
  editable,
}: {
  quoteId: string;
  fees: Fee[];
  editable: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitAmount, setUnitAmount] = useState("");

  const utils = trpc.useUtils();
  const addFee = trpc.quote.addFee.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId });
      setDescription("");
      setQuantity("1");
      setUnitAmount("");
      setShowForm(false);
    },
  });
  const removeFee = trpc.quote.removeFee.useMutation({
    onSuccess: () => utils.quote.getById.invalidate({ id: quoteId }),
  });

  if (fees.length === 0 && !editable) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Fees & Upcharges</h3>
        {editable && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm font-medium text-coral hover:text-coral-light"
          >
            <Plus className="h-3.5 w-3.5" />
            Add fee
          </button>
        )}
      </div>

      {fees.length > 0 && (
        <div className="space-y-1.5">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-secondary px-3 py-2"
            >
              <p className="min-w-0 flex-1 truncate text-sm text-gray-300">
                {fee.description}
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-gray-500">
                  {fee.quantity} × {formatCurrency(fee.unitAmount)}
                </span>
                <span className="text-sm font-medium text-white">
                  {formatCurrency(Number(fee.unitAmount) * fee.quantity)}
                </span>
                {editable && (
                  <button
                    onClick={() => removeFee.mutate({ feeId: fee.id })}
                    className="rounded p-1 text-gray-500 transition-colors hover:text-red-400"
                    aria-label="Remove fee"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!description.trim() || !unitAmount) return;
            addFee.mutate({
              quoteId,
              description: description.trim(),
              quantity: parseInt(quantity) || 1,
              unitAmount: parseFloat(unitAmount),
            });
          }}
          className="mt-2 flex items-end gap-2 rounded-lg border border-coral/30 bg-surface-secondary p-3"
        >
          <div className="flex-1">
            <label className="mb-0.5 block text-xs text-gray-500">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. XXL Upcharge"
              className="w-full rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
              autoFocus
            />
          </div>
          <div className="w-16">
            <label className="mb-0.5 block text-xs text-gray-500">Qty</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-sm text-white focus:border-coral focus:outline-none"
            />
          </div>
          <div className="w-24">
            <label className="mb-0.5 block text-xs text-gray-500">Amount</label>
            <input
              type="number"
              step="0.01"
              value={unitAmount}
              onChange={(e) => setUnitAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={addFee.isPending}
            className="rounded-md bg-coral px-3 py-1.5 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="rounded-md px-2 py-1.5 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
