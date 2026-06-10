"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "PROOFING", label: "Proofing" },
  { key: "APPROVED", label: "Approved" },
  { key: "IN_PRODUCTION", label: "Production" },
  { key: "READY", label: "Ready" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "COMPLETED", label: "Completed" },
];

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? -1 : idx;
}

export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
        <span className="text-sm font-medium text-red-400">Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = getStepIndex(status);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isComplete && "bg-green-500/20 text-green-400",
                  isCurrent && "bg-coral/20 text-coral ring-2 ring-coral/30",
                  isFuture && "bg-surface-secondary text-gray-600"
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] leading-tight",
                  isComplete && "text-green-400",
                  isCurrent && "font-medium text-coral",
                  isFuture && "text-gray-600"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-0.5 mb-4 h-0.5 w-4",
                  idx < currentIdx ? "bg-green-500/30" : "bg-surface-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
