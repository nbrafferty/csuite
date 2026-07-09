"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export type ImprintFormData = {
  method: "SCREEN_PRINT" | "EMBROIDERY" | "DTG" | "TRANSFER" | "OTHER";
  colorCount?: number;
  placement?: string;
  widthIn?: number;
  heightIn?: number;
  artworkAssetId?: string;
  notes?: string;
};

type QuoteItemFormData = {
  savedProductId?: string;
  description: string;
  sku?: string;
  itemNumber?: string;
  color?: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  decorationNotes?: string;
  sizeBreakdown?: Record<string, number>;
  imprints?: ImprintFormData[];
  sortOrder: number;
};

type QuoteItemFormProps = {
  initialData?: Partial<QuoteItemFormData>;
  onSubmit: (data: QuoteItemFormData) => void;
  onCancel: () => void;
  sortOrder?: number;
  companyId?: string; // scopes the imprint artwork picker (staff)
};

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const CATEGORY_OPTIONS = [
  "Screen Printing",
  "Embroidery",
  "Signage",
  "Promo Items",
  "Commercial Printing",
  "Other",
];

const IMPRINT_METHODS: { value: ImprintFormData["method"]; label: string }[] = [
  { value: "SCREEN_PRINT", label: "Screen Printing" },
  { value: "EMBROIDERY", label: "Embroidery" },
  { value: "DTG", label: "DTG" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "OTHER", label: "Other" },
];

type ImprintRowState = {
  method: ImprintFormData["method"];
  colorCount: string;
  placement: string;
  widthIn: string;
  heightIn: string;
  artworkAssetId: string;
  notes: string;
};

const emptyImprint = (): ImprintRowState => ({
  method: "SCREEN_PRINT",
  colorCount: "",
  placement: "",
  widthIn: "",
  heightIn: "",
  artworkAssetId: "",
  notes: "",
});

export function QuoteItemForm({
  initialData,
  onSubmit,
  onCancel,
  sortOrder = 0,
  companyId,
}: QuoteItemFormProps) {
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [itemNumber, setItemNumber] = useState(initialData?.itemNumber ?? "");
  const [color, setColor] = useState(initialData?.color ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
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
  const [imprints, setImprints] = useState<ImprintRowState[]>(() =>
    (initialData?.imprints ?? []).map((imp) => ({
      method: imp.method,
      colorCount: imp.colorCount?.toString() ?? "",
      placement: imp.placement ?? "",
      widthIn: imp.widthIn?.toString() ?? "",
      heightIn: imp.heightIn?.toString() ?? "",
      artworkAssetId: imp.artworkAssetId ?? "",
      notes: imp.notes ?? "",
    }))
  );

  // Artwork library for the imprint picker, scoped to the quote's client
  const { data: artworkData } = trpc.artwork.list.useQuery(
    { companyId, perPage: 100 },
    { enabled: imprints.length > 0 }
  );
  const artworks = artworkData?.artworks ?? [];

  // Sum of the size grid — drives quantity when sizes are used
  const sizeSum = showSizes
    ? Object.values(sizeBreakdown).reduce(
        (sum, v) => sum + (parseInt(v) || 0),
        0
      )
    : 0;

  const updateImprint = (index: number, patch: Partial<ImprintRowState>) => {
    setImprints((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveQty = sizeSum > 0 ? sizeSum : parseInt(quantity);
    if (!description.trim() || !unitPrice || !effectiveQty) return;

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
      itemNumber: itemNumber.trim() || undefined,
      color: color.trim() || undefined,
      category: category || undefined,
      unitPrice: parseFloat(unitPrice),
      quantity: effectiveQty,
      decorationNotes: decorationNotes.trim() || undefined,
      sizeBreakdown:
        sizes && Object.keys(sizes).length > 0 ? sizes : undefined,
      imprints: imprints.map((imp) => ({
        method: imp.method,
        colorCount: imp.colorCount ? parseInt(imp.colorCount) : undefined,
        placement: imp.placement.trim() || undefined,
        widthIn: imp.widthIn ? parseFloat(imp.widthIn) : undefined,
        heightIn: imp.heightIn ? parseFloat(imp.heightIn) : undefined,
        artworkAssetId: imp.artworkAssetId || undefined,
        notes: imp.notes.trim() || undefined,
      })),
      sortOrder: initialData?.sortOrder ?? sortOrder,
    });
  };

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none";

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
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            SKU
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            Item #
          </label>
          <input
            type="text"
            value={itemNumber}
            onChange={(e) => setItemNumber(e.target.value)}
            placeholder="e.g. 5000"
            className={inputClass}
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
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-400">
            Quantity {sizeSum > 0 ? "(from sizes)" : "*"}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={sizeSum > 0 ? sizeSum.toString() : quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className={inputClass + (sizeSum > 0 ? " opacity-60" : "")}
            disabled={sizeSum > 0}
            required={sizeSum === 0}
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
          className={inputClass}
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

      {/* Imprints */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-400">
            Imprints
          </label>
          <button
            type="button"
            onClick={() => setImprints((rows) => [...rows, emptyImprint()])}
            className="flex items-center gap-1 text-sm font-medium text-coral hover:text-coral-light"
          >
            <Plus className="h-3.5 w-3.5" />
            Add imprint
          </button>
        </div>
        {imprints.length > 0 && (
          <div className="space-y-2">
            {imprints.map((imp, i) => (
              <div
                key={i}
                className="rounded-lg border border-surface-border bg-surface-secondary p-3"
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <select
                    value={imp.method}
                    onChange={(e) =>
                      updateImprint(i, { method: e.target.value as ImprintFormData["method"] })
                    }
                    className="rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-white focus:border-coral focus:outline-none"
                  >
                    {IMPRINT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={imp.colorCount}
                    onChange={(e) => updateImprint(i, { colorCount: e.target.value })}
                    placeholder="# colors"
                    className="rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-coral focus:outline-none"
                  />
                  <input
                    type="text"
                    value={imp.placement}
                    onChange={(e) => updateImprint(i, { placement: e.target.value })}
                    placeholder="Placement (e.g. Left chest)"
                    className="col-span-2 rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-coral focus:outline-none"
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={imp.widthIn}
                    onChange={(e) => updateImprint(i, { widthIn: e.target.value })}
                    placeholder={'W (in)'}
                    className="rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-coral focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={imp.heightIn}
                    onChange={(e) => updateImprint(i, { heightIn: e.target.value })}
                    placeholder={'H (in)'}
                    className="rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-coral focus:outline-none"
                  />
                  <select
                    value={imp.artworkAssetId}
                    onChange={(e) => updateImprint(i, { artworkAssetId: e.target.value })}
                    className="col-span-2 rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-white focus:border-coral focus:outline-none"
                  >
                    <option value="">No artwork linked</option>
                    {artworks.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.filename}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={imp.notes}
                    onChange={(e) => updateImprint(i, { notes: e.target.value })}
                    placeholder="Imprint notes"
                    className="flex-1 rounded-md border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-coral focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setImprints((rows) => rows.filter((_, x) => x !== i))}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:text-red-400"
                    aria-label="Remove imprint"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
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
