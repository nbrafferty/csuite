"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  ClipboardList,
  Image,
  BookOpen,
  MessageSquare,
  CreditCard,
  Package,
  Settings,
  Building2,
  LogOut,
  CheckSquare,
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
  { label: "Quotes", href: "/quotes", icon: ClipboardList },
  { label: "Catalog", href: "/catalog", icon: BookOpen },
  { label: "Artwork", href: "/artwork", icon: Image },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Clients", href: "/clients", icon: Building2, staffOnly: true },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const { data: unreadCount } = trpc.thread.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex shrink-0 items-center justify-center border-b border-surface-border px-6 py-5">
        <img
          src="/central-creative-logo.svg"
          alt="Central Creative Co."
          className="h-auto max-h-[67px] w-auto object-contain"
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
              className={cn(
                "relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-sidebar-text-active"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-coral")} />

              <span className="ml-3 whitespace-nowrap">{item.label}</span>

              {/* Unread count badge */}
              {showBadge && (
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
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="ml-3 whitespace-nowrap">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
