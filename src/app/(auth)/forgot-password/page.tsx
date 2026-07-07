"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

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
            Reset Password
          </h1>
          <p className="label-eyebrow mt-3 text-[0.7rem]">
            We&apos;ll email you a reset link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              If an account exists for {email}, a reset link is on its way.
              The link expires in 1 hour.
            </div>
            <p className="text-center text-sm text-foreground-muted">
              <a href="/login" className="font-medium text-brand-400 hover:text-brand-300">
                Back to sign in
              </a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral-light">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground-secondary"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-surface-border bg-surface-card px-4 py-2.5 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="you@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-sm text-foreground-muted">
              <a href="/login" className="font-medium text-brand-400 hover:text-brand-300">
                Back to sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
