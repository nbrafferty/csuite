"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Image,
  BookOpen,
  MessageSquare,
  CreditCard,
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Catalog", href: "/catalog", icon: BookOpen },
  { label: "Artwork", href: "/artwork", icon: Image },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { data: unreadCount } = trpc.thread.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-surface-border bg-sidebar-bg transition-[width] duration-250 ease-in-out overflow-hidden",
        expanded ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-surface-border px-3 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-coral font-bold text-white text-sm ml-1">
          CS
        </div>
        <span
          className={cn(
            "text-lg font-semibold text-white whitespace-nowrap transition-opacity duration-250 ease-in-out",
            expanded ? "opacity-100" : "opacity-0"
          )}
        >
          C-Suite
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-sidebar-active text-sidebar-text-active"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-coral")} />
              <span
                className={cn(
                  "transition-opacity duration-250 ease-in-out",
                  expanded ? "opacity-100" : "opacity-0"
                )}
              >
                {item.label}
              </span>
              {item.href === "/messages" && !!unreadCount && unreadCount > 0 && (
                <span
                  className={cn(
                    "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-xs font-medium text-white transition-opacity duration-250 ease-in-out",
                    expanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-surface-border p-2 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white whitespace-nowrap"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              "transition-opacity duration-250 ease-in-out",
              expanded ? "opacity-100" : "opacity-0"
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
