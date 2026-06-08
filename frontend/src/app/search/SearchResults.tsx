"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, type SearchData } from "@/lib/api";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setError(null);
    setData(null);
    api.search.query(q).then((res) => {
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
  }, [q]);

  const hasResults =
    data && (data.total_subjects > 0 || data.total_discussions > 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          {q ? (
            <h1 className="text-xl font-semibold text-[#1A3C5E]">
              Results for{" "}
              <span className="text-[#2E6DA4]">&ldquo;{q}&rdquo;</span>
            </h1>
          ) : (
            <h1 className="text-xl font-semibold text-[#1A3C5E]">Search</h1>
          )}
        </div>

        {/* No query */}
        {!q && (
          <div className="text-center py-16">
            <p className="text-gray-400">
              Enter a search term in the bar above.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-[#2E6DA4] hover:underline"
            >
              ← Browse subjects
            </Link>
          </div>
        )}

        {/* Loading */}
        {q && loading && (
          <p className="text-center text-gray-400 py-16">Searching…</p>
        )}

        {/* Error */}
        {q && !loading && error && (
          <p className="text-center text-red-500 py-16">{error}</p>
        )}

        {/* No results */}
        {q && !loading && !error && data && !hasResults && (
          <div className="text-center py-16">
            <p className="text-gray-500">
              No results for &ldquo;{q}&rdquo;.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-[#2E6DA4] hover:underline"
            >
              ← Browse subjects
            </Link>
          </div>
        )}

        {/* Results */}
        {q && !loading && !error && data && hasResults && (
          <div className="space-y-10">
            {/* Subjects */}
            {data.subjects.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Subjects ({data.total_subjects})
                </h2>
                <ul className="space-y-2">
                  {data.subjects.map((subject) => (
                    <li key={subject.id}>
                      <Link
                        href={`/subjects/${subject.slug}`}
                        className="flex items-start justify-between gap-4 bg-white border border-gray-200 rounded-lg px-5 py-4 hover:border-[#2E6DA4] hover:shadow-sm transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1A3C5E] truncate">
                            {subject.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {subject.description}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap pt-0.5">
                          {subject.discussion_count}{" "}
                          {subject.discussion_count === 1
                            ? "discussion"
                            : "discussions"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Discussions */}
            {data.discussions.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Discussions ({data.total_discussions})
                </h2>
                <ul className="space-y-2">
                  {data.discussions.map((discussion) => (
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
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}