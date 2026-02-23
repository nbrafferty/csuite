export default function SupportPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Message threads with the CCC team.
          </p>
        </div>
        <button className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90">
          New request
        </button>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No support threads yet. Start a conversation if you need help.
        </p>
      </div>
    </div>
  );
}
