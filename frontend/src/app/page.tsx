// frontend/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type FeedData } from "@/lib/api";

export default function HomePage() {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.feed.get().then((res) => {
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-[#1A3C5E] py-14 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Come to understand a subject through community insight.
        </h1>
        <p className="text-white/60 text-base max-w-lg mx-auto">
          Explore subjects, join discussions, and learn from the Cameroonian
          community.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {loading && (
          <p className="text-center text-gray-400 py-16">Loading…</p>
        )}

        {!loading && error && (
          <p className="text-center text-red-500 py-16">{error}</p>
        )}

        {!loading && !error && data && (
          <>
            {/* Featured subjects */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1A3C5E]">
                  Featured Subjects
                </h2>
                <Link
                  href="/subjects"
                  className="text-sm text-[#2E6DA4] hover:underline"
                >
                  Browse all →
                </Link>
              </div>

              {data.featured_subjects.length === 0 ? (
                <p className="text-gray-400 text-sm">No subjects yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.featured_subjects.map((subject) => (
                    <Link
                      key={subject.id}
                      href={`/subjects/${subject.slug}`}
                      className="bg-white border border-gray-200 rounded-lg px-4 py-4 hover:border-[#2E6DA4] hover:shadow-sm transition-all"
                    >
                      <p className="font-semibold text-[#1A3C5E] truncate">
                        {subject.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {subject.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {subject.discussion_count}{" "}
                        {subject.discussion_count === 1
                          ? "discussion"
                          : "discussions"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Recent discussions */}
            <section>
              <h2 className="text-lg font-semibold text-[#1A3C5E] mb-4">
                Recent Discussions
              </h2>

              {data.recent_discussions.length === 0 ? (
                <p className="text-gray-400 text-sm">No discussions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recent_discussions.map((discussion) => (
                    <li key={discussion.id}>
                      <Link
                        href={`/discussions/${discussion.id}`}
                        className="flex items-start justify-between gap-4 bg-white border border-gray-200 rounded-lg px-5 py-4 hover:border-[#2E6DA4] hover:shadow-sm transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1A3C5E] truncate">
                            {discussion.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="text-[#2E6DA4]">{discussion.subject.title}</span>
                            {" · "}
                            {discussion.author.username}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-xs text-gray-400 whitespace-nowrap pt-0.5 space-y-0.5">
                          <p>{discussion.useful_count} useful</p>
                          <p>{discussion.response_count} responses</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}