"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type SearchData } from "@/lib/api";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

type Tab = "all" | "subjects" | "discussions";

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

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const { loading: authLoading } = useAuth();

  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [inputValue, setInputValue] = useState(q);

  useEffect(() => {
    setInputValue(q);
    if (!q || authLoading) return;
    setLoading(true); setError(null); setData(null); setTab("all");
    api.search.query(q).then((res) => {
      if (res.success) setData(res.data);
      else setError(res.error.message);
      setLoading(false);
    });
  }, [q, authLoading]);  // ← authLoading as dependency forces re-fetch when session resolves

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    router.push(`/search?q=${encodeURIComponent(val)}`);
  }

  const showSubjects = tab === "all" || tab === "subjects";
  const showDiscussions = tab === "all" || tab === "discussions";
  const hasResults = data && (data.total_subjects > 0 || data.total_discussions > 0);

  return (
    <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>
      <div className="px-8 py-10">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-8 flex max-w-[640px] overflow-hidden rounded-full" style={{ boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))", border: "1px solid var(--border-soft, #E8E4DC)" }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search subjects, discussions, ideas…"
            className="flex-1 bg-white px-6 py-3.5 text-sm focus:outline-none"
            style={{ color: "var(--text, #0F1A26)" }}
          />
          <button
            type="submit"
            className="shrink-0 px-6 py-3.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--blue, #1E5FA8)" }}
          >
            Search
          </button>
        </form>

        {/* Header + tabs */}
        {q && (
          <div className="mb-6">
            <h1 className="mb-4 text-2xl font-medium" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
              Results for <span style={{ color: "var(--blue, #1E5FA8)" }}>&ldquo;{q}&rdquo;</span>
            </h1>
            {data && (
              <div className="flex gap-2">
                {([
                  { key: "all", label: `All (${data.total_subjects + data.total_discussions})` },
                  { key: "subjects", label: `Subjects (${data.total_subjects})` },
                  { key: "discussions", label: `Discussions (${data.total_discussions})` },
                ] as { key: Tab; label: string }[]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="rounded-full px-4 py-1.5 text-[11px] transition-colors"
                    style={{
                      fontFamily: mono,
                      background: tab === t.key ? "var(--navy, #0F2744)" : "#fff",
                      color: tab === t.key ? "#fff" : "var(--text-3, #6A7A8A)",
                      border: tab === t.key ? "1px solid var(--navy, #0F2744)" : "1px solid var(--border, #DDD8D0)",
                      fontWeight: tab === t.key ? 500 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* States */}
        {!q && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>Enter a search term above.</p>
          </div>
        )}
        {q && loading && (
          <p className="py-16 text-center text-sm" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>Searching…</p>
        )}
        {q && !loading && error && (
          <p className="py-16 text-center text-sm" style={{ color: "var(--red, #A82020)" }}>{error}</p>
        )}
        {q && !loading && !error && data && !hasResults && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>No results for &ldquo;{q}&rdquo;.</p>
            <Link href="/" className="mt-4 inline-block text-sm hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>← Browse subjects</Link>
          </div>
        )}

        {/* Results */}
        {q && !loading && !error && data && hasResults && (
          <div className="space-y-10">

            {/* Subjects */}
            {showSubjects && data.subjects.length > 0 && (
              <section>
                <p className="mb-4 text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                  Subjects ({data.total_subjects})
                </p>
                <div className="space-y-3">
                  {data.subjects.map(s => (
                    <Link
                      key={s.id}
                      href={`/subjects/${s.slug}`}
                      className="group flex items-start gap-4 rounded-[10px] px-6 py-5 transition-all hover:border-[#A8C8E8]"
                      style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
                    >
                      {/* Subject avatar */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ background: avatarColor(s.title) }}
                      >
                        {s.title[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium transition-colors group-hover:text-[#1E5FA8]" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                            {s.title}
                          </p>
                          <span className="shrink-0 text-[10px] whitespace-nowrap" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                            {s.discussion_count} discussions
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                          {s.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Discussions */}
            {showDiscussions && data.discussions.length > 0 && (
              <section>
                <p className="mb-4 text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                  Discussions ({data.total_discussions})
                </p>
                <div className="space-y-3">
                  {data.discussions.map(d => (
                    <Link
                      key={d.id}
                      href={`/discussions/${d.id}`}
                      className="group block rounded-[10px] px-6 py-5 transition-all hover:border-[#A8C8E8]"
                      style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
                    >
                      {/* Subject label */}
                      <p className="mb-1.5 text-[10px] uppercase tracking-[.04em]" style={{ fontFamily: mono, color: "var(--blue, #1E5FA8)" }}>
                        {d.subject.title}
                      </p>
                      {/* Title */}
                      <p className="mb-2 text-[15px] font-medium leading-snug transition-colors group-hover:text-[#1E5FA8]" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                        {d.title}
                      </p>
                      {/* Body snippet */}
                      {(d as unknown as { body?: string }).body && (
                        <p className="mb-3 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                          {(d as unknown as { body?: string }).body}
                        </p>
                      )}
                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white"
                            style={{ background: avatarColor(d.author.username) }}
                          >
                            {d.author.username[0].toUpperCase()}
                          </div>
                          <span className="text-[11px]" style={{ color: "var(--text-3, #6A7A8A)" }}>
                            {d.author.username}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px]"
                            style={{
                              fontFamily: mono,
                              background: d.viewer_voted ? "var(--green-bg, #E8F5EE)" : "transparent",
                              color: d.viewer_voted ? "var(--green, #1A6645)" : "var(--text-3, #6A7A8A)",
                              border: d.viewer_voted ? "1px solid #9ACAB0" : "1px solid var(--border, #DDD8D0)",
                            }}
                          >
                            ✓ {d.useful_count} useful
                          </span>
                          <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                            · {d.response_count} responses
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                          {timeAgo(d.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}