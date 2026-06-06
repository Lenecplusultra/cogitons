"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api, UserMe, tokenStore } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: UserMe | null;
  loading: boolean;
  login: (user: UserMe) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount — reads the HTTP-only cookie via GET /users/me
const refresh = useCallback(async () => {
  try {
    // Exchange the HTTP-only refresh token cookie for a new access token
      const tokenRes = await api.auth.refresh();
      if (tokenRes.success) {
        tokenStore.set(tokenRes.data.access_token);
      } else {
        setUser(null);
        setLoading(false);
        return;
      }

      // Now fetch the user with the fresh access token
      const userRes = await api.users.me();
      if (userRes.success) {
        setUser(userRes.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Called immediately after a successful login response
  const login = useCallback((user: UserMe) => {
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    tokenStore.set(null);
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}