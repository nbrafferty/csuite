"use client";

import { useState } from "react";
import { COLORS } from "@/lib/tokens";
import { ProjectCard } from "./ProjectCard";
import { ProjectListSkeleton } from "./ProjectCardSkeleton";
import type { ProjectSummary } from "@/lib/types";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortKey =
  | "name"
  | "status"
  | "progressPercent"
  | "totalInvoiced"
  | "eventDate"
  | "updatedAt"
  | "companyName";

interface ProjectListViewProps {
  projects: ProjectSummary[];
  isLoading?: boolean;
  isAdminView?: boolean;
}

export function ProjectListView({
  projects,
  isLoading,
  isAdminView,
}: ProjectListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...projects].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "progressPercent":
        cmp = a.progressPercent - b.progressPercent;
        break;
      case "totalInvoiced":
        cmp = a.totalInvoiced - b.totalInvoiced;
        break;
      case "eventDate":
        cmp =
          (a.eventDate ?? "").localeCompare(b.eventDate ?? "");
        break;
      case "updatedAt":
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        break;
      case "companyName":
        cmp = (a.companyName ?? "").localeCompare(b.companyName ?? "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (isLoading) {
    return <ProjectListSkeleton />;
  }

  const SortHeader = ({
    label,
    field,
    className,
  }: {
    label: string;
    field: SortKey;
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs font-medium ${className ?? ""}`}
      style={{ color: sortKey === field ? COLORS.textPrimary : COLORS.textMuted }}
    >
      {label}
      {sortKey === field &&
        (sortDir === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        ))}
    </button>
  );

  return (
    <div>
      {/* Table header */}
      <div
        className="mb-1 flex items-center gap-4 px-4 py-2"
        style={{ color: COLORS.textMuted }}
      >
        <div className="min-w-0 flex-1">
          <SortHeader label="Project" field="name" />
        </div>
        {isAdminView && (
          <div className="w-28 shrink-0">
            <SortHeader label="Client" field="companyName" />
          </div>
        )}
        <div className="w-32 shrink-0">
          <SortHeader label="Status" field="status" />
        </div>
        <div
          className="w-28 shrink-0 text-xs"
          style={{ color: COLORS.textMuted }}
        >
          Items
        </div>
        <div className="w-24 shrink-0">
          <SortHeader label="Progress" field="progressPercent" />
        </div>
        <div className="w-24 shrink-0 text-right">
          <SortHeader label="Budget" field="totalInvoiced" className="justify-end" />
        </div>
        <div className="w-20 shrink-0 text-right">
          <SortHeader label="Event" field="eventDate" className="justify-end" />
        </div>
        <div className="w-20 shrink-0 text-right">
          <SortHeader label="Updated" field="updatedAt" className="justify-end" />
        </div>
        <div
          className="w-16 shrink-0 text-right text-xs"
          style={{ color: COLORS.textMuted }}
        >
          Team
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {sorted.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            variant="list"
            isAdminView={isAdminView}
          />
        ))}
      </div>
    </div>
  );
}
