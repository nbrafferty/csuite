"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, LayoutGrid, LayoutList, Star, Check, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { ProductCard } from "./product-card";
import { FilterBar, type Filters } from "./filter-bar";
import { QuoteSummaryPanel } from "./quote-summary-panel";
import { ConfiguratorDrawer } from "./configurator-drawer";
import type { CatalogProduct, QuoteItem } from "./types";

const CATEGORY_NAV = [
  { label: "Apparel", id: "apparel" },
  { label: "Signage", id: "signage" },
  { label: "Promotional", id: "promo" },
];

const PRODUCTS_PER_PAGE = 8;

type Toast = {
  type: "added" | "saved" | "submitted";
  id: string;
};

export function CatalogContent() {
  // State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    material: "All",
    speed: "All",
    priceRange: "All",
  });
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [configuringProduct, setConfiguringProduct] =
    useState<CatalogProduct | null>(null);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [toast, setToast] = useState<Toast | null>(null);

  // tRPC query — fetch all products, filter client-side for simplicity
  const { data: catalogData } = trpc.catalog.list.useQuery(
    { page: 1, perPage: 100 },
    { staleTime: 60_000 }
  );

  const allProducts: CatalogProduct[] = useMemo(
    () =>
      (catalogData?.products ?? []).map((p) => ({
        ...p,
        priceFrom: p.priceFrom.toString(),
      })),
    [catalogData]
  );

  // Client-side filtering
  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (
        search &&
        !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description || "").toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allProducts, activeCategory, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Toast helper
  const showToast = useCallback((type: Toast["type"]) => {
    const id = Math.random().toString(36).slice(2);
    setToast({ type, id });
    const duration = type === "submitted" ? 4000 : 2000;
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), duration);
  }, []);

  // Actions
  const addToQuote = useCallback(
    (product: CatalogProduct) => {
      setQuoteItems((items) => {
        if (items.find((i) => i.productId === product.id)) return items;
        return [
          ...items,
          {
            productId: product.id,
            config: {},
            totalQty: null,
            sizeBreakdown: null,
          },
        ];
      });
      showToast("added");
    },
    [showToast]
  );

  const removeFromQuote = useCallback((productId: string) => {
    setQuoteItems((items) => items.filter((i) => i.productId !== productId));
  }, []);

  const saveConfig = useCallback(
    (
      productId: string,
      configData: {
        config: Record<string, any>;
        totalQty: number;
        sizeBreakdown: Record<string, number> | null;
      }
    ) => {
      setQuoteItems((items) => {
        const exists = items.find((i) => i.productId === productId);
        if (exists) {
          return items.map((i) =>
            i.productId === productId ? { ...i, ...configData } : i
          );
        }
        return [...items, { productId, ...configData }];
      });
    },
    []
  );

  const handleConfigure = useCallback(
    (product: CatalogProduct) => {
      if (!quoteItems.find((i) => i.productId === product.id)) {
        addToQuote(product);
      }
      setConfiguringProduct(product);
    },
    [quoteItems, addToQuote]
  );

  const toggleSave = useCallback(
    (productId: string) => {
      setSavedProductIds((ids) => {
        const removing = ids.includes(productId);
        if (!removing) showToast("saved");
        return removing
          ? ids.filter((id) => id !== productId)
          : [...ids, productId];
      });
    },
    [showToast]
  );

  const handleSubmit = useCallback(() => {
    showToast("submitted");
    setQuoteItems([]);
  }, [showToast]);

  const clearFilters = useCallback(() => {
    setFilters({ material: "All", speed: "All", priceRange: "All" });
    setActiveCategory(null);
  }, []);

  const categoryLabel =
    activeCategory
      ? CATEGORY_NAV.find((c) => c.id === activeCategory)?.label
      : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Page heading */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-extrabold uppercase tracking-tight">
              {categoryLabel ? `${categoryLabel} Catalog` : "Product Catalog"}
            </h1>
            <div className="flex gap-0.5 rounded-lg border border-surface-border bg-[#22222A] p-1">
              <button className="rounded-md bg-surface-border p-1.5 text-white">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-zinc-500 hover:text-white">
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-[13px] text-zinc-400">
            High-quality custom creative production options for your brand
            identity.
          </p>
        </div>

        {/* Category pills */}
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => {
              setActiveCategory(null);
              setVisibleCount(PRODUCTS_PER_PAGE);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              !activeCategory
                ? "bg-coral text-white"
                : "bg-[#22222A] text-zinc-400 hover:text-white"
            )}
          >
            All
          </button>
          {CATEGORY_NAV.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(
                  activeCategory === cat.id ? null : cat.id
                );
                setVisibleCount(PRODUCTS_PER_PAGE);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                activeCategory === cat.id
                  ? "bg-coral text-white"
                  : "bg-[#22222A] text-zinc-400 hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search bar inline */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search product catalog, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-surface-border bg-[#22222A] pl-9 pr-4 text-[13px] text-white placeholder-zinc-600 outline-none focus:border-coral"
          />
        </div>

        {/* Filters bar */}
        <div className="mb-7">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onClear={clearFilters}
          />
        </div>

        {/* Result count */}
        <div className="mb-5 text-xs text-zinc-500">
          Showing {Math.min(visibleCount, filtered.length)} of{" "}
          {filtered.length} products
          {activeCategory && ` in ${categoryLabel}`}
          {search && ` matching "${search}"`}
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <Search className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
            <div className="mb-1.5 text-base">No products found</div>
            <div className="text-[13px]">
              Try a different search or category
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isInQuote={!!quoteItems.find((i) => i.productId === product.id)}
                isSaved={savedProductIds.includes(product.id)}
                onAdd={addToQuote}
                onConfigure={handleConfigure}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 pt-6 text-center">
            <div className="mb-3 text-xs text-zinc-500">
              Showing {visible.length} of {filtered.length} products
            </div>
            <button
              onClick={() =>
                setVisibleCount((c) => c + PRODUCTS_PER_PAGE)
              }
              className="rounded-[10px] border border-surface-border bg-[#22222A] px-10 py-3.5 text-sm font-semibold text-zinc-400 transition-all hover:border-zinc-500 hover:text-white"
            >
              Load More Products
            </button>
          </div>
        )}
      </main>

      {/* Right sidebar — Quote Summary */}
      <QuoteSummaryPanel
        items={quoteItems}
        products={allProducts}
        onConfigure={handleConfigure}
        onRemove={removeFromQuote}
        onSubmit={handleSubmit}
      />

      {/* Configurator Drawer */}
      {configuringProduct && (
        <ConfiguratorDrawer
          product={configuringProduct}
          quoteItem={
            quoteItems.find(
              (i) => i.productId === configuringProduct.id
            ) || null
          }
          onClose={() => setConfiguringProduct(null)}
          onSave={(configData) =>
            saveConfig(configuringProduct.id, configData)
          }
        />
      )}

      {/* Toast notifications */}
      {toast?.type === "added" && (
        <div className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 animate-toast-in items-center gap-2.5 rounded-[10px] border border-coral-border bg-[#22222A] px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Check className="h-4 w-4 text-coral" />
          <span className="text-[13px] font-semibold">
            Added to quote request
          </span>
        </div>
      )}

      {toast?.type === "saved" && (
        <div className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 animate-toast-in items-center gap-2.5 rounded-[10px] border border-violet-400/30 bg-[#22222A] px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Star className="h-4 w-4 fill-violet-400 text-violet-400" />
          <span className="text-[13px] font-semibold text-violet-400">
            Saved to My Products
          </span>
        </div>
      )}

      {toast?.type === "submitted" && (
        <div className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 animate-toast-in items-center gap-3 rounded-[10px] border border-emerald-500/30 bg-[#22222A] px-6 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <PartyPopper className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="text-[13px] font-bold text-emerald-400">
              Quote request submitted!
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">
              We&apos;ll review and get back to you shortly.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
