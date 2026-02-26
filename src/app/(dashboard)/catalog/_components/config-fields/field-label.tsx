"use client";

export function FieldLabel({
  label,
  noMargin,
}: {
  label: string;
  noMargin?: boolean;
}) {
  return (
    <div
      className={noMargin ? "flex items-center gap-2" : "mb-2 flex items-center gap-2"}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      <span className="text-[10px] text-zinc-500">optional</span>
    </div>
  );
}
