"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

export default function NewDiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [subjectTitle, setSubjectTitle] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.email_verified)) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!slug) return;
    api.subjects.get(slug).then((res) => {
      if (res.success) { setSubjectId(res.data.id); setSubjectTitle(res.data.title); }
      else router.replace("/");
    });
  }, [slug, router]);

  async function handleSubmit() {
    if (!subjectId) return;
    if (!title.trim()) { setError("Title is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    setSubmitting(true); setError(null);
    const res = await api.discussions.create({ subject_id: subjectId, title: title.trim(), body: body.trim() });
    setSubmitting(false);
    if (res.success) router.push(`/discussions/${res.data.id}`);
    else setError(res.error.message);
  }

  if (authLoading || !subjectId) {
    return <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--cream, #FAF8F5)" }}><p className="text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>Loading…</p></main>;
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>

      {/* Header */}
      <section style={{ background: "var(--navy, #0F2744)" }}>
        <div className="max-w-[680px] mx-auto px-6 py-8">
          <Link href={`/subjects/${slug}`} className="mb-3 inline-block text-[10px] uppercase tracking-[.05em] transition-colors hover:text-white/60" style={{ fontFamily: mono, color: "rgba(255,255,255,.3)" }}>
            ← {subjectTitle || "Back to discussions"}
          </Link>
          <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: serif }}>Start a discussion</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>Share a question, experience, or perspective under a subject.</p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-[680px] mx-auto px-6 py-8">
        {error && (
          <div className="mb-5 rounded-[8px] px-4 py-3 text-sm" style={{ background: "var(--red-bg, #FAE8E8)", border: "1px solid #E0A0A0", color: "var(--red, #A82020)" }}>
            {error}
          </div>
        )}

        <div className="rounded-[10px] p-6" style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}>

          {/* Subject indicator */}
          <div className="mb-5 rounded-[6px] px-3 py-2" style={{ background: "var(--cream, #FAF8F5)", border: "1px solid var(--border-soft, #E8E4DC)" }}>
            <p className="mb-0.5 text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>Subject</p>
            <p className="text-sm font-medium" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>📚 {subjectTitle}</p>
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
              Title <span style={{ color: "var(--red, #A82020)" }}>*</span>
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>A clear, specific title helps others find your discussion.</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              placeholder="What do you want to discuss?"
              className="w-full rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--text, #0F1A26)" }}
            />
            <p className="mt-1 text-right text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>{title.length}/300</p>
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
              Body <span style={{ color: "var(--red, #A82020)" }}>*</span>
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>Give context — the more specific you are, the more useful the responses will be.</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Share your question, insight, or perspective…"
              className="w-full resize-none rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--text, #0F1A26)" }}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link href={`/subjects/${slug}`} className="text-sm transition-colors" style={{ color: "var(--text-3, #6A7A8A)" }}>
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: "var(--blue, #1E5FA8)" }}
            >
              {submitting ? "Posting…" : "Post discussion →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}