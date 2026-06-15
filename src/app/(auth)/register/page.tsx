"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          inviteCode: form.inviteCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-surface-border bg-surface-card px-4 py-2.5 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bg px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img
            src="/central-creative-logo.svg"
            alt="Central Creative Co."
            className="mx-auto h-auto max-h-16 w-auto object-contain"
          />
          <h1 className="mt-6 font-display text-3xl tracking-display text-foreground">
            Create Account
          </h1>
          <p className="label-eyebrow mt-3 text-[0.7rem]">
            Enter your invite code to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-light">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Invite Code
            </label>
            <input
              type="text"
              value={form.inviteCode}
              onChange={update("inviteCode")}
              required
              className={inputClass}
              placeholder="Enter your invite code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Full Name
            </label>
            <input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={update("name")}
              required
              className={inputClass}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update("email")}
              required
              className={inputClass}
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={update("password")}
                required
                minLength={8}
                className={inputClass.replace("mt-1 ", "") + " pr-11"}
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              required
              className={inputClass}
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-foreground-muted">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-brand-400 hover:text-brand-300"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
