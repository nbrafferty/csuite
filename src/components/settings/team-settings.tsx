"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  UserPlus,
  Loader2,
  Shield,
  ShieldOff,
  Mail,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const ROLE_LABEL: Record<string, string> = {
  CLIENT_ADMIN: "Admin",
  CLIENT_USER: "Member",
  CCC_STAFF: "Staff",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "text-emerald-400",
  INVITED: "text-amber-400",
  DISABLED: "text-ink-faint",
};

/**
 * Team management for client admins (and CCC staff acting on a company).
 * When companyId is omitted, the viewer's own company is used.
 */
export function TeamSettings({ companyId }: { companyId?: string }) {
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"CLIENT_ADMIN" | "CLIENT_USER">(
    "CLIENT_USER"
  );
  const [error, setError] = useState<string | null>(null);

  const codeQuery = trpc.user.inviteCode.useQuery({ companyId });
  const { data: users, isLoading } = trpc.user.list.useQuery({ companyId });

  const invalidate = () => {
    utils.user.list.invalidate({ companyId });
  };

  const invite = trpc.user.invite.useMutation({
    onSuccess: () => {
      invalidate();
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("CLIENT_USER");
      setError(null);
    },
    onError: (e) => setError(e.message),
  });

  const updateRole = trpc.user.updateRole.useMutation({ onSuccess: invalidate });
  const updateStatus = trpc.user.updateStatus.useMutation({
    onSuccess: invalidate,
  });

  const copyCode = () => {
    if (!codeQuery.data?.inviteCode) return;
    navigator.clipboard.writeText(codeQuery.data.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Invite code */}
      <div className="rounded-lg border border-surface-border bg-surface-card p-5">
        <h3 className="font-label text-[11px] uppercase tracking-label text-ink-muted">
          Company Invite Code
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Share this code so teammates can self-register and join your company.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-surface-border bg-surface-bg px-3 py-2 font-mono text-sm text-white">
            {codeQuery.data?.inviteCode ?? "…"}
          </code>
          <button
            onClick={copyCode}
            disabled={!codeQuery.data}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:text-white disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-lg border border-surface-border bg-surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-label text-[11px] uppercase tracking-label text-ink-muted">
            Team Members ({users?.length ?? 0})
          </h3>
          <button
            onClick={() => setShowInvite((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-coral-dark"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="mb-4 rounded-lg border border-surface-border bg-surface-bg p-4">
            {error && (
              <p className="mb-3 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral-light">
                {error}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
                className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white placeholder-ink-faint focus:border-coral focus:outline-none"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
                className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white placeholder-ink-faint focus:border-coral focus:outline-none"
              />
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "CLIENT_ADMIN" | "CLIENT_USER")
                }
                className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
              >
                <option value="CLIENT_USER">Member</option>
                <option value="CLIENT_ADMIN">Admin</option>
              </select>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowInvite(false);
                  setError(null);
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  invite.mutate({
                    companyId,
                    name: inviteName.trim(),
                    email: inviteEmail.trim(),
                    role: inviteRole,
                  })
                }
                disabled={
                  invite.isPending ||
                  !inviteName.trim() ||
                  !inviteEmail.trim()
                }
                className="flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white hover:bg-coral-dark disabled:opacity-50"
              >
                {invite.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                Send Invite
              </button>
            </div>
          </div>
        )}

        {/* Member list */}
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-surface-bg"
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {users?.map((u) => {
              const isStaff = u.role === "CCC_STAFF";
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {u.name}
                      </p>
                      <span className={`text-[10px] ${STATUS_STYLE[u.status]}`}>
                        {u.status === "INVITED" && (
                          <Mail className="mr-0.5 inline h-3 w-3" />
                        )}
                        {u.status}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isStaff ? (
                      <span className="text-xs text-gray-500">
                        {ROLE_LABEL[u.role]}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateRole.mutate({
                            userId: u.id,
                            role: e.target.value as
                              | "CLIENT_ADMIN"
                              | "CLIENT_USER",
                          })
                        }
                        className="rounded-lg border border-surface-border bg-surface-bg px-2 py-1 text-xs text-gray-300 focus:border-coral focus:outline-none"
                      >
                        <option value="CLIENT_USER">Member</option>
                        <option value="CLIENT_ADMIN">Admin</option>
                      </select>
                    )}

                    {!isStaff &&
                      (u.status === "DISABLED" ? (
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              userId: u.id,
                              status: "ACTIVE",
                            })
                          }
                          title="Reactivate"
                          className="rounded-lg p-1.5 text-gray-500 hover:text-emerald-400"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            updateStatus.mutate({
                              userId: u.id,
                              status: "DISABLED",
                            })
                          }
                          title="Deactivate"
                          className="rounded-lg p-1.5 text-gray-500 hover:text-coral"
                        >
                          <ShieldOff className="h-4 w-4" />
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
