"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  Tag,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { ArtworkUploadDialog } from "@/components/artwork/artwork-upload-dialog";
import { ArtworkDetailPanel } from "@/components/artwork/artwork-detail-panel";
import { COLORS } from "@/lib/tokens";

type ViewMode = "grid" | "list";

export default function ArtworkPage() {
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(
    null
  );

  const { data, isLoading } = trpc.artwork.list.useQuery(
    {
      search: search || undefined,
      tag: selectedTag || undefined,
      fileType: selectedFileType || undefined,
      sourceType: selectedSource || undefined,
    },
    { refetchInterval: 15_000 }
  );

  const { data: allTags } = trpc.artwork.listTags.useQuery();

  const artworks = data?.artworks ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Artwork Library</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            {isStaff
              ? "Manage artwork assets across all clients"
              : "Upload and manage your artwork files"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-surface-border bg-surface-card p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-coral/20 text-coral"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                viewMode === "list"
                  ? "bg-coral/20 text-coral"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Artwork
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artwork..."
            className="w-full rounded-lg border border-surface-border bg-surface-card pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>

        {/* Tag filter */}
        {allTags && allTags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-3.5 w-3.5 text-gray-500 mr-1" />
            <button
              onClick={() => setSelectedTag("")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                !selectedTag
                  ? "bg-coral/20 text-coral"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              All
            </button>
            {(allTags as string[]).slice(0, 6).map((tag: string) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  selectedTag === tag
                    ? "bg-coral/20 text-coral"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* File type filter */}
        <select
          value={selectedFileType}
          onChange={(e) => setSelectedFileType(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs text-gray-300 focus:border-coral focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="svg">SVG</option>
          <option value="ai">AI</option>
          <option value="eps">EPS</option>
          <option value="pdf">PDF</option>
          <option value="psd">PSD</option>
        </select>

        {/* Source filter */}
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs text-gray-300 focus:border-coral focus:outline-none"
        >
          <option value="">All Sources</option>
          <option value="NATIVE">Uploaded</option>
          <option value="DROPBOX">Dropbox</option>
          <option value="GOOGLE_DRIVE">Google Drive</option>
        </select>

        {/* Count */}
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {total} artwork{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "space-y-2"
          }
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "animate-pulse rounded-lg border border-surface-border bg-surface-card",
                viewMode === "grid" ? "h-52" : "h-16"
              )}
            />
          ))}
        </div>
      ) : artworks.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-12 text-center">
          <p className="text-gray-500">No artwork found</p>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="mt-3 text-sm text-coral hover:text-coral-light"
          >
            Upload your first artwork
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {artworks.map((artwork: any) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              onSelect={setSelectedArtworkId}
              variant="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {artworks.map((artwork: any) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              onSelect={setSelectedArtworkId}
              variant="list"
            />
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <ArtworkUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
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
