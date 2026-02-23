"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Palette,
  FileText,
  MessageCircle,
  Settings,
  Package,
  Bookmark,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/saved-products", label: "Saved Products", icon: Bookmark },
  { href: "/dashboard/artwork", label: "Artwork", icon: Palette },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/billing", label: "Billing", icon: FileText },
  { href: "/dashboard/support", label: "Support", icon: MessageCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    companyName: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">C-Suite</span>
        </Link>
      </div>

      {/* Company badge */}
      <div className="border-b border-[var(--border)] px-4 py-3">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          Organization
        </p>
        <p className="truncate text-sm font-semibold">{user.companyName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {user.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 rounded-md p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
