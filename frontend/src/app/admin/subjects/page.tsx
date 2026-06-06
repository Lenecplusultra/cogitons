"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type SubjectListItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type ModalState =
  | { type: "create" }
  | { type: "edit"; subject: SubjectListItem }
  | null;

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

  // Gate: non-admins get sent home
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/");
    }
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
    setFormTitle("");
    setFormDesc("");
    setFormError(null);
    setModal({ type: "create" });
  };

  const openEdit = (subject: SubjectListItem) => {
    setFormTitle(subject.title);
    setFormDesc(subject.description);
    setFormError(null);
    setModal({ type: "edit", subject });
  };

  const handleSave = async () => {
    if (formTitle.trim().length < 3) {
      setFormError("Title must be at least 3 characters.");
      return;
    }
    if (formDesc.trim().length < 10) {
      setFormError("Description must be at least 10 characters.");
      return;
    }
    setSaving(true);
    setFormError(null);

    let res;
    if (modal?.type === "create") {
      res = await api.subjects.create({
        title: formTitle.trim(),
        description: formDesc.trim(),
      });
    } else if (modal?.type === "edit") {
      res = await api.subjects.update(modal.subject.id, {
        title: formTitle.trim(),
        description: formDesc.trim(),
      });
    }

    setSaving(false);

    if (res && !res.success) {
      setFormError(res.error.message);
      return;
    }

    setModal(null);
    load(page);
  };

  const handleArchive = async (subject: SubjectListItem) => {
    await api.subjects.updateStatus(subject.id, { status: "archived" });
    load(page);
  };

  if (authLoading || !user) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1A3C5E] px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Subjects</h1>
            <p className="text-white/50 text-sm mt-1">Admin</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-white rounded text-sm font-semibold text-[#1A3C5E] hover:opacity-90 transition-opacity"
          >
            + New Subject
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Discussions</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                      No subjects yet.
                    </td>
                  </tr>
                ) : (
                  items.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{s.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                          {s.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.discussion_count}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="px-3 py-1 rounded border border-gray-200 text-gray-600 text-xs hover:border-[#2E6DA4] hover:text-[#2E6DA4] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchive(s)}
                            className="px-3 py-1 rounded border border-gray-200 text-gray-600 text-xs hover:border-yellow-400 hover:text-yellow-600 transition-colors"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#1A3C5E] mb-5">
              {modal.type === "create" ? "New Subject" : "Edit Subject"}
            </h2>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={150}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E6DA4]"
                placeholder="e.g. Software Engineering"
              />
            </label>

            <label className="block mb-5">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] resize-none"
                placeholder="Short explanation of this subject…"
              />
            </label>

            {formError && (
              <p className="text-red-500 text-sm mb-4">{formError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}