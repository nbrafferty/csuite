import type { ProjectStatus, ProjectCategory } from "@prisma/client";

export type { ProjectStatus, ProjectCategory };

export type UserRole = "CLIENT_ADMIN" | "CLIENT_USER" | "CCC_STAFF";

export interface TeamMember {
  id: string;
  initials: string;
  color: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  hasStatusOverride: boolean;
  orderCount: number;
  quoteCount: number;
  progressPercent: number;
  totalInvoiced: number;
  totalQuoted: number;
  eventDate: string | null;
  estimatedDelivery: string | null;
  team: TeamMember[];
  companyName: string | null;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  description: string | null;
  orders: LinkedOrder[];
  quotes: LinkedQuote[];
  createdAt: string;
}

export interface LinkedOrder {
  id: string;
  title: string;
  status: string;
  amount: number;
  updatedAt: string;
}

export interface LinkedQuote {
  id: string;
  title: string;
  status: string;
  amount: number;
  updatedAt: string;
}

export interface ActionQueueItem {
  id: string;
  client: string;
  title: string;
  type: "order" | "proof" | "invoice" | "message" | "shipment";
  urgency: "high" | "medium" | "low";
  time: string;
  assignee?: string;
}
