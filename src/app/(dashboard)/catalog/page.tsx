"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Search, LayoutGrid, LayoutList, ShoppingCart } from "lucide-react";

const CONTENT_TYPES = [
  { label: "All", value: "" },
  { label: "Apparel", value: "APPAREL" },
  { label: "Printing", value: "COMMERCIAL_PRINTING" },
  { label: "Signage", value: "SIGNAGE" },
  { label: "Promo", value: "PROMO_ITEM" },
  { label: "Other", value: "OTHER" },
] as const;

const CONTENT_TYPE_COLORS: Record<string, string> = {
  APPAREL: "bg-indigo-500/10 text-indigo-400",
  COMMERCIAL_PRINTING: "bg-pink-500/10 text-pink-400",
  SIGNAGE: "bg-yellow-500/10 text-yellow-400",
  PROMO_ITEM: "bg-emerald-500/10 text-emerald-400",
  OTHER: "bg-gray-500/10 text-gray-400",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  APPAREL: "Apparel",
  COMMERCIAL_PRINTING: "Printing",
  SIGNAGE: "Signage",
  PROMO_ITEM: "Promo",
  OTHER: "Other",
};

export default function CatalogPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [contentType, setContentType] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data, isLoading } = trpc.catalog.list.useQuery(
    {
      search: search || undefined,
      contentType: contentType ? (contentType as any) : undefined,
      limit: 50,
    },
    { refetchInterval: 30_000 }
  );

  const products = data?.products ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Catalog</h1>
        <p className="mt-1 text-sm text-gray-400">
          Browse products and apparel options.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-card py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-coral focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setContentType(ct.value)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                contentType === ct.value
                  ? "bg-coral text-white"
                  : "bg-[#22222A] text-gray-400 hover:text-white"
              )}
            >
              {ct.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex rounded-lg border border-surface-border bg-surface-card">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "rounded-l-lg p-2 transition-colors",
              view === "grid"
                ? "bg-[#22222A] text-white"
                : "text-gray-500 hover:text-white"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "rounded-r-lg p-2 transition-colors",
              view === "list"
                ? "bg-[#22222A] text-white"
                : "text-gray-500 hover:text-white"
            )}
          >
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-20 text-center">
          <ShoppingCart className="h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No products found</p>
          <p className="mt-1 text-xs text-gray-600">
            Products will appear here once added to the catalog.
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => router.push(`/catalog/${product.id}`)}
              className="cursor-pointer rounded-xl border border-surface-border bg-surface-card p-4 transition-all hover:border-gray-500"
            >
              {/* Image placeholder */}
              <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-white/[0.02]">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <ShoppingCart className="h-10 w-10 text-gray-700" />
                )}
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    {product.name}
                  </h3>
                  {product.sku && (
                    <p className="mt-0.5 font-mono text-xs text-gray-500">
                      {product.sku}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                    CONTENT_TYPE_COLORS[product.contentType] ??
                      CONTENT_TYPE_COLORS.OTHER
                  )}
                >
                  {CONTENT_TYPE_LABELS[product.contentType] ?? product.contentType}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  From ${Number(product.basePrice).toFixed(2)}
                </span>
                {product.vendor && (
                  <span className="text-xs text-gray-500">
                    {product.vendor.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3 text-right">Base Price</th>
                <th className="px-4 py-3">Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {products.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => router.push(`/catalog/${product.id}`)}
                  className="cursor-pointer bg-surface-card transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-white">
                      {product.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-400">
                    {product.sku || "--"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                        CONTENT_TYPE_COLORS[product.contentType] ??
                          CONTENT_TYPE_COLORS.OTHER
                      )}
                    >
                      {CONTENT_TYPE_LABELS[product.contentType] ??
                        product.contentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {product.pricingType}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-white">
                    ${Number(product.basePrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {product.vendor?.name ?? "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
