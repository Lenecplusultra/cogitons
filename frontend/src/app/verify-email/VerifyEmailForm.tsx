"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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
        if (res.success) { setState("success"); }
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
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--brand-navy)" }}>
          Cogitons
        </span>
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          {state === "verifying" && (
            <><div className="mb-4 text-4xl">⏳</div><h1 className="text-xl font-semibold">Verifying your email…</h1></>
          )}
          {state === "success" && (
            <>
              <div className="mb-4 text-4xl">✅</div>
              <h1 className="text-xl font-semibold">Email verified!</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your account is active. You can now log in.</p>
              <Button className="mt-6 w-full" onClick={() => router.push("/login")} style={{ backgroundColor: "var(--brand-blue)", color: "#fff" }}>
                Go to login
              </Button>
            </>
          )}
          {state === "error" && (
            <>
              <div className="mb-4 text-4xl">❌</div>
              <h1 className="text-xl font-semibold">Verification failed</h1>
              <p className="mt-2 text-sm text-muted-foreground">{errorMsg ?? "The link may have expired or already been used."}</p>
              {email && (
                <Button className="mt-6 w-full" variant="outline" onClick={handleResend} disabled={resendLoading || resendSent}>
                  {resendSent ? "Email sent — check your inbox" : resendLoading ? "Sending…" : "Resend verification email"}
                </Button>
              )}
            </>
          )}
          {state === "no_token" && (
            <>
              <div className="mb-4 text-4xl">📬</div>
              <h1 className="text-xl font-semibold">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a verification link to <span className="font-medium text-foreground">{email ?? "your email address"}</span>. Click it to activate your account.
              </p>
              {email && !resendSent && (
                <button onClick={handleResend} disabled={resendLoading} className="mt-4 text-sm hover:underline" style={{ color: "var(--brand-blue)" }}>
                  {resendLoading ? "Sending…" : "Didn't receive it? Resend"}
                </button>
              )}
              {resendSent && <p className="mt-4 text-sm text-muted-foreground">Resent — check your inbox again.</p>}
            </>
          )}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline" style={{ color: "var(--brand-blue)" }}>Back to login</Link>
        </p>
      </div>
    </main>
  );
}
