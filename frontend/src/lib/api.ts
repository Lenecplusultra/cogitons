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
  options: RequestInit = {},
  retry = true
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

    if (res.status === 401 && retry) {
      // Try to refresh the access token silently
      const refreshRes = await fetch(`${BASE}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newToken = refreshJson?.data?.access_token ?? refreshJson?.access_token;
        if (newToken) {
          _accessToken = newToken;
          // Retry the original request once with the new token
          return request<T>(path, options, false);
        }
      }
      // Refresh failed — session is gone
      _accessToken = null;
      return { success: false, error: { code: "401", message: "Session expired. Please log in again." } };
    }

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

  discussions: {
    list: (slug: string, sort: "recent" | "most_useful" = "recent", page = 1, pageSize = 20) =>
      request<DiscussionListData>(
        `/subjects/${slug}/discussions?sort=${sort}&page=${page}&page_size=${pageSize}`
      ),
    get: (id: string) =>
      request<DiscussionDetail>(`/discussions/${id}`),
    create: (body: { subject_id: string; title: string; body: string }) =>
      request<{ id: string; title: string; status: string }>(
        "/discussions",
        { method: "POST", body: JSON.stringify(body) }
      ),
    update: (id: string, body: { title?: string; body?: string }) =>
      request<{ id: string; title: string; body: string; edited: boolean }>(
        `/discussions/${id}`,
        { method: "PATCH", body: JSON.stringify(body) }
      ),
    delete: (id: string) =>
      request(`/discussions/${id}`, { method: "DELETE" }),
    vote: (id: string) =>
      request<{ voted: boolean; useful_count: number }>(
        `/discussions/${id}/vote`,
        { method: "POST" }
      ),
  },

  responses: {
    list: (discussionId: string, page = 1, pageSize = 20) =>
      request<ResponseListData>(
        `/discussions/${discussionId}/responses?page=${page}&page_size=${pageSize}`
      ),
    create: (discussionId: string, body: string) =>
      request<{ id: string; body: string; status: string }>(
        `/discussions/${discussionId}/responses`,
        { method: "POST", body: JSON.stringify({ body }) }
      ),
    update: (id: string, body: string) =>
      request<{ id: string; body: string; edited: boolean }>(
        `/responses/${id}`,
        { method: "PATCH", body: JSON.stringify({ body }) }
      ),
    delete: (id: string) =>
      request(`/responses/${id}`, { method: "DELETE" }),
    vote: (id: string) =>
      request<{ voted: boolean; useful_count: number }>(
        `/responses/${id}/vote`,
        { method: "POST" }
      ),
  },

  search: {
    query: (q: string) =>
      request<SearchData>(`/search?q=${encodeURIComponent(q)}`),
  },

  feed: {
    get: () => request<FeedData>("/feed"),
  },

  stats: {
    get: () => request<{ subjects: number; discussions: number; members: number }>("/stats"),
  },

  moderation: {
    submitReport: (body: { target_type: "discussion" | "response"; target_id: string; reason: ReportReason; details?: string }) =>
      request("/reports", { method: "POST", body: JSON.stringify(body) }),

    listReports: (status: "pending" | "dismissed" | "actioned" = "pending", page = 1) =>
      request<ReportQueueData>(`/admin/reports?status=${status}&page=${page}&page_size=20`),

    dismissReport: (reportId: string, notes?: string) =>
      request(`/admin/reports/${reportId}/dismiss`, { method: "POST", body: JSON.stringify({ notes }) }),

    removeContent: (body: { target_type: "discussion" | "response"; target_id: string; report_id?: string; notes?: string }) =>
      request("/admin/content/remove", { method: "POST", body: JSON.stringify(body) }),

    lockDiscussion: (discussionId: string, body: { report_id?: string; notes?: string }) =>
      request(`/admin/discussions/${discussionId}/lock`, { method: "POST", body: JSON.stringify(body) }),

    unlockDiscussion: (discussionId: string, body: { notes?: string }) =>
      request(`/admin/discussions/${discussionId}/unlock`, { method: "POST", body: JSON.stringify(body) }),

    suspendUser: (userId: string, body: { report_id?: string; notes?: string }) =>
      request(`/admin/users/${userId}/suspend`, { method: "POST", body: JSON.stringify(body) }),

    restoreUser: (userId: string, body: { notes?: string }) =>
      request(`/admin/users/${userId}/restore`, { method: "POST", body: JSON.stringify(body) }),

    getReportContext: (reportId: string) =>
      request<ReportContext>(`/admin/reports/${reportId}/context`),
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
  status: string;
  discussion_count: number;
  response_count: number;
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

export interface DiscussionAuthor {
  id: string;
  username: string;
}

export interface DiscussionCard {
  id: string;
  author: DiscussionAuthor;
  title: string;
  useful_count: number;
  response_count: number;
  edited: boolean;
  status: string;
  created_at: string;
}

export interface DiscussionDetail {
  id: string;
  subject: { id: string; title: string; slug: string };
  author: DiscussionAuthor;
  title: string;
  body: string;
  useful_count: number;
  current_user_voted: boolean;
  response_count: number;
  edited: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionListData {
  items: DiscussionCard[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface ResponseItem {
  id: string;
  author: DiscussionAuthor;
  body: string;
  useful_count: number;
  current_user_voted: boolean;
  edited: boolean;
  status: string;
  created_at: string;
}

export interface ResponseListData {
  items: ResponseItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface SearchSubjectResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  discussion_count: number;
}

export interface SearchDiscussionResult {
  id: string;
  title: string;
  subject: { title: string; slug: string };
  author: { username: string };
  useful_count: number;
  response_count: number;
  created_at: string;
}

export interface SearchData {
  query: string;
  subjects: SearchSubjectResult[];
  discussions: SearchDiscussionResult[];
  total_subjects: number;
  total_discussions: number;
}

export interface FeedSubject {
  id: string;
  title: string;
  slug: string;
  description: string;
  discussion_count: number;
}

export interface FeedDiscussion {
  id: string;
  title: string;
  body: string;
  subject: { title: string; slug: string };
  author: { username: string };
  useful_count: number;
  response_count: number;
  created_at: string;
}

export interface FeedMostUseful {
  id: string;
  title: string;
  subject: { title: string; slug: string };
  useful_count: number;
}
 
export interface FeedData {
  featured_subjects: FeedSubject[];
  recent_discussions: FeedDiscussion[];
  most_useful_this_week: FeedMostUseful[];
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "dangerous_content"
  | "misinformation"
  | "privacy_violation"
  | "off_topic"
  | "other";

export interface ReportQueueItem {
  id: string;
  reporter: { id: string; username: string };
  target_type: "discussion" | "response";
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

export interface ReportQueueData {
  items: ReportQueueItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface ReportContext {
  target_type: "discussion" | "response";
  found: boolean;
  status?: string | null;
  body?: string;
  author?: string;
  discussion_id?: string;
  anchor?: string | null;
  action_taken?: {
    action: string;
    admin: string;
    notes: string | null;
    at: string;
  } | null;
}