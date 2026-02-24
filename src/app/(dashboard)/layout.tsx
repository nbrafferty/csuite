"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icons";

const COLORS = {
  surface: "#1A1A1E",
  cardBorder: "#333338",
  coral: "#E85D5D",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
};

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/" },
  { label: "Clients", icon: "clients", href: "/clients" },
  { label: "Order Queue", icon: "orders", href: "/orders" },
  { label: "Production", icon: "production", href: "/production" },
  { label: "Quotes", icon: "quotes", href: "/quotes" },
  { label: "Proofs", icon: "proofs", href: "/proofs" },
  { label: "Messages", icon: "messages", href: "/messages" },
  { label: "Invoices", icon: "invoices", href: "/invoices" },
  { label: "Expenses", icon: "expenses", href: "/expenses" },
  { label: "Inventory", icon: "inventory", href: "/inventory" },
  { label: "Vendors", icon: "vendors", href: "/vendors" },
  { label: "Shipments", icon: "shipments", href: "/shipments" },
  { label: "Analytics", icon: "analytics", href: "/analytics" },
  { label: "Recent Activity", icon: "activity", href: "/activity" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0D0D0F",
        color: COLORS.textPrimary,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 260,
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.cardBorder}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 14px",
            borderBottom: `1px solid ${COLORS.cardBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 72,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: COLORS.coral,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              flexShrink: 0,
              color: "#fff",
            }}
          >
            CC
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Central Creative
              </div>
              <div
                style={{ fontSize: 11, color: COLORS.coral, fontWeight: 600 }}
              >
                STAFF PORTAL
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "10px 16px" : "10px 14px",
                  marginBottom: 2,
                  borderRadius: 8,
                  textDecoration: "none",
                  background: active
                    ? "rgba(232,93,93,0.1)"
                    : "transparent",
                  color: active ? COLORS.coral : COLORS.textSecondary,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  transition: "background 0.15s",
                }}
              >
                <Icon
                  name={item.icon}
                  color={active ? COLORS.coral : COLORS.textSecondary}
                />
                {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${COLORS.cardBorder}`,
            cursor: "pointer",
            textAlign: "center",
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <Icon
            name={collapsed ? "chevronRight" : "chevronLeft"}
            color={COLORS.textMuted}
            size={16}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
