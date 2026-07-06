"use client";

import { useState, useRef } from "react";
import { X, Upload, Cloud, HardDrive } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { COLORS } from "@/lib/tokens";

interface ArtworkUploadDialogProps {
  open: boolean;
  onClose: () => void;
  defaultOrderId?: string;
}

type SourceTab = "upload" | "dropbox" | "google";

export function ArtworkUploadDialog({
  open,
  onClose,
  defaultOrderId,
}: ArtworkUploadDialogProps) {
  const [sourceTab, setSourceTab] = useState<SourceTab>("upload");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropbox fields
  const [dropboxLink, setDropboxLink] = useState("");
  const [dropboxFileName, setDropboxFileName] = useState("");

  // Google Drive fields
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [googleDriveFileId, setGoogleDriveFileId] = useState("");
  const [googleDriveFileName, setGoogleDriveFileName] = useState("");

  const utils = trpc.useUtils();

  const getUploadUrl = trpc.artwork.getUploadUrl.useMutation();
  const createNative = trpc.artwork.createNative.useMutation({
    onSuccess: () => {
      utils.artwork.list.invalidate();
      resetForm();
      onClose();
    },
  });
  const createFromDropbox = trpc.artwork.createFromDropbox.useMutation({
    onSuccess: () => {
      utils.artwork.list.invalidate();
      resetForm();
      onClose();
    },
  });
  const createFromGoogleDrive = trpc.artwork.createFromGoogleDrive.useMutation({
    onSuccess: () => {
      utils.artwork.list.invalidate();
      resetForm();
      onClose();
    },
  });

  const isPending =
    uploading ||
    getUploadUrl.isPending ||
    createNative.isPending ||
    createFromDropbox.isPending ||
    createFromGoogleDrive.isPending;

  function resetForm() {
    setName("");
    setDescription("");
    setTags("");
    setSelectedFile(null);
    setUploadError("");
    setDropboxLink("");
    setDropboxFileName("");
    setGoogleDriveLink("");
    setGoogleDriveFileId("");
    setGoogleDriveFileName("");
    setSourceTab("upload");
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    if (!name) {
      setName(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !name.trim()) return;
    setUploadError("");

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const orderIds = defaultOrderId ? [defaultOrderId] : [];

    try {
      // Allocate a storage key, then upload the file bytes
      const { uploadUrl, s3Key } = await getUploadUrl.mutateAsync({
        fileName: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream",
      });

      setUploading(true);
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("key", s3Key);
      const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error ?? "File upload failed");
      }
      const { url } = await uploadRes.json();

      createNative.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type || "application/octet-stream",
        s3Key,
        fileUrl: url,
        tags: tagList,
        orderIds,
      });
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDropboxSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dropboxLink.trim() || !name.trim()) return;

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const orderIds = defaultOrderId ? [defaultOrderId] : [];
    const fileName = dropboxFileName || "dropbox-file";

    createFromDropbox.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      fileName,
      fileSize: 0,
      dropboxLink: dropboxLink.trim(),
      tags: tagList,
      orderIds,
    });
  }

  function handleGoogleDriveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!googleDriveLink.trim() || !name.trim()) return;

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const orderIds = defaultOrderId ? [defaultOrderId] : [];
    const fileName = googleDriveFileName || "gdrive-file";

    createFromGoogleDrive.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      fileName,
      fileSize: 0,
      googleDriveFileId: googleDriveFileId || "manual-link",
      googleDriveLink: googleDriveLink.trim(),
      tags: tagList,
      orderIds,
    });
  }

  if (!open) return null;

  const sourceTabs: { id: SourceTab; label: string; icon: typeof Upload }[] = [
    { id: "upload", label: "Upload File", icon: Upload },
    { id: "dropbox", label: "Dropbox", icon: Cloud },
    { id: "google", label: "Google Drive", icon: HardDrive },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-xl rounded-xl border p-6 shadow-xl"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.cardBorder,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add Artwork</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Source tabs */}
        <div
          className="flex gap-1 mb-5 rounded-lg p-1"
          style={{ backgroundColor: COLORS.surface }}
        >
          {sourceTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sourceTab === tab.id
                  ? "bg-coral text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Common fields */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Artwork name"
              className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags (e.g. logo, brand, vector)"
              className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
            />
          </div>
        </div>

        {/* Source-specific content */}
        {sourceTab === "upload" && (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Drop zone */}
            <div
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? "border-coral bg-coral/5" : ""
              }`}
              style={{
                borderColor: dragOver ? COLORS.coral : COLORS.cardBorder,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.ai,.eps,.svg,.psd"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              {selectedFile ? (
                <div>
                  <Upload className="mx-auto mb-2 h-8 w-8" style={{ color: COLORS.coral }} />
                  <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto mb-2 h-8 w-8" style={{ color: COLORS.textMuted }} />
                  <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    PNG, JPG, SVG, AI, EPS, PDF up to 50MB
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || !name.trim() || isPending}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
              >
                {isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        )}

        {sourceTab === "dropbox" && (
          <form onSubmit={handleDropboxSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Dropbox Link <span className="text-red-400">*</span>
              </label>
              <input
                value={dropboxLink}
                onChange={(e) => setDropboxLink(e.target.value)}
                placeholder="https://www.dropbox.com/s/..."
                className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                File Name
              </label>
              <input
                value={dropboxFileName}
                onChange={(e) => setDropboxFileName(e.target.value)}
                placeholder="original-filename.ai"
                className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!dropboxLink.trim() || !name.trim() || isPending}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
              >
                {isPending ? "Linking..." : "Link from Dropbox"}
              </button>
            </div>
          </form>
        )}

        {sourceTab === "google" && (
          <form onSubmit={handleGoogleDriveSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Google Drive Link <span className="text-red-400">*</span>
              </label>
              <input
                value={googleDriveLink}
                onChange={(e) => setGoogleDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                File Name
              </label>
              <input
                value={googleDriveFileName}
                onChange={(e) => setGoogleDriveFileName(e.target.value)}
                placeholder="design-file.psd"
                className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!googleDriveLink.trim() || !name.trim() || isPending}
                className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
              >
                {isPending ? "Linking..." : "Link from Google Drive"}
              </button>
            </div>
          </form>
        )}

        {(uploadError || createNative.isError || createFromDropbox.isError || createFromGoogleDrive.isError) && (
          <p className="mt-3 text-xs text-red-400">
            {uploadError ||
              createNative.error?.message ||
              createFromDropbox.error?.message ||
              createFromGoogleDrive.error?.message}
          </p>
        )}
      </div>
    </div>
  );
}
