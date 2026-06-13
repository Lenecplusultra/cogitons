"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, tokenStore } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuspended(false);
    setLoading(true);
    try {
      const res = await api.auth.login(form);
      if (!res.success) {
        if (res.error.message.toLowerCase().includes("suspended")) {
          setSuspended(true);
        } else {
          setError(res.error.message);
        }
        return;
      }
      const { access_token, user } = res.data as {
        access_token: string;
        user: import("@/lib/api").UserMe;
      };
      tokenStore.set(access_token);
      login(user);
      const next = searchParams.get("next") ?? "/";
      router.push(next);
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
            Come to understand a subject through{" "}
            <em style={{ color: "#A8C8E8" }}>community insight.</em>
          </h2>
          <p className="mb-10 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
            A structured platform for organized, searchable knowledge — built
            for Cameroonian students and professionals.
          </p>
          <ul className="space-y-4">
            {[
              "Browse and search organized subjects",
              "Contribute to discussions that build knowledge over time",
              "Surface the best answers with useful votes",
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
        {/* Mobile logo */}
        <div
          className="mb-8 text-2xl italic text-white md:hidden"
          style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}
        >
          Cogitons
        </div>

        <div className="w-full max-w-[400px]">
          <h1
            className="mb-1 text-2xl font-semibold"
            style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}
          >
            Welcome back
          </h1>
          <p className="mb-8 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="hover:underline"
              style={{ color: "var(--blue, #1E5FA8)" }}
            >
              Sign up free
            </Link>
          </p>

          {suspended && (
            <div
              className="mb-6 rounded-[8px] px-4 py-4"
              style={{ background: "var(--red-bg, #FAE8E8)", border: "1px solid #E0A0A0" }}
            >
              <p className="mb-1 text-sm font-medium" style={{ color: "var(--red, #A82020)" }}>
                Account suspended
              </p>
              <p className="text-sm" style={{ color: "var(--red, #A82020)" }}>
                Your account has been suspended. If you believe this is a
                mistake, please contact us.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text, #0F1A26)" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs hover:underline"
                  style={{ color: "var(--blue, #1E5FA8)" }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
                required
                className="w-full rounded-[6px] px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{
                  border: "1px solid var(--border, #DDD8D0)",
                  background: "#fff",
                  color: "var(--text, #0F1A26)",
                }}
              />
            </div>

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
              disabled={loading || suspended}
              className="w-full rounded-full py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ background: "var(--blue, #1E5FA8)" }}
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
            New to Cogitons?{" "}
            <Link
              href="/signup"
              className="font-medium hover:underline"
              style={{ color: "var(--blue, #1E5FA8)" }}
            >
              Create an account
            </Link>
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