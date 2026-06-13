"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <div
        className="hidden md:flex md:w-[420px] lg:w-[480px] shrink-0 flex-col justify-between px-12 py-14"
        style={{
          background:
            "radial-gradient(ellipse 80% 120% at 0% 50%, rgba(30,95,168,.4) 0%, transparent 60%), #0F2744",
        }}
      >
        <div>
          <div className="mb-12 text-2xl italic text-white" style={{ fontFamily: serif }}>
            Cogitons
          </div>
          <p className="mb-3 text-xs uppercase tracking-widest" style={{ fontFamily: mono, color: "rgba(168,200,232,.7)" }}>
            Knowledge · Discussion
          </p>
          <h2 className="mb-6 text-3xl font-semibold leading-tight text-white" style={{ fontFamily: serif }}>
            Come to understand a subject through{" "}
            <em style={{ color: "#A8C8E8" }}>community insight.</em>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
            A structured platform for organized, searchable knowledge — built
            for Cameroonian students and professionals.
          </p>
        </div>
        <p className="text-xs" style={{ fontFamily: mono, color: "rgba(255,255,255,.2)" }}>
          © 2026 Cogitons
        </p>
      </div>

      {/* ── Right panel ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{ background: "var(--cream, #FAF8F5)" }}
      >
        <div className="w-full max-w-[400px]">
          {!submitted ? (
            <>
              <h1 className="mb-1 text-2xl font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                Forgot your password?
              </h1>
              <p className="mb-8 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ border: "1px solid var(--border, #DDD8D0)", background: "#fff" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--blue, #1E5FA8)" }}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4 text-4xl">📨</div>
              <h1 className="mb-2 text-2xl font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                Check your inbox
              </h1>
              <p className="text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
                If an account exists for{" "}
                <span className="font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                  {email}
                </span>
                , you&apos;ll receive a reset link shortly. It expires in 1 hour.
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
            <Link href="/login" className="hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}