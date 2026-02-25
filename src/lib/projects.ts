import type { PrismaClient } from "@prisma/client";
import type {
  ProjectStatus,
  OrderStatus,
  ProofStatus,
  InvoiceStatus,
  QuoteStatus,
} from "@prisma/client";

// ─── Order status weights for progress calculation ─────────────────

const ORDER_STATUS_WEIGHTS: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 0,
  IN_REVIEW: 10,
  AWAITING_PROOF: 20,
  APPROVED: 40,
  IN_PRODUCTION: 60,
  READY: 80,
  SHIPPED: 90,
  COMPLETED: 100,
  CANCELLED: 0,
};

export function computeProjectProgress(
  orders: { status: string }[]
): number {
  const active = orders.filter((o) => o.status !== "CANCELLED");
  if (active.length === 0) return 0;
  const total = active.reduce(
    (sum, o) => sum + (ORDER_STATUS_WEIGHTS[o.status] ?? 0),
    0
  );
  return Math.round(total / active.length);
}

// ─── Types for derivation ──────────────────────────────────────────

interface OrderForDerivation {
  status: OrderStatus;
  proofs?: { status: ProofStatus }[];
  invoices?: { status: InvoiceStatus; dueDate?: Date | null }[];
}

interface QuoteForDerivation {
  status: QuoteStatus;
}

export interface ProjectWithRelations {
  orders: OrderForDerivation[];
  quotes: QuoteForDerivation[];
}

// ─── Pure derivation (no DB calls) ─────────────────────────────────

export function deriveProjectStatus(
  project: ProjectWithRelations
): ProjectStatus {
  const { orders, quotes } = project;
  const hasOrders = orders.length > 0;
  const hasQuotes = quotes.length > 0;

  if (!hasOrders && !hasQuotes) return "EMPTY";

  // NEEDS_ATTENTION: any linked order/quote requires client action
  const needsAttention = orders.some((order) => {
    // Proof pending approval
    const hasPendingProof = order.proofs?.some(
      (p) => p.status === "SENT" || p.status === "REVISION_REQUESTED"
    );
    if (hasPendingProof) return true;

    // Invoice overdue
    const hasOverdueInvoice = order.invoices?.some(
      (inv) =>
        inv.status === "UNPAID" &&
        inv.dueDate &&
        new Date(inv.dueDate) < new Date()
    );
    if (hasOverdueInvoice) return true;

    return false;
  });
  if (needsAttention) return "NEEDS_ATTENTION";

  // IN_PRODUCTION: at least one order is in PRODUCTION status
  const hasInProduction = orders.some(
    (o) => o.status === "IN_PRODUCTION"
  );
  if (hasInProduction) return "IN_PRODUCTION";

  // ACTIVE: at least one order exists and is not COMPLETE or SHIPPED
  const hasActiveOrder = orders.some(
    (o) =>
      o.status !== "COMPLETED" &&
      o.status !== "SHIPPED" &&
      o.status !== "CANCELLED"
  );
  if (hasActiveOrder) return "ACTIVE";

  // COMPLETED: all orders are COMPLETE or SHIPPED, no open quotes
  const allOrdersDone =
    hasOrders &&
    orders.every(
      (o) =>
        o.status === "COMPLETED" ||
        o.status === "SHIPPED" ||
        o.status === "CANCELLED"
    );
  const hasOpenQuotes = quotes.some(
    (q) => q.status === "SENT" || q.status === "REVIEWING" || q.status === "DRAFT"
  );
  if (allOrdersDone && !hasOpenQuotes) return "COMPLETED";

  // IN_REVIEW: has quotes in SENT/REVIEWING state, no confirmed orders
  const hasReviewingQuotes = quotes.some(
    (q) => q.status === "SENT" || q.status === "REVIEWING"
  );
  const hasConfirmedOrders = orders.some(
    (o) => o.status !== "DRAFT" && o.status !== "CANCELLED"
  );
  if (hasReviewingQuotes && !hasConfirmedOrders) return "IN_REVIEW";

  // Fallback
  if (hasQuotes && !hasOrders) return "IN_REVIEW";

  return "EMPTY";
}

// ─── Recompute and persist ─────────────────────────────────────────

export async function recomputeProjectStatus(
  prisma: PrismaClient,
  projectId: string
): Promise<ProjectStatus> {
  const project = await (prisma as any).project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      orders: {
        select: {
          status: true,
          proofs: { select: { status: true } },
          invoices: { select: { status: true, dueDate: true } },
        },
      },
      quotes: { select: { status: true } },
    },
  });

  const derived = deriveProjectStatus(project);

  await (prisma as any).project.update({
    where: { id: projectId },
    data: { derivedStatus: derived },
  });

  return derived;
}

// ─── Effective status helper ───────────────────────────────────────

export function getEffectiveStatus(project: {
  statusOverride: ProjectStatus | null;
  derivedStatus: ProjectStatus;
}): ProjectStatus {
  return project.statusOverride ?? project.derivedStatus;
}

// ─── Team member color from user ID ────────────────────────────────

const TEAM_COLORS = [
  "#E85D5D",
  "#5B8DEF",
  "#34C759",
  "#A78BFA",
  "#FFD60A",
  "#5BDBEF",
  "#F28B8B",
  "#FF9F43",
];

export function getTeamColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}
