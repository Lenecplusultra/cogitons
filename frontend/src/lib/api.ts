const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// In-memory token store — not localStorage (XSS safe)
let _accessToken: string | null = null;
export const tokenStore = {
  get: () => _accessToken,
  set: (t: string | null) => { _accessToken = t; },
};

type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: { code: string; message: string } };

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (_accessToken) {
      headers["Authorization"] = `Bearer ${_accessToken}`;
    }

    const res = await fetch(`${BASE}/api/v1${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.detail?.[0]?.msg ??
        json?.detail?.message ??
        json?.detail?.error?.message ??
        (typeof json?.detail === "string" ? json.detail : null) ??
        json?.error?.message ??
        "Something went wrong.";
      return { success: false, error: { code: String(res.status), message } };
    }

    if ("success" in json) return json as ApiResponse<T>;
    return { success: true, data: json as T };
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Could not reach the server." },
    };
  }
}

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
    
    refresh: () => request<{ access_token: string }>("/auth/refresh", { method: "POST" }),
  },

  users: {
    me: () => request<UserMe>("/users/me"),
    updateMe: (body: { username?: string; bio?: string }) =>
      request("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
    getByUsername: (username: string) =>
      request(`/users/${username}`),
  },

  subjects: {
    list: (page = 1, pageSize = 20) =>
      request<SubjectListData>(`/subjects?page=${page}&page_size=${pageSize}`),
    get: (slug: string) =>
      request<SubjectDetail>(`/subjects/${slug}`),
    create: (body: { title: string; description: string }) =>
      request<SubjectDetail>("/subjects", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: { title?: string; description?: string }) =>
      request<SubjectDetail>(`/subjects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    updateStatus: (id: string, body: { status: "active" | "archived" | "removed" }) =>
      request<SubjectDetail>(`/subjects/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  },
};

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

export interface SubjectListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  discussion_count: number;
  created_at: string;
}
 
export interface SubjectDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "active" | "archived" | "removed";
  discussion_count: number;
  created_at: string;
}
 
export interface SubjectListData {
  items: SubjectListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}
