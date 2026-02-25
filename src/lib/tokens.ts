import type { ProjectStatus } from "@prisma/client";

// ─── Design Tokens ─────────────────────────────────────────────────

export const COLORS = {
  bg: "#0D0D0F",
  surface: "#1A1A1E",
  card: "#22222A",
  cardBorder: "#333338",
  cardBorderHover: "#444450",
  coral: "#E85D5D",
  coralDim: "rgba(232,93,93,0.12)",
  coralBorder: "rgba(232,93,93,0.25)",
  green: "#34C759",
  greenDim: "rgba(52,199,89,0.12)",
  yellow: "#FFD60A",
  yellowDim: "rgba(255,214,10,0.12)",
  blue: "#5B8DEF",
  blueDim: "rgba(91,141,239,0.12)",
  purple: "#A78BFA",
  purpleDim: "rgba(167,139,250,0.12)",
  teal: "#5BDBEF",
  tealDim: "rgba(91,219,239,0.12)",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
} as const;

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ─── Status Colors ─────────────────────────────────────────────────

export const STATUS_COLORS: Record<
  ProjectStatus,
  { color: string; bg: string; label: string }
> = {
  EMPTY: { color: "#666666", bg: "rgba(102,102,102,0.12)", label: "Empty" },
  IN_REVIEW: {
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    label: "In Review",
  },
  ACTIVE: { color: "#5B8DEF", bg: "rgba(91,141,239,0.12)", label: "Active" },
  IN_PRODUCTION: {
    color: "#E85D5D",
    bg: "rgba(232,93,93,0.12)",
    label: "In Production",
  },
  NEEDS_ATTENTION: {
    color: "#FFD60A",
    bg: "rgba(255,214,10,0.12)",
    label: "Needs Attention",
  },
  COMPLETED: {
    color: "#34C759",
    bg: "rgba(52,199,89,0.12)",
    label: "Completed",
  },
};

// ─── Column Order ──────────────────────────────────────────────────

export const COLUMN_ORDER: ProjectStatus[] = [
  "EMPTY",
  "IN_REVIEW",
  "ACTIVE",
  "IN_PRODUCTION",
  "NEEDS_ATTENTION",
  "COMPLETED",
];

export const ALWAYS_VISIBLE_COLUMNS: ProjectStatus[] = [
  "IN_REVIEW",
  "ACTIVE",
  "IN_PRODUCTION",
  "COMPLETED",
];

// ─── Category Labels ───────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> =
  {
    APPAREL: { label: "Apparel", icon: "👕" },
    SIGNAGE: { label: "Signage", icon: "🪧" },
    PACKAGING: { label: "Packaging", icon: "📦" },
    HEADWEAR: { label: "Headwear", icon: "🧢" },
    DRINKWARE: { label: "Drinkware", icon: "🥤" },
    OTHER: { label: "Other", icon: "📋" },
  };

// ─── Role-aware transitions ────────────────────────────────────────

export type UserRole = "CLIENT_ADMIN" | "CLIENT_USER" | "CCC_STAFF";

export const CLIENT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  EMPTY: ["IN_REVIEW"],
  IN_REVIEW: ["ACTIVE"],
  ACTIVE: [],
  IN_PRODUCTION: [],
  NEEDS_ATTENTION: [],
  COMPLETED: [],
};

export const STAFF_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  EMPTY: ["IN_REVIEW", "ACTIVE", "IN_PRODUCTION"],
  IN_REVIEW: ["ACTIVE", "IN_PRODUCTION", "EMPTY"],
  ACTIVE: ["IN_PRODUCTION", "IN_REVIEW", "COMPLETED"],
  IN_PRODUCTION: ["ACTIVE", "COMPLETED"],
  NEEDS_ATTENTION: ["IN_PRODUCTION", "ACTIVE", "COMPLETED"],
  COMPLETED: ["ACTIVE"],
};

export function canTransition(
  from: ProjectStatus,
  to: ProjectStatus,
  role: UserRole
): boolean {
  if (from === to) return false;
  const map = role === "CCC_STAFF" ? STAFF_TRANSITIONS : CLIENT_TRANSITIONS;
  return map[from]?.includes(to) ?? false;
}

export function getValidTargets(
  from: ProjectStatus,
  role: UserRole
): ProjectStatus[] {
  const map = role === "CCC_STAFF" ? STAFF_TRANSITIONS : CLIENT_TRANSITIONS;
  return map[from] ?? [];
}
