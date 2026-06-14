"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

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
      style={{ background: "var(--navy, #0F2744)", borderBottom: "1px solid rgba(255,255,255,.06)" }}
    >
      <div className="max-w-[1100px] mx-auto px-7 flex items-center gap-4" style={{ height: 52 }}>

        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 italic text-white hover:opacity-80 transition-opacity"
          style={{ fontFamily: serif, fontSize: 20, letterSpacing: "-.3px", marginRight: 20 }}
        >
          Cogitons
        </Link>

        {/* Nav links */}
        <Link
          href="/"
          className="text-xs transition-colors"
          style={{ color: isActive("/") ? "#fff" : "rgba(255,255,255,.55)", fontWeight: isActive("/") ? 500 : 400 }}
        >
          Home
        </Link>
        <Link
          href="/subjects"
          className="text-xs transition-colors"
          style={{ color: isActive("/subjects") ? "#fff" : "rgba(255,255,255,.55)", fontWeight: isActive("/subjects") ? 500 : 400 }}
        >
          Subjects
        </Link>

        {/* Search */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex-1 max-w-[380px]">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => !query && setSearchOpen(false)}
              placeholder="Search…"
              className="w-full rounded-full px-4 py-1.5 text-xs focus:outline-none"
              style={{
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.15)",
                color: "rgba(255,255,255,.8)",
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="transition-colors"
            style={{ color: "rgba(255,255,255,.35)" }}
            aria-label="Search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
            </svg>
          </button>
        )}

        <div className="flex-1" />

        {/* Right side */}
        {authLoading ? null : user ? (
          <div className="flex items-center gap-4">
            {user.role === "admin" && (
              <Link
                href="/admin/subjects"
                className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,.4)" }}
              >
                Admin
              </Link>
            )}
            <Link href={`/profile/${user.username}`} className="flex items-center gap-2 group">
              <div
                className="flex items-center justify-center rounded-full text-white font-semibold"
                style={{ width: 28, height: 28, background: "var(--blue, #1E5FA8)", fontSize: 11 }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <span
                className="hidden sm:block text-xs transition-colors group-hover:text-white"
                style={{ color: "rgba(255,255,255,.7)", fontFamily: mono }}
              >
                {user.username}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,.35)" }}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,.55)" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--blue, #1E5FA8)" }}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}