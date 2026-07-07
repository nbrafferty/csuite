"use client";

import { useState } from "react";
import {
  Plus,
  Image,
  FileText,
  ExternalLink,
  Tag,
  Unlink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { COLORS } from "@/lib/tokens";
import { ArtworkSourceBadge } from "@/components/artwork/artwork-source-badge";
import { ArtworkUploadDialog } from "@/components/artwork/artwork-upload-dialog";
import { ArtworkDetailPanel } from "@/components/artwork/artwork-detail-panel";

interface OrderArtworkTabProps {
  orderId: string;
}

const IMAGE_TYPES = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "tiff"];

export function OrderArtworkTab({ orderId }: OrderArtworkTabProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: links, isLoading } = trpc.artwork.listByOrder.useQuery({
    orderId,
  });

  const unlinkMutation = trpc.artwork.unlinkFromOrder.useMutation({
    onSuccess: () => {
      utils.artwork.listByOrder.invalidate({ orderId });
    },
  });

  // For linking existing artwork
  const { data: allArtwork } = trpc.artwork.list.useQuery(undefined, {
    enabled: showLinkPicker,
  });

  const linkMutation = trpc.artwork.linkToOrder.useMutation({
    onSuccess: () => {
      utils.artwork.listByOrder.invalidate({ orderId });
      setShowLinkPicker(false);
    },
  });

  const linkedIds = new Set((links ?? []).map((l: any) => l.artworkAssetId));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">
          Artwork Files ({links?.length ?? 0})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkPicker(!showLinkPicker)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Link Existing
          </button>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-dark transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload New
          </button>
        </div>
      </div>

      {/* Link picker dropdown */}
      {showLinkPicker && (
        <div
          className="mb-4 rounded-lg border p-3"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.cardBorder,
          }}
        >
          <p className="mb-2 text-xs font-medium text-gray-400">
            Select artwork to link
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {(allArtwork?.artworks ?? [])
              .filter((a: any) => !linkedIds.has(a.id))
              .map((art: any) => (
                <button
                  key={art.id}
                  onClick={() =>
                    linkMutation.mutate({ artworkId: art.id, orderId })
                  }
                  disabled={linkMutation.isPending}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                    style={{ backgroundColor: COLORS.card }}
                  >
                    {art.fileType &&
                    IMAGE_TYPES.includes(art.fileType.toLowerCase()) ? (
                      <Image
                        className="h-4 w-4"
                        style={{ color: COLORS.textMuted }}
                      />
                    ) : (
                      <FileText
                        className="h-4 w-4"
                        style={{ color: COLORS.textMuted }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-white block truncate">
                      {art.name || art.filename}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: COLORS.textMuted }}
                    >
                      {art.filename}
                    </span>
                  </div>
                </button>
              ))}
            {(allArtwork?.artworks ?? []).filter(
              (a: any) => !linkedIds.has(a.id)
            ).length === 0 && (
              <p
                className="py-4 text-center text-xs"
                style={{ color: COLORS.textMuted }}
              >
                No unlinked artwork available
              </p>
            )}
          </div>
          <button
            onClick={() => setShowLinkPicker(false)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Close
          </button>
        </div>
      )}

      {/* Artwork list */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-surface-border bg-surface-card"
            />
          ))}
        </div>
      ) : !links || links.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
          <Image className="mx-auto h-8 w-8 text-gray-600 mb-3" />
          <p className="text-sm text-gray-500">No artwork linked to this order</p>
          <p className="mt-1 text-xs text-gray-600">
            Upload new artwork or link existing files from the library
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link: any) => {
            const art = link.artworkAsset;
            const latestVersion = art.versions?.[0];
            const isImage =
              art.fileType &&
              IMAGE_TYPES.includes(art.fileType.toLowerCase());

            return (
              <div
                key={link.id}
                className="flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.cardBorder,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    COLORS.cardBorderHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    COLORS.cardBorder;
                }}
              >
                {/* Thumbnail */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg cursor-pointer"
                  style={{ backgroundColor: COLORS.surface }}
                  onClick={() => setSelectedArtworkId(art.id)}
                >
                  {latestVersion?.thumbnailUrl ? (
                    <img
                      src={latestVersion.thumbnailUrl}
                      alt={art.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : isImage ? (
                    <Image
                      className="h-5 w-5"
                      style={{ color: COLORS.textMuted }}
                    />
                  ) : (
                    <FileText
                      className="h-5 w-5"
                      style={{ color: COLORS.textMuted }}
                    />
                  )}
                </div>

                {/* Info */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setSelectedArtworkId(art.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {art.name || art.filename}
                    </span>
                    {latestVersion && (
                      <ArtworkSourceBadge
                        sourceType={latestVersion.sourceType}
                      />
                    )}
                    {art.fileType && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase"
                        style={{
                          backgroundColor: COLORS.blueDim,
                          color: COLORS.blue,
                        }}
                      >
                        {art.fileType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs"
                      style={{ color: COLORS.textMuted }}
                    >
                      v{art.currentVersion}
                    </span>
                    {art.tags && art.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag
                          className="h-3 w-3"
                          style={{ color: COLORS.textMuted }}
                        />
                        <span
                          className="text-[10px]"
                          style={{ color: COLORS.textMuted }}
                        >
                          {art.tags.map((t: any) => t.tag).join(", ")}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {latestVersion?.fileUrl && (
                    <a
                      href={latestVersion.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-white transition-colors"
                      title="Open file"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() =>
                      unlinkMutation.mutate({
                        artworkId: art.id,
                        orderId,
                      })
                    }
                    disabled={unlinkMutation.isPending}
                    className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Unlink"
                  >
                    <Unlink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload dialog */}
      <ArtworkUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        defaultOrderId={orderId}
      />

      {/* Detail panel */}
      {selectedArtworkId && (
        <ArtworkDetailPanel
          artworkId={selectedArtworkId}
          onClose={() => setSelectedArtworkId(null)}
        />
      )}
    </div>
  );
}
