"use client";

import { cn } from "@/lib/utils";
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

interface ClientsGridProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
}

export function ClientsGrid({ clients, selectedClientId, onSelectClient }: ClientsGridProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-[#333338] bg-[#22222A] px-6 py-12 text-center">
        <p className="text-sm text-gray-500">No clients match your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {clients.map((client) => {
        const badge = STATUS_BADGE[client.status] ?? STATUS_BADGE.active;
        const isSelected = selectedClientId === client.id;
        const gradient = AVATAR_GRADIENTS[hashStr(client.name) % AVATAR_GRADIENTS.length];

        return (
          <button
            key={client.id}
            onClick={() => onSelectClient(client.id)}
            className={cn(
              "rounded-xl border bg-[#22222A] p-5 text-left transition-all duration-150 hover:-translate-y-0.5",
              isSelected
                ? "border-coral/40"
                : "border-[#333338] hover:border-[#444448]"
            )}
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
                gradient
              )}>
                {client.name[0].toUpperCase()}
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium", badge.className)}>
                {badge.label}
              </span>
            </div>

            <h3 className="mt-3 text-sm font-semibold text-white">{client.name}</h3>

            {client.primaryContact && (
              <p className="mt-1 text-xs text-gray-500">{client.primaryContact.name}</p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{client.activeOrders}</p>
                <p className="text-[10px] text-gray-500">Orders</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">${(client.revenue / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-gray-500">Revenue</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{client.userCount}</p>
                <p className="text-[10px] text-gray-500">Users</p>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-gray-600">
              Last active {formatDistanceToNow(new Date(client.lastActivity), { addSuffix: true })}
            </p>
          </button>
        );
      })}
    </div>
  );
}
