"use client";

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

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-surface-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral font-bold text-white text-sm">
          CS
        </div>
        <span className="text-lg font-semibold text-white">C-Suite</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-sidebar-text-active"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-coral")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-surface-border p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
