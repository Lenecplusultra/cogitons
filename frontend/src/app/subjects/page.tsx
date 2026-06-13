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
    api.subjects.list(page, 6).then((res) => {
      if (res.success) setData(res.data);
      else setError(res.error.message);
      setLoading(false);
    });
  }, [page]);

  const startIndex = (page - 1) * 6;

  return (
    <main className="min-h-screen" style={{ background: "#F5F2ED" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-[#1A3C5E] mb-1"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            All Subjects
          </h1>
          {data && (
            <p className="text-gray-400 text-sm">
              {data.pagination.total} active {data.pagination.total === 1 ? "subject" : "subjects"} · organized knowledge areas
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl h-44 animate-pulse" style={{ border: "1px solid #E8E3DB" }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-red-500 py-16">{error}</p>
        )}

        {!loading && !error && data?.items.length === 0 && (
          <p className="text-center text-gray-400 py-16">No subjects yet.</p>
        )}

        {/* Grid */}
        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.items.map((subject: SubjectListItem, idx: number) => (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.slug}`}
                  className="group bg-white rounded-xl px-5 py-5 flex flex-col justify-between transition-all"
                  style={{
                    border: "1px solid #E8E3DB",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    minHeight: 160,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2E6DA4";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#E8E3DB";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  }}
                >
                  {/* Card number */}
                  <div>
                    <p
                      className="mb-2"
                      style={{
                        fontSize: 11,
                        color: "#C9C2B8",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontWeight: 500,
                      }}
                    >
                      {String(startIndex + idx + 1).padStart(2, "0")}
                    </p>

                    {/* Title */}
                    <p
                      className="mb-2 group-hover:text-[#2E6DA4] transition-colors"
                      style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1A3C5E",
                        lineHeight: 1.3,
                      }}
                    >
                      {subject.title}
                    </p>

                    {/* Description */}
                    <p
                      className="line-clamp-3"
                      style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 }}
                    >
                      {subject.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid #F0EDE8" }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                      {subject.discussion_count}{" "}
                      {subject.discussion_count === 1 ? "discussion" : "discussions"}
                      {" · "}
                      {subject.response_count}{" "}
                      {subject.response_count === 1 ? "response" : "responses"}
                    </p>
                    <svg
                      className="text-gray-300 group-hover:text-[#2E6DA4] transition-colors"
                      style={{ width: 14, height: 14 }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: "#FFFFFF",
                    color: "#6B7280",
                    border: "1px solid #E8E3DB",
                  }}
                >
                  ←
                </button>
                {Array.from({ length: data.pagination.total_pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: p === page ? "#1A3C5E" : "#FFFFFF",
                      color: p === page ? "#FFFFFF" : "#6B7280",
                      border: p === page ? "1px solid #1A3C5E" : "1px solid #E8E3DB",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.total_pages, p + 1))}
                  disabled={page === data.pagination.total_pages}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: "#FFFFFF",
                    color: "#6B7280",
                    border: "1px solid #E8E3DB",
                  }}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}