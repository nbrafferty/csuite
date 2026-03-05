"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { COLORS, PROJECT_STATUS_COLORS, PROJECT_STATUSES, type ProjectStatus } from "@/lib/tokens";
import { ProjectStatusBadge } from "./project-status-badge";
import { OrderPicker } from "./order-picker";
import { QuotePicker } from "./quote-picker";
import {
  ArrowLeft,
  Plus,
  ExternalLink,
  Trash2,
  Archive,
  Folder,
  X,
} from "lucide-react";

export function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isStaff = role === "CCC_STAFF";
  const isAdmin = role === "CLIENT_ADMIN" || isStaff;
  const canChangeStatus = role !== "CLIENT_USER";

  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: projectId });
  const utils = trpc.useUtils();

  const updateStatus = trpc.projects.updateStatus.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.list.invalidate();
      setShowStatusDropdown(false);
    },
  });

  const removeOrder = trpc.projects.removeOrder.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.list.invalidate();
    },
  });

  const removeQuote = trpc.projects.removeQuote.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      utils.projects.list.invalidate();
    },
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      router.push("/projects");
    },
  });

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="skeleton-pulse h-8 w-48 rounded" style={{ backgroundColor: COLORS.cardBorder }} />
        <div className="mt-4 skeleton-pulse h-6 w-96 rounded" style={{ backgroundColor: COLORS.cardBorder }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p style={{ color: COLORS.textSecondary }}>Project not found</p>
        <Link href="/projects" className="mt-2 text-sm underline" style={{ color: COLORS.coral }}>
          Back to Projects
        </Link>
      </div>
    );
  }

  const budgetPercent = project.budget && project.budget > 0
    ? Math.min(Math.round((project.totalAmount / project.budget) * 100), 150)
    : null;

  const budgetColor = budgetPercent !== null
    ? budgetPercent > 100 ? COLORS.coral : budgetPercent >= 80 ? COLORS.yellow : COLORS.green
    : null;

  // Status options for dropdown
  const statusOptions: ProjectStatus[] = isStaff
    ? PROJECT_STATUSES
    : (["PLANNING", "ACTIVE", "COMPLETED"] as ProjectStatus[]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1 text-sm transition-colors hover:opacity-80"
        style={{ color: COLORS.textSecondary }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left column */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: COLORS.cardBorder }}>
                  <Folder className="h-5 w-5" style={{ color: COLORS.textMuted }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                  {project.name}
                </h1>
                {project.description && (
                  <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
                    {project.description}
                  </p>
                )}
              </div>
              <ProjectStatusBadge status={project.status} />
            </div>
          </div>

          {/* Orders section */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                Orders ({project.orders.length})
              </h2>
              {isAdmin && !showAddOrder && (
                <button
                  onClick={() => setShowAddOrder(true)}
                  className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: COLORS.cardBorder, color: COLORS.textSecondary }}
                >
                  <Plus className="h-3 w-3" />
                  Add Order
                </button>
              )}
            </div>

            {showAddOrder && (
              <div className="mb-3">
                <OrderPicker projectId={projectId} onDone={() => setShowAddOrder(false)} />
              </div>
            )}

            {project.orders.length === 0 && !showAddOrder ? (
              <div
                className="flex flex-col items-center rounded-lg border py-8"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
              >
                <p className="text-sm" style={{ color: COLORS.textMuted }}>No orders linked</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddOrder(true)}
                    className="mt-3 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ borderColor: COLORS.cardBorder, color: COLORS.textSecondary }}
                  >
                    <Plus className="h-3 w-3" />
                    Link existing order
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {project.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                    style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: COLORS.textMuted }}>
                          {order.number}
                        </span>
                        <span className="truncate text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                          {order.title}
                        </span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: COLORS.coralDim, color: COLORS.coral }}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                        <span>${Number(order.totalAmount).toLocaleString()}</span>
                        {order.inHandsDate && (
                          <span>&middot; Due {new Date(order.inHandsDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        )}
                        {order.poNumber && <span>&middot; PO: {order.poNumber}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm("Remove this order from the project?")) {
                              removeOrder.mutate({ orderId: order.id });
                            }
                          }}
                          className="text-xs transition-colors hover:underline"
                          style={{ color: COLORS.textMuted }}
                        >
                          Remove
                        </button>
                      )}
                      <Link href={`/orders/${order.id}`} style={{ color: COLORS.textMuted }}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quotes section */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                Quotes ({project.quotes.length})
              </h2>
              {isAdmin && !showAddQuote && (
                <button
                  onClick={() => setShowAddQuote(true)}
                  className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: COLORS.cardBorder, color: COLORS.textSecondary }}
                >
                  <Plus className="h-3 w-3" />
                  Add Quote
                </button>
              )}
            </div>

            {showAddQuote && (
              <div className="mb-3">
                <QuotePicker projectId={projectId} onDone={() => setShowAddQuote(false)} />
              </div>
            )}

            {project.quotes.length === 0 && !showAddQuote ? (
              <div
                className="flex flex-col items-center rounded-lg border py-8"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
              >
                <p className="text-sm" style={{ color: COLORS.textMuted }}>No quotes linked</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddQuote(true)}
                    className="mt-3 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ borderColor: COLORS.cardBorder, color: COLORS.textSecondary }}
                  >
                    <Plus className="h-3 w-3" />
                    Link existing quote
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {project.quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                    style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: COLORS.textMuted }}>
                          {quote.number}
                        </span>
                        <span className="truncate text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                          {quote.title}
                        </span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: COLORS.purpleDim, color: COLORS.purple }}>
                          {quote.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                        <span>${Number(quote.totalAmount).toLocaleString()}</span>
                        {quote.expiresAt && (
                          <span>&middot; Expires {new Date(quote.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm("Remove this quote from the project?")) {
                              removeQuote.mutate({ quoteId: quote.id });
                            }
                          }}
                          className="text-xs transition-colors hover:underline"
                          style={{ color: COLORS.textMuted }}
                        >
                          Remove
                        </button>
                      )}
                      <Link href={`/quotes/${quote.id}`} style={{ color: COLORS.textMuted }}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}>
              <div className="text-xs" style={{ color: COLORS.textMuted }}>Total Order Value</div>
              <div className="mt-1 text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
                ${project.totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}>
              <div className="text-xs" style={{ color: COLORS.textMuted }}>Total Quoted</div>
              <div className="mt-1 text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
                ${project.quotes.reduce((sum, q) => sum + q.totalAmount, 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}>
              <div className="text-xs" style={{ color: COLORS.textMuted }}>Items</div>
              <div className="mt-1 text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
                {project.orderCount + project.quoteCount}
              </div>
              <div className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>
                {project.orderCount} orders, {project.quoteCount} quotes
              </div>
            </div>
          </div>
        </div>

        {/* Right column — sticky sidebar */}
        <div className="w-72 shrink-0">
          <div className="sticky top-6 space-y-4">
            {/* Status control */}
            <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}>
              <div className="mb-2 text-xs font-medium" style={{ color: COLORS.textMuted }}>Status</div>
              <div className="relative">
                <button
                  onClick={() => canChangeStatus && setShowStatusDropdown(!showStatusDropdown)}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={{ borderColor: COLORS.cardBorder, cursor: canChangeStatus ? "pointer" : "default" }}
                  disabled={!canChangeStatus}
                >
                  <ProjectStatusBadge status={project.status} size="sm" />
                </button>
                {showStatusDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border py-1 shadow-xl"
                      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.cardBorder }}>
                      {statusOptions
                        .filter((s) => s !== project.status)
                        .map((s) => {
                          const cfg = PROJECT_STATUS_COLORS[s];
                          return (
                            <button
                              key={s}
                              onClick={() => updateStatus.mutate({ id: projectId, status: s })}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                              style={{ color: cfg.color }}
                            >
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                              {cfg.label}
                            </button>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Project details */}
            <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}>
              <div className="space-y-3">
                <div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Event Date</div>
                  <div className="mt-0.5 text-sm" style={{ color: COLORS.textPrimary }}>
                    {project.eventDate
                      ? new Date(project.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                      : "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>Client Contact</div>
                  <div className="mt-0.5 text-sm" style={{ color: COLORS.textPrimary }}>
                    {project.clientContact || "Not set"}
                  </div>
                </div>
                {project.budget != null && (
                  <div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>Budget</div>
                    <div className="mt-0.5 text-sm" style={{ color: COLORS.textPrimary }}>
                      ${project.budget.toLocaleString()}
                    </div>
                    {budgetPercent !== null && (
                      <div className="mt-1">
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: COLORS.cardBorder }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(budgetPercent, 100)}%`,
                              backgroundColor: budgetColor!,
                            }}
                          />
                        </div>
                        <div className="mt-0.5 text-[10px]" style={{ color: budgetColor! }}>
                          {budgetPercent}% used (${project.totalAmount.toLocaleString()} / ${project.budget!.toLocaleString()})
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isStaff && project.companyName && (
                  <div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>Client</div>
                    <div className="mt-0.5 text-sm" style={{ color: COLORS.textPrimary }}>
                      {project.companyName}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isAdmin && (
              <div className="rounded-lg border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}>
                <div className="space-y-2">
                  {isStaff && project.status !== "ARCHIVED" && (
                    <button
                      onClick={() => updateStatus.mutate({ id: projectId, status: "ARCHIVED" })}
                      className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-white/5"
                      style={{ borderColor: COLORS.cardBorder, color: COLORS.textSecondary }}
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this project? Orders and quotes will be unlinked but not deleted.")) {
                        deleteProject.mutate({ id: projectId });
                      }
                    }}
                    disabled={deleteProject.isPending}
                    className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-white/5"
                    style={{ borderColor: COLORS.cardBorder, color: COLORS.coral }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteProject.isPending ? "Deleting..." : "Delete Project"}
                  </button>
                </div>
              </div>
            )}

            {/* Created by */}
            <div className="text-xs" style={{ color: COLORS.textMuted }}>
              Created by {project.createdByName} &middot;{" "}
              {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
