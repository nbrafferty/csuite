"use client";

import { useRef, useState } from "react";
import { CloudUpload, Paperclip, Loader2 } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function uploadFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const key = `catalog-artwork/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
      const form = new FormData();
      form.append("file", file);
      form.append("key", key);
      const res = await fetch("/api/files/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setFileName(file.name);
      onChange(url);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleClick() {
    if (uploading) return;
    if (value) {
      setFileName("");
      onChange(null);
    } else {
      inputRef.current?.click();
    }
  }

  return (
    <div>
      <FieldLabel label={label} />
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.ai,.eps,.svg,.psd"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer rounded-[10px] border-2 border-dashed p-5 text-center transition-all duration-200",
          value
            ? "border-coral bg-coral-dim"
            : "border-surface-border bg-transparent hover:border-zinc-500"
        )}
      >
        {uploading ? (
          <div>
            <Loader2 className="mx-auto mb-1.5 h-5 w-5 animate-spin text-coral" />
            <div className="text-[13px] font-medium text-zinc-400">Uploading...</div>
          </div>
        ) : value ? (
          <div>
            <Paperclip className="mx-auto mb-1.5 h-5 w-5 text-coral" />
            <div className="text-[13px] font-semibold text-coral">
              {fileName || "Artwork attached"}
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
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
