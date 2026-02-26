"use client";

import { cn } from "@/lib/utils";
import { FieldLabel } from "./field-label";

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const DEFAULT_BREAKDOWN: Record<string, number> = {
  XS: 5,
  S: 15,
  M: 30,
  L: 30,
  XL: 15,
  "2XL": 5,
  "3XL": 0,
};

export function SizeMatrix({
  label,
  sizeMode,
  onSizeModeChange,
  totalQty,
  onTotalQtyChange,
  sizeBreakdown,
  onSizeBreakdownChange,
}: {
  label: string;
  sizeMode: "total" | "perSize";
  onSizeModeChange: (mode: "total" | "perSize") => void;
  totalQty: number;
  onTotalQtyChange: (qty: number) => void;
  sizeBreakdown: Record<string, number>;
  onSizeBreakdownChange: (breakdown: Record<string, number>) => void;
}) {
  const breakdown = { ...DEFAULT_BREAKDOWN, ...sizeBreakdown };
  const totalPct = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const sizeUnits = Object.fromEntries(
    SIZES.map((s) => [s, Math.round(((breakdown[s] || 0) / 100) * totalQty)])
  );

  const resetEvenSplit = () => {
    const activeSizes = SIZES.filter((s) => (breakdown[s] || 0) > 0);
    if (activeSizes.length === 0) return;
    const base = Math.floor(100 / activeSizes.length);
    const rem = 100 - base * activeSizes.length;
    const newBreak: Record<string, number> = {};
    SIZES.forEach((s) => {
      newBreak[s] = 0;
    });
    activeSizes.forEach((s, i) => {
      newBreak[s] = base + (i === 0 ? rem : 0);
    });
    onSizeBreakdownChange(newBreak);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <FieldLabel label={label} noMargin />
        <div className="flex gap-0 rounded-lg border border-surface-border bg-[#22222A] p-[3px]">
          {(["total", "perSize"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onSizeModeChange(mode)}
              className={cn(
                "rounded-md border-none px-3 py-[5px] text-[11px] font-semibold transition-all duration-150",
                sizeMode === mode
                  ? "bg-surface-border text-white"
                  : "text-zinc-500"
              )}
            >
              {mode === "total" ? "By Total" : "By Size"}
            </button>
          ))}
        </div>
      </div>

      {sizeMode === "total" && (
        <div className="mb-4">
          <div className="mb-1.5 text-[11px] text-zinc-500">Total Quantity</div>
          <input
            type="number"
            value={totalQty}
            onChange={(e) =>
              onTotalQtyChange(Math.max(1, parseInt(e.target.value) || 0))
            }
            className="w-full rounded-lg border border-surface-border bg-[#22222A] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-coral"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-[10px] border border-surface-border bg-[#22222A]">
        {/* Header */}
        <div className="grid border-b border-surface-border" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          <div className="p-2 text-center text-[9px] font-extrabold uppercase tracking-wider text-zinc-500">
            SIZE
          </div>
          {SIZES.map((s) => (
            <div
              key={s}
              className="p-2 text-center text-[9px] font-extrabold uppercase tracking-wider text-zinc-500"
            >
              {s}
            </div>
          ))}
        </div>

        {/* Input row */}
        <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          <div className="flex items-center justify-center p-2.5 text-[11px] font-semibold text-zinc-400">
            {sizeMode === "total" ? "%" : "Qty"}
          </div>
          {SIZES.map((s) => (
            <input
              key={s}
              type="number"
              value={breakdown[s] || 0}
              min={0}
              max={sizeMode === "total" ? 100 : undefined}
              onChange={(e) =>
                onSizeBreakdownChange({
                  ...breakdown,
                  [s]: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="border-l border-surface-border bg-transparent p-2.5 text-center text-xs text-white outline-none"
            />
          ))}
        </div>

        {/* Units row (only in total mode) */}
        {sizeMode === "total" && (
          <div
            className="grid border-t border-surface-border"
            style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
          >
            <div className="flex items-center justify-center p-2.5 text-[11px] font-semibold text-zinc-500">
              Units
            </div>
            {SIZES.map((s) => (
              <div
                key={s}
                className="flex items-center justify-center p-2.5 text-xs text-zinc-400"
              >
                {sizeUnits[s]}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {sizeMode === "total" && (
          <div
            className={cn(
              "text-[11px]",
              totalPct === 100 ? "text-emerald-400" : "text-coral"
            )}
          >
            {totalPct}% allocated
            {totalPct !== 100 && ` — ${100 - totalPct}% remaining`}
          </div>
        )}
        <button
          onClick={resetEvenSplit}
          className="ml-auto text-[11px] text-zinc-500 underline hover:text-zinc-300"
        >
          Even split
        </button>
      </div>
    </div>
  );
}
