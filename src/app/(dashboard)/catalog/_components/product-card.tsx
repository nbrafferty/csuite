"use client";

import { useState, useEffect } from "react";
import { Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "./types";

export function ProductCard({
  product,
  isInQuote,
  isSaved,
  onAdd,
  onConfigure,
  onToggleSave,
}: {
  product: CatalogProduct;
  isInQuote: boolean;
  isSaved: boolean;
  onAdd: (product: CatalogProduct) => void;
  onConfigure: (product: CatalogProduct) => void;
  onToggleSave: (id: string) => void;
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

  const priceDisplay = `From $${Number(product.priceFrom)} / ${product.priceUnit}`;

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
      {/* Badges */}
      <div className="absolute left-3 top-3 z-[2] flex gap-1.5">
        {product.popular && (
          <span className="rounded bg-[rgba(13,13,15,0.8)] px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-wider text-coral backdrop-blur-sm"
            style={{ border: "1px solid rgba(232,93,93,0.25)" }}>
            POPULAR
          </span>
        )}
        {isSaved && (
          <span className="rounded bg-[rgba(13,13,15,0.8)] px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-wider text-violet-400 backdrop-blur-sm"
            style={{ border: "1px solid rgba(167,139,250,0.3)" }}>
            MY PRODUCT
          </span>
        )}
      </div>

      {/* Top-right controls */}
      <div className="absolute right-2.5 top-2.5 z-[2] flex flex-col items-center gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(product.id);
          }}
          title={isSaved ? "Remove from My Products" : "Save to My Products"}
          className={cn(
            "flex h-[30px] w-[30px] items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200",
            isSaved
              ? "border border-violet-400/50 bg-violet-400/85 opacity-100"
              : "border border-white/10 bg-[rgba(13,13,15,0.7)] opacity-0 group-hover:opacity-100"
          )}
        >
          <Star
            className={cn("h-3.5 w-3.5", isSaved ? "fill-white text-white" : "text-white")}
          />
        </button>
        {isInQuote && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-coral text-[11px] font-bold text-white">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative overflow-hidden bg-[#18181f] pt-[75%]">
        <img
          src={product.images[imgIdx]}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        />
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
          <div className="flex-1 text-sm font-semibold leading-tight">
            {product.name}
          </div>
          {product.tag && (
            <span
              className="shrink-0 rounded px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-wider"
              style={{
                color: product.tagColor || "#A78BFA",
                background: `${product.tagColor || "#A78BFA"}18`,
                border: `1px solid ${product.tagColor || "#A78BFA"}30`,
              }}
            >
              {product.tag}
            </span>
          )}
        </div>
        <div className="text-xs leading-relaxed text-zinc-500">
          {product.description}
        </div>
        <div className="mt-0.5 text-[13px] font-bold text-zinc-400">
          {priceDisplay}
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
