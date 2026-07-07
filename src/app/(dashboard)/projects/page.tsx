"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import {
  COLORS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUSES,
  type ProjectStatus,
  type UserRole,
} from "@/lib/tokens";
import { ProjectKanban } from "@/components/projects/ProjectKanban";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import { ProjectListSkeleton } from "@/components/projects/ProjectCardSkeleton";
import {
  Plus,
  List,
  Search,
  FolderKanban,
  Columns3,
} from "lucide-react";

type ViewMode = "list" | "kanban";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role ?? "CLIENT_USER") as UserRole;
  const isStaff = role === "CCC_STAFF";
  const isAdmin = role === "CLIENT_ADMIN" || isStaff;

  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>("");

  const { data: clients } = trpc.clientOrg.list.useQuery(undefined, {
    enabled: isStaff,
  });

  const { data: projects, isLoading } = trpc.projects.list.useQuery(
    {
      search: search || undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      includeArchived: showArchived,
      companyId: clientFilter || undefined,
    },
    { refetchInterval: 30_000 }
  );

  const filteredProjects = useMemo(() => projects ?? [], [projects]);

  const statusFilterOptions = [
    { status: "ALL" as const, label: "All" },
    ...PROJECT_STATUSES.filter((s) => showArchived || s !== "ARCHIVED").map((s) => ({
      status: s,
      label: PROJECT_STATUS_COLORS[s].label,
    })),
  ];

  const toggleStatusFilter = (status: ProjectStatus | "ALL") => {
    if (status === "ALL") {
      setStatusFilter([]);
    } else {
      setStatusFilter((prev) =>
        prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
      );
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-display text-white">
            Projects
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
            {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border" style={{ borderColor: COLORS.cardBorder }}>
            {([
              { mode: "list" as const, icon: List, title: "List view" },
              { mode: "kanban" as const, icon: Columns3, title: "Kanban view" },
            ] as const).map(({ mode, icon: Icon, title }, i) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`p-2 transition-colors ${
                  i === 0 ? "rounded-l-lg" : "rounded-r-lg"
                }`}
                style={{
                  backgroundColor: view === mode ? COLORS.card : "transparent",
                  color: view === mode ? COLORS.textPrimary : COLORS.textMuted,
                }}
                title={title}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

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
        <div
          className="flex items-center rounded-lg border px-3"
          style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: COLORS.textMuted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-56 bg-transparent px-2 py-2 text-sm outline-none"
            style={{ color: COLORS.textPrimary }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs" style={{ color: COLORS.textMuted }}>
              &#10005;
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {statusFilterOptions.map(({ status, label }) => {
            const isActive =
              status === "ALL" ? statusFilter.length === 0 : statusFilter.includes(status as ProjectStatus);
            const statusConfig = status !== "ALL" ? PROJECT_STATUS_COLORS[status as ProjectStatus] : null;

            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? statusConfig?.bg ?? COLORS.coralDim : "transparent",
                  color: isActive ? statusConfig?.color ?? COLORS.coral : COLORS.textMuted,
                  border: `1px solid ${
                    isActive
                      ? statusConfig?.color ? `${statusConfig.color}40` : COLORS.coralBorder
                      : COLORS.cardBorder
                  }`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {isStaff && clients && clients.length > 0 && (
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs font-medium outline-none"
            style={{
              backgroundColor: COLORS.card,
              borderColor: clientFilter ? COLORS.coral : COLORS.cardBorder,
              color: clientFilter ? COLORS.textPrimary : COLORS.textMuted,
            }}
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.textMuted }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded"
          />
          Show Archived
        </label>
      </div>

      {/* Content */}
      {isLoading ? (
        view === "kanban" ? (
          <ProjectKanban projects={[]} isLoading userRole={role} isAdminView={isStaff} showArchived={showArchived} />
        ) : (
          <ProjectListSkeleton />
        )
      ) : filteredProjects.length === 0 ? (
        search || clientFilter ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              No projects match your filters.
            </p>
            <button onClick={() => { setSearch(""); setClientFilter(""); }} className="mt-2 text-xs font-medium underline" style={{ color: COLORS.coral }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderKanban className="mb-4 h-12 w-12" style={{ color: COLORS.textMuted }} />
            <h3 className="mb-2 text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
              No projects yet
            </h3>
            <p className="mb-4 text-sm" style={{ color: COLORS.textSecondary }}>
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
          showArchived={showArchived}
        />
      ) : (
        <ProjectListView projects={filteredProjects} isLoading={isLoading} isAdminView={isStaff} />
      )}

      <ProjectCreateDialog open={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}
