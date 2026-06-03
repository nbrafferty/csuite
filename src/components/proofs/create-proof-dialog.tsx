"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, Image, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type FileEntry = {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
};

type CreateProofDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (proofId: string) => void;
  companyId: string;
  isStaff: boolean;
};

export function CreateProofDialog({
  open,
  onClose,
  onCreated,
  companyId,
  isStaff,
}: CreateProofDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: companies } = trpc.clientOrg.list.useQuery(undefined, {
    enabled: open && isStaff,
  });

  const createProof = trpc.proof.create.useMutation();
  const confirmAsset = trpc.proof.confirmAsset.useMutation();
  const utils = trpc.useUtils();

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    const entries: FileEntry[] = Array.from(incoming)
      .filter((f) => allowed.includes(f.type))
      .map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        status: "pending" as const,
      }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const entry = prev[index];
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setCreating(true);

    try {
      const proof = await createProof.mutateAsync({
        title: title.trim(),
        companyId: selectedCompanyId,
      });

      const versionId = proof.currentVersion?.id;

      if (versionId && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const entry = files[i];
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "uploading" } : f
            )
          );

          const kind = entry.file.type === "application/pdf" ? "PDF" as const : "IMAGE" as const;

          // Get image dimensions for image files
          let width: number | undefined;
          let height: number | undefined;
          if (entry.file.type.startsWith("image/")) {
            try {
              const dims = await getImageDimensions(entry.file);
              width = dims.width;
              height = dims.height;
            } catch {}
          }

          const s3Key = `proofs/${proof.id}/${versionId}/${entry.file.name}`;

          const form = new FormData();
          form.append("file", entry.file);
          form.append("s3Key", s3Key);
          const uploadRes = await fetch("/api/proof-assets/upload", { method: "POST", body: form });
          if (!uploadRes.ok) {
            console.error("Upload failed:", await uploadRes.text());
          }

          await confirmAsset.mutateAsync({
            versionId,
            s3Key,
            fileName: entry.file.name,
            mimeType: entry.file.type,
            kind,
            width,
            height,
          });

          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "done" } : f
            )
          );
        }
      }

      utils.proof.list.invalidate();
      onCreated(proof.id);
    } catch {
      setCreating(false);
    }
  };

  if (!open) return null;

  const canSubmit = title.trim().length > 0 && !creating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-lg rounded-lg border border-surface-border bg-surface-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h3 className="font-display text-lg uppercase tracking-display text-white">
            New Proof
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-faint hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block font-label text-[11px] uppercase tracking-label text-ink-muted">
              Proof title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acme Corp Polo — Spring 2025"
              className="w-full rounded-md border border-surface-border bg-surface-card px-3 py-2 text-sm text-white placeholder-ink-faint focus:border-coral focus:outline-none"
              autoFocus
            />
          </div>

          {/* Company selector — staff only */}
          {isStaff && companies && (
            <div>
              <label className="mb-1.5 block font-label text-[11px] uppercase tracking-label text-ink-muted">
                Client
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full rounded-md border border-surface-border bg-surface-card px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
              >
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File drop zone */}
          <div>
            <label className="mb-1.5 block font-label text-[11px] uppercase tracking-label text-ink-muted">
              Proof files
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors",
                dragOver
                  ? "border-coral bg-coral/10"
                  : "border-surface-border bg-surface-card/50 hover:border-ink-faint"
              )}
            >
              <Upload
                className={cn(
                  "h-8 w-8",
                  dragOver ? "text-coral" : "text-ink-faint"
                )}
              />
              <p className="mt-2 text-xs text-ink-muted">
                Drop images or PDFs here, or click to browse
              </p>
              <p className="mt-0.5 text-[10px] text-ink-faint">
                PNG, JPG, WebP, PDF
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-surface-border bg-surface-card px-3 py-2"
                >
                  {entry.preview ? (
                    <img
                      src={entry.preview}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <FileText className="h-5 w-5 text-ink-faint" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white">
                      {entry.file.name}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {(entry.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  {entry.status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-coral" />
                  ) : entry.status === "done" ? (
                    <span className="text-[10px] text-emerald-400">Done</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="rounded p-0.5 text-ink-faint hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-surface-border px-5 py-3">
          <button
            onClick={onClose}
            disabled={creating}
            className="rounded-md px-4 py-2 text-sm text-ink-muted hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white transition-colors",
              canSubmit
                ? "bg-coral hover:bg-coral-light"
                : "cursor-not-allowed bg-coral/40"
            )}
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? "Creating..." : "Create proof"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
