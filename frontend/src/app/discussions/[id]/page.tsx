"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, type DiscussionDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!discussion) return;
    if (!confirm("Delete this discussion? This cannot be undone.")) return;

    setDeleting(true);
    const res = await api.discussions.delete(discussion.id);
    setDeleting(false);

    if (res.success) {
      router.push(`/subjects/${discussion.subject.slug}`);
    } else {
      setError(res.error.message);
    }
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

      {/* Body */}
      <section className="max-w-3xl mx-auto px-4 py-8">
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

          {/* Stats row */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div className="flex gap-4 text-sm text-gray-400">
              <span>👍 {discussion.useful_count} useful</span>
              <span>💬 {discussion.response_count} responses</span>
            </div>

            {/* Owner controls — issue #58 */}
            {isOwner && (
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => { setEditing(false); setEditError(null); }}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-4 py-1.5 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-3 py-1.5 text-sm text-[#2E6DA4] hover:underline transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Responses placeholder — Phase 4 */}
        <div className="mt-8">
          <h2 className="text-base font-semibold text-[#1A3C5E] mb-4">
            Responses ({discussion.response_count})
          </h2>
          <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
            <p className="text-gray-400 text-sm">Responses coming in Phase 4.</p>
          </div>
        </div>
      </section>
    </main>
  );
}