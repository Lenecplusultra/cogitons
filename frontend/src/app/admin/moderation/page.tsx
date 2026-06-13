// frontend/src/app/admin/moderation/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type ReportQueueItem, type ReportContext } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type StatusFilter = "pending" | "dismissed" | "actioned";

function ReportCard({
  report,
  onAction,
}: {
  report: ReportQueueItem;
  onAction: () => void;
}) {
  const [context, setContext] = useState<ReportContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.moderation.getReportContext(report.id).then((res) => {
      if (res.success) setContext(res.data);
      setContextLoading(false);
    });
  }, [report.id]);

  async function handleDismiss() {
    setActionLoading(true);
    await api.moderation.dismissReport(report.id, notes);
    setActionLoading(false);
    onAction();
  }

  async function handleRemove() {
    if (!confirm("Remove this content? It will be hidden from all users.")) return;
    setActionLoading(true);
    await api.moderation.removeContent({
      target_type: report.target_type,
      target_id: report.target_id,
      report_id: report.id,
      notes,
    });
    setActionLoading(false);
    onAction();
  }

  async function handleLock() {
    setActionLoading(true);
    await api.moderation.lockDiscussion(
      context?.discussion_id ?? report.target_id,
      { report_id: report.id, notes }
    );
    setActionLoading(false);
    onAction();
  }

  async function handleUnlock() {
    setActionLoading(true);
    await api.moderation.unlockDiscussion(
      context?.discussion_id ?? report.target_id,
      { notes }
    );
    setActionLoading(false);
    onAction();
  }

  const contextLink = context?.found && context.discussion_id
    ? `/discussions/${context.discussion_id}${context.anchor ? `#${context.anchor}` : ""}`
    : null;

  const isPending = report.status === "pending";
  const isRemoved = context?.status === "removed";
  const isLocked = context?.status === "locked";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-500 bg-red-50 px-2 py-0.5 rounded">
              {report.reason.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded">
              {report.target_type}
            </span>
            {isRemoved && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                removed
              </span>
            )}
            {isLocked && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                locked
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Reported by{" "}
            <Link
              href={`/profile/${report.reporter.username}`}
              className="font-medium text-gray-700 hover:text-[#2E6DA4] transition-colors"
            >
              {report.reporter.username}
            </Link>
            {" · "}
            {new Date(report.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {report.details && (
            <p className="text-sm text-gray-600 mt-1 italic">
              &ldquo;{report.details}&rdquo;
            </p>
          )}
        </div>

        {contextLink && (
          <Link
            href={contextLink}
            className="shrink-0 text-xs text-[#2E6DA4] hover:underline"
            target="_blank"
          >
            View in context ↗
          </Link>
        )}
      </div>

      {/* Content preview */}
      <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        {contextLoading ? (
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        ) : !context?.found ? (
          <p className="text-xs text-gray-400 italic">Content no longer exists.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium">
                {context.target_type === "response" ? "Response" : "Discussion"} by{" "}
                <Link
                  href={`/profile/${context.author}`}
                  className="text-gray-600 hover:text-[#2E6DA4] transition-colors"
                >
                  {context.author}
                </Link>
              </p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
              {context.body}
            </p>
          </>
        )}
      </div>

      {/* Action taken (for dismissed/actioned) */}
      {context?.action_taken && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 space-y-0.5">
          <p>
            <span className="font-semibold capitalize">
              {context.action_taken.action}
            </span>
            {" · "}by {context.action_taken.admin}
            {" · "}
            {new Date(context.action_taken.at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {context.action_taken.notes && (
            <p className="text-blue-600 italic">
              &ldquo;{context.action_taken.notes}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Actions — only for pending reports */}
      {/* Notes + actions — pending reports get full controls, actioned get unlock only */}
      {(isPending || isLocked) && (
        <>
          {isPending && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Admin notes (optional)…"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#2E6DA4] resize-none mb-3"
            />
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {isPending && (
              <>
                <button
                  onClick={handleDismiss}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded border border-gray-200 text-xs text-gray-600 hover:border-gray-400 disabled:opacity-50 transition-colors"
                >
                  Dismiss
                </button>

                <button
                  onClick={handleRemove}
                  disabled={actionLoading || !context?.found || isRemoved}
                  className="px-3 py-1.5 rounded border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {isRemoved ? "Already removed" : "Remove content"}
                </button>
              </>
            )}

            {report.target_type === "discussion" && !isRemoved && (
              isLocked ? (
                <button
                  onClick={handleUnlock}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded border border-green-200 text-xs text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                >
                  Unlock discussion
                </button>
              ) : isPending ? (
                <button
                  onClick={handleLock}
                  disabled={actionLoading || !context?.found}
                  className="px-3 py-1.5 rounded border border-amber-200 text-xs text-amber-600 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                >
                  Lock discussion
                </button>
              ) : null
            )}

            {actionLoading && (
              <span className="text-xs text-gray-400">Processing…</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<ReportQueueItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const load = (p: number, s: StatusFilter) => {
    setLoading(true);
    api.moderation.listReports(s, p).then((res) => {
      if (res.success) {
        setItems(res.data.items);
        setTotalPages(res.data.pagination.total_pages);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(page, statusFilter); }, [page, statusFilter]); // eslint-disable-line

  if (authLoading || !user) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-[#1A3C5E] px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Moderation Queue</h1>
            <p className="text-white/50 text-sm mt-1">Admin</p>
          </div>
          <Link
            href="/admin/subjects"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            ← Subjects
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          {(["pending", "dismissed", "actioned"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-[#1A3C5E] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#2E6DA4]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
            <p className="text-gray-400">No {statusFilter} reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onAction={() => load(page, statusFilter)}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
      </div>
    </main>
  );
}