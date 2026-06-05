/**
 * frontend/src/lib/api.ts
 * Thin fetch wrapper — all API calls go through here.
 * Base URL comes from NEXT_PUBLIC_API_URL env var.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: { code: string; message: string } };

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include", // send/receive HTTP-only cookies
    ...options,
  });

  const json = await res.json();
  return json as ApiResponse<T>;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    signup: (body: { username: string; email: string; password: string }) =>
      request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(body) }),

    logout: () => request("/auth/logout", { method: "POST" }),

    verifyEmail: (token: string) =>
      request("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),

    resendVerification: (email: string) =>
      request("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    forgotPassword: (email: string) =>
      request("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    resetPassword: (body: { token: string; new_password: string }) =>
      request("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  users: {
    me: () => request<UserMe>("/users/me"),
    updateMe: (body: { username?: string; bio?: string }) =>
      request("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
    getByUsername: (username: string) =>
      request(`/users/${username}`),
  },
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface UserMe {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  role: "user" | "admin";
  status: "active" | "suspended" | "removed";
  email_verified: boolean;
  created_at: string;
}