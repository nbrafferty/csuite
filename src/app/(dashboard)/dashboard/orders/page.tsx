export default function OrdersPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            View and manage your orders.
          </p>
        </div>
        <button className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90">
          New order
        </button>
      </div>

      {/* Filters placeholder */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-medium">
          All
        </span>
        <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
          Active
        </span>
        <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
          Needs approval
        </span>
        <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
          Completed
        </span>
      </div>

      {/* Empty state */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No orders yet. Create your first order to get started.
        </p>
      </div>
    </div>
  );
}
