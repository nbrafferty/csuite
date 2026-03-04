"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { COLORS } from "@/lib/tokens";

interface ArtworkTagInputProps {
  tags: string[];
  suggestions?: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function ArtworkTagInput({
  tags,
  suggestions = [],
  onAdd,
  onRemove,
}: ArtworkTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !tags.includes(s) &&
      s.toLowerCase().includes(inputValue.toLowerCase())
  );

  function handleAdd(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onAdd(trimmed);
    setInputValue("");
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd(inputValue);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
            style={{ backgroundColor: COLORS.surface, color: COLORS.textSecondary }}
          >
            {tag}
            <button
              onClick={() => onRemove(tag)}
              className="hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag..."
            className="flex-1 rounded-lg border border-surface-border bg-[#0D0D0F] px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
          <button
            onClick={() => handleAdd(inputValue)}
            disabled={!inputValue.trim()}
            className="rounded-lg border border-surface-border px-2 py-1.5 text-gray-400 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-20 max-h-32 overflow-y-auto rounded-lg border shadow-lg"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.cardBorder,
            }}
          >
            {filteredSuggestions.slice(0, 8).map((s) => (
              <button
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAdd(s);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                style={{ color: COLORS.textSecondary }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
