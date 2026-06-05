"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Response is always identical whether email exists or not — prevents enumeration.
      await api.auth.forgotPassword(email);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--brand-navy)" }}
          >
            Cogitons
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {!submitted ? (
            <>
              <h1 className="mb-2 text-xl font-semibold">Forgot your password?</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Enter your email address and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
                               placeholder:text-muted-foreground focus:outline-none focus:ring-2
                               focus:ring-ring transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  style={{ backgroundColor: "var(--brand-blue)", color: "#fff" }}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-4 text-4xl text-center">📨</div>
              <h1 className="mb-2 text-xl font-semibold text-center">
                Check your inbox
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>,
                you&apos;ll receive a reset link shortly. It expires in 1 hour.
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="hover:underline"
            style={{ color: "var(--brand-blue)" }}
          >
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}