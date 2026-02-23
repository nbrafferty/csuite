"use client";

import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const stats = [
  {
    label: "Active Orders",
    value: "24",
    change: "+12%",
    icon: ShoppingCart,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    label: "Pending Proofs",
    value: "8",
    change: "+3",
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  {
    label: "Completed",
    value: "156",
    change: "+18%",
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    label: "Revenue (MTD)",
    value: "$48,250",
    change: "+22%",
    icon: DollarSign,
    color: "text-brand-400",
    bgColor: "bg-brand-400/10",
  },
];

const recentOrders = [
  {
    id: "CS-8891",
    title: "Spring Gala Polos",
    status: "IN_PRODUCTION",
    date: "Feb 20, 2026",
  },
  {
    id: "CS-8890",
    title: "Corporate Tees – Q1",
    status: "AWAITING_PROOF",
    date: "Feb 19, 2026",
  },
  {
    id: "CS-8889",
    title: "Trade Show Hats",
    status: "APPROVED",
    date: "Feb 18, 2026",
  },
  {
    id: "CS-8888",
    title: "Team Hoodies 2026",
    status: "SHIPPED",
    date: "Feb 17, 2026",
  },
  {
    id: "CS-8887",
    title: "Client Gift Bags",
    status: "COMPLETED",
    date: "Feb 15, 2026",
  },
];

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-700 text-gray-300",
  SUBMITTED: "bg-blue-900 text-blue-300",
  IN_REVIEW: "bg-purple-900 text-purple-300",
  AWAITING_PROOF: "bg-amber-900 text-amber-300",
  APPROVED: "bg-emerald-900 text-emerald-300",
  IN_PRODUCTION: "bg-indigo-900 text-indigo-300",
  READY: "bg-teal-900 text-teal-300",
  SHIPPED: "bg-cyan-900 text-cyan-300",
  COMPLETED: "bg-green-900 text-green-300",
  CANCELLED: "bg-red-900 text-red-300",
};

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Here&apos;s what&apos;s happening with your orders today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <button className="flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300">
            View all <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-800">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-800/50"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-gray-400">
                  {order.id}
                </span>
                <span className="text-sm font-medium text-white">
                  {order.title}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusColors[order.status] || "bg-gray-700 text-gray-300"
                  }`}
                >
                  {order.status.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-gray-500">{order.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
