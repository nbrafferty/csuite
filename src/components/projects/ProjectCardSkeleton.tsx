"use client";

import { COLORS } from "@/lib/tokens";

export function ProjectCardSkeleton() {
  return (
    <div
      className="skeleton-pulse rounded-lg border p-4"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.cardBorder,
      }}
    >
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div
          className="h-4 w-32 rounded"
          style={{ backgroundColor: COLORS.cardBorder }}
        />
        <div
          className="h-4 w-12 rounded"
          style={{ backgroundColor: COLORS.cardBorder }}
        />
      </div>

      {/* Title */}
      <div
        className="mb-2 h-4 w-48 rounded"
        style={{ backgroundColor: COLORS.cardBorder }}
      />

      {/* Subtitle */}
      <div
        className="mb-4 h-3 w-28 rounded"
        style={{ backgroundColor: COLORS.cardBorder }}
      />

      {/* Progress bar */}
      <div
        className="mb-4 h-1 w-full rounded-full"
        style={{ backgroundColor: COLORS.cardBorder }}
      />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-full"
              style={{ backgroundColor: COLORS.cardBorder }}
            />
          ))}
        </div>
        <div
          className="h-3 w-20 rounded"
          style={{ backgroundColor: COLORS.cardBorder }}
        />
      </div>
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse flex items-center gap-4 rounded-lg border px-4 py-3"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.cardBorder,
          }}
        >
          <div
            className="h-4 w-40 rounded"
            style={{ backgroundColor: COLORS.cardBorder }}
          />
          <div
            className="h-4 w-20 rounded"
            style={{ backgroundColor: COLORS.cardBorder }}
          />
          <div
            className="h-4 w-24 rounded"
            style={{ backgroundColor: COLORS.cardBorder }}
          />
          <div
            className="h-2 w-32 rounded-full"
            style={{ backgroundColor: COLORS.cardBorder }}
          />
          <div
            className="ml-auto h-4 w-16 rounded"
            style={{ backgroundColor: COLORS.cardBorder }}
          />
        </div>
      ))}
    </div>
  );
}
