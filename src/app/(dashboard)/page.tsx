"use client";

import { Icon } from "@/components/icons";

/* ── Placeholder data ── */

const stats = [
  {
    label: "Active Projects",
    value: "12",
    change: "+2 this week",
    icon: "production",
    iconColor: "#60A5FA",
    iconBg: "rgba(96,165,250,0.1)",
  },
  {
    label: "Open Quotes",
    value: "8",
    change: "3 awaiting approval",
    icon: "quotes",
    iconColor: "#E85D5D",
    iconBg: "rgba(232,93,93,0.1)",
  },
  {
    label: "Active Orders",
    value: "24",
    change: "+5 this month",
    icon: "orders",
    iconColor: "#FBBF24",
    iconBg: "rgba(251,191,36,0.1)",
  },
  {
    label: "Completed Projects",
    value: "156",
    change: "+18 this quarter",
    icon: "check",
    iconColor: "#34D399",
    iconBg: "rgba(52,211,153,0.1)",
  },
];

const activeProjects = [
  {
    id: "PRJ-1041",
    name: "Spring Gala Uniforms",
    client: "Riverside Events Co.",
    deadline: "Mar 15, 2026",
    progress: 72,
  },
  {
    id: "PRJ-1039",
    name: "Corporate Rebrand Polos",
    client: "TechNova Inc.",
    deadline: "Mar 8, 2026",
    progress: 45,
  },
  {
    id: "PRJ-1037",
    name: "Trade Show Merchandise",
    client: "Summit Partners",
    deadline: "Apr 2, 2026",
    progress: 28,
  },
  {
    id: "PRJ-1035",
    name: "Team Hoodies 2026",
    client: "Greenfield Academy",
    deadline: "Mar 22, 2026",
    progress: 90,
  },
];

const recentQuotes = [
  {
    id: "QT-2240",
    title: "Embroidered Caps (x200)",
    amount: "$4,800",
    status: "Pending",
    date: "Feb 22, 2026",
  },
  {
    id: "QT-2238",
    title: "Custom Tees - Summer Run",
    amount: "$6,200",
    status: "Approved",
    date: "Feb 20, 2026",
  },
  {
    id: "QT-2236",
    title: "Safety Vests - Bulk",
    amount: "$3,150",
    status: "Pending",
    date: "Feb 19, 2026",
  },
  {
    id: "QT-2234",
    title: "Executive Gift Set",
    amount: "$1,900",
    status: "Declined",
    date: "Feb 17, 2026",
  },
  {
    id: "QT-2232",
    title: "Marathon Runner Kits",
    amount: "$8,400",
    status: "Approved",
    date: "Feb 15, 2026",
  },
];

const quoteStatusColor: Record<string, string> = {
  Pending: "#FBBF24",
  Approved: "#34D399",
  Declined: "#EF4444",
};

const COLORS = {
  surface: "#1A1A1E",
  cardBorder: "#333338",
  coral: "#E85D5D",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
};

/* ── Component ── */

export default function DashboardPage() {
  return (
    <div style={{ padding: 32, overflowY: "auto", flex: 1 }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
          Welcome back
        </h1>
        <p style={{ marginTop: 4, fontSize: 14, color: COLORS.textSecondary }}>
          Here&apos;s an overview of your projects and activity.
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: stat.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={stat.icon} color={stat.iconColor} size={20} />
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: 0 }}>
                {stat.label}
              </p>
            </div>
            <p style={{ marginTop: 4, fontSize: 12, color: COLORS.textMuted }}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main content: Projects + Quotes sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Active Projects */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>
              Active Projects
            </h2>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.coral,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              View all
              <Icon name="chevronRight" color={COLORS.coral} size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.textMuted }}>
                        {project.id}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
                        {project.name}
                      </span>
                    </div>
                    <p style={{ marginTop: 4, fontSize: 12, color: COLORS.textSecondary }}>
                      {project.client}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSecondary }}>
                    <Icon name="activity" color={COLORS.textSecondary} size={14} />
                    {project.deadline}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: COLORS.textSecondary }}>Progress</span>
                    <span style={{ fontWeight: 500, color: COLORS.textPrimary }}>{project.progress}%</span>
                  </div>
                  <div style={{ height: 8, width: "100%", borderRadius: 9999, background: COLORS.cardBorder, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 9999,
                        background: COLORS.coral,
                        width: `${project.progress}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotes sidebar */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>
              Recent Quotes
            </h2>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.coral,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              View all
              <Icon name="chevronRight" color={COLORS.coral} size={14} />
            </button>
          </div>

          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {recentQuotes.map((quote, i) => (
              <div
                key={quote.id}
                style={{
                  padding: "14px 16px",
                  borderTop: i > 0 ? `1px solid ${COLORS.cardBorder}` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary }}>
                    {quote.title}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, whiteSpace: "nowrap" }}>
                    {quote.amount}
                  </span>
                </div>
                <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: COLORS.textMuted }}>
                    {quote.id} · {quote.date}
                  </span>
                  <span style={{ fontWeight: 500, color: quoteStatusColor[quote.status] ?? COLORS.textSecondary }}>
                    {quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
