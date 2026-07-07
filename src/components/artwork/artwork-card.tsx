"use client";

import { COLORS } from "@/lib/tokens";
import { Image, FileText, Tag } from "lucide-react";
import { ArtworkSourceBadge } from "./artwork-source-badge";

interface ArtworkCardProps {
  artwork: {
    id: string;
    name: string;
    filename: string;
    fileType: string | null;
    currentVersion: number;
    createdAt: string | Date;
    company: { id: string; name: string };
    versions: Array<{
      thumbnailUrl: string | null;
      sourceType: string;
      fileUrl: string;
    }>;
    tags: Array<{ id: string; tag: string }>;
    orderArtworkLinks: Array<{ order: { id: string; number: string } }>;
  };
  onSelect: (id: string) => void;
  variant: "grid" | "list";
}

const IMAGE_TYPES = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "tiff"];

function isImageType(fileType: string | null): boolean {
  return !!fileType && IMAGE_TYPES.includes(fileType.toLowerCase());
}

export function ArtworkCard({ artwork, onSelect, variant }: ArtworkCardProps) {
  const latestVersion = artwork.versions[0];
  const sourceType = latestVersion?.sourceType ?? "NATIVE";
  const thumbnailUrl = latestVersion?.thumbnailUrl;

  if (variant === "list") {
    return (
      <div
        onClick={() => onSelect(artwork.id)}
        className="flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors cursor-pointer"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorder;
        }}
      >
        {/* Thumbnail */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: COLORS.surface }}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={artwork.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : isImageType(artwork.fileType) ? (
            <Image className="h-5 w-5" style={{ color: COLORS.textMuted }} />
          ) : (
            <FileText className="h-5 w-5" style={{ color: COLORS.textMuted }} />
          )}
        </div>

        {/* Name + filename */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="truncate text-sm font-medium"
              style={{ color: COLORS.textPrimary }}
            >
              {artwork.name || artwork.filename}
            </span>
            <ArtworkSourceBadge sourceType={sourceType} />
          </div>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            {artwork.filename}
          </span>
        </div>

        {/* Tags */}
        <div className="hidden w-40 shrink-0 md:flex flex-wrap gap-1">
          {artwork.tags.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{ backgroundColor: COLORS.surface, color: COLORS.textSecondary }}
            >
              {t.tag}
            </span>
          ))}
          {artwork.tags.length > 3 && (
            <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
              +{artwork.tags.length - 3}
            </span>
          )}
        </div>

        {/* Version */}
        <div className="w-16 shrink-0 text-center">
          <span className="text-xs" style={{ color: COLORS.textSecondary }}>
            v{artwork.currentVersion}
          </span>
        </div>

        {/* Linked orders */}
        <div className="w-20 shrink-0 text-right">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            {artwork.orderArtworkLinks.length > 0
              ? `${artwork.orderArtworkLinks.length} order${artwork.orderArtworkLinks.length > 1 ? "s" : ""}`
              : "—"}
          </span>
        </div>

        {/* Company */}
        <div
          className="w-28 shrink-0 truncate text-right text-xs"
          style={{ color: COLORS.textMuted }}
        >
          {artwork.company.name}
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div
      onClick={() => onSelect(artwork.id)}
      className="group rounded-lg border transition-all cursor-pointer overflow-hidden"
      style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorder;
      }}
    >
      {/* Preview area */}
      <div
        className="flex h-36 items-center justify-center"
        style={{ backgroundColor: COLORS.surface }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={artwork.name}
            className="h-full w-full object-cover"
          />
        ) : isImageType(artwork.fileType) ? (
          <Image className="h-10 w-10" style={{ color: COLORS.textMuted }} />
        ) : (
          <FileText className="h-10 w-10" style={{ color: COLORS.textMuted }} />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span
            className="text-sm font-medium leading-snug line-clamp-1"
            style={{ color: COLORS.textPrimary }}
          >
            {artwork.name || artwork.filename}
          </span>
          <ArtworkSourceBadge sourceType={sourceType} />
        </div>

        <div
          className="mb-2 text-xs truncate"
          style={{ color: COLORS.textMuted }}
        >
          {artwork.filename} · v{artwork.currentVersion}
        </div>

        {/* Tags */}
        {artwork.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            <Tag className="h-3 w-3" style={{ color: COLORS.textMuted }} />
            {artwork.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="rounded-full px-1.5 py-0.5 text-[9px]"
                style={{ backgroundColor: COLORS.surface, color: COLORS.textSecondary }}
              >
                {t.tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {artwork.company.name}
          </span>
          {artwork.orderArtworkLinks.length > 0 && (
            <span className="text-[11px]" style={{ color: COLORS.textSecondary }}>
              {artwork.orderArtworkLinks.length} order{artwork.orderArtworkLinks.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
