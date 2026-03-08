"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddClientDialog({ open, onClose }: AddClientDialogProps) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const createMutation = trpc.clientOrg.create.useMutation({
    onSuccess: () => {
      utils.clientOrg.list.invalidate();
      resetAndClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const resetAndClose = () => {
    setName("");
    setContactName("");
    setContactEmail("");
    setPhone("");
    setAddress("");
    setError("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate({
      name,
      contactName,
      contactEmail,
      phone: phone || undefined,
      address: address || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={resetAndClose} />
      <div className="relative w-full max-w-md rounded-xl border border-surface-border bg-surface-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Add Client</h2>
          <button
            onClick={resetAndClose}
            className="rounded-md p-1 text-foreground-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Primary Contact Name *
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Contact Email *
            </label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. jane@acme.com"
              className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (512) 555-0100"
              className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Austin, TX 78701"
              className="w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

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
              disabled={createMutation.isPending}
              className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
