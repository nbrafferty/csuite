"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { COLORS, STATUS_COLORS, CATEGORY_LABELS } from "@/lib/tokens";
import { DerivedStatusBadge } from "@/components/projects/DerivedStatusBadge";
import { ArrowLeft, Plus, ExternalLink } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isStaff = role === "CCC_STAFF";

  const { data: project, isLoading } = trpc.projects.detail.useQuery({ id });
  const utils = trpc.useUtils();

  const clearOverride = trpc.projects.clearStatusOverride.useMutation({
    onSuccess: () => {
      utils.projects.detail.invalidate({ id });
      utils.projects.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div
          className="skeleton-pulse h-8 w-48 rounded"
          style={{ backgroundColor: COLORS.cardBorder }}
        />
        <div
          className="mt-4 skeleton-pulse h-6 w-96 rounded"
          style={{ backgroundColor: COLORS.cardBorder }}
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p style={{ color: COLORS.textSecondary }}>Project not found</p>
        <Link
          href="/projects"
          className="mt-2 text-sm underline"
          style={{ color: COLORS.coral }}
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const category = CATEGORY_LABELS[project.category];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1 text-sm transition-colors hover:opacity-80"
        style={{ color: COLORS.textSecondary }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: COLORS.textPrimary }}
            >
              {project.name}
            </h1>
            <div
              className="mt-2 flex items-center gap-3 text-sm"
              style={{ color: COLORS.textSecondary }}
            >
              <span>
                {category?.icon} {category?.label}
              </span>
              {project.eventDate && (
                <>
                  <span>·</span>
                  <span>
                    Event:{" "}
                    {new Date(project.eventDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DerivedStatusBadge
              status={project.status}
              hasStatusOverride={project.hasStatusOverride}
            />
            {isStaff && project.hasStatusOverride && (
              <button
                onClick={() => clearOverride.mutate({ id })}
                disabled={clearOverride.isPending}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                style={{
                  borderColor: COLORS.cardBorder,
                  color: COLORS.textSecondary,
                }}
              >
                Clear override
              </button>
            )}
          </div>
        </div>

        {project.description && (
          <p
            className="mt-3 text-sm"
            style={{ color: COLORS.textSecondary }}
          >
            {project.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.cardBorder,
          }}
        >
          <div className="text-xs" style={{ color: COLORS.textMuted }}>
            Progress
          </div>
          <div
            className="mt-1 text-xl font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            {project.progressPercent}%
          </div>
          <div
            className="mt-2 h-1.5 rounded-full"
            style={{ backgroundColor: COLORS.cardBorder }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${project.progressPercent}%`,
                backgroundColor: STATUS_COLORS[project.status].color,
              }}
            />
          </div>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.cardBorder,
          }}
        >
          <div className="text-xs" style={{ color: COLORS.textMuted }}>
            Orders
          </div>
          <div
            className="mt-1 text-xl font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            {project.orderCount}
          </div>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.cardBorder,
          }}
        >
          <div className="text-xs" style={{ color: COLORS.textMuted }}>
            Quotes
          </div>
          <div
            className="mt-1 text-xl font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            {project.quoteCount}
          </div>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.cardBorder,
          }}
        >
          <div className="text-xs" style={{ color: COLORS.textMuted }}>
            Budget
          </div>
          <div
            className="mt-1 text-xl font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            ${project.totalInvoiced.toLocaleString()}
          </div>
          {project.totalQuoted > 0 && (
            <div className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>
              ${project.totalQuoted.toLocaleString()} quoted
            </div>
          )}
        </div>
      </div>

      {/* Orders section */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-sm font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            Orders ({project.orders.length})
          </h2>
        </div>
        {project.orders.length === 0 ? (
          <div
            className="flex flex-col items-center rounded-lg border py-8"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.cardBorder,
            }}
          >
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              No orders linked to this project
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                style={{
                  borderColor: COLORS.cardBorder,
                  color: COLORS.textSecondary,
                }}
              >
                <Plus className="h-3 w-3" /> Link existing order
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {project.orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.cardBorder,
                }}
              >
                <div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {order.title}
                  </span>
                  <span
                    className="ml-2 text-xs"
                    style={{ color: COLORS.textMuted }}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                    ${order.amount.toLocaleString()}
                  </span>
                  <Link
                    href={`/orders`}
                    style={{ color: COLORS.textMuted }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quotes section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-sm font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            Quotes ({project.quotes.length})
          </h2>
        </div>
        {project.quotes.length === 0 ? (
          <div
            className="flex flex-col items-center rounded-lg border py-8"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.cardBorder,
            }}
          >
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              No quotes linked to this project
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                style={{
                  borderColor: COLORS.cardBorder,
                  color: COLORS.textSecondary,
                }}
              >
                <Plus className="h-3 w-3" /> Link existing quote
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {project.quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.cardBorder,
                }}
              >
                <div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {quote.title}
                  </span>
                  <span
                    className="ml-2 text-xs"
                    style={{ color: COLORS.textMuted }}
                  >
                    {quote.status}
                  </span>
                </div>
                <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                  ${quote.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
