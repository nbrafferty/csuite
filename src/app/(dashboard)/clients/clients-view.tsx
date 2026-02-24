"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Search, LayoutList, LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientsTable } from "./clients-table";
import { ClientsGrid } from "./clients-grid";
import { ClientDetailPanel } from "./client-detail-panel";

type StatusFilter = "all" | "active" | "paused" | "overdue";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Overdue", value: "overdue" },
];

export function ClientsView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data: clients } = trpc.clientOrg.list.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = c.name.toLowerCase().includes(q);
        const contactMatch = c.primaryContact?.name.toLowerCase().includes(q);
        if (!nameMatch && !contactMatch) return false;
      }
      return true;
    });
  }, [clients, statusFilter, search]);

  const totalCount = clients?.length ?? 0;

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Managing {totalCount} client organization{totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-card py-2 pl-10 pr-3 text-sm text-foreground placeholder-foreground-muted focus:border-coral focus:outline-none"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-coral text-white"
                  : "bg-surface-secondary text-foreground-secondary hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-surface-border bg-surface-card">
            <button
              onClick={() => setView("table")}
              className={cn(
                "rounded-l-lg p-2 transition-colors",
                view === "table"
                  ? "bg-surface-secondary text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(
                "rounded-r-lg p-2 transition-colors",
                view === "grid"
                  ? "bg-surface-secondary text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Add Client (placeholder) */}
          <button
            disabled
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "table" ? (
        <ClientsTable
          clients={filteredClients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
        />
      ) : (
        <ClientsGrid
          clients={filteredClients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
        />
      )}

      {/* Detail panel */}
      <ClientDetailPanel
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </div>
  );
}
