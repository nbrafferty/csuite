"use client";

import { cn } from "@/lib/utils";
import { FieldLabel } from "./field-label";

type ColorOption = {
  label: string;
  value: string;
};

export function ColorSwatch({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ColorOption[];
  value: string | undefined;
  onChange: (val: string) => void;
}) {
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div>
      <FieldLabel label={label} />
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {options.map((opt) => (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={cn(
              "h-8 w-8 cursor-pointer rounded-full transition-all duration-150",
              value === opt.value &&
                "ring-2 ring-coral ring-offset-2 ring-offset-surface-card"
            )}
            style={{
              background: opt.value,
              border:
                value === opt.value
                  ? "3px solid #E85D5D"
                  : "3px solid transparent",
              boxShadow:
                opt.value === "#f5f5f5"
                  ? "inset 0 0 0 1px rgba(255,255,255,0.15)"
                  : "none",
            }}
          />
        ))}
      </div>
      {value && (
        <div className="mt-1.5 text-[11px] text-zinc-500">
          Selected: {selectedLabel}
        </div>
      )}
    </div>
  );
}
