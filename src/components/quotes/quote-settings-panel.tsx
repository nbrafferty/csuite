"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PaymentTermsDisplay } from "./payment-terms-display";
import { QuoteStatusBadge } from "./quote-status-badge";
import { formatDistanceToNow, format } from "date-fns";

type Company = { id: string; name: string; slug: string };

type ChangeRequest = {
  id: string;
  message: string;
  itemComments: any;
  createdAt: string | Date;
  user: { id: string; name: string };
};

type QuoteSettingsPanelProps = {
  // Quote data (if editing)
  quoteId?: string;
  status?: string;
  number?: string;
  convertedOrderId?: string | null;

  // Form values
  companyId: string;
  title: string;
  paymentTermType: string;
  depositPercent: number | null;
  netDays: number | null;
  expiresAt: string;
  notes: string;
  clientMessage: string;

  // Setters
  onCompanyIdChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onPaymentTermTypeChange: (v: string) => void;
  onDepositPercentChange: (v: number | null) => void;
  onNetDaysChange: (v: number | null) => void;
  onExpiresAtChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onClientMessageChange: (v: string) => void;

  // Companies list
  companies: Company[];

  // Change requests
  changeRequests?: ChangeRequest[];

  // Actions
  onSave: () => void;
  onSend: () => void;
  onConvert?: () => void;
  isSaving?: boolean;
  isSending?: boolean;
  isConverting?: boolean;
};

export function QuoteSettingsPanel({
  quoteId,
  status,
  number,
  convertedOrderId,
  companyId,
  title,
  paymentTermType,
  depositPercent,
  netDays,
  expiresAt,
  notes,
  clientMessage,
  onCompanyIdChange,
  onTitleChange,
  onPaymentTermTypeChange,
  onDepositPercentChange,
  onNetDaysChange,
  onExpiresAtChange,
  onNotesChange,
  onClientMessageChange,
  companies,
  changeRequests,
  onSave,
  onSend,
  onConvert,
  isSaving,
  isSending,
  isConverting,
}: QuoteSettingsPanelProps) {
  const isEditable = !status || status === "DRAFT" || status === "CHANGES_REQUESTED";
  const isReadOnly = status === "SENT" || status === "APPROVED" || status === "DECLINED" || status === "EXPIRED" || status === "CONVERTED";

  return (
    <div className="space-y-5">
      {/* Quote number + status */}
      {quoteId && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-gray-500">{number}</span>
          {status && <QuoteStatusBadge status={status} />}
        </div>
      )}

      {/* Client selector */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Client *
        </label>
        <select
          value={companyId}
          onChange={(e) => onCompanyIdChange(e.target.value)}
          disabled={!!quoteId || isReadOnly}
          className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white focus:border-coral focus:outline-none disabled:opacity-50"
        >
          <option value="">Select a client...</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Quote Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={isReadOnly}
          placeholder='e.g. "Summer Event Tees"'
          className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Payment terms */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Payment Terms
        </label>
        <select
          value={paymentTermType}
          onChange={(e) => {
            onPaymentTermTypeChange(e.target.value);
            if (e.target.value !== "DEPOSIT") onDepositPercentChange(null);
            if (e.target.value !== "NET") onNetDaysChange(null);
          }}
          disabled={isReadOnly}
          className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white focus:border-coral focus:outline-none disabled:opacity-50"
        >
          <option value="FULL">Pay in Full</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="NET">Net Terms</option>
        </select>

        {paymentTermType === "DEPOSIT" && (
          <div className="mt-2">
            <label className="mb-0.5 block text-xs text-gray-500">
              Deposit %
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={depositPercent ?? ""}
              onChange={(e) =>
                onDepositPercentChange(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={isReadOnly}
              placeholder="50"
              className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none disabled:opacity-50"
            />
          </div>
        )}

        {paymentTermType === "NET" && (
          <div className="mt-2">
            <label className="mb-0.5 block text-xs text-gray-500">
              Net Days
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={netDays ?? ""}
              onChange={(e) =>
                onNetDaysChange(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              disabled={isReadOnly}
              placeholder="30"
              className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none disabled:opacity-50"
            />
          </div>
        )}
      </div>

      {/* Expiration date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Expiration Date
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => onExpiresAtChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white focus:border-coral focus:outline-none disabled:opacity-50"
        />
        {!expiresAt && (
          <p className="mt-0.5 text-xs text-gray-600">No expiry set</p>
        )}
      </div>

      {/* Internal notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Internal Notes{" "}
          <span className="text-xs text-gray-600">(staff only)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={isReadOnly}
          placeholder="Notes visible only to staff..."
          rows={2}
          className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Client message */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          Message to Client
        </label>
        <textarea
          value={clientMessage}
          onChange={(e) => onClientMessageChange(e.target.value)}
          disabled={isReadOnly}
          placeholder="This message will be shown to the client..."
          rows={2}
          className="w-full rounded-lg border border-[#333338] bg-[#22222A] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Change request history */}
      {changeRequests && changeRequests.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-yellow-400">
            Change Requests
          </label>
          <div className="space-y-2">
            {changeRequests.map((cr) => (
              <div
                key={cr.id}
                className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-yellow-400">
                    {cr.user.name}
                  </span>
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(cr.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-yellow-300/80">{cr.message}</p>
                {Array.isArray(cr.itemComments) &&
                  cr.itemComments.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-yellow-500/10 pt-2">
                      {(cr.itemComments as any[]).map(
                        (ic: any, i: number) => (
                          <p key={i} className="text-xs text-yellow-300/60">
                            Item comment: {ic.comment}
                          </p>
                        )
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2 border-t border-[#333338] pt-4">
        {(!status || status === "DRAFT") && (
          <>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-full rounded-lg border border-[#333338] px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={onSend}
              disabled={isSending}
              className="w-full rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send to Client"}
            </button>
          </>
        )}

        {status === "CHANGES_REQUESTED" && (
          <>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-full rounded-lg border border-[#333338] px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={onSend}
              disabled={isSending}
              className="w-full rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Re-send to Client"}
            </button>
          </>
        )}

        {status === "APPROVED" && onConvert && (
          <button
            onClick={onConvert}
            disabled={isConverting}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isConverting ? "Converting..." : "Convert to Order"}
          </button>
        )}

        {status === "CONVERTED" && convertedOrderId && (
          <a
            href={`/orders/${convertedOrderId}`}
            className="block w-full rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-center text-sm font-medium text-purple-400 hover:bg-purple-500/20"
          >
            View Order
          </a>
        )}
      </div>
    </div>
  );
}
