import type { ProjectStatus } from "./tokens";

export type { ProjectStatus };

export type UserRole = "CLIENT_ADMIN" | "CLIENT_USER" | "CCC_STAFF";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  orderCount: number;
  quoteCount: number;
  totalAmount: number;
  eventDate: string | null;
  clientContact: string | null;
  budget: number | null;
  logoUrl: string | null;
  companyName: string | null;
  createdByName: string;
  updatedAt: string;
}

export interface LinkedOrder {
  id: string;
  number: string;
  title: string;
  status: string;
  totalAmount: number;
  inHandsDate: string | null;
  poNumber: string | null;
}

export interface LinkedQuote {
  id: string;
  number: string;
  title: string;
  status: string;
  totalAmount: number;
  expiresAt: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  orders: LinkedOrder[];
  quotes: LinkedQuote[];
  createdAt: string;
  createdById: string;
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
