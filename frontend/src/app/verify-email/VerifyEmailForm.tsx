"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

type State = "verifying" | "success" | "error" | "no_token";

export default function VerifyEmailForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const email = params.get("email");

  const [state, setState] = useState<State>(token ? "verifying" : "no_token");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await api.auth.verifyEmail(token);
        if (res.success) setState("success");
        else { setErrorMsg(res.error.message); setState("error"); }
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
        setState("error");
      }
    })();
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResendLoading(true);
    try { await api.auth.resendVerification(email); setResendSent(true); }
    catch { /* silent */ }
    finally { setResendLoading(false); }
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
          {state === "verifying" && (
            <div className="text-center">
              <div className="mb-4 text-4xl">⏳</div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                Verifying your email…
              </h1>
            </div>
          )}

          {state === "success" && (
            <div className="text-center">
              <div className="mb-4 text-4xl">✅</div>
              <h1 className="mb-2 text-2xl font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                Email verified!
              </h1>
              <p className="mb-8 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
                Your account is active. You can now log in.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-full py-2.5 text-sm font-medium text-white"
                style={{ background: "var(--blue, #1E5FA8)" }}
              >
                Go to login
              </button>
            </div>
          )}

          {state === "error" && (
            <div className="text-center">
              <div className="mb-4 text-4xl">❌</div>
              <h1 className="mb-2 text-2xl font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                Verification failed
              </h1>
              <p className="mb-6 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
                {errorMsg ?? "The link may have expired or already been used."}
              </p>
              {email && (
                <button
                  onClick={handleResend}
                  disabled={resendLoading || resendSent}
                  className="w-full rounded-full py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: resendSent ? "var(--green, #1A6645)" : "var(--blue, #1E5FA8)" }}
                >
                  {resendSent ? "Email sent — check your inbox" : resendLoading ? "Sending…" : "Resend verification email"}
                </button>
              )}
            </div>
          )}

          {state === "no_token" && (
            <div className="text-center">
              <div className="mb-4 text-4xl">📬</div>
              <h1 className="mb-2 text-2xl font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                Check your inbox
              </h1>
              <p className="mb-6 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
                We sent a verification link to{" "}
                <span className="font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                  {email ?? "your email address"}
                </span>
                . Click it to activate your account.
              </p>
              {email && !resendSent && (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm hover:underline disabled:opacity-60"
                  style={{ color: "var(--blue, #1E5FA8)" }}
                >
                  {resendLoading ? "Sending…" : "Didn't receive it? Resend"}
                </button>
              )}
              {resendSent && (
                <p className="text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
                  Resent — check your inbox again.
                </p>
              )}
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