"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type FeedData, type FeedMostUseful } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

interface PlatformStats { subjects: number; discussions: number; members: number; }

const AVATAR_COLORS = ["#1E5FA8", "#1A6645", "#7A3A80", "#C05020"];
function avatarColor(seed: string) {
  let s = 0; for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
    <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>

      {/* Hero */}
      <section style={{
        background: "radial-gradient(ellipse 60% 80% at 50% -20%, rgba(30,95,168,.5) 0%, transparent 70%), var(--navy, #0F2744)",
      }}>
        <div className="mx-auto max-w-[700px] px-6 pb-14 pt-16 text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[.15em]" style={{ fontFamily: mono, color: "#A8C8E8" }}>
            Knowledge · Discussion · Community
          </p>
          <h1 className="mb-4 leading-tight text-white" style={{ fontFamily: serif, fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 600 }}>
            Come to understand a subject<br />through{" "}
            <em style={{ color: "#A8C8E8" }}>community insight.</em>
          </h1>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
            A structured alternative to noisy social media — every discussion organized under a subject, every insight searchable and reusable.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
              if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
            }}
            className="mx-auto mb-5 flex max-w-[560px] overflow-hidden rounded-full"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,.2)" }}
          >
            <input
              name="q"
              type="text"
              placeholder="Search subjects, discussions, ideas…"
              className="flex-1 bg-white px-6 py-4 text-sm focus:outline-none"
              style={{ color: "var(--text, #0F1A26)" }}
            />
            <button
              type="submit"
              className="shrink-0 px-7 py-4 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--blue, #1E5FA8)" }}
            >
              Search
            </button>
          </form>
          <Link href="/subjects" className="text-xs transition-colors hover:text-white" style={{ color: "rgba(255,255,255,.4)" }}>
            Browse subjects →
          </Link>
        </div>
      </section>

      {/* Body — full width with comfortable padding */}
      <div className="px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-36 animate-pulse rounded-[10px]" style={{ border: "1px solid var(--border-soft, #E8E4DC)", background: "#fff" }} />)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">

            {/* ── Main column ── */}
            <div className="min-w-0 space-y-10">

              {/* Subject grid */}
              {feed?.featured_subjects && feed.featured_subjects.length > 0 && (
                <section>
                  <p className="mb-4 text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                    Browse subjects
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {feed.featured_subjects.map((s) => (
                      <Link
                        key={s.id}
                        href={`/subjects/${s.slug}`}
                        className="group rounded-[10px] px-6 py-5 transition-all hover:border-[#A8C8E8]"
                        style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))", minHeight: 120 }}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <p className="text-[15px] font-medium leading-snug transition-colors group-hover:text-[#1E5FA8]" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                            {s.title}
                          </p>
                          <span className="shrink-0 whitespace-nowrap text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                            {s.discussion_count} discussions
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                          {s.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent discussions */}
              {feed?.recent_discussions && feed.recent_discussions.length > 0 && (
                <section>
                  <p className="mb-4 text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                    Recent discussions
                  </p>
                  <div className="space-y-3">
                    {feed.recent_discussions.map((d) => (
                      <Link
                        key={d.id}
                        href={`/discussions/${d.id}`}
                        className="group block rounded-[10px] px-6 py-5 transition-all hover:border-[#A8C8E8]"
                        style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
                      >
                        {/* Subject label */}
                        <p className="mb-2 text-[10px] uppercase tracking-[.04em]" style={{ fontFamily: mono, color: "var(--blue, #1E5FA8)" }}>
                          {d.subject.title}
                        </p>
                        {/* Title */}
                        <p className="mb-2 text-[15px] font-medium leading-snug transition-colors group-hover:text-[#1E5FA8]" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                          {d.title}
                        </p>
                        {/* Body snippet */}
                        <p className="mb-4 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                          {d.body}
                        </p>
                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ background: avatarColor(d.author.username) }}>
                              {d.author.username[0].toUpperCase()}
                            </div>
                            <span className="text-[11px]" style={{ color: "var(--text-3, #6A7A8A)" }}>
                              {d.author.username}
                            </span>
                            <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                              ✓ {d.useful_count} useful
                            </span>
                            <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                              · {d.response_count} responses
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                            {timeAgo(d.created_at)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="shrink-0 space-y-4">

              {/* Platform stats */}
              {stats && (
                <section className="rounded-[10px] p-5" style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}>
                  <p className="mb-3 text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>Platform</p>
                  {[
                    { label: "Active subjects", value: stats.subjects },
                    { label: "Discussions", value: stats.discussions },
                    { label: "Members", value: stats.members },
                  ].map((s, i, arr) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft, #E8E4DC)" : "none" }}
                    >
                      <span className="text-sm" style={{ color: "var(--text-2, #3A4A5A)" }}>{s.label}</span>
                      <span className="text-sm font-medium" style={{ fontFamily: mono, color: "var(--navy, #0F2744)" }}>
                        {s.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </section>
              )}

              {/* Most useful this week */}
              {feed?.most_useful_this_week && feed.most_useful_this_week.length > 0 && (
                <section className="rounded-[10px] p-5" style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}>
                  <p className="mb-3 text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                    Most useful this week
                  </p>
                  {(feed.most_useful_this_week as FeedMostUseful[]).map((item, i, arr) => (
                    <Link
                      key={item.id}
                      href={`/discussions/${item.id}`}
                      className="group block py-3"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft, #E8E4DC)" : "none" }}
                    >
                      <p className="mb-1.5 line-clamp-2 text-xs leading-snug transition-colors group-hover:text-[#1E5FA8]" style={{ color: "var(--text-2, #3A4A5A)" }}>
                        &ldquo;{item.title}&rdquo;
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[9px] uppercase tracking-[.06em]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                          {item.subject.title}
                        </span>
                        <span className="whitespace-nowrap text-[11px] font-medium" style={{ fontFamily: mono, color: "var(--green, #1A6645)" }}>
                          ✓ {item.useful_count}
                        </span>
                      </div>
                    </Link>
                  ))}
                </section>
              )}

              {/* Guest CTA */}
              {!user && (
                <section className="rounded-[10px] p-5" style={{ background: "var(--navy, #0F2744)" }}>
                  <p className="mb-1.5 text-sm font-medium text-white" style={{ fontFamily: serif }}>Join Cogitons</p>
                  <p className="mb-4 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
                    Create an account to start discussions, share insights, and vote on what&apos;s useful.
                  </p>
                  <Link
                    href="/signup"
                    className="mb-2 block rounded-full bg-white py-2 text-center text-xs font-medium transition-opacity hover:opacity-90"
                    style={{ color: "var(--navy, #0F2744)" }}
                  >
                    Create account
                  </Link>
                  <Link
                    href="/login"
                    className="block text-center text-[10px] transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,.35)" }}
                  >
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