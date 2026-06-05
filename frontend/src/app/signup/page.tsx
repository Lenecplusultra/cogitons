"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.signup(form);
      if (!res.success) {
        setError(res.error.message);
        return;
      }
      // Redirect to a confirmation screen — user must verify email before login
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--brand-navy)" }}
          >
            Cogitons
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account to join the conversation.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold text-foreground">
            Sign up
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="texyonzo"
              autoComplete="username"
              required
              maxLength={40}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
            />

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{
                backgroundColor: "var(--brand-blue)",
                color: "#fff",
              }}
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium hover:underline"
              style={{ color: "var(--brand-blue)" }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Shared field component (local to this file) ──────────────────────────────

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
                   placeholder:text-muted-foreground focus:outline-none focus:ring-2
                   focus:ring-ring transition-colors"
      />
    </div>
  );
}