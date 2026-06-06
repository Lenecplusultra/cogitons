"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function NewDiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in or not verified
  useEffect(() => {
    if (!authLoading && (!user || !user.email_verified)) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load subject id from slug
  useEffect(() => {
    if (!slug) return;
    api.subjects.get(slug).then((res) => {
      if (res.success) setSubjectId(res.data.id);
      else router.replace("/");
    });
  }, [slug, router]);

  async function handleSubmit() {
    if (!subjectId) return;
    if (!title.trim()) { setError("Title is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }

    setSubmitting(true);
    setError(null);

    const res = await api.discussions.create({
      subject_id: subjectId,
      title: title.trim(),
      body: body.trim(),
    });

    setSubmitting(false);

    if (res.success) {
      router.push(`/discussions/${res.data.id}`);
    } else {
      setError(res.error.message);
    }
  }

  if (authLoading || !subjectId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#1A3C5E] px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/subjects/${slug}`}
            className="text-sm text-white/50 hover:text-white mb-4 inline-block transition-colors"
          >
            ← Back to discussions
          </Link>
          <h1 className="text-2xl font-bold text-white">Start a discussion</h1>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-10">
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              placeholder="What do you want to discuss?"
              className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2E6DA4] transition-colors"
            />
            <p className="text-xs text-gray-300 mt-1 text-right">{title.length}/300</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Body <span className="text-red-400">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Share your question, insight, or perspective…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2E6DA4] transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Link
              href={`/subjects/${slug}`}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? "Posting…" : "Post discussion"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}