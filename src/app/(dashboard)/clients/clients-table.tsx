"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Client = {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryContact: { name: string; email: string } | null;
  userCount: number;
  activeOrders: number;
  revenue: number;
  lastActivity: Date;
  createdAt: Date;
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-teal-400",
  "from-violet-500 to-fuchsia-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-cyan-400",
  "from-rose-500 to-pink-400",
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/20 text-[#34C759]" },
  paused: { label: "Paused", className: "bg-yellow-500/20 text-[#FFD60A]" },
  overdue: { label: "Overdue", className: "bg-red-500/20 text-[#E85D5D]" },
};

type SortKey = "name" | "status";
type SortDir = "asc" | "desc";

interface ClientsTableProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
}

export function ClientsTable({ clients, selectedClientId, onSelectClient }: ClientsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = [...clients].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sortKey === "status") {
      const order = { active: 0, paused: 1, overdue: 2 };
      cmp = (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-coral" />
      : <ChevronDown className="h-3 w-3 text-coral" />;
  };

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-[#333338] bg-[#22222A] px-6 py-12 text-center">
        <p className="text-sm text-gray-500">No clients match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#333338]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#333338] bg-[#1A1A1E]">
            <th className="px-4 py-3 text-left">
              <button onClick={() => toggleSort("name")} className="group flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Organization <SortIcon col="name" />
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Primary Contact
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Active Orders
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Revenue
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Last Activity
            </th>
            <th className="px-4 py-3 text-left">
              <button onClick={() => toggleSort("status")} className="group flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                Status <SortIcon col="status" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((client) => {
            const badge = STATUS_BADGE[client.status] ?? STATUS_BADGE.active;
            const isSelected = selectedClientId === client.id;
            const gradient = AVATAR_GRADIENTS[hashStr(client.name) % AVATAR_GRADIENTS.length];

            return (
              <tr
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={cn(
                  "cursor-pointer border-b border-[#333338] transition-colors",
                  isSelected
                    ? "bg-[rgba(255,255,255,0.03)]"
                    : "bg-[#22222A] hover:bg-[rgba(255,255,255,0.03)]"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                      gradient
                    )}>
                      {client.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "h-2 w-2 rounded-full",
                          client.status === "active" && "bg-[#34C759]",
                          client.status === "paused" && "bg-[#FFD60A]",
                          client.status === "overdue" && "bg-[#E85D5D]"
                        )} />
                        <span className="text-sm font-medium text-white">{client.name}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{client.userCount} member{client.userCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {client.primaryContact ? (
                    <div>
                      <p className="text-sm text-white">{client.primaryContact.name}</p>
                      <p className="text-xs text-gray-500">{client.primaryContact.email}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No contact</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                    client.activeOrders > 0
                      ? "bg-blue-500/20 text-[#5B8DEF]"
                      : "bg-gray-500/20 text-gray-400"
                  )}>
                    {client.activeOrders}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  ${client.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(client.lastActivity), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium", badge.className)}>
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
