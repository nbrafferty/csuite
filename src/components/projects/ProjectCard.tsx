"use client";

import Link from "next/link";
import { COLORS } from "@/lib/tokens";
import { ProjectStatusBadge } from "./project-status-badge";
import type { ProjectSummary } from "@/lib/types";
import { Folder } from "lucide-react";

interface ProjectCardProps {
  project: ProjectSummary;
  variant: "grid" | "kanban" | "list";
  isAdminView?: boolean;
}

export function ProjectCard({ project, variant, isAdminView }: ProjectCardProps) {
  if (variant === "list") {
    return (
      <Link
        href={`/projects/${project.id}`}
        className="flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors hover:border-opacity-60"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.cardBorder,
        }}
      >
        {/* Logo */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden"
          style={{ backgroundColor: COLORS.cardBorder }}>
          {project.logoUrl ? (
            <img src={project.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Folder className="h-4 w-4" style={{ color: COLORS.textMuted }} />
          )}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <span className="truncate text-sm font-medium" style={{ color: COLORS.textPrimary }}>
            {project.name}
          </span>
        </div>

        {/* Client (admin only) */}
        {isAdminView && project.companyName && (
          <div className="w-28 shrink-0 truncate text-xs" style={{ color: COLORS.textSecondary }}>
            {project.companyName}
          </div>
        )}

        {/* Status */}
        <div className="w-28 shrink-0">
          <ProjectStatusBadge status={project.status} size="sm" />
        </div>

        {/* Orders / Quotes */}
        <div className="w-28 shrink-0 text-xs" style={{ color: COLORS.textSecondary }}>
          {project.orderCount} orders &middot; {project.quoteCount} quotes
        </div>

        {/* Total */}
        <div className="w-24 shrink-0 text-right text-xs" style={{ color: COLORS.textSecondary }}>
          ${project.totalAmount.toLocaleString()}
        </div>

        {/* Event date */}
        <div className="w-20 shrink-0 text-right text-xs" style={{ color: COLORS.textSecondary }}>
          {project.eventDate
            ? new Date(project.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "\u2014"}
        </div>

        {/* Contact */}
        <div className="w-20 shrink-0 text-right text-xs" style={{ color: COLORS.textMuted }}>
          {project.clientContact ?? "\u2014"}
        </div>
      </Link>
    );
  }

  if (variant === "kanban") {
    return (
      <Link
        href={`/projects/${project.id}`}
        className="block rounded-lg border p-3 transition-all"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorder; }}
      >
        <div className="mb-2 flex items-center gap-2">
          {project.logoUrl ? (
            <img src={project.logoUrl} alt="" className="h-6 w-6 rounded object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded"
              style={{ backgroundColor: COLORS.cardBorder }}>
              <Folder className="h-3 w-3" style={{ color: COLORS.textMuted }} />
            </div>
          )}
          <span className="truncate text-sm font-medium" style={{ color: COLORS.textPrimary }}>
            {project.name}
          </span>
        </div>

        <div className="text-xs" style={{ color: COLORS.textSecondary }}>
          {project.orderCount} orders &middot; {project.quoteCount} quotes
        </div>

        <div className="mt-1 text-xs font-medium" style={{ color: COLORS.textPrimary }}>
          ${project.totalAmount.toLocaleString()}
        </div>

        {isAdminView && project.companyName && (
          <div className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>
            {project.companyName}
          </div>
        )}
      </Link>
    );
  }

  // Grid variant
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border p-4 transition-all hover:shadow-lg"
      style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorderHover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.cardBorder; }}
    >
      {/* Logo + Status */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden"
          style={{ backgroundColor: COLORS.cardBorder }}>
          {project.logoUrl ? (
            <img src={project.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Folder className="h-6 w-6" style={{ color: COLORS.textMuted }} />
          )}
        </div>
        <ProjectStatusBadge status={project.status} size="sm" />
      </div>

      {/* Name */}
      <h3 className="mb-1 text-base font-medium text-white">
        {project.name}
      </h3>

      {/* Description */}
      {project.description && (
        <p className="mb-3 line-clamp-1 text-xs" style={{ color: COLORS.textMuted }}>
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="mb-2 flex items-center gap-3 text-xs" style={{ color: COLORS.textSecondary }}>
        <span>{project.orderCount} orders</span>
        <span>{project.quoteCount} quotes</span>
        <span className="font-medium">${project.totalAmount.toLocaleString()}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs" style={{ color: COLORS.textMuted }}>
        <span>
          {project.eventDate
            ? new Date(project.eventDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No date"}
        </span>
        {project.clientContact && <span>{project.clientContact}</span>}
      </div>
    </Link>
  );
}
