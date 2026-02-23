"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

const COLORS = {
  surface: "#1A1A1E",
  cardBorder: "#333338",
  coral: "#E85D5D",
  textSecondary: "#999999",
  textMuted: "#666666",
};

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
  { label: "Clients", icon: "clients", href: "/admin/clients" },
  { label: "Order Queue", icon: "orders", href: "/admin/orders" },
  { label: "Production", icon: "production", href: "/admin/production" },
  { label: "Quotes", icon: "quotes", href: "/admin/quotes" },
  { label: "Proofs", icon: "proofs", href: "/admin/proofs" },
  { label: "Messages", icon: "messages", href: "/admin/messages", active: true },
  { label: "Invoices", icon: "invoices", href: "/admin/invoices" },
  { label: "Expenses", icon: "expenses", href: "/admin/expenses" },
  { label: "Inventory", icon: "inventory", href: "/admin/inventory" },
  { label: "Vendors", icon: "vendors", href: "/admin/vendors" },
  { label: "Shipments", icon: "shipments", href: "/admin/shipments" },
  { label: "Analytics", icon: "analytics", href: "/admin/analytics" },
  { label: "Recent Activity", icon: "activity", href: "/admin/activity" },
];

export function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
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
            <div style={{ fontSize: 14, fontWeight: 700 }}>Central Creative</div>
            <div style={{ fontSize: 11, color: COLORS.coral, fontWeight: 600 }}>
              STAFF PORTAL
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {navItems.map((item) => {
          const badge = item.icon === "messages" ? unreadCount : 0;
          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 16px" : "10px 14px",
                marginBottom: 2,
                borderRadius: 8,
                cursor: "pointer",
                background: item.active ? "rgba(232,93,93,0.1)" : "transparent",
                color: item.active ? COLORS.coral : COLORS.textSecondary,
                fontSize: 13,
                fontWeight: item.active ? 600 : 400,
                transition: "background 0.15s",
                position: "relative",
              }}
            >
              <Icon
                name={item.icon}
                color={item.active ? COLORS.coral : COLORS.textSecondary}
              />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: COLORS.coral,
                    color: "#fff",
                    borderRadius: 10,
                    padding: "2px 7px",
                  }}
                >
                  {badge}
                </span>
              )}
              {collapsed && badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 10,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: COLORS.coral,
                  }}
                />
              )}
            </div>
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
  );
}
