"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Send } from "lucide-react";

export default function NewQuoteRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inHandsDate, setInHandsDate] = useState("");

  const createMutation = trpc.quoteRequest.create.useMutation({
    onSuccess: () => router.push("/quotes"),
  });

  const handleSubmit = (asDraft: boolean) => {
    if (!title.trim()) return;
    createMutation.mutate({
      title,
      description: description || undefined,
      inHandsDate: inHandsDate ? new Date(inHandsDate).toISOString() : undefined,
      submit: !asDraft,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => router.push("/quotes")}
        className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quotes
      </button>

      <h1 className="text-2xl font-bold text-white mb-2">
        New Quote Request
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Describe what you need and our team will prepare a quote for you.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title / Project Name *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Spring Gala Event Merchandise"
            className="w-full rounded-lg border border-surface-border bg-surface-card px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Describe what you need — quantities, sizes, decoration details, etc."
            className="w-full rounded-lg border border-surface-border bg-surface-card px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            In-Hands Date
          </label>
          <input
            type="date"
            value={inHandsDate}
            onChange={(e) => setInHandsDate(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-card px-4 py-3 text-sm text-white focus:border-coral focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            When do you need the items delivered?
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-6">
          <button
            onClick={() => handleSubmit(true)}
            disabled={!title.trim() || createMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-surface-border px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={!title.trim() || createMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {createMutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
