"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  FolderKanban,
  Image,
  BookOpen,
  MessageSquare,
  CreditCard,
  Package,
  Settings,
  Building2,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  staffOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Catalog", href: "/catalog", icon: BookOpen },
  { label: "Artwork", href: "/artwork", icon: Image },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Clients", href: "/clients", icon: Building2, staffOnly: true },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const { data: unreadCount } = trpc.thread.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-surface-border bg-sidebar-bg transition-[width] duration-200 ease-in-out",
        expanded ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center justify-center border-b border-surface-border px-4">
        <img
          src="/ccc-logo.svg"
          alt="C-Suite"
          width={34}
          height={34}
          className={cn(
            "shrink-0 transition-opacity duration-200",
            expanded ? "absolute opacity-0" : "opacity-100"
          )}
        />
        <img
          src="/ccc-wordmark.svg"
          alt="C-Suite"
          width={150}
          height={34}
          className={cn(
            "shrink-0 transition-opacity duration-200",
            expanded ? "opacity-100" : "absolute opacity-0"
          )}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        {navItems.filter((item) => !item.staffOnly || isStaff).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const showBadge =
            item.href === "/messages" && !!unreadCount && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setExpanded(false)}
              title={expanded ? undefined : item.label}
              className={cn(
                "relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-sidebar-text-active"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-coral")} />

              {/* Collapsed badge — small dot */}
              {!expanded && showBadge && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral" />
              )}

              <span
                className={cn(
                  "ml-3 whitespace-nowrap transition-opacity duration-200",
                  expanded ? "opacity-100" : "opacity-0"
                )}
              >
                {item.label}
              </span>

              {/* Expanded badge — count */}
              {expanded && showBadge && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-xs font-medium text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-surface-border p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={expanded ? undefined : "Sign Out"}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              "ml-3 whitespace-nowrap transition-opacity duration-200",
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
