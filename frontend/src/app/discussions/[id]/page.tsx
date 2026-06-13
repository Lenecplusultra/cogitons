// frontend/src/app/discussions/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, type DiscussionDetail, type ResponseItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ReportModal from "@/components/ReportModal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
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
  return formatDate(iso);
}

const AVATAR_COLORS = [
  "#2563EB", "#059669", "#7C3AED", "#DC2626",
  "#D97706", "#0891B2", "#BE185D", "#65A30D",
];

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35, letterSpacing: "0.03em" }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Response card ─────────────────────────────────────────────────────────────

function ResponseCard({
  response,
  isMostUseful,
  currentUserId,
  canVote,
  isGuest,
  onAuthRequired,
  onUpdated,
  onDeleted,
  onVoted,
}: {
  response: ResponseItem;
  isMostUseful: boolean;
  currentUserId: string | undefined;
  canVote: boolean;
  isGuest: boolean;
  onAuthRequired: () => void;
  onUpdated: (id: string, body: string) => void;
  onDeleted: (id: string) => void;
  onVoted: (id: string, voted: boolean, useful_count: number) => void;
}) {
  const isOwner = currentUserId === response.author.id;
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(response.body);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function handleSave() {
    if (!editBody.trim()) { setEditError("Body is required."); return; }
    setSaving(true); setEditError(null);
    const res = await api.responses.update(response.id, editBody.trim());
    setSaving(false);
    if (res.success) { onUpdated(response.id, res.data.body); setEditing(false); }
    else setEditError(res.error.message);
  }

  async function handleDelete() {
    if (!confirm("Delete this response?")) return;
    setDeleting(true);
    const res = await api.responses.delete(response.id);
    setDeleting(false);
    if (res.success) onDeleted(response.id);
  }

  async function handleVote() {
    if (!canVote) { if (isGuest) { onAuthRequired(); return; } return; }
    setVoting(true);
    const res = await api.responses.vote(response.id);
    setVoting(false);
    if (res.success) onVoted(response.id, res.data.voted, res.data.useful_count);
  }

  return (
    <div
      id={`response-${response.id}`}
      className="bg-white rounded-xl px-5 py-5"
      style={{
        border: "1px solid #E8E3DB",
        borderLeft: isMostUseful ? "3px solid #2E6DA4" : "1px solid #E8E3DB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar name={response.author.username} size={28} />
          <Link
            href={`/profile/${response.author.username}`}
            style={{ fontSize: 13, fontWeight: 600, color: "#1A3C5E" }}
            className="hover:text-[#2E6DA4] transition-colors"
          >
            {response.author.username}
          </Link>
          {isMostUseful && (
            <span
              className="flex items-center gap-1"
              style={{
                fontSize: 10, fontWeight: 600, color: "#2E6DA4",
                background: "#EBF2FA", borderRadius: 4, padding: "2px 6px",
              }}
            >
              <span style={{ color: "#059669" }}>✓</span> Most useful
            </span>
          )}
          {response.edited && (
            <span style={{ fontSize: 10, color: "#D1D5DB" }}>edited</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{timeAgo(response.created_at)}</span>
          {isOwner && !editing && (
            <>
              <button onClick={() => setEditing(true)} style={{ fontSize: 11, color: "#2E6DA4" }} className="hover:underline">Edit</button>
              <button onClick={handleDelete} disabled={deleting} style={{ fontSize: 11, color: "#F87171" }} className="hover:text-red-600 disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>

      {editError && (
        <div className="mb-3 px-3 py-2 bg-red-50 rounded text-xs text-red-600" style={{ border: "1px solid #FECACA" }}>
          {editError}
        </div>
      )}

      {editing ? (
        <>
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 rounded focus:outline-none resize-none"
            style={{ border: "1px solid #E8E3DB", fontSize: 14 }}
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button onClick={() => { setEditing(false); setEditBody(response.body); setEditError(null); }} style={{ fontSize: 12, color: "#6B7280" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded text-white disabled:opacity-50" style={{ fontSize: 12, fontWeight: 600, background: "#2E6DA4" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75 }} className="whitespace-pre-wrap mb-4">
          {response.body}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleVote}
          disabled={voting}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 transition-all"
          style={{
            fontSize: 12,
            fontWeight: 500,
            border: response.current_user_voted ? "1px solid #2E6DA4" : "1px solid #E8E3DB",
            color: response.current_user_voted ? "#2E6DA4" : "#6B7280",
            background: response.current_user_voted ? "#EBF2FA" : "#FAFAFA",
          }}
        >
          <span style={{ color: "#059669", fontWeight: 600 }}>✓</span>
          Useful · {response.useful_count}
        </button>
        {!isOwner && !isGuest && (
          <button
            onClick={() => setReporting(true)}
            className="flex items-center gap-1"
            style={{ fontSize: 12, color: "#9CA3AF" }}
          >
            ⚑ Report
          </button>
        )}
      </div>

      {reporting && (
        <ReportModal targetType="response" targetId={response.id} onClose={() => setReporting(false)} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [discussionVoting, setDiscussionVoting] = useState(false);
  const [reportingDiscussion, setReportingDiscussion] = useState(false);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [responsePage, setResponsePage] = useState(1);
  const [responseTotalPages, setResponseTotalPages] = useState(1);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [newResponseBody, setNewResponseBody] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.discussions.get(id).then((res) => {
      if (res.success) { setDiscussion(res.data); setEditTitle(res.data.title); setEditBody(res.data.body); }
      else setError(res.error.message);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setResponsesLoading(true);
    api.responses.list(id, responsePage).then((res) => {
      if (res.success) { setResponses(res.data.items); setResponseTotalPages(res.data.pagination.total_pages); }
      setResponsesLoading(false);
    });
  }, [id, responsePage]);

  async function handleSaveEdit() {
    if (!discussion || !editTitle.trim() || !editBody.trim()) { setEditError("Title and body are required."); return; }
    setSaving(true); setEditError(null);
    const res = await api.discussions.update(discussion.id, { title: editTitle.trim(), body: editBody.trim() });
    setSaving(false);
    if (res.success) { setDiscussion((p) => p ? { ...p, title: res.data.title, body: res.data.body, edited: true } : p); setEditing(false); }
    else setEditError(res.error.message);
  }

  async function handleDeleteDiscussion() {
    if (!discussion || !confirm("Delete this discussion? All responses will also be deleted.")) return;
    setDeleting(true);
    const res = await api.discussions.delete(discussion.id);
    setDeleting(false);
    if (res.success) router.push(`/subjects/${discussion.subject.slug}`);
    else setError(res.error.message);
  }

  async function handleDiscussionVote() {
    if (!user) { router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    if (!user.email_verified || !discussion) return;
    setDiscussionVoting(true);
    const res = await api.discussions.vote(discussion.id);
    setDiscussionVoting(false);
    if (res.success) setDiscussion((p) => p ? { ...p, useful_count: res.data.useful_count, current_user_voted: res.data.voted } : p);
  }

  async function handleSubmitResponse() {
    if (!user) { router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    if (!newResponseBody.trim()) { setResponseError("Response cannot be empty."); return; }
    setSubmittingResponse(true); setResponseError(null);
    const res = await api.responses.create(id, newResponseBody.trim());
    setSubmittingResponse(false);
    if (res.success) {
      setNewResponseBody("");
      const updated = await api.responses.list(id, responsePage);
      if (updated.success) { setResponses(updated.data.items); setResponseTotalPages(updated.data.pagination.total_pages); }
      setDiscussion((p) => p ? { ...p, response_count: p.response_count + 1 } : p);
    } else setResponseError(res.error.message);
  }

  const handleResponseUpdated = (responseId: string, newBody: string) =>
    setResponses((p) => p.map((r) => r.id === responseId ? { ...r, body: newBody, edited: true } : r));
  const handleResponseDeleted = (responseId: string) => {
    setResponses((p) => p.filter((r) => r.id !== responseId));
    setDiscussion((p) => p ? { ...p, response_count: Math.max(0, p.response_count - 1) } : p);
  };
  const handleResponseVoted = (responseId: string, voted: boolean, useful_count: number) =>
    setResponses((p) => p.map((r) => r.id === responseId ? { ...r, current_user_voted: voted, useful_count } : r));

  if (authLoading || loading) {
    return <main className="min-h-screen flex items-center justify-center" style={{ background: "#F5F2ED" }}><p className="text-gray-400 text-sm">Loading…</p></main>;
  }
  if (error || !discussion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F5F2ED" }}>
        <p className="text-gray-500">{error ?? "Discussion not found."}</p>
        <Link href="/" className="text-sm text-[#2E6DA4] underline">← Back</Link>
      </main>
    );
  }

  const isOwner = user?.id === discussion.author.id;
  const canRespond = !!user && user.email_verified && discussion.status !== "locked";
  const mostUsefulId = responses.length > 0
    ? responses.reduce((a, b) => a.useful_count >= b.useful_count ? a : b).id
    : null;

  return (
    <main className="min-h-screen" style={{ background: "#F5F2ED" }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-7">

          {/* ── Main ── */}
          <div className="min-w-0">

            {/* Breadcrumb */}
            <Link
              href={`/subjects/${discussion.subject.slug}`}
              className="inline-flex items-center gap-1 mb-5 transition-colors"
              style={{ fontSize: 13, color: "#2E6DA4" }}
            >
              ← {discussion.subject.title}
            </Link>

            {/* Title */}
            {editing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={300}
                className="w-full px-3 py-2 rounded mb-3 focus:outline-none"
                style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#1A3C5E", border: "1px solid #E8E3DB" }}
              />
            ) : (
              <h1
                className="mb-4"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "#1A3C5E", lineHeight: 1.3 }}
              >
                {discussion.title}
              </h1>
            )}

            {/* Author row */}
            <div className="flex items-center gap-2 mb-6">
              <Avatar name={discussion.author.username} size={28} />
              <Link href={`/profile/${discussion.author.username}`} style={{ fontSize: 13, fontWeight: 600, color: "#374151" }} className="hover:text-[#2E6DA4] transition-colors">
                {discussion.author.username}
              </Link>
              <span style={{ fontSize: 12, color: "#D1D5DB" }}>·</span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Posted {timeAgo(discussion.created_at)}</span>
              {discussion.edited && <span style={{ fontSize: 10, color: "#D1D5DB" }}>edited</span>}
            </div>

            {/* Body */}
            <div className="mb-5">
              {editError && (
                <div className="mb-3 px-4 py-3 bg-red-50 rounded text-sm text-red-600" style={{ border: "1px solid #FECACA" }}>{editError}</div>
              )}
              {editing ? (
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 rounded focus:outline-none resize-none"
                  style={{ border: "1px solid #E8E3DB", fontSize: 14 }}
                />
              ) : (
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }} className="whitespace-pre-wrap">
                  {discussion.body}
                </p>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-3 pb-6 mb-6" style={{ borderBottom: "1px solid #E8E3DB" }}>
              <button
                onClick={handleDiscussionVote}
                disabled={discussionVoting}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all"
                style={{
                  fontSize: 13, fontWeight: 500,
                  border: discussion.current_user_voted ? "1px solid #2E6DA4" : "1px solid #E8E3DB",
                  color: discussion.current_user_voted ? "#2E6DA4" : "#6B7280",
                  background: discussion.current_user_voted ? "#EBF2FA" : "#FFFFFF",
                }}
              >
                <span style={{ color: "#059669", fontWeight: 600 }}>✓</span>
                Mark as useful · {discussion.useful_count}
              </button>

              {user && !isOwner && (
                <button
                  onClick={() => setReportingDiscussion(true)}
                  className="flex items-center gap-1"
                  style={{ fontSize: 13, color: "#9CA3AF" }}
                >
                  ⚑ Report
                </button>
              )}

              {isOwner && !editing && (
                <div className="ml-auto flex items-center gap-3">
                  <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: "#2E6DA4" }} className="hover:underline">Edit</button>
                  <button onClick={handleDeleteDiscussion} disabled={deleting} style={{ fontSize: 12, color: "#F87171" }} className="hover:text-red-600 disabled:opacity-50">
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
              {editing && (
                <div className="ml-auto flex items-center gap-3">
                  <button onClick={() => { setEditing(false); setEditError(null); }} style={{ fontSize: 12, color: "#6B7280" }}>Cancel</button>
                  <button onClick={handleSaveEdit} disabled={saving} className="px-3 py-1.5 rounded text-white disabled:opacity-50" style={{ fontSize: 12, fontWeight: 600, background: "#2E6DA4" }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {/* Responses header */}
            <p className="mb-4" style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {discussion.response_count} Response{discussion.response_count !== 1 ? "s" : ""}
            </p>

            {/* Response form */}
            {canRespond ? (
              <div className="bg-white rounded-xl px-5 py-4 mb-4" style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                {responseError && (
                  <div className="mb-3 px-3 py-2 bg-red-50 rounded text-xs text-red-600" style={{ border: "1px solid #FECACA" }}>{responseError}</div>
                )}
                <textarea
                  value={newResponseBody}
                  onChange={(e) => setNewResponseBody(e.target.value)}
                  rows={4}
                  placeholder="Share your insight or perspective…"
                  className="w-full px-3 py-2.5 rounded focus:outline-none resize-none"
                  style={{ border: "1px solid #E8E3DB", fontSize: 13, color: "#374151" }}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleSubmitResponse}
                    disabled={submittingResponse}
                    className="px-4 py-2 rounded text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                    style={{ fontSize: 13, fontWeight: 600, background: "#2E6DA4" }}
                  >
                    {submittingResponse ? "Posting…" : "Post response"}
                  </button>
                </div>
              </div>
            ) : discussion.status === "locked" ? (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
                🔒 This discussion is locked and no longer accepting responses.
              </div>
            ) : (
              <div className="mb-4 px-4 py-3 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E8E3DB" }}>
                <span style={{ fontSize: 13, color: "#6B7280" }}>
                  <Link href="/login" style={{ color: "#2E6DA4", fontWeight: 600 }} className="hover:underline">Log in</Link>
                  {" "}or{" "}
                  <Link href="/signup" style={{ color: "#2E6DA4", fontWeight: 600 }} className="hover:underline">sign up</Link>
                  {" "}to join the discussion.
                </span>
              </div>
            )}

            {/* Response list */}
            {responsesLoading ? (
              <div className="space-y-2.5">
                {[1, 2].map((i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" style={{ border: "1px solid #E8E3DB" }} />)}
              </div>
            ) : responses.length === 0 ? (
              <div className="rounded-xl p-10 text-center" style={{ border: "1px dashed #D1C9BC" }}>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>No responses yet. Be the first to contribute.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {responses.map((r) => (
                  <ResponseCard
                    key={r.id}
                    response={r}
                    isMostUseful={r.id === mostUsefulId && r.useful_count > 0}
                    currentUserId={user?.id}
                    canVote={!!user && !!user.email_verified}
                    isGuest={!user}
                    onAuthRequired={() => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)}
                    onUpdated={handleResponseUpdated}
                    onDeleted={handleResponseDeleted}
                    onVoted={handleResponseVoted}
                  />
                ))}
              </div>
            )}

            {/* Response pagination */}
            {responseTotalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button onClick={() => setResponsePage((p) => Math.max(1, p - 1))} disabled={responsePage === 1} className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-30" style={{ borderColor: "#E8E3DB", color: "#6B7280" }}>←</button>
                {Array.from({ length: responseTotalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setResponsePage(n)} className="px-3 py-1.5 rounded-lg text-xs border" style={{ background: n === responsePage ? "#1A3C5E" : "#FFFFFF", color: n === responsePage ? "#FFFFFF" : "#6B7280", borderColor: n === responsePage ? "#1A3C5E" : "#E8E3DB" }}>{n}</button>
                ))}
                <button onClick={() => setResponsePage((p) => Math.min(responseTotalPages, p + 1))} disabled={responsePage === responseTotalPages} className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-30" style={{ borderColor: "#E8E3DB", color: "#6B7280" }}>→</button>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4 shrink-0">

            {/* Subject card */}
            <section className="bg-white rounded-xl px-4 py-4" style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.14em] mb-3">Subject</p>
              <Link href={`/subjects/${discussion.subject.slug}`} className="group block">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1A3C5E" }} className="group-hover:text-[#2E6DA4] transition-colors mb-1">
                  {discussion.subject.title} →
                </p>
              </Link>
            </section>

            {/* Thread stats */}
            <section className="bg-white rounded-xl px-4 py-4" style={{ border: "1px solid #E8E3DB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.14em] mb-3">Thread stats</p>
              <div className="divide-y" style={{ borderColor: "#F0EDE8" }}>
                {[
                  { label: "Responses", value: discussion.response_count },
                  { label: "Useful votes", value: discussion.useful_count },
                  { label: "Posted", value: timeAgo(discussion.created_at) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2">
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1A3C5E" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Guest CTA */}
            {!user && (
              <section className="rounded-xl px-4 py-4" style={{ background: "#1A3C5E" }}>
                <p className="text-sm font-bold text-white mb-1.5">Join the discussion</p>
                <p className="text-white/50 text-xs leading-relaxed mb-3">Log in or create an account to respond and vote.</p>
                <Link href="/signup" className="block text-center bg-white text-[#1A3C5E] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white/92 transition-colors mb-1.5">Create account</Link>
                <Link href="/login" className="block text-center text-white/40 hover:text-white/70 text-xs transition-colors">Already a member? Log in</Link>
              </section>
            )}
          </div>
        </div>
      </div>

      {reportingDiscussion && (
        <ReportModal targetType="discussion" targetId={discussion.id} onClose={() => setReportingDiscussion(false)} />
      )}
    </main>
  );
}