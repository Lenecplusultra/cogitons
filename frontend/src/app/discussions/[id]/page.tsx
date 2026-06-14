"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, type DiscussionDetail, type ResponseItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ReportModal from "@/components/ReportModal";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

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
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div className="shrink-0 flex items-center justify-center rounded-full text-white font-semibold select-none"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

function ReportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] transition-colors hover:opacity-80"
      style={{ fontFamily: mono, color: "var(--red, #A82020)" }}
    >
      🚩 Report
    </button>
  );
}

function UsefulPill({ voted, count, onClick, disabled }: { voted: boolean; count: number; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all disabled:opacity-60"
      style={{
        fontFamily: mono,
        background: voted ? "var(--green-bg, #E8F5EE)" : "transparent",
        color: voted ? "var(--green, #1A6645)" : "var(--text-3, #6A7A8A)",
        border: voted ? "1px solid #9ACAB0" : "1px solid var(--border, #DDD8D0)",
      }}
    >
      <span style={{ color: "var(--green, #1A6645)" }}>✓</span>
      {count > 0 ? `Useful · ${count}` : "Useful"}
    </button>
  );
}

// ── Collapsible response composer ─────────────────────────────────────────────
function ResponseComposer({
  user,
  value,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  user: { username: string } | null;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="mb-4 rounded-[10px] overflow-hidden transition-all"
      style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
    >
      {!expanded ? (
        // Collapsed: single bar
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--cream,#FAF8F5)]"
        >
          <Avatar name={user?.username ?? "?"} size={28} />
          <span className="text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>
            Share your insight or perspective…
          </span>
        </button>
      ) : (
        // Expanded: full composer
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Avatar name={user?.username ?? "?"} size={24} />
            <span className="text-xs font-medium" style={{ color: "var(--text-2, #3A4A5A)" }}>
              {user?.username}
            </span>
          </div>
          {error && (
            <p className="mb-3 rounded-[6px] px-3 py-2 text-xs" style={{ background: "var(--red-bg, #FAE8E8)", color: "var(--red, #A82020)" }}>
              {error}
            </p>
          )}
          <textarea
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            placeholder="Share your insight or perspective…"
            className="w-full resize-none rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--text, #0F1A26)" }}
          />
          <div className="mt-3 flex items-center justify-end gap-3">
            <button
              onClick={() => { setExpanded(false); onChange(""); }}
              className="text-xs"
              style={{ color: "var(--text-3, #6A7A8A)" }}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-full px-4 py-2 text-xs font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: "var(--blue, #1E5FA8)" }}
            >
              {submitting ? "Posting…" : "Post response →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Response card ─────────────────────────────────────────────────────────────
function ResponseCard({
  response, isMostUseful, currentUserId, canVote, isGuest,
  onAuthRequired, onUpdated, onDeleted, onVoted,
}: {
  response: ResponseItem; isMostUseful: boolean; currentUserId: string | undefined;
  canVote: boolean; isGuest: boolean; onAuthRequired: () => void;
  onUpdated: (id: string, body: string) => void; onDeleted: (id: string) => void;
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
      className="rounded-[10px] px-6 py-5"
      style={{
        background: "#fff",
        border: "1px solid var(--border-soft, #E8E4DC)",
        borderLeft: isMostUseful ? "3px solid var(--blue, #1E5FA8)" : "1px solid var(--border-soft, #E8E4DC)",
        boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={response.author.username} size={26} />
          <Link href={`/profile/${response.author.username}`} className="text-xs font-medium hover:underline" style={{ color: "var(--text-2, #3A4A5A)" }}>
            {response.author.username}
          </Link>
          {isMostUseful && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ fontFamily: mono, background: "var(--sky, #E8F0F7)", color: "var(--blue, #1E5FA8)" }}>
              ✓ Most useful
            </span>
          )}
          {response.edited && <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>edited</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>{timeAgo(response.created_at)}</span>
          {isOwner && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="text-[11px] hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>Edit</button>
              <button onClick={handleDelete} disabled={deleting} className="text-[11px] hover:underline disabled:opacity-50" style={{ color: "var(--red, #A82020)" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>

      {editError && <p className="mb-3 rounded-[6px] px-3 py-2 text-xs" style={{ background: "var(--red-bg, #FAE8E8)", color: "var(--red, #A82020)" }}>{editError}</p>}

      {editing ? (
        <>
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={5}
            className="mb-2 w-full resize-none rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ border: "1px solid var(--border, #DDD8D0)" }}
          />
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => { setEditing(false); setEditBody(response.body); setEditError(null); }} className="text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-full px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: "var(--blue, #1E5FA8)" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      ) : (
        <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text, #0F1A26)" }}>{response.body}</p>
      )}

      <div className="flex items-center gap-3">
        <UsefulPill voted={response.current_user_voted} count={response.useful_count} onClick={handleVote} disabled={voting} />
        {!isOwner && !isGuest && <ReportBtn onClick={() => setReporting(true)} />}
      </div>

      {reporting && <ReportModal targetType="response" targetId={response.id} onClose={() => setReporting(false)} />}
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
  const [related, setRelated] = useState<Array<{ id: string; title: string; useful_count: number; response_count: number }>>([]);

  useEffect(() => {
    if (!id) return;
    api.discussions.get(id).then((res) => {
      if (res.success) { setDiscussion(res.data); setEditTitle(res.data.title); setEditBody(res.data.body); }
      else setError(res.error.message);
      setLoading(false);
    });
    // Load related async — doesn't block the main thread
    api.discussions.related(id).then((res) => {
      if (res.success) setRelated(res.data);
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
    if (res.success) { setDiscussion(p => p ? { ...p, title: res.data.title, body: res.data.body, edited: true } : p); setEditing(false); }
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
    if (res.success) setDiscussion(p => p ? { ...p, useful_count: res.data.useful_count, current_user_voted: res.data.voted } : p);
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
      setDiscussion(p => p ? { ...p, response_count: p.response_count + 1 } : p);
    } else setResponseError(res.error.message);
  }

  if (authLoading || loading) {
    return <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--cream, #FAF8F5)" }}><p className="text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>Loading…</p></main>;
  }
  if (error || !discussion) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "var(--cream, #FAF8F5)" }}><p style={{ color: "var(--text-3, #6A7A8A)" }}>{error ?? "Discussion not found."}</p><Link href="/" className="text-sm hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>← Back</Link></main>;
  }

  const isOwner = user?.id === discussion.author.id;
  const canRespond = !!user && user.email_verified && discussion.status !== "locked";
  const mostUsefulId = responses.length > 0 ? responses.reduce((a, b) => a.useful_count >= b.useful_count ? a : b).id : null;

  // Subject description — may not be on the type yet, cast safely
  const subjectDesc = (discussion.subject as unknown as { description?: string }).description;

  return (
    <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">

          {/* ── Main ── */}
          <div className="min-w-0">
            <Link
              href={`/subjects/${discussion.subject.slug}`}
              className="mb-5 inline-block text-[10px] uppercase tracking-[.05em] hover:underline"
              style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}
            >
              ← {discussion.subject.title}
            </Link>

            {/* OP card */}
            <div
              className="mb-5 rounded-[10px] px-7 py-6"
              style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
            >
              {editing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={300}
                  className="mb-3 w-full rounded-[6px] px-3 py-2 text-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ fontFamily: serif, fontWeight: 600, color: "var(--navy, #0F2744)", border: "1px solid var(--border, #DDD8D0)" }}
                />
              ) : (
                <h1 className="mb-5 text-xl font-semibold leading-snug" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                  {discussion.title}
                </h1>
              )}

              <div className="mb-5 flex items-center gap-2 border-b pb-4" style={{ borderColor: "var(--border-soft, #E8E4DC)" }}>
                <Avatar name={discussion.author.username} size={26} />
                <Link href={`/profile/${discussion.author.username}`} className="text-xs font-medium hover:underline" style={{ color: "var(--text-2, #3A4A5A)" }}>
                  {discussion.author.username}
                </Link>
                <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                  · Posted {timeAgo(discussion.created_at)}
                </span>
                {discussion.edited && (
                  <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>· edited</span>
                )}
              </div>

              {editError && (
                <p className="mb-3 rounded-[6px] px-3 py-2 text-sm" style={{ background: "var(--red-bg, #FAE8E8)", color: "var(--red, #A82020)" }}>{editError}</p>
              )}

              {editing ? (
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={10}
                  className="mb-3 w-full resize-none rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1px solid var(--border, #DDD8D0)" }}
                />
              ) : (
                <p className="mb-6 whitespace-pre-wrap text-sm leading-loose" style={{ color: "var(--text, #0F1A26)" }}>
                  {discussion.body}
                </p>
              )}

              <div className="flex items-center gap-3">
                <UsefulPill
                  voted={discussion.current_user_voted}
                  count={discussion.useful_count}
                  onClick={handleDiscussionVote}
                  disabled={discussionVoting}
                />
                {user && !isOwner && <ReportBtn onClick={() => setReportingDiscussion(true)} />}
                {isOwner && !editing && (
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => setEditing(true)} className="text-xs hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>Edit</button>
                    <button onClick={handleDeleteDiscussion} disabled={deleting} className="text-xs hover:underline disabled:opacity-50" style={{ color: "var(--red, #A82020)" }}>
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
                {editing && (
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => { setEditing(false); setEditError(null); }} className="text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>Cancel</button>
                    <button onClick={handleSaveEdit} disabled={saving} className="rounded-full px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: "var(--blue, #1E5FA8)" }}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Responses header */}
            <p className="mb-4 text-[10px] uppercase tracking-[.12em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
              {discussion.response_count} Response{discussion.response_count !== 1 ? "s" : ""}
            </p>

            {/* Response composer */}
            {canRespond && (
              <ResponseComposer
                user={user}
                value={newResponseBody}
                onChange={setNewResponseBody}
                onSubmit={handleSubmitResponse}
                submitting={submittingResponse}
                error={responseError}
              />
            )}

            {!canRespond && discussion.status === "locked" && (
              <div className="mb-4 rounded-[10px] px-4 py-3 text-sm" style={{ background: "var(--amber-bg, #FFF5E0)", border: "1px solid #E0C070", color: "var(--amber, #7A5010)" }}>
                🔒 This discussion is locked and no longer accepting responses.
              </div>
            )}

            {!canRespond && discussion.status !== "locked" && !user && (
              <div className="mb-4 rounded-[10px] px-5 py-4" style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)" }}>
                <span className="text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
                  <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>Log in</Link>
                  {" "}or{" "}
                  <Link href="/signup" className="font-medium hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>sign up</Link>
                  {" "}to join the discussion.
                </span>
              </div>
            )}

            {/* Response list */}
            {responsesLoading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-28 animate-pulse rounded-[10px]" style={{ border: "1px solid var(--border-soft, #E8E4DC)", background: "#fff" }} />)}
              </div>
            ) : responses.length === 0 ? (
              <div className="rounded-[10px] p-10 text-center text-sm" style={{ border: "1px dashed var(--border, #DDD8D0)", color: "var(--text-4, #9AAABB)" }}>
                No responses yet. Be the first to contribute.
              </div>
            ) : (
              <div className="space-y-3">
                {responses.map(r => (
                  <ResponseCard
                    key={r.id}
                    response={r}
                    isMostUseful={r.id === mostUsefulId && r.useful_count > 0}
                    currentUserId={user?.id}
                    canVote={!!user && !!user.email_verified}
                    isGuest={!user}
                    onAuthRequired={() => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)}
                    onUpdated={(rid, body) => setResponses(p => p.map(r => r.id === rid ? { ...r, body, edited: true } : r))}
                    onDeleted={(rid) => { setResponses(p => p.filter(r => r.id !== rid)); setDiscussion(p => p ? { ...p, response_count: Math.max(0, p.response_count - 1) } : p); }}
                    onVoted={(rid, voted, useful_count) => setResponses(p => p.map(r => r.id === rid ? { ...r, current_user_voted: voted, useful_count } : r))}
                  />
                ))}
              </div>
            )}

            {responseTotalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <PagBtn onClick={() => setResponsePage(p => Math.max(1, p-1))} disabled={responsePage === 1}>←</PagBtn>
                {Array.from({ length: responseTotalPages }, (_, i) => i+1).map(n => (
                  <PagBtn key={n} onClick={() => setResponsePage(n)} active={n === responsePage}>{n}</PagBtn>
                ))}
                <PagBtn onClick={() => setResponsePage(p => Math.min(responseTotalPages, p+1))} disabled={responsePage === responseTotalPages}>→</PagBtn>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">
            {/* Subject card — with description */}
            <div
              className="rounded-[10px] p-5"
              style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
            >
              <p className="mb-3 text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>Subject</p>
              <Link href={`/subjects/${discussion.subject.slug}`} className="group block mb-2">
                <p className="text-sm font-medium transition-colors group-hover:text-[#1E5FA8]" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                  {discussion.subject.title} →
                </p>
              </Link>
              {subjectDesc && (
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                  {subjectDesc}
                </p>
              )}
            </div>

            {/* Thread stats */}
            <div
              className="rounded-[10px] p-5"
              style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
            >
              <p className="mb-3 text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>Thread stats</p>
              {[
                { label: "Responses", value: discussion.response_count },
                { label: "Useful votes", value: discussion.useful_count },
                { label: "Posted", value: timeAgo(discussion.created_at) },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft, #E8E4DC)" : "none" }}
                >
                  <span className="text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>{row.label}</span>
                  <span className="text-xs font-medium" style={{ fontFamily: mono, color: "var(--navy, #0F2744)" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Related discussions */}
            {related.length > 0 && (
              <div
                className="rounded-[10px] p-5"
                style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
              >
                <p className="mb-3 text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
                  Related discussions
                </p>
                {related.map((r, i, arr) => (
                  <Link
                    key={r.id}
                    href={`/discussions/${r.id}`}
                    className="group block py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft, #E8E4DC)" : "none" }}
                  >
                    <p className="mb-1 text-xs font-medium leading-snug transition-colors group-hover:text-[#1E5FA8]" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                      {r.title}
                    </p>
                    <p className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                      ✓ {r.useful_count} useful · {r.response_count} responses
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {/* Guest CTA */}
            {!user && (
              <div className="rounded-[10px] p-5" style={{ background: "var(--navy, #0F2744)" }}>
                <p className="mb-1.5 text-sm font-medium text-white" style={{ fontFamily: serif }}>Join the discussion</p>
                <p className="mb-4 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,.5)" }}>
                  Log in or create an account to respond and vote.
                </p>
                <Link href="/signup" className="mb-2 block rounded-full bg-white py-2 text-center text-xs font-medium hover:opacity-90" style={{ color: "var(--navy, #0F2744)" }}>
                  Create account
                </Link>
                <Link href="/login" className="block text-center text-[10px] transition-colors hover:text-white" style={{ color: "rgba(255,255,255,.35)" }}>
                  Already a member? Log in
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>

      {reportingDiscussion && (
        <ReportModal targetType="discussion" targetId={discussion.id} onClose={() => setReportingDiscussion(false)} />
      )}
    </main>
  );
}

function PagBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded text-sm disabled:opacity-30"
      style={{
        fontFamily: mono,
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