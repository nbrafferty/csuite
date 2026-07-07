"use client";

import { useState } from "react";
import { X } from "lucide-react";

type QuoteItemFormData = {
  savedProductId?: string;
  description: string;
  sku?: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  decorationNotes?: string;
  sizeBreakdown?: Record<string, number>;
  sortOrder: number;
};

type QuoteItemFormProps = {
  initialData?: Partial<QuoteItemFormData>;
  onSubmit: (data: QuoteItemFormData) => void;
  onCancel: () => void;
  sortOrder?: number;
};

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function QuoteItemForm({
  initialData,
  onSubmit,
  onCancel,
  sortOrder = 0,
}: QuoteItemFormProps) {
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [color, setColor] = useState(initialData?.color ?? "");
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitPrice?.toString() ?? ""
  );
  const [quantity, setQuantity] = useState(
    initialData?.quantity?.toString() ?? ""
  );
  const [decorationNotes, setDecorationNotes] = useState(
    initialData?.decorationNotes ?? ""
  );
  const [showSizes, setShowSizes] = useState(
    !!initialData?.sizeBreakdown &&
      Object.keys(initialData.sizeBreakdown).length > 0
  );
  const [sizeBreakdown, setSizeBreakdown] = useState<Record<string, string>>(
    () => {
      if (initialData?.sizeBreakdown) {
        return Object.fromEntries(
          Object.entries(initialData.sizeBreakdown).map(([k, v]) => [
            k,
            v.toString(),
          ])
        );
      }
      return {};
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !unitPrice || !quantity) return;

    const sizes = showSizes
      ? Object.fromEntries(
          Object.entries(sizeBreakdown)
            .filter(([, v]) => v && parseInt(v) > 0)
            .map(([k, v]) => [k, parseInt(v)])
        )
      : undefined;

    onSubmit({
      savedProductId: initialData?.savedProductId,
      description: description.trim(),
      sku: sku.trim() || undefined,
      color: color.trim() || undefined,
      unitPrice: parseFloat(unitPrice),
      quantity: parseInt(quantity),
      decorationNotes: decorationNotes.trim() || undefined,
      sizeBreakdown:
        sizes && Object.keys(sizes).length > 0 ? sizes : undefined,
      sortOrder: initialData?.sortOrder ?? sortOrder,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Description *
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Bella+Canvas 3001 — Heather Navy"
          className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            SKU
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            Color
          </label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            Unit Price *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            Quantity *
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Decoration Notes
        </label>
        <textarea
          value={decorationNotes}
          onChange={(e) => setDecorationNotes(e.target.value)}
          placeholder="e.g. Left chest logo, 1-color white"
          rows={2}
          className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
        />
      </div>

      {/* Size breakdown toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowSizes(!showSizes)}
          className="text-sm font-medium text-coral hover:text-coral-light"
        >
          {showSizes ? "Remove size breakdown" : "+ Add size breakdown"}
        </button>
        {showSizes && (
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {SIZE_OPTIONS.map((size) => (
              <div key={size}>
                <label className="mb-0.5 block text-center text-xs text-gray-500">
                  {size}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={sizeBreakdown[size] ?? ""}
                  onChange={(e) =>
                    setSizeBreakdown((prev) => ({
                      ...prev,
                      [size]: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-surface-border bg-surface-secondary px-2 py-1.5 text-center text-sm text-white focus:border-coral focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark"
        >
          {initialData?.description ? "Update Item" : "Add Item"}
        </button>
      </div>
    </form>
  );
}
