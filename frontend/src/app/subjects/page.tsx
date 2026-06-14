"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type SubjectListItem, type SubjectListData } from "@/lib/api";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

export default function SubjectsPage() {
  const [data, setData] = useState<SubjectListData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setData(null);   
    setError(null);
    api.subjects.list(page, 6).then((res) => {
      if (res.success) setData(res.data);
      else setError(res.error.message);
      setLoading(false);
    });
  }, [page]);

  const startIndex = (page - 1) * 6;

  return (
    <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>

      {/* Page header */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border-soft, #E8E4DC)" }}>
        <div className="px-8 py-6">
          <h1 className="text-2xl font-medium" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
            All Subjects
          </h1>
          {data && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
              {data.pagination.total} active {data.pagination.total === 1 ? "subject" : "subjects"} · organized knowledge areas
            </p>
          )}
        </div>
      </div>

      <div className="px-8 py-8">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-44 animate-pulse rounded-[10px]" style={{ border: "1px solid var(--border-soft, #E8E4DC)", background: "#fff" }} />
            ))}
          </div>
        )}

        {!loading && error && <p className="py-16 text-center text-sm" style={{ color: "var(--red, #A82020)" }}>{error}</p>}
        {!loading && !error && data?.items.length === 0 && <p className="py-16 text-center text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>No subjects yet.</p>}

        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.items.map((subject: SubjectListItem, idx: number) => (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.slug}`}
                  className="group flex flex-col justify-between rounded-[10px] px-5 py-5 transition-all hover:border-[#A8C8E8]"
                  style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))", minHeight:180 }}
                >
                  <div>
                    <p className="mb-2.5 text-[10px]" style={{ fontFamily: mono, color: "#A8C8E8" }}>
                      {String(startIndex + idx + 1).padStart(2, "0")}
                    </p>
                    <p className="mb-1.5 text-[15px] font-medium leading-snug group-hover:text-[#1E5FA8] transition-colors" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
                      {subject.title}
                    </p>
                    <p className="line-clamp-3 text-xs leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                      {subject.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-soft, #E8E4DC)" }}>
                    <p className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                      {subject.discussion_count} discussions · {subject.response_count} responses
                    </p>
                    <span className="text-sm" style={{ color: "#A8C8E8" }}>→</span>
                  </div>
                </Link>
              ))}
            </div>

            {data.pagination.total_pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <PagBtn onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>←</PagBtn>
                {Array.from({ length: data.pagination.total_pages }, (_, i) => i+1).map(p => (
                  <PagBtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</PagBtn>
                ))}
                <PagBtn onClick={() => setPage(p => Math.min(data.pagination.total_pages, p+1))} disabled={page === data.pagination.total_pages}>→</PagBtn>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function PagBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  const mono = "'DM Mono', monospace";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded text-sm disabled:opacity-30"
      style={{
        fontFamily: mono,
        background: active ? "var(--blue, #1E5FA8)" : "#fff",
        color: active ? "#fff" : "var(--text-2, #3A4A5A)",
        border: active ? "1px solid var(--blue, #1E5FA8)" : "1px solid var(--border, #DDD8D0)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}