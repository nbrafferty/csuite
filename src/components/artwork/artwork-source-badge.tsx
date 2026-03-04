"use client";

import { COLORS } from "@/lib/tokens";

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NATIVE: { label: "Uploaded", color: COLORS.blue, bg: COLORS.blueDim },
  DROPBOX: { label: "Dropbox", color: COLORS.purple, bg: COLORS.purpleDim },
  GOOGLE_DRIVE: { label: "Google Drive", color: COLORS.green, bg: COLORS.greenDim },
};

export function ArtworkSourceBadge({ sourceType }: { sourceType: string }) {
  const config = SOURCE_CONFIG[sourceType] ?? SOURCE_CONFIG.NATIVE;

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
