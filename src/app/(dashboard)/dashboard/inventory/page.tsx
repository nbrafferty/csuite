export default function InventoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          View on-hand inventory across your locations.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No inventory items yet. Items will appear here once they&apos;re tracked.
        </p>
      </div>
    </div>
  );
}
