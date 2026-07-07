// ─── Design Tokens ─────────────────────────────────────────────────

export const COLORS = {
  bg: "#0D0D0F",
  surface: "#1A1A1E",
  card: "#22222A",
  cardBorder: "#333338",
  cardBorderHover: "#444450",
  coral: "#da5245",
  coralDim: "rgba(218,82,69,0.12)",
  coralBorder: "rgba(218,82,69,0.25)",
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

// ─── Project Status Colors ────────────────────────────────────────

export type ProjectStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
];

export const PROJECT_STATUS_COLORS: Record<
  ProjectStatus,
  { color: string; bg: string; label: string }
> = {
  PLANNING: { color: "#5B8DEF", bg: "rgba(91,141,239,0.12)", label: "Planning" },
  ACTIVE: { color: "#da5245", bg: "rgba(218,82,69,0.12)", label: "Active" },
  COMPLETED: { color: "#34C759", bg: "rgba(52,199,89,0.12)", label: "Completed" },
  ARCHIVED: { color: "#666666", bg: "rgba(102,102,102,0.12)", label: "Archived" },
};

export type UserRole = "CLIENT_ADMIN" | "CLIENT_USER" | "CCC_STAFF";
