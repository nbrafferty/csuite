"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { COLORS, PROJECT_STATUS_COLORS, type ProjectStatus } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { X, Search } from "lucide-react";

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
  preLinkedOrderId?: string;
  preLinkedQuoteId?: string;
}

export function ProjectCreateDialog({
  open,
  onClose,
  preLinkedOrderId,
  preLinkedQuoteId,
}: ProjectCreateDialogProps) {
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("PLANNING");
  const [eventDate, setEventDate] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [budget, setBudget] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(
    preLinkedOrderId ? [preLinkedOrderId] : []
  );
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>(
    preLinkedQuoteId ? [preLinkedQuoteId] : []
  );
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: clients } = trpc.clientOrg.list.useQuery(undefined, {
    enabled: open && isStaff,
  });

  const create = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      utils.projects.searchProjects.invalidate();
      handleClose();
    },
    onError: (err) => setError(err.message),
  });

  const orderSearch = trpc.projects.searchOrders.useQuery(
    { search: linkSearch || undefined },
    { enabled: open && linkSearch.length >= 1 }
  );
  const quoteSearch = trpc.projects.searchQuotes.useQuery(
    { search: linkSearch || undefined },
    { enabled: open && linkSearch.length >= 1 }
  );

  const handleClose = useCallback(() => {
    setName("");
    setDescription("");
    setStatus("PLANNING");
    setEventDate("");
    setClientContact("");
    setBudget("");
    setCompanyId("");
    setLinkSearch("");
    setSelectedOrderIds(preLinkedOrderId ? [preLinkedOrderId] : []);
    setSelectedQuoteIds(preLinkedQuoteId ? [preLinkedQuoteId] : []);
    setError("");
    onClose();
  }, [onClose, preLinkedOrderId, preLinkedQuoteId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (isStaff && !companyId) {
      setError("Please select a client");
      return;
    }

    create.mutate({
      name,
      description: description || undefined,
      status,
      eventDate: eventDate || undefined,
      clientContact: clientContact || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      companyId: isStaff && companyId ? companyId : undefined,
      orderIds: selectedOrderIds.length > 0 ? selectedOrderIds : undefined,
      quoteIds: selectedQuoteIds.length > 0 ? selectedQuoteIds : undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={handleClose} />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border p-6 shadow-2xl"
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.cardBorder }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>New Project</h2>
          <button onClick={handleClose} className="rounded-lg p-1 transition-colors hover:bg-white/10" style={{ color: COLORS.textMuted }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Project name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="TechConnect 2026 Trade Show"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
              autoFocus
            />
          </div>

          {/* Client (staff only) */}
          {isStaff && (
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Client *</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
              >
                <option value="">Select a client...</option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Status</label>
            <div className="flex gap-2">
              {(["PLANNING", "ACTIVE", "COMPLETED"] as ProjectStatus[]).map((s) => {
                const cfg = PROJECT_STATUS_COLORS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: status === s ? cfg.bg : COLORS.card,
                      borderColor: status === s ? `${cfg.color}40` : COLORS.cardBorder,
                      color: status === s ? cfg.color : COLORS.textSecondary,
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event date + Client contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Event date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, color: COLORS.textPrimary, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Client contact</label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="Lisa Chen"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: COLORS.textMuted }}>$</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="5,000"
                className="w-full rounded-lg border pl-7 pr-3 py-2 text-sm outline-none"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          {/* Link orders/quotes */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.textSecondary }}>Add orders / quotes</label>
            <div className="rounded-lg border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}>
              <div className="flex items-center px-3">
                <Search className="h-4 w-4 shrink-0" style={{ color: COLORS.textMuted }} />
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Search orders or quotes..."
                  className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                  style={{ color: COLORS.textPrimary }}
                />
              </div>

              {linkSearch.length >= 1 && (
                <div className="max-h-40 overflow-y-auto border-t" style={{ borderColor: COLORS.cardBorder }}>
                  {(orderSearch.data ?? []).map((order) => (
                    <button
                      key={`order-${order.id}`}
                      type="button"
                      onClick={() => setSelectedOrderIds((ids) => ids.includes(order.id) ? ids.filter((x) => x !== order.id) : [...ids, order.id])}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                      style={{ color: selectedOrderIds.includes(order.id) ? COLORS.coral : COLORS.textSecondary }}
                    >
                      <span className="truncate">{order.number} — {order.title}</span>
                      {selectedOrderIds.includes(order.id) && <span className="ml-auto">&#10003;</span>}
                    </button>
                  ))}
                  {(quoteSearch.data ?? []).map((quote) => (
                    <button
                      key={`quote-${quote.id}`}
                      type="button"
                      onClick={() => setSelectedQuoteIds((ids) => ids.includes(quote.id) ? ids.filter((x) => x !== quote.id) : [...ids, quote.id])}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                      style={{ color: selectedQuoteIds.includes(quote.id) ? COLORS.coral : COLORS.textSecondary }}
                    >
                      <span className="truncate">{quote.number} — {quote.title}</span>
                      {selectedQuoteIds.includes(quote.id) && <span className="ml-auto">&#10003;</span>}
                    </button>
                  ))}
                  {(orderSearch.data ?? []).length === 0 && (quoteSearch.data ?? []).length === 0 && !orderSearch.isLoading && !quoteSearch.isLoading && (
                    <div className="px-3 py-3 text-center text-xs" style={{ color: COLORS.textMuted }}>No matching orders or quotes</div>
                  )}
                </div>
              )}
            </div>

            {(selectedOrderIds.length > 0 || selectedQuoteIds.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedOrderIds.map((id) => {
                  const order = orderSearch.data?.find((o) => o.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                      style={{ backgroundColor: COLORS.coralDim, color: COLORS.coral }}>
                      {order?.number ?? id.slice(0, 8)}
                      <button type="button" onClick={() => setSelectedOrderIds((ids) => ids.filter((x) => x !== id))}>&#10005;</button>
                    </span>
                  );
                })}
                {selectedQuoteIds.map((id) => {
                  const quote = quoteSearch.data?.find((q) => q.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                      style={{ backgroundColor: COLORS.purpleDim, color: COLORS.purple }}>
                      {quote?.number ?? id.slice(0, 8)}
                      <button type="button" onClick={() => setSelectedQuoteIds((ids) => ids.filter((x) => x !== id))}>&#10005;</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10" style={{ color: COLORS.textSecondary }}>
              Cancel
            </button>
            <button type="submit" disabled={create.isPending} className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50" style={{ backgroundColor: COLORS.coral }}>
              {create.isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
