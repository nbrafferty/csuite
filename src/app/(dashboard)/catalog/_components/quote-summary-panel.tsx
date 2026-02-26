"use client";

import { X, ClipboardList, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogProduct, QuoteItem } from "./types";

export function QuoteSummaryPanel({
  items,
  products,
  onConfigure,
  onRemove,
  onSubmit,
}: {
  items: QuoteItem[];
  products: CatalogProduct[];
  onConfigure: (product: CatalogProduct) => void;
  onRemove: (productId: string) => void;
  onSubmit: () => void;
}) {
  const configuredCount = items.filter(
    (i) => i.config && Object.keys(i.config).length > 0
  ).length;

  return (
    <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-surface-border bg-surface-card">
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="mb-5 text-lg font-bold">Quick Quote Summary</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6">
        {items.length === 0 ? (
          /* Empty state */
          <div className="mt-2 rounded-xl border border-surface-border bg-[#22222A] px-6 py-8 text-center">
            <ClipboardList className="mx-auto mb-3 h-9 w-9 text-zinc-600" />
            <div className="text-[13px] leading-relaxed text-zinc-400">
              Your quote list is empty. Add items from the catalog to get
              started.
            </div>
          </div>
        ) : (
          /* Item list */
          <div className="mt-2 flex flex-col gap-2">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              const isConfigured =
                item.config && Object.keys(item.config).length > 0;

              return (
                <div
                  key={item.productId}
                  className={cn(
                    "overflow-hidden rounded-[10px] border bg-[#22222A]",
                    isConfigured
                      ? "border-emerald-500/20"
                      : "border-surface-border"
                  )}
                >
                  <div className="flex gap-2.5 p-3.5">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        From ${Number(product.priceFrom)} / {product.priceUnit}
                      </div>
                      {item.totalQty && (
                        <div className="mt-0.5 text-[10px] text-zinc-400">
                          Qty: {item.totalQty}
                        </div>
                      )}
                      {isConfigured && (
                        <div className="mt-0.5 text-[10px] text-emerald-400">
                          ● Configured
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(item.productId)}
                      className="self-start p-0.5 text-zinc-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!isConfigured && (
                    <div className="flex items-center justify-between border-t border-surface-border px-3.5 py-2">
                      <span className="text-[10px] text-zinc-500">
                        Add details
                      </span>
                      <button
                        onClick={() => onConfigure(product)}
                        className="rounded-md border border-surface-border px-2.5 py-1 text-[10px] font-semibold text-zinc-400 hover:border-zinc-500 hover:text-white"
                      >
                        Configure →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Production tip */}
        <div className="mt-4 flex gap-3 rounded-[10px] border border-coral-border bg-coral-dim p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          <div>
            <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-coral">
              PRODUCTION TIP
            </div>
            <div className="text-[11px] leading-relaxed text-zinc-400">
              Ordering apparel in bundles of 50+ reduces the per-unit decoration
              cost by up to 25%.
            </div>
          </div>
        </div>

        {/* Saved Projects */}
        <div className="mt-5">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-wide">
            Saved Projects
          </div>
          {[
            { name: "Annual Tech Conf '24", items: 12, modified: "2d ago" },
            { name: "New Hire Kits - Q3", items: 4, modified: "1w ago" },
          ].map((proj, i) => (
            <div
              key={i}
              className="mb-2 cursor-pointer rounded-lg border border-surface-border bg-[#22222A] p-3.5 transition-colors hover:border-zinc-500"
            >
              <div className="text-[13px] font-semibold">{proj.name}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                {proj.items} Items &bull; Modified {proj.modified}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit CTA */}
      {items.length > 0 && (
        <div className="border-t border-surface-border px-6 py-4">
          {configuredCount < items.length && (
            <div className="mb-2 text-center text-[10px] text-zinc-500">
              {items.length - configuredCount} unconfigured — we&apos;ll follow
              up
            </div>
          )}
          <button
            onClick={onSubmit}
            className="w-full rounded-[10px] bg-coral py-3 text-[13px] font-bold tracking-wide text-white hover:bg-coral-light"
          >
            Request Quote ({items.length}) →
          </button>
        </div>
      )}
    </div>
  );
}
