"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NavBar() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#1A3C5E] border-b border-[#2E6DA4]/30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-white font-bold text-lg shrink-0 hover:text-[#93C5FD] transition-colors"
        >
          Cogitons
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects and discussions…"
              className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-md px-4 py-1.5 text-sm focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all"
            />
            {query && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs transition-colors"
              >
                ↵
              </button>
            )}
          </div>
        </form>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {authLoading ? null : user ? (
            <>
              <Link
                href={`/profile/${user.username}`}
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-[#2E6DA4] hover:bg-[#2563a0] text-white text-sm px-3 py-1.5 rounded-md transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}