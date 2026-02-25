"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { COLORS, STATUS_COLORS, COLUMN_ORDER } from "@/lib/tokens";
import type { UserRole } from "@/lib/tokens";
import type { ProjectStatus } from "@prisma/client";
import { ProjectKanban } from "@/components/projects/ProjectKanban";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { ProjectCardSkeleton } from "@/components/projects/ProjectCardSkeleton";
import { ProjectListSkeleton } from "@/components/projects/ProjectCardSkeleton";
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  FolderKanban,
} from "lucide-react";

type ViewMode = "kanban" | "list";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role ?? "CLIENT_USER") as UserRole;
  const isStaff = role === "CCC_STAFF";
  const isAdmin = role === "CLIENT_ADMIN" || isStaff;

  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: projects, isLoading } = trpc.projects.list.useQuery(
    {
      search: search || undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined,
    },
    { refetchInterval: 30_000 }
  );

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects;
  }, [projects]);

  const lastUpdated = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    const sorted = [...projects].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    return new Date(sorted[0].updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [projects]);

  const statusFilterOptions: { status: ProjectStatus | "ALL"; label: string }[] =
    [
      { status: "ALL", label: "All" },
      ...COLUMN_ORDER.map((s) => ({
        status: s as ProjectStatus,
        label: STATUS_COLORS[s].label,
      })),
    ];

  const toggleStatusFilter = (status: ProjectStatus | "ALL") => {
    if (status === "ALL") {
      setStatusFilter([]);
    } else {
      setStatusFilter((prev) =>
        prev.includes(status)
          ? prev.filter((s) => s !== status)
          : [...prev, status]
      );
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: COLORS.textPrimary }}
          >
            Projects
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
            {filteredProjects.length} project
            {filteredProjects.length !== 1 ? "s" : ""}
            {lastUpdated && ` · last updated ${lastUpdated}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div
            className="flex rounded-lg border"
            style={{ borderColor: COLORS.cardBorder }}
          >
            <button
              onClick={() => setView("kanban")}
              className="rounded-l-lg p-2 transition-colors"
              style={{
                backgroundColor:
                  view === "kanban" ? COLORS.card : "transparent",
                color:
                  view === "kanban"
                    ? COLORS.textPrimary
                    : COLORS.textMuted,
              }}
              title="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className="rounded-r-lg p-2 transition-colors"
              style={{
                backgroundColor:
                  view === "list" ? COLORS.card : "transparent",
                color:
                  view === "list"
                    ? COLORS.textPrimary
                    : COLORS.textMuted,
              }}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* New Project button */}
          {isAdmin && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.coral }}
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex items-center gap-4">
        {/* Search */}
        <div
          className="flex items-center rounded-lg border px-3"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.cardBorder,
          }}
        >
          <Search
            className="h-4 w-4 shrink-0"
            style={{ color: COLORS.textMuted }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-56 bg-transparent px-2 py-2 text-sm outline-none"
            style={{ color: COLORS.textPrimary }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs"
              style={{ color: COLORS.textMuted }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilterOptions.map(({ status, label }) => {
            const isActive =
              status === "ALL"
                ? statusFilter.length === 0
                : statusFilter.includes(status as ProjectStatus);
            const statusConfig =
              status !== "ALL"
                ? STATUS_COLORS[status as ProjectStatus]
                : null;

            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isActive
                    ? statusConfig?.bg ?? COLORS.coralDim
                    : "transparent",
                  color: isActive
                    ? statusConfig?.color ?? COLORS.coral
                    : COLORS.textMuted,
                  border: `1px solid ${
                    isActive
                      ? statusConfig?.color
                        ? `${statusConfig.color}40`
                        : COLORS.coralBorder
                      : COLORS.cardBorder
                  }`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        view === "kanban" ? (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {["IN_REVIEW", "ACTIVE", "IN_PRODUCTION", "COMPLETED"].map(
              (status) => (
                <div
                  key={status}
                  className="w-72 shrink-0 rounded-lg border p-2"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.cardBorder,
                  }}
                >
                  <div
                    className="mb-2 h-8 rounded px-3 py-2"
                    style={{ backgroundColor: COLORS.cardBorder }}
                  />
                  <div className="space-y-2">
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <ProjectListSkeleton />
        )
      ) : filteredProjects.length === 0 ? (
        search ? (
          // No search results
          <div className="flex flex-col items-center justify-center py-20">
            <p
              className="text-sm"
              style={{ color: COLORS.textSecondary }}
            >
              No projects match &ldquo;{search}&rdquo;
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs font-medium underline"
              style={{ color: COLORS.coral }}
            >
              Clear search
            </button>
          </div>
        ) : (
          // Empty board
          <div className="flex flex-col items-center justify-center py-20">
            <FolderKanban
              className="mb-4 h-12 w-12"
              style={{ color: COLORS.textMuted }}
            />
            <h3
              className="mb-2 text-lg font-semibold"
              style={{ color: COLORS.textPrimary }}
            >
              No projects yet
            </h3>
            <p
              className="mb-4 text-sm"
              style={{ color: COLORS.textSecondary }}
            >
              Create a project to start organizing your orders and quotes.
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: COLORS.coral }}
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            )}
          </div>
        )
      ) : view === "kanban" ? (
        <ProjectKanban
          projects={filteredProjects}
          isLoading={isLoading}
          userRole={role}
          isAdminView={isStaff}
        />
      ) : (
        <ProjectListView
          projects={filteredProjects}
          isLoading={isLoading}
          isAdminView={isStaff}
        />
      )}

      {/* New Project Modal */}
      <NewProjectModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  );
}
