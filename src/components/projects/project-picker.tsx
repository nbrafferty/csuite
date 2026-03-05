"use client";

import { useState } from "react";
import { COLORS, PROJECT_STATUS_COLORS, type ProjectStatus } from "@/lib/tokens";
import { trpc } from "@/lib/trpc";
import { Search, X, Plus, Folder, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ProjectCreateDialog } from "./project-create-dialog";

interface ProjectPickerProps {
  currentProjectId: string | null;
  currentProjectName?: string | null;
  currentProjectStatus?: string | null;
  currentProjectLogoUrl?: string | null;
  onLink: (projectId: string) => void;
  onUnlink: () => void;
  itemType: "order" | "quote";
  itemId: string;
}

export function ProjectPicker({
  currentProjectId,
  currentProjectName,
  currentProjectStatus,
  currentProjectLogoUrl,
  onLink,
  onUnlink,
  itemType,
  itemId,
}: ProjectPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const projectsQuery = trpc.projects.searchProjects.useQuery(
    { search: search || undefined },
    { enabled: isOpen }
  );

  if (currentProjectId) {
    const statusCfg = currentProjectStatus
      ? PROJECT_STATUS_COLORS[currentProjectStatus as ProjectStatus]
      : null;

    return (
      <div
        className="rounded-lg border p-3"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
            Project
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs transition-colors hover:underline"
              style={{ color: COLORS.textSecondary }}
            >
              Change
            </button>
            <button
              onClick={onUnlink}
              className="text-xs transition-colors hover:underline"
              style={{ color: COLORS.coral }}
            >
              Remove
            </button>
          </div>
        </div>

        <Link
          href={`/projects/${currentProjectId}`}
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/5"
        >
          {currentProjectLogoUrl ? (
            <img src={currentProjectLogoUrl} alt="" className="h-6 w-6 rounded object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded" style={{ backgroundColor: COLORS.cardBorder }}>
              <Folder className="h-3 w-3" style={{ color: COLORS.textMuted }} />
            </div>
          )}
          <span className="flex-1 truncate text-sm font-medium" style={{ color: COLORS.textPrimary }}>
            {currentProjectName}
          </span>
          {statusCfg && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          )}
          <ExternalLink className="h-3 w-3 shrink-0" style={{ color: COLORS.textMuted }} />
        </Link>

        {isOpen && (
          <ProjectDropdown
            search={search}
            setSearch={setSearch}
            projects={projectsQuery.data ?? []}
            onSelect={(projectId) => {
              onLink(projectId);
              setIsOpen(false);
              setSearch("");
            }}
            onCreateNew={() => {
              setIsOpen(false);
              setShowCreateDialog(true);
            }}
          />
        )}

        <ProjectCreateDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          preLinkedOrderId={itemType === "order" ? itemId : undefined}
          preLinkedQuoteId={itemType === "quote" ? itemId : undefined}
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-3"
      style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
          Project
        </span>
      </div>

      {isOpen ? (
        <ProjectDropdown
          search={search}
          setSearch={setSearch}
          projects={projectsQuery.data ?? []}
          onSelect={(projectId) => {
            onLink(projectId);
            setIsOpen(false);
            setSearch("");
          }}
          onCreateNew={() => {
            setIsOpen(false);
            setShowCreateDialog(true);
          }}
          onClose={() => {
            setIsOpen(false);
            setSearch("");
          }}
        />
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs" style={{ color: COLORS.textMuted }}>
            Not in a project
          </span>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: COLORS.cardBorder, color: COLORS.textSecondary }}
          >
            <Plus className="h-3 w-3" />
            Add to Project
          </button>
        </div>
      )}

      <ProjectCreateDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        preLinkedOrderId={itemType === "order" ? itemId : undefined}
        preLinkedQuoteId={itemType === "quote" ? itemId : undefined}
      />
    </div>
  );
}

function ProjectDropdown({
  search,
  setSearch,
  projects,
  onSelect,
  onCreateNew,
  onClose,
}: {
  search: string;
  setSearch: (s: string) => void;
  projects: { id: string; name: string; status: string; logoUrl: string | null; _count: { orders: number; quotes: number } }[];
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="mt-2 rounded-lg border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.cardBorder }}>
      <div className="flex items-center gap-2 px-3">
        <Search className="h-3 w-3 shrink-0" style={{ color: COLORS.textMuted }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full bg-transparent py-2 text-xs outline-none"
          style={{ color: COLORS.textPrimary }}
          autoFocus
        />
        {onClose && (
          <button onClick={onClose}><X className="h-3 w-3" style={{ color: COLORS.textMuted }} /></button>
        )}
      </div>

      <div className="max-h-40 overflow-y-auto border-t" style={{ borderColor: COLORS.cardBorder }}>
        {projects.map((p) => {
          const cfg = PROJECT_STATUS_COLORS[p.status as ProjectStatus];
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
              style={{ color: COLORS.textSecondary }}
            >
              {p.logoUrl ? (
                <img src={p.logoUrl} alt="" className="h-4 w-4 rounded object-cover" />
              ) : (
                <Folder className="h-4 w-4 shrink-0" style={{ color: COLORS.textMuted }} />
              )}
              <span className="flex-1 truncate">{p.name}</span>
              {cfg && (
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              )}
            </button>
          );
        })}
        {projects.length === 0 && (
          <div className="px-3 py-3 text-center text-xs" style={{ color: COLORS.textMuted }}>
            No projects found
          </div>
        )}
      </div>

      <div className="border-t" style={{ borderColor: COLORS.cardBorder }}>
        <button
          onClick={onCreateNew}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: COLORS.coral }}
        >
          <Plus className="h-3 w-3" />
          Create New Project
        </button>
      </div>
    </div>
  );
}
