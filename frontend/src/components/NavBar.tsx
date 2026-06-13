// frontend/src/components/NavBar.tsx
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NavBar() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
    setSearchOpen(false);
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="sticky top-0 z-50"
      style={{ background: "#1A3C5E", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-5" style={{ height: 52 }}>

        {/* Logo */}
        <Link
          href="/"
          className="text-white shrink-0 hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Cogitons
        </Link>

        {/* Nav links */}
        <Link
          href="/"
          className={`text-sm transition-colors ${isActive("/") ? "text-white font-medium" : "text-white/55 hover:text-white"}`}
        >
          Home
        </Link>
        <Link
          href="/subjects"
          className={`text-sm transition-colors ${isActive("/subjects") ? "text-white font-medium" : "text-white/55 hover:text-white"}`}
        >
          Subjects
        </Link>

        {/* Search icon */}
        <button
          onClick={() => setSearchOpen((v) => !v)}
          className="text-white/40 hover:text-white/80 transition-colors"
          aria-label="Search"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
          </svg>
        </button>

        {searchOpen && (
          <form onSubmit={handleSearch} className="flex-1 max-w-xs">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => !query && setSearchOpen(false)}
              placeholder="Search…"
              className="w-full bg-white/10 text-white placeholder-white/30 border border-white/15 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-white/40 transition-all"
            />
          </form>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        {authLoading ? null : user ? (
          <div className="flex items-center gap-4">
            {user.role === "admin" && (
              <Link
                href="/admin/subjects"
                className="text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                Admin
              </Link>
            )}
            <Link href={`/profile/${user.username}`} className="flex items-center gap-2 group">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  background: "#2E6DA4",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  fontSize: 11,
                }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-white/70 group-hover:text-white text-sm transition-colors hidden sm:block">
                {user.username}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-white/35 hover:text-white/70 text-xs transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/60 hover:text-white text-sm transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"
              style={{ background: "#2E6DA4" }}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}