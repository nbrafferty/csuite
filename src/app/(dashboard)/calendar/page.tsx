"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Proofing", value: "PROOFING" },
  { label: "Approved", value: "APPROVED" },
  { label: "In Production", value: "IN_PRODUCTION" },
  { label: "Ready", value: "READY" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

// Chip colors keyed to order status (mirrors OrderStatusBadge palette)
const STATUS_CHIP: Record<string, string> = {
  SUBMITTED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  IN_REVIEW: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  PROOFING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  IN_PRODUCTION: "bg-green-500/20 text-green-300 border-green-500/30",
  READY: "bg-coral/20 text-coral border-coral/30",
  SHIPPED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  COMPLETED: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function CalendarPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState("");

  // Visible range per view (month view includes leading/trailing week days)
  const { from, to, days } = useMemo(() => {
    if (view === "month") {
      const from = startOfWeek(startOfMonth(anchor));
      const to = endOfWeek(endOfMonth(anchor));
      const days: Date[] = [];
      for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
      return { from, to, days };
    }
    if (view === "week") {
      const from = startOfWeek(anchor);
      const to = endOfWeek(anchor);
      const days: Date[] = [];
      for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
      return { from, to, days };
    }
    return { from: startOfDay(anchor), to: endOfDay(anchor), days: [anchor] };
  }, [view, anchor]);

  const { data: entries, isLoading } = trpc.order.calendar.useQuery(
    {
      from: from.toISOString(),
      to: to.toISOString(),
      status: statusFilter ? (statusFilter as any) : undefined,
    },
    { enabled: isStaff, refetchInterval: 60_000 }
  );

  const byDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof entries>>();
    for (const e of entries ?? []) {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  if (!isStaff) {
    return (
      <p className="py-20 text-center text-sm text-gray-500">
        The production calendar is only available to staff.
      </p>
    );
  }

  const navigate = (dir: -1 | 1) => {
    if (view === "month") setAnchor((a) => addMonths(a, dir));
    else if (view === "week") setAnchor((a) => addWeeks(a, dir));
    else setAnchor((a) => addDays(a, dir));
  };

  const rangeLabel =
    view === "month"
      ? format(anchor, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(anchor), "MMM d")} – ${format(endOfWeek(anchor), "MMM d, yyyy")}`
        : format(anchor, "EEEE, MMMM d, yyyy");

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-display text-white">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Orders by production due date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-surface-border p-0.5">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize",
                  view === v ? "bg-coral text-white" : "text-gray-400 hover:text-white"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-surface-border p-2 text-gray-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAnchor(new Date())}
              className="rounded-lg border border-surface-border px-3 py-2 text-xs font-medium text-gray-300 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="rounded-lg border border-surface-border p-2 text-gray-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="mb-3 text-sm font-medium text-gray-300">{rangeLabel}</p>

      {/* Grid */}
      <div className="overflow-hidden rounded-xl border border-surface-border">
        {view !== "day" && (
          <div className="grid grid-cols-7 border-b border-surface-border bg-surface-card">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                {d}
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "grid",
            view === "month" && "grid-cols-7",
            view === "week" && "grid-cols-7",
            view === "day" && "grid-cols-1"
          )}
        >
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEntries = byDay.get(key) ?? [];
            const dim = view === "month" && !isSameMonth(day, anchor);
            return (
              <div
                key={key}
                className={cn(
                  "border-b border-r border-surface-border bg-surface-card p-1.5",
                  view === "month" ? "min-h-[110px]" : "min-h-[300px]",
                  dim && "bg-surface-bg/50"
                )}
              >
                <p
                  className={cn(
                    "mb-1 px-1 text-xs font-medium",
                    isToday(day)
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-coral text-white"
                      : dim
                        ? "text-gray-600"
                        : "text-gray-400"
                  )}
                >
                  {format(day, "d")}
                </p>
                <div className="space-y-1">
                  {dayEntries.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => router.push(`/orders/${e.id}`)}
                      title={`${e.number} — ${e.title} (${e.companyName})`}
                      className={cn(
                        "block w-full truncate rounded border px-1.5 py-1 text-left text-[10px] font-medium leading-tight transition-opacity hover:opacity-80",
                        STATUS_CHIP[e.status] ?? STATUS_CHIP.SUBMITTED
                      )}
                    >
                      {e.paid && <span className="mr-1 rounded bg-green-500/30 px-1 text-[8px] font-bold text-green-300">PAID</span>}
                      {e.number} · {e.title}
                      {view !== "month" && (
                        <span className="block truncate text-[9px] opacity-70">{e.companyName}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <p className="mt-4 text-center text-xs text-gray-500">Loading orders...</p>
      )}
    </div>
  );
}
