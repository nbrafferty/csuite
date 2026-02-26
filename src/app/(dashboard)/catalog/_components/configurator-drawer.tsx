"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "./config-fields/color-swatch";
import { SizeMatrix } from "./config-fields/size-matrix";
import { ArtworkUpload } from "./config-fields/artwork-upload";
import { FieldLabel } from "./config-fields/field-label";
import type { CatalogProduct, QuoteItem } from "./types";

const CONFIG_SCHEMA: Record<string, any[]> = {
  apparel: [
    {
      type: "color_swatch",
      key: "color",
      label: "Color",
      options: [
        { label: "Black", value: "#1a1a1a" },
        { label: "White", value: "#f5f5f5" },
        { label: "Navy", value: "#1e3a5f" },
        { label: "Forest", value: "#2d5a3d" },
        { label: "Maroon", value: "#6b2737" },
        { label: "Royal", value: "#2c4ea8" },
        { label: "Red", value: "#c0392b" },
        { label: "Gray", value: "#7f8c8d" },
      ],
    },
    { type: "size_matrix", key: "sizes", label: "Sizes & Quantities" },
    {
      type: "select",
      key: "printLocation",
      label: "Print Location",
      options: [
        "Left Chest",
        "Full Front",
        "Full Back",
        "Full Front + Back",
        "Sleeve",
      ],
    },
    { type: "artwork_upload", key: "artwork", label: "Artwork File" },
    { type: "text", key: "notes", label: "Additional Notes" },
  ],
  promo: [
    { type: "quantity", key: "quantity", label: "Quantity" },
    {
      type: "select",
      key: "decoration",
      label: "Decoration Method",
      options: [
        "Screen Print",
        "Embroidery",
        "Laser Engrave",
        "Full Color Print",
        "Deboss",
      ],
    },
    { type: "artwork_upload", key: "artwork", label: "Artwork File" },
    { type: "text", key: "notes", label: "Additional Notes" },
  ],
  signage: [
    {
      type: "select",
      key: "size",
      label: "Size",
      options: ['24" x 36"', '36" x 48"', '48" x 96"', "Custom"],
    },
    {
      type: "select",
      key: "material",
      label: "Material",
      options: ["Gloss Vinyl", "Matte Vinyl", "Mesh", "Fabric"],
    },
    {
      type: "select",
      key: "finishing",
      label: "Finishing",
      options: [
        "Hemmed + Grommets",
        "Pole Pocket",
        "Hemmed Only",
        "None",
      ],
    },
    { type: "quantity", key: "quantity", label: "Quantity" },
    { type: "artwork_upload", key: "artwork", label: "Artwork File" },
    { type: "text", key: "notes", label: "Additional Notes" },
  ],
};

export function ConfiguratorDrawer({
  product,
  quoteItem,
  onClose,
  onSave,
}: {
  product: CatalogProduct | null;
  quoteItem: QuoteItem | null;
  onClose: () => void;
  onSave: (data: {
    config: Record<string, any>;
    totalQty: number;
    sizeBreakdown: Record<string, number> | null;
  }) => void;
}) {
  const schema = product
    ? CONFIG_SCHEMA[product.category] || CONFIG_SCHEMA.promo
    : [];

  const [values, setValues] = useState<Record<string, any>>(
    quoteItem?.config || {}
  );
  const [activeImg, setActiveImg] = useState(0);
  const [sizeMode, setSizeMode] = useState<"total" | "perSize">("total");
  const [totalQty, setTotalQty] = useState(quoteItem?.totalQty || 100);
  const [sizeBreakdown, setSizeBreakdown] = useState<Record<string, number>>(
    (quoteItem?.sizeBreakdown as Record<string, number>) || {
      XS: 5,
      S: 15,
      M: 30,
      L: 30,
      XL: 15,
      "2XL": 5,
      "3XL": 0,
    }
  );

  if (!product) return null;

  const set = (key: string, val: any) =>
    setValues((v) => ({ ...v, [key]: val }));

  const filledFields = schema.filter((f: any) => {
    if (f.type === "size_matrix") return totalQty > 0;
    if (f.type === "text") return false;
    return !!values[f.key];
  }).length;
  const totalFields = schema.filter((f: any) => f.type !== "text").length;

  const handleSave = () => {
    const hasSizeMatrix = schema.some((f: any) => f.type === "size_matrix");
    onSave({
      config: values,
      totalQty: hasSizeMatrix ? totalQty : values.quantity || 1,
      sizeBreakdown: hasSizeMatrix ? sizeBreakdown : null,
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-[rgba(13,13,15,0.75)] backdrop-blur-sm animate-fade-in"
      />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 top-0 z-[110] flex w-[520px] animate-slide-in-right flex-col overflow-y-auto border-l border-surface-border bg-surface-card">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-6 py-5">
          <div>
            <div className="text-base font-bold">{product.name}</div>
            <div className="mt-0.5 text-xs text-zinc-500">
              Configure your product — all fields optional
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Completion bar */}
        <div className="flex shrink-0 items-center gap-3 border-b border-surface-border px-6 py-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalFields }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full transition-colors duration-200",
                  i < filledFields ? "bg-emerald-400" : "bg-surface-border"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-500">
            {filledFields} of {totalFields} fields completed
          </span>
        </div>

        {/* Image gallery */}
        <div className="shrink-0">
          <div className="relative overflow-hidden bg-[#18181f] pt-[56%]">
            <img
              src={product.images[activeImg]}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 bg-[#22222A] px-6 py-3">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "h-10 w-[52px] shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all duration-150",
                    i === activeImg
                      ? "border-coral opacity-100"
                      : "border-transparent opacity-40 hover:opacity-70"
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {schema.map((field: any) => {
            if (field.type === "color_swatch") {
              return (
                <ColorSwatch
                  key={field.key}
                  label={field.label}
                  options={field.options}
                  value={values[field.key]}
                  onChange={(val) => set(field.key, val)}
                />
              );
            }

            if (field.type === "size_matrix") {
              return (
                <SizeMatrix
                  key={field.key}
                  label={field.label}
                  sizeMode={sizeMode}
                  onSizeModeChange={setSizeMode}
                  totalQty={totalQty}
                  onTotalQtyChange={setTotalQty}
                  sizeBreakdown={sizeBreakdown}
                  onSizeBreakdownChange={setSizeBreakdown}
                />
              );
            }

            if (field.type === "select") {
              return (
                <div key={field.key}>
                  <FieldLabel label={field.label} />
                  <select
                    value={values[field.key] || ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-surface-border bg-[#22222A] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-coral"
                  >
                    <option value="">
                      Choose {field.label.toLowerCase()}...
                    </option>
                    {field.options.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === "quantity") {
              return (
                <div key={field.key}>
                  <FieldLabel label={field.label} />
                  <input
                    type="number"
                    min={1}
                    value={values[field.key] || ""}
                    onChange={(e) =>
                      set(field.key, parseInt(e.target.value) || "")
                    }
                    placeholder="Enter quantity..."
                    className="w-full rounded-lg border border-surface-border bg-[#22222A] px-3.5 py-2.5 text-[13px] text-white placeholder-zinc-600 outline-none focus:border-coral"
                  />
                </div>
              );
            }

            if (field.type === "artwork_upload") {
              return (
                <ArtworkUpload
                  key={field.key}
                  label={field.label}
                  value={values[field.key]}
                  onChange={(val) => set(field.key, val)}
                />
              );
            }

            if (field.type === "text") {
              return (
                <div key={field.key}>
                  <FieldLabel label={field.label} />
                  <textarea
                    value={values[field.key] || ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder="Pantone colors, special instructions, event details..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-surface-border bg-[#22222A] px-3.5 py-2.5 text-[13px] leading-relaxed text-white placeholder-zinc-600 outline-none focus:border-coral"
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-2.5 border-t border-surface-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[9px] border border-surface-border px-5 py-[11px] text-[13px] font-semibold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-[9px] bg-coral py-[11px] text-[13px] font-bold tracking-wide text-white hover:bg-coral-light"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </>
  );
}
