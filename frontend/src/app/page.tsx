// frontend/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type FeedData, type FeedMostUseful } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface PlatformStats {
  subjects: number;
  discussions: number;
  members: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const AVATAR_COLORS = [
  "#2563EB", "#059669", "#7C3AED", "#DC2626",
  "#D97706", "#0891B2", "#BE185D", "#65A30D",
];

function Avatar({ name }: { name: string }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none"
      style={{ width: 24, height: 24, background: color, fontSize: 9, letterSpacing: "0.03em" }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.feed.get(), api.stats.get()]).then(([feedRes, statsRes]) => {
      if (feedRes.success) setFeed(feedRes.data);
      if (statsRes.success) setStats(statsRes.data as PlatformStats);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "#F5F2ED" }}>

      {/* Hero */}
      <section style={{ background: "#1A3C5E" }}>
        <div className="max-w-3xl mx-auto px-6 pt-14 pb-12 text-center">
          <p className="text-white/40 text-xs font-semibold tracking-[0.18em] uppercase mb-6">
            Knowledge · Discussion · Community
          </p>
          <h1
            className="text-white leading-[1.15] mb-5"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(2rem, 5vw, 2.8rem)",
              fontWeight: 700,
            }}
          >
            Come to understand a subject<br />
            through{" "}
            <em style={{ fontStyle: "italic", color: "#93C5FD", fontWeight: 700 }}>
              community insight.
            </em>
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            A structured alternative to noisy social media — every discussion organized under a subject, every insight searchable and reusable.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
              if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
            }}
            className="flex items-stretch max-w-xl mx-auto mb-5 rounded-lg overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
          >
            <input
              name="q"
              type="text"
              placeholder="Search subjects, discussions, ideas…"
              className="flex-1 bg-white text-gray-800 placeholder-gray-400 px-5 py-3.5 text-sm focus:outline-none border-0"
            />
            <button
              type="submit"
              className="text-white font-semibold text-sm px-7 py-3.5 shrink-0 hover:opacity-90 transition-opacity"
              style={{ background: "#2E6DA4" }}
            >
              Search
            </button>
          </form>
          <Link href="/subjects" className="text-white/40 hover:text-white/70 text-sm transition-colors">
            Browse subjects →
          </Link>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-7">
            <div className="space-y-2.5">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl h-32 animate-pulse" style={{ border: "1px solid #E8E3DB" }} />
              ))}
            </div>
            <div className="space-y-2.5">
              <div className="bg-white rounded-xl h-40 animate-pulse" style={{ border: "1px solid #E8E3DB" }} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-7">

            {/* Main column */}
            <div className="space-y-8 min-w-0">

              {/* Browse subjects */}
              {feed && feed.featured_subjects.length > 0 && (
                <section>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.14em] mb-3">
                    Browse subjects
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {feed.featured_subjects.map((subject) => (
                      <Link
                        key={subject.id}
                        href={`/subjects/${subject.slug}`}
                        className="group bg-white rounded-xl px-4 py-3.5 transition-all"
                        style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#2E6DA4";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#E8E3DB";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-semibold text-[#1A3C5E] text-sm leading-snug group-hover:text-[#2E6DA4] transition-colors">
                            {subject.title}
                          </p>
                          <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                            {subject.discussion_count} discussions
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {subject.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent discussions */}
              {feed && feed.recent_discussions.length > 0 && (
                <section>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.14em] mb-3">
                    Recent discussions
                  </p>
                  <div className="space-y-2.5">
                    {feed.recent_discussions.map((discussion) => (
                      <Link
                        key={discussion.id}
                        href={`/discussions/${discussion.id}`}
                        className="group block bg-white rounded-xl px-5 py-4 transition-all"
                        style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#2E6DA4";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#E8E3DB";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                        }}
                      >
                        {/* Subject label */}
                        <p
                          className="mb-1"
                          style={{
                            color: "#2E6DA4",
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            fontFamily: "var(--font-geist-mono, monospace)",
                          }}
                        >
                          {discussion.subject.title}
                        </p>

                        {/* Title */}
                        <p
                          className="mb-1.5 group-hover:text-[#2E6DA4] transition-colors"
                          style={{
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#1A3C5E",
                            lineHeight: 1.35,
                          }}
                        >
                          {discussion.title}
                        </p>

                        {/* Body snippet */}
                        <p
                          className="mb-2.5 truncate"
                          style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}
                        >
                          {discussion.body}
                        </p>

                        {/* Footer: avatar + name + stats LEFT · time RIGHT */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Avatar name={discussion.author.username} />
                            <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }} className="shrink-0">
                              {discussion.author.username}
                            </span>
                            <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
                            <span style={{ fontSize: 11, color: "#6B7280" }} className="shrink-0">
                              <span style={{ color: "#059669", fontWeight: 600 }}>✓</span>
                              {" "}{discussion.useful_count} useful
                            </span>
                            <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
                            <span style={{ fontSize: 11, color: "#6B7280" }} className="shrink-0">
                              {discussion.response_count} responses
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: "#9CA3AF" }} className="shrink-0 ml-3">
                            {timeAgo(discussion.created_at)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 shrink-0">

              {stats && (
                <section
                  className="bg-white rounded-xl px-4 py-4"
                  style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.14em] mb-2.5">
                    Platform
                  </p>
                  <div className="divide-y" style={{ borderColor: "#F0EDE8" }}>
                    {[
                      { label: "Active subjects", value: stats.subjects },
                      { label: "Discussions", value: stats.discussions },
                      { label: "Members", value: stats.members },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">{s.label}</span>
                        <span className="font-bold text-[#1A3C5E] text-sm tabular-nums">{s.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {feed?.most_useful_this_week && feed.most_useful_this_week.length > 0 && (
                <section
                  className="bg-white rounded-xl px-4 py-4"
                  style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.14em] mb-2.5">
                    Most useful this week
                  </p>
                  <div className="divide-y" style={{ borderColor: "#F0EDE8" }}>
                    {(feed.most_useful_this_week as FeedMostUseful[]).map((item) => (
                      <Link key={item.id} href={`/discussions/${item.id}`} className="block py-2.5 group">
                        <p className="text-xs text-gray-700 group-hover:text-[#2E6DA4] leading-snug transition-colors line-clamp-2 mb-1">
                          &ldquo;{item.title}&rdquo;
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-gray-400 truncate"
                            style={{
                              fontFamily: "var(--font-geist-mono, monospace)",
                              fontSize: 9,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {item.subject.title}
                          </span>
                          <span style={{ color: "#059669", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>
                            ✓ {item.useful_count}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {!user && (
                <section className="rounded-xl px-4 py-4" style={{ background: "#1A3C5E" }}>
                  <p className="text-sm font-bold text-white mb-1.5">Join Cogitons</p>
                  <p className="text-white/50 text-xs leading-relaxed mb-3">
                    Create an account to start discussions, share insights, and vote on what&apos;s useful.
                  </p>
                  <Link href="/signup" className="block text-center bg-white text-[#1A3C5E] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white/92 transition-colors mb-1.5">
                    Create account
                  </Link>
                  <Link href="/login" className="block text-center text-white/40 hover:text-white/70 text-xs transition-colors">
                    Already a member? Log in
                  </Link>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}