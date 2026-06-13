"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type SubjectListItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

type ModalState =
  | { type: "create" }
  | { type: "edit"; subject: SubjectListItem }
  | null;

// ── Admin sidebar ─────────────────────────────────────────────────────────────
function AdminSidebar({ active }: { active: "reports" | "subjects" }) {
  return (
    <aside
      className="hidden md:flex w-[200px] shrink-0 flex-col"
      style={{ background: "#0F1520", minHeight: "100vh", position: "sticky", top: 0 }}
    >
      <div
        className="px-5 py-6 text-base italic border-b"
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminSubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<SubjectListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.replace("/");
  }, [user, authLoading, router]);

  const load = (p: number) => {
    setLoading(true);
    api.subjects.list(p).then((res) => {
      if (res.success) {
        setItems(res.data.items);
        setTotalPages(res.data.pagination.total_pages);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(page); }, [page]); // eslint-disable-line

  const openCreate = () => {
    setFormTitle(""); setFormDesc(""); setFormError(null);
    setModal({ type: "create" });
  };

  const openEdit = (subject: SubjectListItem) => {
    setFormTitle(subject.title); setFormDesc(subject.description); setFormError(null);
    setModal({ type: "edit", subject });
  };

  const handleSave = async () => {
    if (formTitle.trim().length < 3) { setFormError("Title must be at least 3 characters."); return; }
    if (formDesc.trim().length < 10) { setFormError("Description must be at least 10 characters."); return; }
    setSaving(true); setFormError(null);
    const res = modal?.type === "create"
      ? await api.subjects.create({ title: formTitle.trim(), description: formDesc.trim() })
      : modal?.type === "edit"
      ? await api.subjects.update(modal.subject.id, { title: formTitle.trim(), description: formDesc.trim() })
      : undefined;
    setSaving(false);
    if (res && !res.success) { setFormError(res.error.message); return; }
    setModal(null); load(page);
  };

  const handleArchive = async (subject: SubjectListItem) => {
    await api.subjects.updateStatus(subject.id, { status: "archived" });
    load(page);
  };

  if (authLoading || !user) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>
      <AdminSidebar active="subjects" />

      <main className="flex-1 min-w-0">
        {/* Page header */}
        <div
          className="flex items-center justify-between px-8 py-7 border-b"
          style={{ background: "#fff", borderColor: "var(--border-soft, #E8E4DC)" }}
        >
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
              Admin
            </p>
            <h1 className="text-2xl" style={{ fontFamily: serif, fontWeight: 600, color: "var(--navy, #0F2744)" }}>
              Subject Management
            </h1>
          </div>
          <button
            onClick={openCreate}
            className="rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--blue, #1E5FA8)" }}
          >
            + Create new subject
          </button>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <p className="text-sm" style={{ color: "var(--text-4, #9AAABB)" }}>Loading…</p>
          ) : items.length === 0 ? (
            <div
              className="rounded-[10px] p-10 text-center text-sm"
              style={{ border: "1px dashed var(--border, #DDD8D0)", color: "var(--text-4, #9AAABB)" }}
            >
              No subjects yet.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-[10px] px-5 py-4"
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border-soft, #E8E4DC)",
                    boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))",
                    opacity: s.status === "archived" ? 0.6 : 1,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--navy, #0F2744)" }}>
                        {s.title}
                      </p>
                      {s.status === "archived" && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px]"
                          style={{ fontFamily: mono, background: "var(--cream-dark, #F0EDE8)", color: "var(--text-3, #6A7A8A)" }}
                        >
                          archived
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                      /subjects/{s.slug} · {s.discussion_count} discussions
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-full px-3 py-1.5 text-xs transition-colors hover:border-[var(--blue)]"
                      style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--text-2, #3A4A5A)" }}
                    >
                      Edit
                    </button>
                    {s.status !== "archived" ? (
                      <button
                        onClick={() => handleArchive(s)}
                        className="rounded-full px-3 py-1.5 text-xs"
                        style={{ border: "1px solid #E0C070", color: "var(--amber, #7A5010)", background: "var(--amber-bg, #FFF5E0)" }}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        onClick={async () => { await api.subjects.updateStatus(s.id, { status: "active" }); load(page); }}
                        className="rounded-full px-3 py-1.5 text-xs"
                        style={{ border: "1px solid #9ACAB0", color: "var(--green, #1A6645)", background: "var(--green-bg, #E8F5EE)" }}
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="flex h-9 w-9 items-center justify-center rounded text-sm"
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

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md rounded-[10px] p-6"
            style={{
              background: "#fff",
              boxShadow: "var(--shadow-lg, 0 4px 24px rgba(15,39,68,.10), 0 1px 4px rgba(15,39,68,.06))",
            }}
          >
            <h2 className="mb-5 text-lg" style={{ fontFamily: serif, fontWeight: 600, color: "var(--navy, #0F2744)" }}>
              {modal.type === "create" ? "Create new subject" : "Edit subject"}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={150}
                  placeholder="e.g. Software Engineering"
                  className="w-full rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1px solid var(--border, #DDD8D0)", background: "#fff" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Short explanation of this subject…"
                  className="w-full resize-none rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1px solid var(--border, #DDD8D0)", background: "#fff" }}
                />
              </div>
            </div>

            {formError && (
              <p className="mt-3 text-sm" style={{ color: "var(--red, #A82020)" }}>
                {formError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="rounded-full px-4 py-2 text-sm"
                style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--text-2, #3A4A5A)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "var(--blue, #1E5FA8)" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}