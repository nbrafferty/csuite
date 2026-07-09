"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ContactRow {
  name: string;
  email: string;
  role: "CLIENT_ADMIN" | "CLIENT_USER";
}

const emptyContact = (role: ContactRow["role"] = "CLIENT_USER"): ContactRow => ({
  name: "",
  email: "",
  role,
});

export function AddClientDialog({ open, onClose }: AddClientDialogProps) {
  const [name, setName] = useState("");
  const [contacts, setContacts] = useState<ContactRow[]>([emptyContact("CLIENT_ADMIN")]);
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
    setContacts([emptyContact("CLIENT_ADMIN")]);
    setPhone("");
    setAddress("");
    setError("");
    onClose();
  };

  const updateContact = (index: number, patch: Partial<ContactRow>) => {
    setContacts((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emails = contacts.map((c) => c.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      setError("Each user needs a unique email address");
      return;
    }

    createMutation.mutate({
      name,
      contacts: contacts.map((c) => ({
        name: c.name.trim(),
        email: c.email.trim(),
        role: c.role,
      })),
      phone: phone || undefined,
      address: address || undefined,
    });
  };

  if (!open) return null;

  const inputClass =
    "w-full rounded-lg border border-surface-border bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={resetAndClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-surface-border bg-surface-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-display text-foreground">Add Client</h2>
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
              className={inputClass}
            />
          </div>

          {/* Users */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground-secondary">
              Users * <span className="font-normal text-foreground-muted">— each receives an invite to the portal</span>
            </label>
            <div className="space-y-2">
              {contacts.map((contact, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-surface-border bg-surface-secondary p-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={contact.name}
                      onChange={(e) => updateContact(i, { name: e.target.value })}
                      placeholder="Name"
                      className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
                    />
                    <input
                      type="email"
                      required
                      value={contact.email}
                      onChange={(e) => updateContact(i, { email: e.target.value })}
                      placeholder="email@company.com"
                      className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <select
                      value={contact.role}
                      onChange={(e) =>
                        updateContact(i, { role: e.target.value as ContactRow["role"] })
                      }
                      className="rounded-lg border border-surface-border bg-surface-card px-2 py-1.5 text-xs text-foreground focus:border-coral focus:outline-none"
                    >
                      <option value="CLIENT_ADMIN">Admin — can approve quotes & manage team</option>
                      <option value="CLIENT_USER">Member — can view & collaborate</option>
                    </select>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setContacts((rows) => rows.filter((_, x) => x !== i))}
                        className="rounded-md p-1.5 text-foreground-muted transition-colors hover:text-red-400"
                        aria-label="Remove user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setContacts((rows) => [...rows, emptyContact()])}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-coral hover:text-coral-light"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another user
            </button>
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
              className={inputClass}
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
              className={inputClass}
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
