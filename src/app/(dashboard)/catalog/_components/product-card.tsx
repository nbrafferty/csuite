"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "./types";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  APPAREL: "Apparel",
  COMMERCIAL_PRINTING: "Printing",
  SIGNAGE: "Signage",
  PROMO_ITEM: "Promo",
  OTHER: "Other",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  APPAREL: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  COMMERCIAL_PRINTING: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  SIGNAGE: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  PROMO_ITEM: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  OTHER: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

export function ProductCard({
  product,
  isInQuote,
  onAdd,
  onConfigure,
}: {
  product: CatalogProduct;
  isInQuote: boolean;
  onAdd: (product: CatalogProduct) => void;
  onConfigure: (product: CatalogProduct) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!hovered) {
      setImgIdx(0);
      return;
    }
    if (product.images.length < 2) return;
    const interval = setInterval(
      () => setImgIdx((i) => (i + 1) % product.images.length),
      900
    );
    return () => clearInterval(interval);
  }, [hovered, product.images.length]);

  const priceDisplay = `From $${Number(product.basePrice).toFixed(2)}`;
  const typeLabel = CONTENT_TYPE_LABELS[product.contentType] ?? product.contentType;
  const typeColor = CONTENT_TYPE_COLORS[product.contentType] ?? CONTENT_TYPE_COLORS.OTHER;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-[14px] border transition-all duration-200",
        isInQuote
          ? "border-coral-border bg-[#22222A]"
          : "border-surface-border bg-[#22222A] hover:border-[#444]",
        hovered && "-translate-y-[3px] shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
      )}
    >
      {/* Top-right in-quote indicator */}
      {isInQuote && (
        <div className="absolute right-2.5 top-2.5 z-[2] flex h-6 w-6 items-center justify-center rounded-full bg-coral text-[11px] font-bold text-white">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden bg-[#18181f] pt-[75%]">
        {product.images.length > 0 ? (
          <img
            src={product.images[imgIdx]}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingCart className="h-10 w-10 text-gray-700" />
          </div>
        )}
        {product.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {product.images.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[5px] w-[5px] rounded-full transition-colors duration-200",
                  i === imgIdx ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-4 pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-sm font-semibold leading-tight">
              {product.name}
            </div>
            {product.sku && (
              <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                {product.sku}
              </div>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-wider",
              typeColor
            )}
          >
            {typeLabel}
          </span>
        </div>
        {product.description && (
          <div className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {product.description}
          </div>
        )}
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[13px] font-bold text-zinc-400">
            {priceDisplay}
          </span>
          {product.vendor && (
            <span className="text-[11px] text-zinc-500">
              {product.vendor.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          className={cn(
            "flex-1 rounded-lg border py-2.5 text-xs font-bold tracking-wide transition-all duration-150",
            isInQuote
              ? "border-coral-border bg-coral-dim text-coral"
              : "border-coral bg-coral text-white hover:bg-coral-light"
          )}
        >
          {isInQuote ? "✓ Added" : "+ Add to Quote"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(product);
          }}
          className="rounded-lg border border-surface-border px-3 py-2.5 text-xs font-semibold text-zinc-400 transition-all duration-150 hover:border-zinc-500 hover:text-white"
        >
          Configure
        </button>
      </div>
    </div>
  );
}
