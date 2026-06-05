"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--brand-navy)" }}>
            Cogitons
          </span>
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="text-xl font-semibold">Invalid reset link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This link is missing a reset token. Please request a new one.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => router.push("/forgot-password")}
              style={{ backgroundColor: "var(--brand-blue)", color: "#fff" }}
            >
              Request new link
            </Button>
          </div>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await api.auth.resetPassword({ token: token!, new_password: password });
      if (!res.success) { setError(res.error.message); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--brand-navy)" }}>
            Cogitons
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {!success ? (
            <>
              <h1 className="mb-2 text-xl font-semibold">Reset your password</h1>
              <p className="mb-6 text-sm text-muted-foreground">Choose a new password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirm new password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                </div>
                {error && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  style={{ backgroundColor: "var(--brand-blue)", color: "#fff" }}
                >
                  {loading ? "Saving…" : "Set new password"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-4 text-4xl text-center">✅</div>
              <h1 className="mb-2 text-xl font-semibold text-center">Password updated</h1>
              <p className="text-sm text-muted-foreground text-center">
                Your password has been reset. You can now log in.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() => router.push("/login")}
                style={{ backgroundColor: "var(--brand-blue)", color: "#fff" }}
              >
                Go to login
              </Button>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
