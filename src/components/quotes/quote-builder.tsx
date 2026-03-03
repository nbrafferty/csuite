"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { QuoteItemCard } from "./quote-item-card";
import { QuoteItemForm } from "./quote-item-form";
import { QuoteSettingsPanel } from "./quote-settings-panel";
import { CatalogPickerDialog } from "./catalog-picker-dialog";
import { MockupUpload } from "./mockup-upload";
import { Plus, ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

type QuoteBuilderProps = {
  quoteId?: string;
};

export function QuoteBuilder({ quoteId }: QuoteBuilderProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Form state (for new quotes)
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [paymentTermType, setPaymentTermType] = useState("FULL");
  const [depositPercent, setDepositPercent] = useState<number | null>(null);
  const [netDays, setNetDays] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [clientMessage, setClientMessage] = useState("");

  // UI state
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [showConfirmConvert, setShowConfirmConvert] = useState(false);

  // Existing quote data
  const { data: quote, isLoading: quoteLoading } =
    trpc.quote.getById.useQuery(
      { id: quoteId! },
      { enabled: !!quoteId }
    );

  // Populate form when quote data loads
  const formPopulated = useRef(false);
  useEffect(() => {
    if (quote && !formPopulated.current) {
      formPopulated.current = true;
      setCompanyId(quote.companyId);
      setTitle(quote.title);
      setPaymentTermType(quote.paymentTermType);
      setDepositPercent(quote.depositPercent);
      setNetDays(quote.netDays);
      setExpiresAt(
        quote.expiresAt
          ? new Date(quote.expiresAt).toISOString().split("T")[0]
          : ""
      );
      setNotes(quote.notes ?? "");
      setClientMessage(quote.clientMessage ?? "");
    }
  }, [quote]);

  // Companies list
  const { data: companies = [] } = trpc.quote.listCompanies.useQuery();

  // Mutations
  const createQuote = trpc.quote.create.useMutation({
    onSuccess: (data) => {
      router.push(`/quotes/${data.id}`);
    },
  });

  const updateQuote = trpc.quote.update.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId! });
    },
  });

  const addItem = trpc.quote.addItem.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId! });
      setShowItemForm(false);
    },
  });

  const updateItem = trpc.quote.updateItem.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId! });
      setEditingItemId(null);
    },
  });

  const removeItem = trpc.quote.removeItem.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId! });
    },
  });

  const sendQuote = trpc.quote.send.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId! });
      setShowConfirmSend(false);
    },
  });

  const convertToOrder = trpc.quote.convertToOrder.useMutation({
    onSuccess: () => {
      utils.quote.getById.invalidate({ id: quoteId! });
      setShowConfirmConvert(false);
    },
  });

  const uploadMockup = trpc.quote.uploadMockup.useMutation({
    onSuccess: () => utils.quote.getById.invalidate({ id: quoteId! }),
  });

  const uploadItemMockup = trpc.quote.uploadItemMockup.useMutation({
    onSuccess: () => utils.quote.getById.invalidate({ id: quoteId! }),
  });

  // Handlers
  const handleSave = useCallback(() => {
    if (quoteId) {
      updateQuote.mutate({
        id: quoteId,
        title: title || undefined,
        paymentTerms: {
          paymentTermType: paymentTermType as any,
          depositPercent: depositPercent ?? undefined,
          netDays: netDays ?? undefined,
        },
        expiresAt: expiresAt
          ? new Date(expiresAt).toISOString()
          : null,
        notes: notes || undefined,
        clientMessage: clientMessage || undefined,
      });
    } else {
      if (!companyId || !title) return;
      createQuote.mutate({
        companyId,
        title,
        paymentTerms: {
          paymentTermType: paymentTermType as any,
          depositPercent: depositPercent ?? undefined,
          netDays: netDays ?? undefined,
        },
        expiresAt: expiresAt
          ? new Date(expiresAt).toISOString()
          : undefined,
        notes: notes || undefined,
        clientMessage: clientMessage || undefined,
      });
    }
  }, [
    quoteId,
    companyId,
    title,
    paymentTermType,
    depositPercent,
    netDays,
    expiresAt,
    notes,
    clientMessage,
    createQuote,
    updateQuote,
  ]);

  const handleSend = useCallback(() => {
    if (!quoteId) {
      // For new quotes, save first then send will happen after redirect
      handleSave();
      return;
    }
    setShowConfirmSend(true);
  }, [quoteId, handleSave]);

  const confirmSend = useCallback(() => {
    if (!quoteId) return;
    sendQuote.mutate({
      id: quoteId,
      clientMessage: clientMessage || undefined,
    });
  }, [quoteId, clientMessage, sendQuote]);

  const handleConvert = useCallback(() => {
    setShowConfirmConvert(true);
  }, []);

  const confirmConvert = useCallback(() => {
    if (!quoteId) return;
    convertToOrder.mutate({ id: quoteId });
  }, [quoteId, convertToOrder]);

  const handleAddItem = useCallback(
    (data: any) => {
      if (!quoteId) return;
      addItem.mutate({ quoteId, item: data });
    },
    [quoteId, addItem]
  );

  const handleUpdateItem = useCallback(
    (itemId: string, data: any) => {
      updateItem.mutate({ itemId, item: data });
    },
    [updateItem]
  );

  const handleCatalogSelect = useCallback(
    (product: any) => {
      if (!quoteId) return;
      const sizeTemplate = product.defaultSizeTemplate as Record<string, number> | null;
      addItem.mutate({
        quoteId,
        item: {
          savedProductId: product.id,
          description: `${product.name}${product.color ? ` — ${product.color}` : ""}`,
          sku: product.sku ?? undefined,
          color: product.color ?? undefined,
          unitPrice: 0,
          quantity: sizeTemplate
            ? Object.values(sizeTemplate).reduce((a: number, b: number) => a + b, 0)
            : 1,
          decorationNotes:
            product.decorationPreset
              ? typeof product.decorationPreset === "string"
                ? product.decorationPreset
                : JSON.stringify(product.decorationPreset)
              : undefined,
          sizeBreakdown: sizeTemplate ?? undefined,
          sortOrder: (quote?.items.length ?? 0),
        },
      });
    },
    [quoteId, quote, addItem]
  );

  const isEditable =
    !quote || quote.status === "DRAFT" || quote.status === "CHANGES_REQUESTED";

  // Build item comment map from change requests
  const itemCommentMap: Record<string, string> = {};
  if (quote?.changeRequests?.[0]?.itemComments) {
    const comments = quote.changeRequests[0].itemComments as any[];
    if (Array.isArray(comments)) {
      comments.forEach((ic: any) => {
        if (ic.quoteItemId && ic.comment) {
          itemCommentMap[ic.quoteItemId] = ic.comment;
        }
      });
    }
  }

  if (quoteId && quoteLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
      </div>
    );
  }

  const quoteTotal =
    quote?.items.reduce((sum, i) => sum + Number(i.lineTotal), 0) ?? 0;

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => router.push("/quotes")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Quotes
      </button>

      {/* Page title */}
      <h1
        className="mb-6 text-2xl font-bold text-white"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        {quoteId ? (quote?.title ?? "Edit Quote") : "New Quote"}
      </h1>

      {/* Two-column layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left column — Line items (60%) */}
        <div className="flex-1 lg:w-3/5">
          {/* Quote-level mockup */}
          {quoteId && (
            <div className="mb-6 rounded-xl border border-[#333338] bg-[#1A1A1E] p-5">
              <h2 className="mb-3 text-lg font-semibold text-white">
                Quote Mockup
              </h2>
              <MockupUpload
                mockupUrl={quote?.mockupUrl}
                onUpload={(url) =>
                  uploadMockup.mutate({ id: quoteId!, mockupUrl: url })
                }
                onRemove={() =>
                  uploadMockup.mutate({ id: quoteId!, mockupUrl: null })
                }
                editable={isEditable}
              />
            </div>
          )}

          <div className="rounded-xl border border-[#333338] bg-[#1A1A1E] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Line Items</h2>

              {isEditable && quoteId && (
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-sm font-medium text-white hover:bg-coral-dark"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {showAddMenu && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-[#333338] bg-[#0D0D0F] py-1 shadow-xl">
                      <button
                        onClick={() => {
                          setShowCatalog(true);
                          setShowAddMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-[#1A1A1E] hover:text-white"
                      >
                        From Catalog
                      </button>
                      <button
                        onClick={() => {
                          setShowItemForm(true);
                          setShowAddMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-[#1A1A1E] hover:text-white"
                      >
                        Ad Hoc Item
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items list */}
            {(!quoteId || (quote && quote.items.length === 0)) &&
              !showItemForm && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-gray-500">
                    {quoteId
                      ? "No items yet. Add items to this quote."
                      : "Save the quote first, then add items."}
                  </p>
                </div>
              )}

            <div className="space-y-3">
              {quote?.items.map((item) =>
                editingItemId === item.id ? (
                  <div
                    key={item.id}
                    className="rounded-lg border border-coral/30 bg-[#22222A] p-4"
                  >
                    <QuoteItemForm
                      initialData={{
                        savedProductId: item.savedProductId ?? undefined,
                        description: item.description,
                        sku: item.sku ?? undefined,
                        color: item.color ?? undefined,
                        unitPrice: Number(item.unitPrice),
                        quantity: item.quantity,
                        decorationNotes: item.decorationNotes ?? undefined,
                        sizeBreakdown: item.sizeBreakdown as
                          | Record<string, number>
                          | undefined,
                        sortOrder: item.sortOrder,
                      }}
                      onSubmit={(data) => handleUpdateItem(item.id, data)}
                      onCancel={() => setEditingItemId(null)}
                    />
                  </div>
                ) : (
                  <QuoteItemCard
                    key={item.id}
                    item={{
                      ...item,
                      unitPrice: Number(item.unitPrice),
                      lineTotal: Number(item.lineTotal),
                      sizeBreakdown: item.sizeBreakdown as Record<
                        string,
                        number
                      > | null,
                    }}
                    editable={isEditable}
                    onEdit={() => setEditingItemId(item.id)}
                    onRemove={() => removeItem.mutate({ itemId: item.id })}
                    onMockupUpload={(url) =>
                      uploadItemMockup.mutate({ itemId: item.id, mockupUrl: url })
                    }
                    onMockupRemove={() =>
                      uploadItemMockup.mutate({ itemId: item.id, mockupUrl: null })
                    }
                    itemComment={itemCommentMap[item.id]}
                  />
                )
              )}

              {/* Add item form */}
              {showItemForm && (
                <div className="rounded-lg border border-coral/30 bg-[#22222A] p-4">
                  <QuoteItemForm
                    onSubmit={handleAddItem}
                    onCancel={() => setShowItemForm(false)}
                    sortOrder={quote?.items.length ?? 0}
                  />
                </div>
              )}
            </div>

            {/* Total */}
            {quote && quote.items.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-[#333338] pt-4">
                <span className="text-sm font-medium text-gray-400">
                  Quote Total
                </span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(quoteTotal)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right column — Settings panel (40%) */}
        <div className="lg:w-2/5">
          <div className="sticky top-24 rounded-xl border border-[#333338] bg-[#1A1A1E] p-5">
            <QuoteSettingsPanel
              quoteId={quoteId}
              status={quote?.status}
              number={quote?.number}
              convertedOrderId={quote?.convertedOrderId}
              companyId={companyId}
              title={title}
              paymentTermType={paymentTermType}
              depositPercent={depositPercent}
              netDays={netDays}
              expiresAt={expiresAt}
              notes={notes}
              clientMessage={clientMessage}
              onCompanyIdChange={setCompanyId}
              onTitleChange={setTitle}
              onPaymentTermTypeChange={setPaymentTermType}
              onDepositPercentChange={setDepositPercent}
              onNetDaysChange={setNetDays}
              onExpiresAtChange={setExpiresAt}
              onNotesChange={setNotes}
              onClientMessageChange={setClientMessage}
              companies={companies}
              changeRequests={quote?.changeRequests?.map((cr) => ({
                ...cr,
                itemComments: cr.itemComments,
              }))}
              onSave={handleSave}
              onSend={handleSend}
              onConvert={handleConvert}
              isSaving={
                createQuote.isPending || updateQuote.isPending
              }
              isSending={sendQuote.isPending}
              isConverting={convertToOrder.isPending}
            />
          </div>
        </div>
      </div>

      {/* Catalog picker dialog */}
      <CatalogPickerDialog
        companyId={companyId}
        open={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelect={handleCatalogSelect}
      />

      {/* Send confirmation dialog */}
      {showConfirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-[#333338] bg-[#0D0D0F] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Send Quote to Client?
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              The client will be able to view, approve, or request changes to
              this quote.
            </p>
            {quoteTotal > 0 && (
              <p className="mt-2 text-sm text-white">
                Total: <strong>{formatCurrency(quoteTotal)}</strong>
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmSend(false)}
                className="rounded-lg border border-[#333338] px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                disabled={sendQuote.isPending}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
              >
                {sendQuote.isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert confirmation dialog */}
      {showConfirmConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-[#333338] bg-[#0D0D0F] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Convert to Order?
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              This will create an order from this quote and copy all line items.
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmConvert(false)}
                className="rounded-lg border border-[#333338] px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmConvert}
                disabled={convertToOrder.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {convertToOrder.isPending
                  ? "Converting..."
                  : "Convert to Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
