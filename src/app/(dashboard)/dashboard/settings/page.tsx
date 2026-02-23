export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage your company profile, users, and preferences.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Company profile */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">Company profile</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Update your company name, logo, and contact details.
          </p>
        </div>

        {/* Users & permissions */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">Users &amp; permissions</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Invite team members and manage their access.
          </p>
        </div>

        {/* Locations */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">Shipping locations</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Manage your shipping addresses for orders.
          </p>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">Notifications</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Choose what you get notified about.
          </p>
        </div>

        {/* Security */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold">Security</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Change your password and security settings.
          </p>
        </div>
      </div>
    </div>
  );
}
