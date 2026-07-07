"use client";

import { useState } from "react";
import { X, Search, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";

type SavedProduct = {
  id: string;
  name: string;
  sku: string | null;
  color: string | null;
  decorationPreset: any;
  defaultSizeTemplate: any;
  thumbnailUrl: string | null;
};

type CatalogPickerDialogProps = {
  companyId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (product: SavedProduct) => void;
};

export function CatalogPickerDialog({
  companyId,
  open,
  onClose,
  onSelect,
}: CatalogPickerDialogProps) {
  const [search, setSearch] = useState("");

  const { data: products, isLoading } =
    trpc.quote.listSavedProducts.useQuery(
      { companyId, search: search || undefined },
      { enabled: open && !!companyId }
    );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-surface-border bg-surface-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h3 className="text-lg font-semibold text-white">
            Add from Catalog
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-surface-border px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-surface-border bg-surface-card py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Product list */}
        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
            </div>
          )}

          {!isLoading && (!products || products.length === 0) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-500">
                {search
                  ? "No products match your search"
                  : "No saved products for this client"}
              </p>
            </div>
          )}

          {products?.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onSelect(product);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-card"
            >
              {product.thumbnailUrl ? (
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-secondary">
                  <img
                    src={product.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                  <Package className="h-5 w-5 text-gray-600" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {[product.sku, product.color].filter(Boolean).join(" · ") ||
                    "No SKU"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
