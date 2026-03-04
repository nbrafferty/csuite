"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Bell, Search, Sun, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const DEV_USERS = [
  {
    email: "admin@centralcreative.co",
    name: "CCC Admin",
    role: "CCC_STAFF",
    company: "Central Creative Co",
  },
  {
    email: "admin@acme.com",
    name: "Jane Smith",
    role: "CLIENT_ADMIN",
    company: "Acme Corp",
  },
  {
    email: "user@acme.com",
    name: "John Doe",
    role: "CLIENT_USER",
    company: "Acme Corp",
  },
  {
    email: "hank@globex.com",
    name: "Hank Scorpio",
    role: "CLIENT_ADMIN",
    company: "Globex",
  },
  {
    email: "lily@bloomstudio.com",
    name: "Lily Chen",
    role: "CLIENT_ADMIN",
    company: "Bloom Studio",
  },
];

const ROLE_BADGE_CLASSES: Record<string, string> = {
  CCC_STAFF: "bg-coral/20 text-coral",
  CLIENT_ADMIN: "bg-blue-500/20 text-blue-400",
  CLIENT_USER: "bg-gray-500/20 text-gray-400",
};

const ROLE_LABELS: Record<string, string> = {
  CCC_STAFF: "Staff",
  CLIENT_ADMIN: "Admin",
  CLIENT_USER: "User",
};

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const currentEmail = session?.user?.email;

  async function handleSwitchUser(email: string) {
    if (email === currentEmail || switching) return;
    setSwitching(true);
    try {
      await signIn("credentials", {
        email,
        password: "password123",
        redirect: false,
      });
      window.location.reload();
    } catch {
      setSwitching(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-surface-border bg-surface-bg/80 px-6 backdrop-blur-sm">
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          placeholder="Search orders, products, invoices..."
          className="h-10 w-full rounded-lg border border-surface-border bg-surface-card pl-10 pr-4 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-coral focus:ring-1 focus:ring-coral"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="relative rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-surface-card hover:text-foreground"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button className="relative rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-surface-card hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral" />
        </button>

        {/* User avatar area with dev switcher */}
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-surface-card"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {session.user.name}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {(session.user as any).companyName}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-medium text-white">
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <ChevronDown className="h-4 w-4 text-foreground-secondary" />
            </button>

            {/* Dev user switcher dropdown */}
            {switcherOpen && (
              <>
                {/* Overlay to close dropdown on outside click */}
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setSwitcherOpen(false)}
                />

                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-surface-border bg-surface-card shadow-lg">
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
                    <span className="rounded bg-coral px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      DEV
                    </span>
                    <span className="text-xs font-medium text-foreground-secondary">
                      Switch User
                    </span>
                  </div>

                  {/* User list */}
                  <div className="py-1">
                    {DEV_USERS.map((user) => {
                      const isActive = user.email === currentEmail;
                      return (
                        <button
                          key={user.email}
                          onClick={() => handleSwitchUser(user.email)}
                          disabled={isActive || switching}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive
                              ? "bg-coral/10"
                              : "hover:bg-surface-border/50"
                          } ${switching && !isActive ? "opacity-50" : ""}`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${
                              isActive ? "bg-coral" : "bg-foreground-muted"
                            }`}
                          >
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={`truncate text-sm font-medium ${
                                  isActive
                                    ? "text-coral"
                                    : "text-foreground"
                                }`}
                              >
                                {user.name}
                              </p>
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  ROLE_BADGE_CLASSES[user.role] ?? ""
                                }`}
                              >
                                {ROLE_LABELS[user.role] ?? user.role}
                              </span>
                            </div>
                            <p className="truncate text-xs text-foreground-secondary">
                              {user.company} &middot; {user.email}
                            </p>
                          </div>

                          {/* Active indicator */}
                          {isActive && (
                            <div className="h-2 w-2 shrink-0 rounded-full bg-coral" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
