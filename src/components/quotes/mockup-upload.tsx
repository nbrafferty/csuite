"use client";

import { useRef, useState, useCallback } from "react";
import { ImagePlus, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MockupUploadProps = {
  mockupUrl?: string | null;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
  editable?: boolean;
  compact?: boolean;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1200;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MockupUpload({
  mockupUrl,
  onUpload,
  onRemove,
  editable = true,
  compact = false,
}: MockupUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > MAX_FILE_SIZE) {
        alert("Image must be under 5MB");
        return;
      }
      setIsUploading(true);
      try {
        const dataUrl = await resizeImage(file);
        onUpload(dataUrl);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  if (mockupUrl) {
    return (
      <>
        <div className={cn("group relative", compact ? "h-20 w-20" : "w-full")}>
          <img
            src={mockupUrl}
            alt="Mockup"
            className={cn(
              "rounded-lg border border-[#333338] object-cover",
              compact ? "h-20 w-20" : "h-40 w-full"
            )}
            onClick={() => setShowFullscreen(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setShowFullscreen(true)}
              className="rounded-md p-1.5 text-white hover:bg-white/20"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            {editable && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md p-1.5 text-white hover:bg-white/20"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="rounded-md p-1.5 text-red-400 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        {/* Fullscreen overlay */}
        {showFullscreen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
            onClick={() => setShowFullscreen(false)}
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={mockupUrl}
              alt="Mockup"
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  if (!editable) return null;

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "flex cursor-pointer items-center justify-center rounded-lg border border-dashed transition-colors",
          isDragging
            ? "border-coral bg-coral/5"
            : "border-[#333338] hover:border-gray-500",
          compact
            ? "h-20 w-20 flex-col gap-0.5"
            : "h-28 w-full flex-col gap-1.5"
        )}
      >
        {isUploading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-coral" />
        ) : (
          <>
            <ImagePlus
              className={cn(
                "text-gray-600",
                compact ? "h-4 w-4" : "h-5 w-5"
              )}
            />
            <span
              className={cn(
                "text-gray-600",
                compact ? "text-[10px]" : "text-xs"
              )}
            >
              {compact ? "Mockup" : "Upload mockup image"}
            </span>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}
