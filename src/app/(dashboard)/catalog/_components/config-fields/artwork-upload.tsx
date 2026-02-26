"use client";

import { CloudUpload, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel } from "./field-label";

export function ArtworkUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (val: string | null) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <div
        onClick={() => onChange(value ? null : "mock-file.ai")}
        className={cn(
          "cursor-pointer rounded-[10px] border-2 border-dashed p-5 text-center transition-all duration-200",
          value
            ? "border-coral bg-coral-dim"
            : "border-surface-border bg-transparent hover:border-zinc-500"
        )}
      >
        {value ? (
          <div>
            <Paperclip className="mx-auto mb-1.5 h-5 w-5 text-coral" />
            <div className="text-[13px] font-semibold text-coral">
              mock-file.ai
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              Click to remove
            </div>
          </div>
        ) : (
          <div>
            <CloudUpload className="mx-auto mb-1.5 h-6 w-6 text-zinc-400" />
            <div className="text-[13px] font-medium text-zinc-400">
              Drop file or click to upload
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              AI, EPS, PDF, PNG — 300dpi+
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
