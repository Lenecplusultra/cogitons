"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type SubjectDetail, type DiscussionCard } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type SortOption = "recent" | "most_useful";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  // Load subject once
  useEffect(() => {
    if (!slug) return;
    api.subjects.get(slug).then((res) => {
      if (res.success) {
        setSubject(res.data);
      } else {
        setError(res.error.message);
        setLoading(false);
      }
    });
  }, [slug]);

  // Load discussions whenever subject, sort, or page changes
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

  // Reset to page 1 when sort changes
  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    setPage(1);
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error}</p>
        <Link href="/" className="text-sm text-[#2E6DA4] underline">
          ← Back to subjects
        </Link>
      </main>
    );
  }

  if (!subject) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
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
            {total} {total === 1 ? "discussion" : "discussions"}
          </p>
        </div>
      </section>

      {/* Discussions */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        {/* Controls row */}
        <div className="flex items-center justify-between mb-6">
          {/* Sort tabs — issue #59 */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => handleSortChange("recent")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                sort === "recent"
                  ? "bg-[#1A3C5E] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => handleSortChange("most_useful")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                sort === "most_useful"
                  ? "bg-[#1A3C5E] text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Most Useful
            </button>
          </div>

          {/* Start discussion button — only for logged-in verified users */}
          {user && user.email_verified && (
            <Link
              href={`/subjects/${slug}/discussions/new`}
              className="px-4 py-2 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90 transition-opacity"
            >
              Start a discussion
            </Link>
          )}
        </div>

        {/* Discussion list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : discussions.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-14 text-center">
            <p className="text-gray-400 font-medium mb-1">No discussions yet</p>
            <p className="text-gray-300 text-sm">Be the first to start one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {discussions.map((d) => (
              <Link
                key={d.id}
                href={`/discussions/${d.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#2E6DA4] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1A3C5E] text-base leading-snug mb-1 truncate">
                      {d.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {d.author.username}
                      {d.edited && (
                        <span className="ml-2 text-xs text-gray-300">edited</span>
                      )}
                      <span className="mx-1">·</span>
                      {formatDate(d.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-4 shrink-0 text-sm text-gray-400 mt-0.5">
                    <span title="Useful votes">👍 {d.useful_count}</span>
                    <span title="Responses">💬 {d.response_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Numbered pagination — issue #60 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded text-sm border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                  n === page
                    ? "bg-[#1A3C5E] text-white border-[#1A3C5E]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded text-sm border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}