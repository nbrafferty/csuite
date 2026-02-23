export default function ArtworkPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artwork</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Upload and manage artwork files for your orders.
          </p>
        </div>
        <button className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90">
          Upload artwork
        </button>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No artwork uploaded yet. Upload your first file to get started.
        </p>
      </div>
    </div>
  );
}
