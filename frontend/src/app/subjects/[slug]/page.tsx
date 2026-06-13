// frontend/src/app/subjects/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type SubjectDetail, type DiscussionCard } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type SortOption = "recent" | "most_useful";

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

export default function SubjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionCard[]>([]);
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.subjects.get(slug).then((res) => {
      if (res.success) setSubject(res.data);
      else { setError(res.error.message); setLoading(false); }
    });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.discussions.list(slug, sort, page).then((res) => {
      if (res.success) {
        setDiscussions(res.data.items);
        setTotalPages(res.data.pagination.total_pages);
        setTotal(res.data.pagination.total);
      }
      setLoading(false);
    });
  }, [slug, sort, page]);

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    setPage(1);
  }

  if (authLoading || (!subject && !error)) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#F5F2ED" }}>
        <p className="text-gray-400 text-sm">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F5F2ED" }}>
        <p className="text-gray-500">{error}</p>
        <Link href="/" className="text-sm text-[#2E6DA4] underline">← Back to subjects</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F2ED" }}>

      {/* ── Subject header ── */}
      <section style={{ background: "#1A3C5E" }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Link
            href="/subjects"
            className="text-white/40 hover:text-white/70 text-xs transition-colors mb-4 inline-block"
          >
            ← All subjects
          </Link>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1
                className="text-white mb-2"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {subject!.title}
              </h1>
              <p className="text-white/55 text-sm max-w-xl leading-relaxed">
                {subject!.description}
              </p>
              <p className="text-white/30 text-xs mt-3">
                {total} {total === 1 ? "discussion" : "discussions"}
              </p>
            </div>
            {user && user.email_verified && (
              <Link
                href={`/subjects/${slug}/discussions/new`}
                className="shrink-0 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: "#2E6DA4" }}
              >
                Start a discussion
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-7">

          {/* ── Main column ── */}
          <div className="min-w-0">
            {/* Sort tabs */}
            <div className="flex items-center gap-2 mb-5">
              {(["recent", "most_useful"] as SortOption[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSortChange(s)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: sort === s ? "#1A3C5E" : "#FFFFFF",
                    color: sort === s ? "#FFFFFF" : "#6B7280",
                    border: sort === s ? "1px solid #1A3C5E" : "1px solid #E8E3DB",
                  }}
                >
                  {s === "recent" ? "Recent" : "Most Useful"}
                </button>
              ))}
            </div>

            {/* Discussion list */}
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl h-28 animate-pulse"
                    style={{ border: "1px solid #E8E3DB" }}
                  />
                ))}
              </div>
            ) : discussions.length === 0 ? (
              <div
                className="bg-white rounded-xl p-14 text-center"
                style={{ border: "1px dashed #D1C9BC" }}
              >
                <p className="text-gray-400 text-sm font-medium mb-1">No discussions yet</p>
                <p className="text-gray-300 text-xs">Be the first to start one.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {discussions.map((d) => (
                  <Link
                    key={d.id}
                    href={`/discussions/${d.id}`}
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
                      {d.title}
                    </p>

                    {/* Body snippet */}
                    {(d as { body?: string }).body && (
                      <p
                        className="mb-2.5 truncate"
                        style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}
                      >
                        {(d as { body?: string }).body}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={d.author.username} />
                        <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>
                          {d.author.username}
                        </span>
                        {d.edited && (
                          <>
                            <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
                            <span style={{ fontSize: 10, color: "#D1D5DB" }}>edited</span>
                          </>
                        )}
                        <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>
                          <span style={{ color: "#059669", fontWeight: 600 }}>✓</span>
                          {" "}{d.useful_count} useful
                        </span>
                        <span style={{ fontSize: 11, color: "#D1D5DB" }}>·</span>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>
                          {d.response_count} responses
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }} className="shrink-0 ml-3">
                        {timeAgo(d.created_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs border text-gray-500 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: "#E8E3DB" }}
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                    style={{
                      background: n === page ? "#1A3C5E" : "#FFFFFF",
                      color: n === page ? "#FFFFFF" : "#6B7280",
                      borderColor: n === page ? "#1A3C5E" : "#E8E3DB",
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs border text-gray-500 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: "#E8E3DB" }}
                >
                  →
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4 shrink-0">
            {/* Subject info */}
            <section
              className="bg-white rounded-xl px-4 py-4"
              style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.14em] mb-2.5">
                About this subject
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                {subject!.description}
              </p>
              <div className="divide-y" style={{ borderColor: "#F0EDE8" }}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-500">Discussions</span>
                  <span className="font-bold text-[#1A3C5E] text-xs tabular-nums">{total}</span>
                </div>
              </div>
            </section>

            {/* Start discussion CTA for guests */}
            {!user && (
              <section
                className="rounded-xl px-4 py-4"
                style={{ background: "#1A3C5E" }}
              >
                <p className="text-sm font-bold text-white mb-1.5">Join the discussion</p>
                <p className="text-white/50 text-xs leading-relaxed mb-3">
                  Log in or create an account to start a discussion in this subject.
                </p>
                <Link
                  href="/signup"
                  className="block text-center bg-white text-[#1A3C5E] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white/92 transition-colors mb-1.5"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="block text-center text-white/40 hover:text-white/70 text-xs transition-colors"
                >
                  Already a member? Log in
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}