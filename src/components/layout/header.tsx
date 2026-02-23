"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-surface-border bg-surface-bg/80 px-6 backdrop-blur-sm">
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search orders, products, invoices..."
          className="h-10 w-full rounded-lg border border-surface-border bg-surface-card pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-coral focus:ring-1 focus:ring-coral"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-surface-card hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral" />
        </button>

        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400">
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
          </div>
        )}
      </div>
    </header>
  );
}
