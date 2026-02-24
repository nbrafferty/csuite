"use client";

import { useSession } from "next-auth/react";
import {
  FolderOpen,
  FileText,
  ShoppingCart,
  CheckCircle,
  ArrowUpRight,
  Clock,
} from "lucide-react";

/* ── Placeholder data ── */

const stats = [
  {
    label: "Active Projects",
    value: "12",
    change: "+2 this week",
    icon: FolderOpen,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
  },
  {
    label: "Open Quotes",
    value: "8",
    change: "3 awaiting approval",
    icon: FileText,
    iconColor: "text-coral",
    iconBg: "bg-coral/10",
  },
  {
    label: "Active Orders",
    value: "24",
    change: "+5 this month",
    icon: ShoppingCart,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
  },
  {
    label: "Completed Projects",
    value: "156",
    change: "+18 this quarter",
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
  },
];

const activeProjects = [
  {
    id: "PRJ-1041",
    name: "Spring Gala Uniforms",
    client: "Riverside Events Co.",
    deadline: "Mar 15, 2026",
    progress: 72,
  },
  {
    id: "PRJ-1039",
    name: "Corporate Rebrand Polos",
    client: "TechNova Inc.",
    deadline: "Mar 8, 2026",
    progress: 45,
  },
  {
    id: "PRJ-1037",
    name: "Trade Show Merchandise",
    client: "Summit Partners",
    deadline: "Apr 2, 2026",
    progress: 28,
  },
  {
    id: "PRJ-1035",
    name: "Team Hoodies 2026",
    client: "Greenfield Academy",
    deadline: "Mar 22, 2026",
    progress: 90,
  },
];

const recentQuotes = [
  {
    id: "QT-2240",
    title: "Embroidered Caps (x200)",
    amount: "$4,800",
    status: "Pending",
    date: "Feb 22, 2026",
  },
  {
    id: "QT-2238",
    title: "Custom Tees – Summer Run",
    amount: "$6,200",
    status: "Approved",
    date: "Feb 20, 2026",
  },
  {
    id: "QT-2236",
    title: "Safety Vests – Bulk",
    amount: "$3,150",
    status: "Pending",
    date: "Feb 19, 2026",
  },
  {
    id: "QT-2234",
    title: "Executive Gift Set",
    amount: "$1,900",
    status: "Declined",
    date: "Feb 17, 2026",
  },
  {
    id: "QT-2232",
    title: "Marathon Runner Kits",
    amount: "$8,400",
    status: "Approved",
    date: "Feb 15, 2026",
  },
];

const quoteStatusColor: Record<string, string> = {
  Pending: "text-amber-400",
  Approved: "text-emerald-400",
  Declined: "text-red-400",
};

/* ── Component ── */

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Here&apos;s an overview of your projects and activity.
        </p>
        <p className="mt-2 text-sm text-emerald-400">
          ✅ Workflow validated — 2026-02-24T12:00:00Z
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
            <p className="mt-1 text-xs text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main content: Projects + Quotes sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Projects – takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Active Projects
            </h2>
            <button className="flex items-center gap-1 text-sm font-medium text-coral hover:text-coral-light">
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-surface-border bg-surface-card p-5 transition-colors hover:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">
                        {project.id}
                      </span>
                      <h3 className="text-sm font-semibold text-white">
                        {project.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {project.client}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    {project.deadline}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-medium text-white">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
                    <div
                      className="h-full rounded-full bg-coral transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotes sidebar – takes 1 col */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Quotes</h2>
            <button className="flex items-center gap-1 text-sm font-medium text-coral hover:text-coral-light">
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-card divide-y divide-surface-border">
            {recentQuotes.map((quote) => (
              <div
                key={quote.id}
                className="px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate mr-2">
                    {quote.title}
                  </span>
                  <span className="text-sm font-semibold text-white whitespace-nowrap">
                    {quote.amount}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {quote.id} &middot; {quote.date}
                  </span>
                  <span
                    className={`font-medium ${quoteStatusColor[quote.status] ?? "text-gray-400"}`}
                  >
                    {quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
