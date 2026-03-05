"use client";

import { useParams } from "next/navigation";
import { ProjectDetail } from "@/components/projects/project-detail";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <ProjectDetail projectId={id} />;
}
