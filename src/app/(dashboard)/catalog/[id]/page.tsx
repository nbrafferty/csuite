"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowLeft, ShoppingCart, Plus, Minus } from "lucide-react";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  APPAREL: "Apparel",
  COMMERCIAL_PRINTING: "Commercial Printing",
  SIGNAGE: "Signage",
  PROMO_ITEM: "Promo Item",
  OTHER: "Other",
};

export default function CatalogProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = trpc.catalog.get.useQuery({ id });

  const createOrderMutation = trpc.order.create.useMutation({
    onSuccess: (order) => router.push(`/orders/${order.id}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-400">Product not found</p>
      </div>
    );
  }

  const unitPrice = Number(product.basePrice);
  const lineTotal = unitPrice * quantity;
  const options = product.options as any;

  const handleAddToOrder = () => {
    createOrderMutation.mutate({
      title: product.name,
      items: [
        {
          title: product.name,
          contentType: product.contentType as any,
          catalogProductId: product.id,
          sku: product.sku || undefined,
          unitPrice,
          quantity,
        },
      ],
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => router.push("/catalog")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to catalog
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product image */}
        <div className="flex items-center justify-center rounded-xl border border-surface-border bg-surface-card p-8">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="max-h-80 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-lg bg-white/[0.02]">
              <ShoppingCart className="h-16 w-16 text-gray-700" />
            </div>
          )}
        </div>

        {/* Product details */}
        <div>
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {CONTENT_TYPE_LABELS[product.contentType] ?? product.contentType}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{product.name}</h1>
          {product.sku && (
            <p className="mt-1 font-mono text-sm text-gray-500">
              SKU: {product.sku}
            </p>
          )}
          {product.description && (
            <p className="mt-4 text-sm text-gray-300 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mt-6">
            <span className="text-3xl font-bold text-white">
              ${unitPrice.toFixed(2)}
            </span>
            <span className="ml-2 text-sm text-gray-500">per unit</span>
          </div>

          {/* Options display */}
          {options && (
            <div className="mt-6 space-y-4">
              {options.sizes && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Sizes
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(options.sizes as string[]).map((size: string) => (
                      <span
                        key={size}
                        className="rounded-lg border border-surface-border bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {options.colors && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Colors
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(options.colors as string[]).map((color: string) => (
                      <span
                        key={color}
                        className="rounded-lg border border-surface-border bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </label>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-border bg-surface-card text-gray-400 hover:text-white transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-center text-sm text-white focus:border-coral focus:outline-none"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-border bg-surface-card text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Total & order button */}
          <div className="mt-8 rounded-xl border border-surface-border bg-surface-card p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Line Total</span>
              <span className="text-xl font-bold text-white">
                ${lineTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <button
              onClick={handleAddToOrder}
              disabled={createOrderMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-4 py-3 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {createOrderMutation.isPending
                ? "Creating Order..."
                : "Create Order"}
            </button>
          </div>

          {product.vendor && (
            <p className="mt-4 text-xs text-gray-600">
              Supplied by {product.vendor.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
