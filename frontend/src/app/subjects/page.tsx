// frontend/src/app/subjects/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type SubjectListItem, type SubjectListData } from "@/lib/api";

export default function SubjectsPage() {
  const [data, setData] = useState<SubjectListData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.subjects.list(page).then((res) => {
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
  }, [page]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-[#1A3C5E] mb-6">
          All Subjects
        </h1>

        {loading && (
          <p className="text-center text-gray-400 py-16">Loading subjects…</p>
        )}

        {!loading && error && (
          <p className="text-center text-red-500 py-16">{error}</p>
        )}

        {!loading && !error && data?.items.length === 0 && (
          <p className="text-center text-gray-400 py-16">
            No subjects yet. Check back soon.
          </p>
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <>
            <ul className="space-y-3">
              {data.items.map((subject: SubjectListItem) => (
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
                    <span className="shrink-0 text-sm text-gray-400 whitespace-nowrap pt-0.5">
                      {subject.discussion_count}{" "}
                      {subject.discussion_count === 1
                        ? "discussion"
                        : "discussions"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {data.pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from(
                  { length: data.pagination.total_pages },
                  (_, i) => i + 1
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-[#2E6DA4] text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-[#2E6DA4]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}