"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
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
            Choose New Password
          </h1>
        </div>

        {!token ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-light">
              This reset link is missing its token. Request a new one.
            </div>
            <p className="text-center text-sm text-foreground-muted">
              <a href="/forgot-password" className="font-medium text-brand-400 hover:text-brand-300">
                Request new reset link
              </a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-light">
                {error}{" "}
                {error.includes("expired") && (
                  <a href="/forgot-password" className="font-medium text-brand-400 hover:text-brand-300">
                    Request a new link
                  </a>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground-secondary">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Saving..." : "Set New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
