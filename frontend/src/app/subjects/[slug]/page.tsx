"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type SubjectDetail } from "@/lib/api";

export default function SubjectPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.subjects.get(slug).then((res) => {
      if (res.success) {
        setSubject(res.data);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  if (error || !subject) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error ?? "Subject not found."}</p>
        <Link href="/" className="text-sm text-[#2E6DA4] underline">
          ← Back to subjects
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Subject header */}
      <section className="bg-[#1A3C5E] px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm text-white/50 hover:text-white mb-5 inline-block transition-colors"
          >
            ← All subjects
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{subject.title}</h1>
          <p className="text-white/70 max-w-xl">{subject.description}</p>
          <p className="text-white/40 text-sm mt-3">
            {subject.discussion_count}{" "}
            {subject.discussion_count === 1 ? "discussion" : "discussions"}
          </p>
        </div>
      </section>

      {/* Discussions — Phase 3 */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1A3C5E]">Discussions</h2>
          <Link
            href={`/subjects/${slug}/discussions/new`}
            className="px-4 py-2 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90 transition-opacity"
          >
            Start a discussion
          </Link>
        </div>

        <div className="border border-dashed border-gray-300 rounded-lg p-14 text-center">
          <p className="text-gray-400 font-medium mb-1">No discussions yet</p>
          <p className="text-gray-300 text-sm">Be the first to start one.</p>
        </div>
      </section>
    </main>
  );
}