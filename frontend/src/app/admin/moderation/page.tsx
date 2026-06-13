"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type ReportQueueItem, type ReportContext } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";
const ACTION_LABELS: Record<string, string> = {
  dismiss_report: "Report dismissed",
  remove_content: "Content removed",
  lock_discussion: "Discussion locked",
  unlock_discussion: "Discussion unlocked",
  suspend_user: "User suspended",
  restore_user: "User restored",
};

type StatusFilter = "pending" | "dismissed" | "actioned";

// ── Admin sidebar ─────────────────────────────────────────────────────────────
function AdminSidebar({ active }: { active: "reports" | "subjects" }) {
  return (
    <aside
      className="hidden md:flex w-[200px] shrink-0 flex-col"
      style={{ background: "#0F1520", minHeight: "100vh", position: "sticky", top: 0 }}
    >
      <div
        className="px-5 py-6 text-base italic text-white border-b"
        style={{ fontFamily: serif, borderColor: "rgba(255,255,255,.07)", color: "#AAC8E8" }}
      >
        Cogitons
        <span
          className="block text-[10px] not-italic mt-0.5"
          style={{ fontFamily: mono, color: "rgba(255,255,255,.25)", letterSpacing: ".08em" }}
        >
          Admin
        </span>
      </div>
      <nav className="mt-3 flex flex-col gap-0.5 px-2">
        <Link
          href="/admin/moderation"
          className="flex items-center gap-2 rounded px-3 py-2 text-xs transition-colors"
          style={{
            fontFamily: serif,
            color: active === "reports" ? "#AAC8E8" : "rgba(255,255,255,.45)",
            background: active === "reports" ? "rgba(170,200,232,.08)" : "transparent",
            borderLeft: active === "reports" ? "2px solid #AAC8E8" : "2px solid transparent",
            fontWeight: active === "reports" ? 500 : 400,
          }}
        >
          🚩 Reports
        </Link>
        <Link
          href="/admin/subjects"
          className="flex items-center gap-2 rounded px-3 py-2 text-xs transition-colors"
          style={{
            fontFamily: serif,
            color: active === "subjects" ? "#AAC8E8" : "rgba(255,255,255,.45)",
            background: active === "subjects" ? "rgba(170,200,232,.08)" : "transparent",
            borderLeft: active === "subjects" ? "2px solid #AAC8E8" : "2px solid transparent",
            fontWeight: active === "subjects" ? 500 : 400,
          }}
        >
          📚 Subjects
        </Link>
      </nav>
    </aside>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────
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

  const contextLink =
    context?.found && context.discussion_id
      ? `/discussions/${context.discussion_id}${context.anchor ? `#${context.anchor}` : ""}`
      : null;

  const isPending = report.status === "pending";
  const isRemoved = context?.status === "removed";
  const isLocked = context?.status === "locked";

  return (
    <div
      className="rounded-[10px] p-5"
      style={{
        background: "#fff",
        border: "1px solid var(--border-soft, #E8E4DC)",
        boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))",
      }}
    >
      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Target type badge */}
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{ fontFamily: mono, background: "var(--sky, #E8F0F7)", color: "var(--navy, #0F2744)" }}
            >
              {report.target_type}
            </span>
            {/* Reason badge */}
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={{ fontFamily: mono, background: "var(--red-bg, #FAE8E8)", color: "var(--red, #A82020)" }}
            >
              {report.reason.replace(/_/g, " ")}
            </span>
            {isRemoved && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px]"
                style={{ fontFamily: mono, background: "var(--cream-dark, #F0EDE8)", color: "var(--text-3, #6A7A8A)" }}
              >
                removed
              </span>
            )}
            {isLocked && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px]"
                style={{ fontFamily: mono, background: "var(--amber-bg, #FFF5E0)", color: "var(--amber, #7A5010)" }}
              >
                locked
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>
            Reported by{" "}
            <Link
              href={`/profile/${report.reporter.username}`}
              className="font-medium hover:underline"
              style={{ color: "var(--text-2, #3A4A5A)" }}
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
            <p className="text-sm italic" style={{ color: "var(--text-2, #3A4A5A)" }}>
              &ldquo;{report.details}&rdquo;
            </p>
          )}
        </div>
        {contextLink && (
          <Link
            href={contextLink}
            target="_blank"
            className="shrink-0 text-xs hover:underline"
            style={{ color: "var(--blue, #1E5FA8)" }}
          >
            View in context ↗
          </Link>
        )}
      </div>

      {/* Content preview */}
      <div
        className="mb-4 rounded-[8px] p-4"
        style={{ background: "var(--cream, #FAF8F5)", border: "1px solid var(--border-soft, #E8E4DC)" }}
      >
        {contextLoading ? (
          <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: "var(--border, #DDD8D0)" }} />
        ) : !context?.found ? (
          <p className="text-xs italic" style={{ color: "var(--text-4, #9AAABB)" }}>
            Content no longer exists.
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>
              {context.target_type === "response" ? "Response" : "Discussion"} by{" "}
              <Link
                href={`/profile/${context.author}`}
                className="hover:underline"
                style={{ color: "var(--text-2, #3A4A5A)" }}
              >
                {context.author}
              </Link>
            </p>
            <p
              className="line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed"
              style={{ color: "var(--text, #0F1A26)" }}
            >
              {context.body}
            </p>
          </>
        )}
      </div>

      {/* Action taken (dismissed / actioned) */}
      {context?.action_taken && (
        <div
          className="mb-4 rounded-[8px] px-4 py-3 text-xs"
          style={{ background: "var(--sky, #E8F0F7)", border: "1px solid var(--sky-mid, #C8DDEF)", color: "var(--navy, #0F2744)" }}
        >
          <p>
            <span className="font-semibold">
              {ACTION_LABELS[context.action_taken.action] ?? context.action_taken.action}
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
            <p className="mt-0.5 italic" style={{ color: "var(--blue, #1E5FA8)" }}>
              &ldquo;{context.action_taken.notes}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {(isPending || isLocked) && (
        <>
          {isPending && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Admin notes (optional)…"
              className="mb-3 w-full resize-none rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ border: "1px solid var(--border, #DDD8D0)", background: "#fff" }}
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {isPending && (
              <>
                <ActionBtn onClick={handleDismiss} disabled={actionLoading}>
                  Dismiss
                </ActionBtn>
                <ActionBtn
                  onClick={handleRemove}
                  disabled={actionLoading || !context?.found || isRemoved}
                  color="red"
                >
                  {isRemoved ? "Already removed" : "Remove content"}
                </ActionBtn>
              </>
            )}
            {report.target_type === "discussion" && !isRemoved && (
              isLocked ? (
                <ActionBtn onClick={handleUnlock} disabled={actionLoading} color="green">
                  Unlock discussion
                </ActionBtn>
              ) : isPending ? (
                <ActionBtn onClick={handleLock} disabled={actionLoading || !context?.found} color="amber">
                  Lock discussion
                </ActionBtn>
              ) : null
            )}
            {actionLoading && (
              <span className="text-xs" style={{ color: "var(--text-4, #9AAABB)" }}>
                Processing…
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  color = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: "default" | "red" | "green" | "amber";
}) {
  const styles: Record<string, { border: string; color: string; bg?: string }> = {
    default: { border: "var(--border, #DDD8D0)", color: "var(--text-2, #3A4A5A)" },
    red: { border: "#E0A0A0", color: "var(--red, #A82020)", bg: "var(--red-bg, #FAE8E8)" },
    green: { border: "#9ACAB0", color: "var(--green, #1A6645)", bg: "var(--green-bg, #E8F5EE)" },
    amber: { border: "#E0C070", color: "var(--amber, #7A5010)", bg: "var(--amber-bg, #FFF5E0)" },
  };
  const s = styles[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
      style={{ border: `1px solid ${s.border}`, color: s.color, background: s.bg ?? "transparent" }}
    >
      {children}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<ReportQueueItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.replace("/");
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
    <div className="flex min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>
      <AdminSidebar active="reports" />

      <main className="flex-1 min-w-0">
        {/* Page header */}
        <div
          className="px-8 py-7 border-b"
          style={{ background: "#fff", borderColor: "var(--border-soft, #E8E4DC)" }}
        >
          <p className="mb-1 text-xs uppercase tracking-widest" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
            Admin
          </p>
          <h1 className="text-2xl" style={{ fontFamily: serif, fontWeight: 600, color: "var(--navy, #0F2744)" }}>
            Pending Reports
          </h1>
        </div>

        <div className="px-8 py-6">
          {/* Filter tabs */}
          <div className="mb-6 flex gap-2">
            {(["pending", "dismissed", "actioned"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className="rounded-full px-4 py-1.5 text-xs capitalize transition-colors"
                style={{
                  fontFamily: mono,
                  background: statusFilter === s ? "var(--navy, #0F2744)" : "#fff",
                  color: statusFilter === s ? "#fff" : "var(--text-3, #6A7A8A)",
                  border: statusFilter === s ? "1px solid var(--navy, #0F2744)" : "1px solid var(--border, #DDD8D0)",
                  fontWeight: statusFilter === s ? 500 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>Loading…</p>
          ) : items.length === 0 ? (
            <div
              className="rounded-[10px] p-10 text-center text-sm"
              style={{ border: "1px dashed var(--border, #DDD8D0)", color: "var(--text-4, #9AAABB)" }}
            >
              No {statusFilter} reports.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((report) => (
                <ReportCard key={report.id} report={report} onAction={() => load(page, statusFilter)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="flex h-9 w-9 items-center justify-center rounded text-sm transition-colors"
                  style={{
                    fontFamily: mono,
                    background: p === page ? "var(--blue, #1E5FA8)" : "#fff",
                    color: p === page ? "#fff" : "var(--text-2, #3A4A5A)",
                    border: p === page ? "1px solid var(--blue, #1E5FA8)" : "1px solid var(--border, #DDD8D0)",
                    fontWeight: p === page ? 600 : 400,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}