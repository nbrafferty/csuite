"use client";

import { useState } from "react";
import {
  X,
  Image,
  FileText,
  Calendar,
  User,
  Tag,
  Link as LinkIcon,
  Trash2,
  Upload,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { COLORS } from "@/lib/tokens";
import { ArtworkSourceBadge } from "./artwork-source-badge";
import { ArtworkTagInput } from "./artwork-tag-input";
import { formatDistanceToNow } from "date-fns";

interface ArtworkDetailPanelProps {
  artworkId: string;
  onClose: () => void;
}

const IMAGE_TYPES = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "tiff"];

export function ArtworkDetailPanel({
  artworkId,
  onClose,
}: ArtworkDetailPanelProps) {
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const utils = trpc.useUtils();

  const { data: artwork, isLoading } = trpc.artwork.getById.useQuery({
    id: artworkId,
  });

  const { data: allTags } = trpc.artwork.listTags.useQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const updateMutation = trpc.artwork.update.useMutation({
    onSuccess: () => {
      utils.artwork.getById.invalidate({ id: artworkId });
      utils.artwork.list.invalidate();
      setIsEditing(false);
    },
  });

  const addTagMutation = trpc.artwork.addTag.useMutation({
    onSuccess: () => {
      utils.artwork.getById.invalidate({ id: artworkId });
      utils.artwork.list.invalidate();
      utils.artwork.listTags.invalidate();
    },
  });

  const removeTagMutation = trpc.artwork.removeTag.useMutation({
    onSuccess: () => {
      utils.artwork.getById.invalidate({ id: artworkId });
      utils.artwork.list.invalidate();
    },
  });

  const deleteMutation = trpc.artwork.delete.useMutation({
    onSuccess: () => {
      utils.artwork.list.invalidate();
      onClose();
    },
  });

  function startEditing() {
    if (!artwork) return;
    setEditName(artwork.name);
    setEditDescription(artwork.description ?? "");
    setIsEditing(true);
  }

  function handleSave() {
    if (!editName.trim()) return;
    updateMutation.mutate({
      id: artworkId,
      name: editName.trim(),
      description: editDescription.trim() || null,
    });
  }

  const latestVersion = artwork?.versions?.[0];
  const isImage =
    artwork?.fileType && IMAGE_TYPES.includes(artwork.fileType.toLowerCase());

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-surface-border bg-surface-card shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-card px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Artwork Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
          </div>
        ) : !artwork ? (
          <div className="px-6 py-20 text-center text-gray-500">
            Artwork not found
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Preview */}
            <div
              className="flex items-center justify-center rounded-lg overflow-hidden"
              style={{
                backgroundColor: COLORS.surface,
                minHeight: 160,
              }}
            >
              {latestVersion?.thumbnailUrl ? (
                <img
                  src={latestVersion.thumbnailUrl}
                  alt={artwork.name}
                  className="max-h-48 w-full object-contain"
                />
              ) : isImage ? (
                <Image
                  className="h-16 w-16"
                  style={{ color: COLORS.textMuted }}
                />
              ) : (
                <FileText
                  className="h-16 w-16"
                  style={{ color: COLORS.textMuted }}
                />
              )}
            </div>

            {/* Title + Edit */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold text-white">
                    {artwork.name || artwork.filename}
                  </h3>
                  <button
                    onClick={startEditing}
                    className="shrink-0 text-xs text-coral hover:text-coral-light"
                  >
                    Edit
                  </button>
                </div>
                {artwork.description && (
                  <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">
                    {artwork.description}
                  </p>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <FileText className="h-4 w-4 text-gray-600" />
                <span>{artwork.filename}</span>
                {artwork.fileType && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase"
                    style={{
                      backgroundColor: COLORS.blueDim,
                      color: COLORS.blue,
                    }}
                  >
                    {artwork.fileType}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <Upload className="h-4 w-4 text-gray-600" />
                <span>Version {artwork.currentVersion}</span>
                {latestVersion && (
                  <ArtworkSourceBadge sourceType={latestVersion.sourceType} />
                )}
              </div>

              {artwork.creator && (
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="h-4 w-4 text-gray-600" />
                  <span>Created by {artwork.creator.name}</span>
                  <span className="text-gray-600">
                    {formatDistanceToNow(new Date(artwork.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span>
                  {new Date(artwork.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </p>
              <ArtworkTagInput
                tags={artwork.tags.map((t: any) => t.tag)}
                suggestions={allTags ?? []}
                onAdd={(tag) =>
                  addTagMutation.mutate({ artworkId: artwork.id, tag })
                }
                onRemove={(tag) =>
                  removeTagMutation.mutate({ artworkId: artwork.id, tag })
                }
              />
            </div>

            {/* Version History */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version History
              </p>
              <div className="space-y-2">
                {artwork.versions.map((v: any) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.cardBorder,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          v{v.versionNumber}
                        </span>
                        <ArtworkSourceBadge sourceType={v.sourceType} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-xs"
                          style={{ color: COLORS.textMuted }}
                        >
                          {v.fileName}
                        </span>
                        {v.fileSize > 0 && (
                          <span
                            className="text-xs"
                            style={{ color: COLORS.textMuted }}
                          >
                            · {(v.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                      {v.uploader && (
                        <span
                          className="text-xs"
                          style={{ color: COLORS.textMuted }}
                        >
                          by {v.uploader.name} ·{" "}
                          {formatDistanceToNow(new Date(v.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                      {v.notes && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: COLORS.textSecondary }}
                        >
                          {v.notes}
                        </p>
                      )}
                    </div>
                    <a
                      href={v.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-gray-500 hover:text-white transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Orders */}
            {artwork.orderArtworkLinks.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked Orders
                </p>
                <div className="space-y-1.5">
                  {artwork.orderArtworkLinks.map((link: any) => (
                    <div
                      key={link.order.id}
                      className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ backgroundColor: COLORS.surface }}
                    >
                      <LinkIcon
                        className="h-3.5 w-3.5"
                        style={{ color: COLORS.textMuted }}
                      />
                      <span
                        className="font-mono text-xs"
                        style={{ color: COLORS.coral }}
                      >
                        {link.order.number}
                      </span>
                      <span
                        className="text-xs truncate"
                        style={{ color: COLORS.textSecondary }}
                      >
                        {link.order.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Quotes */}
            {artwork.quoteArtworkLinks.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked Quotes
                </p>
                <div className="space-y-1.5">
                  {artwork.quoteArtworkLinks.map((link: any) => (
                    <div
                      key={link.quote.id}
                      className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ backgroundColor: COLORS.surface }}
                    >
                      <LinkIcon
                        className="h-3.5 w-3.5"
                        style={{ color: COLORS.textMuted }}
                      />
                      <span
                        className="font-mono text-xs"
                        style={{ color: COLORS.purple }}
                      >
                        {link.quote.number}
                      </span>
                      <span
                        className="text-xs truncate"
                        style={{ color: COLORS.textSecondary }}
                      >
                        {link.quote.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-surface-border">
              <button
                onClick={() => {
                  if (confirm("Delete this artwork and all versions?")) {
                    deleteMutation.mutate({ id: artworkId });
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? "Deleting..." : "Delete Artwork"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
