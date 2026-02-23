export default function BillingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          View invoices and manage payments.
        </p>
      </div>

      {/* Tabs placeholder */}
      <div className="mb-4 flex gap-4 border-b border-[var(--border)]">
        <button className="border-b-2 border-[var(--primary)] pb-2 text-sm font-medium">
          Invoices
        </button>
        <button className="pb-2 text-sm font-medium text-[var(--muted-foreground)]">
          Payment methods
        </button>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No invoices yet. Invoices will appear here once they&apos;re issued.
        </p>
      </div>
    </div>
  );
}
