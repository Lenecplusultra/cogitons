"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
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
        setError(typeof res.error === "object" ? res.error.message : String(res.error));
        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: navy brand panel ── */}
      <div
        className="hidden md:flex md:w-[420px] lg:w-[480px] shrink-0 flex-col justify-between px-12 py-14"
        style={{
          background:
            "radial-gradient(ellipse 80% 120% at 0% 50%, rgba(30,95,168,.4) 0%, transparent 60%), #0F2744",
        }}
      >
        <div>
          <div
            className="mb-12 text-2xl italic text-white"
            style={{ fontFamily: serif }}
          >
            Cogitons
          </div>
          <p
            className="mb-3 text-xs uppercase tracking-widest"
            style={{ fontFamily: mono, color: "rgba(168,200,232,.7)" }}
          >
            Knowledge · Discussion
          </p>
          <h2
            className="mb-6 text-3xl font-semibold leading-tight text-white"
            style={{ fontFamily: serif }}
          >
            Join a community that builds knowledge, not just{" "}
            <em style={{ color: "#A8C8E8" }}>noise.</em>
          </h2>
          <p className="mb-10 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
            Create an account to start discussions, share insights, and
            contribute to organized knowledge under the subjects that matter
            to you.
          </p>
          <ul className="space-y-4">
            {[
              "Real identity — real conversations",
              "Start and reply to discussions under any subject",
              "Vote useful to surface the best knowledge",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 shrink-0 text-xs"
                  style={{ color: "#A8C8E8" }}
                >
                  ✓
                </span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,.65)" }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs" style={{ fontFamily: mono, color: "rgba(255,255,255,.2)" }}>
          © 2026 Cogitons
        </p>
      </div>

      {/* ── Right: form panel ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{ background: "var(--cream, #FAF8F5)" }}
      >
        <div className="w-full max-w-[400px]">
          <h1
            className="mb-1 text-2xl font-semibold"
            style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}
          >
            Create your account
          </h1>
          <p className="mb-8 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="hover:underline"
              style={{ color: "var(--blue, #1E5FA8)" }}
            >
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--text, #0F1A26)" }}
              >
                Username
              </label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="texyonzo"
                autoComplete="username"
                required
                maxLength={40}
                className="w-full rounded-[6px] px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{
                  border: "1px solid var(--border, #DDD8D0)",
                  background: "#fff",
                  color: "var(--text, #0F1A26)",
                }}
              />
              <p className="text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>
                Visible to others — choose something you&apos;re comfortable with.
              </p>
            </div>

            <AuthField
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <AuthField
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

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-blue-600"
              />
              <span className="text-sm" style={{ color: "var(--text-2, #3A4A5A)" }}>
                I agree to the{" "}
                <a href="#" className="hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>
                  Privacy Policy
                </a>
              </span>
            </label>

            {error && (
              <p
                className="rounded-[6px] px-3 py-2 text-sm"
                style={{ background: "var(--red-bg, #FAE8E8)", color: "var(--red, #A82020)" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full rounded-full py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ background: "var(--blue, #1E5FA8)" }}
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p
            className="mt-6 text-center text-xs"
            style={{ color: "var(--text-4, #9AAABB)" }}
          >
            You&apos;ll receive a verification email after signup.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-[6px] px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
        style={{
          border: "1px solid var(--border, #DDD8D0)",
          background: "#fff",
          color: "var(--text, #0F1A26)",
        }}
      />
    </div>
  );
}