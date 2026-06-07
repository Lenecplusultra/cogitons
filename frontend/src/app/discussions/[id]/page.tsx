"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, type DiscussionDetail, type ResponseItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Response card ─────────────────────────────────────────────────────────────

function ResponseCard({
  response,
  currentUserId,
  canVote,
  onUpdated,
  onDeleted,
  onVoted,
}: {
  response: ResponseItem;
  currentUserId: string | undefined;
  canVote: boolean;
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

  async function handleSave() {
    if (!editBody.trim()) { setEditError("Body is required."); return; }
    setSaving(true);
    setEditError(null);
    const res = await api.responses.update(response.id, editBody.trim());
    setSaving(false);
    if (res.success) {
      onUpdated(response.id, res.data.body);
      setEditing(false);
    } else {
      setEditError(res.error.message);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this response?")) return;
    setDeleting(true);
    const res = await api.responses.delete(response.id);
    setDeleting(false);
    if (res.success) onDeleted(response.id);
  }

  async function handleVote() {
    if (!canVote) return;
    setVoting(true);
    const res = await api.responses.vote(response.id);
    setVoting(false);
    if (res.success) onVoted(response.id, res.data.voted, res.data.useful_count);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{response.author.username}</span>
          <span>·</span>
          <span>{formatDate(response.created_at)}</span>
          {response.edited && (
            <span className="text-xs text-gray-300">edited</span>
          )}
        </div>
        {isOwner && !editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[#2E6DA4] hover:underline"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </div>

      {editError && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {editError}
        </div>
      )}

      {editing ? (
        <>
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2E6DA4] transition-colors resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={() => { setEditing(false); setEditBody(response.body); setEditError(null); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded text-xs font-medium text-white bg-[#2E6DA4] hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {response.body}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={handleVote}
          disabled={!canVote || voting}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            response.current_user_voted
              ? "text-[#2E6DA4] font-medium"
              : canVote
              ? "text-gray-400 hover:text-[#2E6DA4]"
              : "text-gray-300 cursor-default"
          }`}
        >
          👍 {response.useful_count} useful
        </button>
      </div>
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

  // Discussion edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [discussionVoting, setDiscussionVoting] = useState(false);

  // Responses state
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [responsePage, setResponsePage] = useState(1);
  const [responseTotalPages, setResponseTotalPages] = useState(1);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [newResponseBody, setNewResponseBody] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);

  // Load discussion
  useEffect(() => {
    if (!id) return;
    api.discussions.get(id).then((res) => {
      if (res.success) {
        setDiscussion(res.data);
        setEditTitle(res.data.title);
        setEditBody(res.data.body);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
  }, [id]);

  // Load responses
  useEffect(() => {
    if (!id) return;
    setResponsesLoading(true);
    api.responses.list(id, responsePage).then((res) => {
      if (res.success) {
        setResponses(res.data.items);
        setResponseTotalPages(res.data.pagination.total_pages);
      }
      setResponsesLoading(false);
    });
  }, [id, responsePage]);

  async function handleSaveEdit() {
    if (!discussion) return;
    if (!editTitle.trim()) { setEditError("Title is required."); return; }
    if (!editBody.trim()) { setEditError("Body is required."); return; }
    setSaving(true);
    setEditError(null);
    const res = await api.discussions.update(discussion.id, {
      title: editTitle.trim(),
      body: editBody.trim(),
    });
    setSaving(false);
    if (res.success) {
      setDiscussion((prev) =>
        prev ? { ...prev, title: res.data.title, body: res.data.body, edited: true } : prev
      );
      setEditing(false);
    } else {
      setEditError(res.error.message);
    }
  }

  async function handleDeleteDiscussion() {
    if (!discussion) return;
    if (!confirm("Delete this discussion? All responses will also be deleted.")) return;
    setDeleting(true);
    const res = await api.discussions.delete(discussion.id);
    setDeleting(false);
    if (res.success) {
      router.push(`/subjects/${discussion.subject.slug}`);
    } else {
      setError(res.error.message);
    }
  }

  async function handleDiscussionVote() {
    if (!discussion || !user || !user.email_verified) return;
    setDiscussionVoting(true);
    const res = await api.discussions.vote(discussion.id);
    setDiscussionVoting(false);
    if (res.success) {
      setDiscussion((prev) =>
        prev
          ? { ...prev, useful_count: res.data.useful_count, current_user_voted: res.data.voted }
          : prev
      );
    }
  }

  async function handleSubmitResponse() {
    if (!newResponseBody.trim()) { setResponseError("Response cannot be empty."); return; }
    setSubmittingResponse(true);
    setResponseError(null);
    const res = await api.responses.create(id, newResponseBody.trim());
    setSubmittingResponse(false);
    if (res.success) {
      setNewResponseBody("");
      // Reload responses and update count
      const updated = await api.responses.list(id, responsePage);
      if (updated.success) {
        setResponses(updated.data.items);
        setResponseTotalPages(updated.data.pagination.total_pages);
      }
      setDiscussion((prev) =>
        prev ? { ...prev, response_count: prev.response_count + 1 } : prev
      );
    } else {
      setResponseError(res.error.message);
    }
  }

  function handleResponseUpdated(responseId: string, newBody: string) {
    setResponses((prev) =>
      prev.map((r) => r.id === responseId ? { ...r, body: newBody, edited: true } : r)
    );
  }

  function handleResponseDeleted(responseId: string) {
    setResponses((prev) => prev.filter((r) => r.id !== responseId));
    setDiscussion((prev) =>
      prev ? { ...prev, response_count: Math.max(0, prev.response_count - 1) } : prev
    );
  }

  function handleResponseVoted(responseId: string, voted: boolean, useful_count: number) {
    setResponses((prev) =>
      prev.map((r) =>
        r.id === responseId ? { ...r, current_user_voted: voted, useful_count } : r
      )
    );
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  if (error || !discussion) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error ?? "Discussion not found."}</p>
        <Link href="/" className="text-sm text-[#2E6DA4] underline">
          ← Back to subjects
        </Link>
      </main>
    );
  }

  const isOwner = user?.id === discussion.author.id;
  const canRespond = !!user && user.email_verified && discussion.status !== "locked";

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-[#1A3C5E] px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/subjects/${discussion.subject.slug}`}
            className="text-sm text-white/50 hover:text-white mb-4 inline-block transition-colors"
          >
            ← {discussion.subject.title}
          </Link>

          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={300}
              className="w-full px-3 py-2.5 rounded text-xl font-bold text-[#1A3C5E] focus:outline-none"
            />
          ) : (
            <h1 className="text-2xl font-bold text-white leading-snug">
              {discussion.title}
            </h1>
          )}

          <div className="flex items-center gap-2 mt-3 text-sm text-white/50">
            <span>{discussion.author.username}</span>
            <span>·</span>
            <span>{formatDate(discussion.created_at)}</span>
            {discussion.edited && (
              <span className="text-white/30 text-xs">edited</span>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-8">
        {/* Discussion body */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {editError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {editError}
            </div>
          )}

          {editing ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2E6DA4] transition-colors resize-none"
            />
          ) : (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {discussion.body}
            </p>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div className="flex gap-4 text-sm">
              <button
                onClick={handleDiscussionVote}
                disabled={!user || !user.email_verified || discussionVoting}
                className={`flex items-center gap-1.5 transition-colors ${
                  discussion.current_user_voted
                    ? "text-[#2E6DA4] font-medium"
                    : user && user.email_verified
                    ? "text-gray-400 hover:text-[#2E6DA4]"
                    : "text-gray-300 cursor-default"
                }`}
              >
                👍 {discussion.useful_count} useful
              </button>
              <span className="text-gray-400">💬 {discussion.response_count} responses</span>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => { setEditing(false); setEditError(null); }}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-4 py-1.5 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-3 py-1.5 text-sm text-[#2E6DA4] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteDiscussion}
                      disabled={deleting}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Responses section */}
        <div className="mt-8">
          <h2 className="text-base font-semibold text-[#1A3C5E] mb-4">
            Responses ({discussion.response_count})
          </h2>

          {/* Response form */}
          {canRespond && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
              {responseError && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {responseError}
                </div>
              )}
              <textarea
                value={newResponseBody}
                onChange={(e) => setNewResponseBody(e.target.value)}
                rows={4}
                placeholder="Share your insight or perspective…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2E6DA4] transition-colors resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSubmitResponse}
                  disabled={submittingResponse}
                  className="px-4 py-2 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submittingResponse ? "Posting…" : "Post response"}
                </button>
              </div>
            </div>
          )}

          {!user && (
            <div className="mb-5 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-500">
              <Link href="/login" className="text-[#2E6DA4] hover:underline">
                Log in
              </Link>{" "}
              to join the discussion.
            </div>
          )}

          {discussion.status === "locked" && (
            <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              This discussion is locked and no longer accepting responses.
            </div>
          )}

          {/* Response list */}
          {responsesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : responses.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
              <p className="text-gray-400 text-sm">No responses yet. Be the first to contribute.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((r) => (
                <ResponseCard
                  key={r.id}
                  response={r}
                  currentUserId={user?.id}
                  canVote={!!user && !!user.email_verified}
                  onUpdated={handleResponseUpdated}
                  onDeleted={handleResponseDeleted}
                  onVoted={handleResponseVoted}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {responseTotalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                onClick={() => setResponsePage((p) => Math.max(1, p - 1))}
                disabled={responsePage === 1}
                className="px-3 py-1.5 rounded text-sm border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ←
              </button>
              {Array.from({ length: responseTotalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setResponsePage(n)}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    n === responsePage
                      ? "bg-[#1A3C5E] text-white border-[#1A3C5E]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setResponsePage((p) => Math.min(responseTotalPages, p + 1))}
                disabled={responsePage === responseTotalPages}
                className="px-3 py-1.5 rounded text-sm border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}