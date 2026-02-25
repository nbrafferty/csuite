"use client";

import { useState, useCallback } from "react";
import { COLORS, CATEGORY_LABELS } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { X, Search } from "lucide-react";
import type { ProjectCategory } from "@prisma/client";

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  ProjectCategory,
  { label: string; icon: string },
][];

export function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProjectCategory | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const create = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      handleClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Search for linkable orders/quotes
  const orderSearch = trpc.projects.searchOrders.useQuery(
    { search: linkSearch },
    { enabled: linkSearch.length >= 1 }
  );
  const quoteSearch = trpc.projects.searchQuotes.useQuery(
    { search: linkSearch },
    { enabled: linkSearch.length >= 1 }
  );

  const handleClose = useCallback(() => {
    setName("");
    setCategory(null);
    setEventDate("");
    setDescription("");
    setLinkSearch("");
    setSelectedOrderIds([]);
    setSelectedQuoteIds([]);
    setError("");
    onClose();
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!category) {
      setError("Category is required");
      return;
    }

    create.mutate({
      name,
      category,
      description: description || undefined,
      eventDate: eventDate || undefined,
      orderIds: selectedOrderIds.length > 0 ? selectedOrderIds : undefined,
      quoteIds: selectedQuoteIds.length > 0 ? selectedQuoteIds : undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-xl border p-6 shadow-2xl"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.cardBorder,
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            New Project
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 transition-colors hover:bg-white/10"
            style={{ color: COLORS.textMuted }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              Project name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer Festival Tees 2026"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-coral"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.cardBorder,
                color: COLORS.textPrimary,
              }}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label
              className="mb-2 block text-xs font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              Category *
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(([key, { label, icon }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor:
                      category === key ? COLORS.coralDim : COLORS.card,
                    borderColor:
                      category === key
                        ? COLORS.coralBorder
                        : COLORS.cardBorder,
                    color:
                      category === key
                        ? COLORS.coral
                        : COLORS.textSecondary,
                  }}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Event date */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              Event / due date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-coral"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.cardBorder,
                color: COLORS.textPrimary,
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-coral"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.cardBorder,
                color: COLORS.textPrimary,
              }}
            />
          </div>

          {/* Link existing */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: COLORS.textSecondary }}
            >
              Link to existing (optional)
            </label>
            <div
              className="relative rounded-lg border"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.cardBorder,
              }}
            >
              <div className="flex items-center px-3">
                <Search
                  className="h-4 w-4 shrink-0"
                  style={{ color: COLORS.textMuted }}
                />
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search orders or quotes..."
                  className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                  style={{ color: COLORS.textPrimary }}
                />
              </div>

              {/* Search results */}
              {linkSearch.length >= 1 && (
                <div
                  className="max-h-40 overflow-y-auto border-t"
                  style={{ borderColor: COLORS.cardBorder }}
                >
                  {(orderSearch.data ?? []).map((order) => (
                    <button
                      key={`order-${order.id}`}
                      type="button"
                      onClick={() =>
                        setSelectedOrderIds((ids) =>
                          ids.includes(order.id)
                            ? ids.filter((x) => x !== order.id)
                            : [...ids, order.id]
                        )
                      }
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                      style={{
                        color: selectedOrderIds.includes(order.id)
                          ? COLORS.coral
                          : COLORS.textSecondary,
                      }}
                    >
                      <span className="shrink-0">📦</span>
                      <span className="truncate">
                        {order.displayId} — {order.title}
                      </span>
                      {selectedOrderIds.includes(order.id) && (
                        <span className="ml-auto">✓</span>
                      )}
                    </button>
                  ))}
                  {(quoteSearch.data ?? []).map((quote) => (
                    <button
                      key={`quote-${quote.id}`}
                      type="button"
                      onClick={() =>
                        setSelectedQuoteIds((ids) =>
                          ids.includes(quote.id)
                            ? ids.filter((x) => x !== quote.id)
                            : [...ids, quote.id]
                        )
                      }
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                      style={{
                        color: selectedQuoteIds.includes(quote.id)
                          ? COLORS.coral
                          : COLORS.textSecondary,
                      }}
                    >
                      <span className="shrink-0">📄</span>
                      <span className="truncate">
                        {quote.displayId} — {quote.title}
                      </span>
                      {selectedQuoteIds.includes(quote.id) && (
                        <span className="ml-auto">✓</span>
                      )}
                    </button>
                  ))}
                  {(orderSearch.data ?? []).length === 0 &&
                    (quoteSearch.data ?? []).length === 0 &&
                    !orderSearch.isLoading &&
                    !quoteSearch.isLoading && (
                      <div
                        className="px-3 py-3 text-center text-xs"
                        style={{ color: COLORS.textMuted }}
                      >
                        No matching orders or quotes
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Selected items */}
            {(selectedOrderIds.length > 0 || selectedQuoteIds.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedOrderIds.map((id) => {
                  const order = orderSearch.data?.find((o) => o.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: COLORS.coralDim,
                        color: COLORS.coral,
                      }}
                    >
                      📦 {order?.displayId ?? id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedOrderIds((ids) =>
                            ids.filter((x) => x !== id)
                          )
                        }
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
                {selectedQuoteIds.map((id) => {
                  const quote = quoteSearch.data?.find((q) => q.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: COLORS.purpleDim,
                        color: COLORS.purple,
                      }}
                    >
                      📄 {quote?.displayId ?? id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedQuoteIds((ids) =>
                            ids.filter((x) => x !== id)
                          )
                        }
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs" style={{ color: COLORS.coral }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: COLORS.textSecondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: COLORS.coral }}
            >
              {create.isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
