"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type SubjectDetail, type DiscussionCard } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

type SortOption = "recent" | "most_useful";

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
        console.log("first discussion:", JSON.stringify(res.data.items[0], null, 2));
        setDiscussions(res.data.items);
        setTotalPages(res.data.pagination.total_pages);
        setTotal(res.data.pagination.total);
      }
      setLoading(false);
    });
  }, [slug, sort, page]);

  if (authLoading || (!subject && !error)) {
    return <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--cream, #FAF8F5)" }}><p className="text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>Loading…</p></main>;
  }
  if (error) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "var(--cream, #FAF8F5)" }}><p style={{ color: "var(--text-3, #6A7A8A)" }}>{error}</p><Link href="/" className="text-sm hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>← Back to subjects</Link></main>;
  }

  const s = subject!;
  const responseCount = (s as unknown as { response_count?: number }).response_count ?? 0;
  const contributorCount = (s as unknown as { contributor_count?: number }).contributor_count ?? 0;

  return (
    <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>

      {/* Subject hero */}
      <section style={{
        background: "radial-gradient(ellipse 80% 120% at 0% 50%, rgba(30,95,168,.35) 0%, transparent 60%), var(--navy, #0F2744)",
        overflow: "hidden",
      }}>
        <div className="px-8 py-8">
          <Link
            href="/subjects"
            className="mb-5 inline-block text-[10px] uppercase tracking-[.05em] transition-colors hover:text-white/60"
            style={{ fontFamily: mono, color: "rgba(255,255,255,.3)" }}
          >
            ← All subjects
          </Link>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="mb-2 font-semibold leading-tight text-white" style={{ fontFamily: serif, fontSize: "clamp(1.5rem,3vw,2rem)" }}>
                {s.title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.55)" }}>
                {s.description}
              </p>
              {/* Stats */}
              <div className="mt-6 flex gap-8">
                <HeroStat value={total} label="discussions" />
                <HeroStat value={responseCount} label="responses" />
                <HeroStat value={contributorCount} label="contributors" />
              </div>
            </div>
            {user && user.email_verified && (
              <Link
                href={`/subjects/${slug}/discussions/new`}
                className="shrink-0 rounded-full px-5 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--blue, #1E5FA8)" }}
              >
                + Start a discussion
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Controls bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border-soft, #E8E4DC)" }}>
        <div className="flex items-center justify-between px-8 py-3">
          <p className="text-xs" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
            {total} discussions
          </p>
          <div className="flex gap-1.5">
            {(["recent", "most_useful"] as SortOption[]).map(opt => (
              <button
                key={opt}
                onClick={() => { setSort(opt); setPage(1); }}
                className="rounded-full px-4 py-1 text-[11px] transition-colors"
                style={{
                  fontFamily: mono,
                  background: sort === opt ? "var(--navy, #0F2744)" : "transparent",
                  color: sort === opt ? "#fff" : "var(--text-3, #6A7A8A)",
                  border: sort === opt ? "1px solid var(--navy, #0F2744)" : "1px solid var(--border, #DDD8D0)",
                  fontWeight: sort === opt ? 500 : 400,
                }}
              >
                {opt === "recent" ? "Recent" : "Most useful"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body — full width, no max-w cap */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] items-start">

          {/* Discussion list */}
          <div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-[10px]" style={{ border: "1px solid var(--border-soft, #E8E4DC)", background: "#fff" }} />)}
              </div>
            ) : discussions.length === 0 ? (
              <div className="rounded-[10px] p-16 text-center text-sm" style={{ border: "1px dashed var(--border, #DDD8D0)", color: "var(--text-4, #9AAABB)" }}>
                No discussions yet. Be the first to start one.
              </div>
            ) : (
              <div className="space-y-3">
                {discussions.map(d => {
                  const voted = d.viewer_voted ?? false;
                  const body = d.body;
                  return (
                    <Link
                      key={d.id}
                      href={`/discussions/${d.id}`}
                      className="group block rounded-[10px] px-6 py-5 transition-all hover:border-[#A8C8E8]"
                      style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
                    >
                      {/* Author row */}
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: avatarColor(d.author.username) }}>
                          {d.author.username[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium" style={{ color: "var(--text-2, #3A4A5A)" }}>
                          {d.author.username}
                        </span>
                        <span className="ml-auto text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                          {timeAgo(d.created_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <p className="mb-2 text-[15px] font-medium leading-snug transition-colors group-hover:text-[#1E5FA8]" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                        {d.title}
                      </p>

                      {/* Body snippet */}
                      {body && (
                        <p className="mb-4 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                          {body}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                          style={{
                            fontFamily: mono,
                            background: voted ? "var(--green-bg, #E8F5EE)" : "transparent",
                            color: voted ? "var(--green, #1A6645)" : "var(--text-3, #6A7A8A)",
                            border: voted ? "1px solid #9ACAB0" : "1px solid var(--border, #DDD8D0)",
                          }}
                        >
                          ✓ Useful · {d.useful_count}
                        </span>
                        <span className="text-[11px]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                          💬 {d.response_count} responses
                        </span>
                        {d.edited && (
                          <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>· edited</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <PagBtn onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>←</PagBtn>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
                  <PagBtn key={n} onClick={() => setPage(n)} active={n === page}>{n}</PagBtn>
                ))}
                <PagBtn onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>→</PagBtn>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Subject stats card */}
            <div className="rounded-[10px] p-5" style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}>
              <p className="mb-3 text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                About this subject
              </p>
              <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                {s.description}
              </p>
              {[
                { label: "Discussions", value: total },
                { label: "Responses", value: responseCount },
                { label: "Contributors", value: contributorCount },
             ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2.5"
                  style={{ borderTop: "1px solid var(--border-soft, #E8E4DC)" }}
                >
                  <span className="text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>{row.label}</span>
                  <span className="text-xs font-medium" style={{ fontFamily: mono, color: "var(--navy, #0F2744)" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Guest CTA */}
            {!user && (
              <div className="rounded-[10px] p-5" style={{ background: "var(--navy, #0F2744)" }}>
                <p className="mb-1.5 text-sm font-medium text-white" style={{ fontFamily: serif }}>Join the discussion</p>
                <p className="mb-4 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
                  Log in or create an account to start a discussion in this subject.
                </p>
                <Link href="/signup" className="mb-2 block rounded-full bg-white py-2 text-center text-xs font-medium hover:opacity-90" style={{ color: "var(--navy, #0F2744)" }}>
                  Create account
                </Link>
                <Link href="/login" className="block text-center text-[10px] transition-colors hover:text-white" style={{ color: "rgba(255,255,255,.35)" }}>
                  Already a member? Log in
                </Link>
              </div>
            )}

            {/* Start discussion CTA for logged-in users */}
            {user && user.email_verified && (
              <Link
                href={`/subjects/${slug}/discussions/new`}
                className="block rounded-[10px] p-5 text-center text-xs font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--blue, #1E5FA8)" }}
              >
                + Start a discussion
              </Link>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-2xl font-medium text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</div>
      <div className="text-[10px]" style={{ color: "rgba(255,255,255,.35)" }}>{label}</div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded text-sm disabled:opacity-30"
      style={{
        fontFamily: "'DM Mono', monospace",
        background: active ? "var(--blue, #1E5FA8)" : "#fff",
        color: active ? "#fff" : "var(--text-2, #3A4A5A)",
        border: active ? "1px solid var(--blue, #1E5FA8)" : "1px solid var(--border, #DDD8D0)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}