"use client";

import { useSession } from "next-auth/react";
import { TeamSettings } from "@/components/settings/team-settings";
import { AutomationSettings } from "@/components/settings/automation-settings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role;
  const canManageTeam = role === "CLIENT_ADMIN" || role === "CCC_STAFF";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl uppercase tracking-display text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Manage your account and team.
        </p>
      </div>

      {/* Account */}
      <div className="mb-6 rounded-lg border border-surface-border bg-surface-card p-5">
        <h3 className="font-label text-[11px] uppercase tracking-label text-ink-muted">
          Account
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-white">{user?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-white">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Company</p>
            <p className="text-white">{user?.companyName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="text-white">
              {role === "CCC_STAFF"
                ? "Staff"
                : role === "CLIENT_ADMIN"
                  ? "Admin"
                  : "Member"}
            </p>
          </div>
        </div>
      </div>

      {/* Automations (staff) */}
      {role === "CCC_STAFF" && <AutomationSettings />}

      {/* Team management */}
      {canManageTeam && <TeamSettings />}
    </div>
  );
}
