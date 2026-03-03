"use client";

import { Pencil, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type QuoteItemData = {
  id: string;
  description: string;
  sku?: string | null;
  color?: string | null;
  unitPrice: number | string;
  quantity: number;
  lineTotal: number | string;
  decorationNotes?: string | null;
  sizeBreakdown?: Record<string, number> | null;
  savedProduct?: {
    id: string;
    name: string;
    thumbnailUrl?: string | null;
  } | null;
  sortOrder: number;
};

type QuoteItemCardProps = {
  item: QuoteItemData;
  editable?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  dragHandleProps?: Record<string, any>;
  itemComment?: string | null;
};

const formatCurrency = (n: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n));

export function QuoteItemCard({
  item,
  editable = false,
  onEdit,
  onRemove,
  dragHandleProps,
  itemComment,
}: QuoteItemCardProps) {
  const sizeBreakdown =
    item.sizeBreakdown && typeof item.sizeBreakdown === "object"
      ? (item.sizeBreakdown as Record<string, number>)
      : null;

  return (
    <div
      className={cn(
        "group rounded-lg border border-[#333338] bg-[#1A1A1E] p-4 transition-colors",
        editable && "hover:border-[#444449]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {editable && dragHandleProps && (
          <div
            {...dragHandleProps}
            className="mt-1 cursor-grab text-gray-600 hover:text-gray-400 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Thumbnail */}
        {item.savedProduct?.thumbnailUrl && (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#22222A]">
            <img
              src={item.savedProduct.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-white">{item.description}</p>
              {item.sku && (
                <p className="mt-0.5 text-xs text-gray-500">SKU: {item.sku}</p>
              )}
              {item.color && (
                <p className="mt-0.5 text-xs text-gray-500">
                  Color: {item.color}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-medium text-white">
                {formatCurrency(item.lineTotal)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {item.quantity} x {formatCurrency(item.unitPrice)}
              </p>
            </div>
          </div>

          {item.decorationNotes && (
            <p className="mt-2 text-sm text-gray-500">
              {item.decorationNotes}
            </p>
          )}

          {sizeBreakdown && Object.keys(sizeBreakdown).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(sizeBreakdown).map(([size, qty]) => (
                <span
                  key={size}
                  className="rounded-full bg-[#22222A] px-2 py-0.5 text-xs text-gray-400"
                >
                  {size}: {qty}
                </span>
              ))}
            </div>
          )}

          {itemComment && (
            <div className="mt-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
              <p className="text-xs font-medium text-yellow-400">
                Client feedback:
              </p>
              <p className="mt-0.5 text-sm text-yellow-300/80">
                {itemComment}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {editable && (
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={onEdit}
                className="rounded-md p-1.5 text-gray-500 hover:bg-[#22222A] hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="rounded-md p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
