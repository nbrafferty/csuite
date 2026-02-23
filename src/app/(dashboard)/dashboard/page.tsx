import { auth } from "@/lib/auth";
import {
  ShoppingCart,
  FileCheck,
  DollarSign,
  MessageCircle,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-[var(--muted-foreground)]" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Here&apos;s what&apos;s happening with your orders.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active orders" value="0" icon={ShoppingCart} />
        <StatCard label="Awaiting approval" value="0" icon={FileCheck} />
        <StatCard label="Unpaid invoices" value="$0" icon={DollarSign} />
        <StatCard label="Open threads" value="0" icon={MessageCircle} />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard/orders?new=true"
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            New order
          </a>
          <a
            href="/dashboard/artwork?upload=true"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--accent)]"
          >
            Upload artwork
          </a>
          <a
            href="/dashboard/billing"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--accent)]"
          >
            Pay invoice
          </a>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No recent activity yet. Create your first order to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
