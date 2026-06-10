"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

type QuoteItem = {
  id: string;
  description: string;
};

type ChangeRequestFormProps = {
  items: QuoteItem[];
  onSubmit: (data: {
    message: string;
    itemComments?: { quoteItemId: string; comment: string }[];
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ChangeRequestForm({
  items,
  onSubmit,
  onCancel,
  isLoading,
}: ChangeRequestFormProps) {
  const [message, setMessage] = useState("");
  const [itemComments, setItemComments] = useState<
    Record<string, string>
  >({});
  const [showItemComments, setShowItemComments] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const comments = Object.entries(itemComments)
      .filter(([, comment]) => comment.trim())
      .map(([quoteItemId, comment]) => ({
        quoteItemId,
        comment: comment.trim(),
      }));

    onSubmit({
      message: message.trim(),
      itemComments: comments.length > 0 ? comments : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-400">
          What changes would you like? *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the changes you'd like to see..."
          rows={3}
          className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          required
        />
      </div>

      {/* Per-item comments */}
      <div>
        <button
          type="button"
          onClick={() => setShowItemComments(!showItemComments)}
          className="flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coral-light"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {showItemComments
            ? "Hide item-specific comments"
            : "Add comments on specific items"}
        </button>

        {showItemComments && (
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.id}>
                <label className="mb-0.5 block text-xs text-gray-500">
                  {item.description}
                </label>
                <input
                  type="text"
                  value={itemComments[item.id] ?? ""}
                  onChange={(e) =>
                    setItemComments((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                  placeholder="Optional comment for this item..."
                  className="w-full rounded-md border border-surface-border bg-surface-secondary px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 disabled:opacity-50"
        >
          {isLoading ? "Submitting..." : "Submit Change Request"}
        </button>
      </div>
    </form>
  );
}
