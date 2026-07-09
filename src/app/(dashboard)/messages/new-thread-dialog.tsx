"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NewThreadDialogProps {
  open: boolean;
  onClose: () => void;
  isStaff: boolean;
  onCreated: (threadId: string) => void;
}

export function NewThreadDialog({ open, onClose, isStaff, onCreated }: NewThreadDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: clients } = trpc.clientOrg.list.useQuery(undefined, {
    enabled: open && isStaff,
  });

  const create = trpc.thread.create.useMutation({
    onSuccess: (thread) => {
      utils.thread.list.invalidate();
      const id = thread.id;
      resetAndClose();
      onCreated(id);
    },
    onError: (err) => setError(err.message),
  });

  const resetAndClose = () => {
    setSubject("");
    setBody("");
    setCompanyId("");
    setError("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isStaff && !companyId) {
      setError("Please select a client");
      return;
    }
    create.mutate({
      subject: subject.trim(),
      body: body.trim(),
      companyId: isStaff && companyId ? companyId : undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={resetAndClose} />
      <div className="relative w-full max-w-md rounded-xl border border-surface-border bg-surface-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-display text-foreground">New Message</h2>
          <button
            onClick={resetAndClose}
            className="rounded-md p-1 text-foreground-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isStaff && (
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground-secondary">
                Client *
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground focus:border-coral focus:outline-none"
              >
                <option value="">Select a client...</option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
              className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Message *
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
            >
              {create.isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
