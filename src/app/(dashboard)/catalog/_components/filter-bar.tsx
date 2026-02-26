"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type FilterDef = {
  key: string;
  label: string;
  options: string[];
};

const FILTER_DEFS: FilterDef[] = [
  {
    key: "material",
    label: "Material",
    options: [
      "All",
      "Cotton",
      "Polyester",
      "Blend",
      "Canvas",
      "Vinyl",
      "Foam",
    ],
  },
  {
    key: "speed",
    label: "Production Speed",
    options: [
      "All",
      "Rush (1-2 days)",
      "Standard (3-5 days)",
      "Economy (7-10 days)",
    ],
  },
  {
    key: "priceRange",
    label: "Price Range",
    options: ["All", "Under $10", "$10 - $25", "$25 - $50", "$50 - $100", "$100+"],
  },
];

function FilterDropdown({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const isActive = value !== "All";
  const display = isActive ? value : `${def.label}: All`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all duration-150",
          isActive
            ? "border-coral-border bg-coral-dim text-coral"
            : "border-surface-border bg-[#22222A] text-zinc-400 hover:border-zinc-500"
        )}
      >
        {display}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-surface-border bg-surface-card p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {def.options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "cursor-pointer rounded-md px-3 py-2 text-xs transition-colors duration-100",
                opt === value
                  ? "bg-coral-dim text-coral"
                  : "text-zinc-400 hover:bg-white/[0.04]"
              )}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type Filters = {
  material: string;
  speed: string;
  priceRange: string;
};

export function FilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
}) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "All");

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-surface-border pb-6">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        Filter by:
      </span>
      {FILTER_DEFS.map((def) => (
        <FilterDropdown
          key={def.key}
          def={def}
          value={filters[def.key as keyof Filters]}
          onChange={(val) =>
            onChange({ ...filters, [def.key]: val })
          }
        />
      ))}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="text-xs font-semibold text-coral hover:text-coral-light"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
