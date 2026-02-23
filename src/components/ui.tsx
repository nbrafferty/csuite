"use client";

const COLORS = {
  coral: "#E85D5D",
  green: "#34C759",
  yellow: "#FFD60A",
  blue: "#5B8DEF",
};

export const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  open: { label: "Open", color: COLORS.coral, bg: "rgba(232,93,93,0.12)" },
  waiting_client: {
    label: "Waiting on Client",
    color: COLORS.yellow,
    bg: "rgba(255,214,10,0.1)",
  },
  waiting_staff: {
    label: "Waiting on CCC",
    color: COLORS.blue,
    bg: "rgba(91,141,239,0.12)",
  },
  resolved: {
    label: "Resolved",
    color: COLORS.green,
    bg: "rgba(52,199,89,0.12)",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const c = statusConfig[status];
  if (!c) return null;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 4,
        background: c.bg,
        color: c.color,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

export function Avatar({
  initials,
  size = 32,
  bg = "linear-gradient(135deg, #E85D5D, #A78BFA)",
}: {
  initials: string;
  size?: number;
  bg?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.375,
        fontWeight: 700,
        flexShrink: 0,
        color: "#fff",
      }}
    >
      {initials}
    </div>
  );
}
