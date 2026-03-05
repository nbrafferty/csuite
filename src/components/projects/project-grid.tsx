"use client";

import { ProjectCard } from "./ProjectCard";
import type { ProjectSummary } from "@/lib/types";

interface ProjectGridProps {
  projects: ProjectSummary[];
  isAdminView?: boolean;
}

export function ProjectGrid({ projects, isAdminView }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          variant="grid"
          isAdminView={isAdminView}
        />
      ))}
    </div>
  );
}
