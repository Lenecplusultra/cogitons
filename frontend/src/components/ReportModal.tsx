"use client";

import { useState } from "react";
import { api, type ReportReason } from "@/lib/api";

const serif = "'Lora', Georgia, serif";
const mono = "'DM Mono', monospace";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "dangerous_content", label: "Dangerous Content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "privacy_violation", label: "Privacy Violation" },
  { value: "off_topic", label: "Off-Topic" },
  { value: "other", label: "Other" },
];

interface ReportModalProps {
  targetType: "discussion" | "response";
  targetId: string;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setSubmitting(true); setError(null);
    const res = await api.moderation.submitReport({ target_type: targetType, target_id: targetId, reason, details: details.trim() || undefined });
    setSubmitting(false);
    if (res.success) setSubmitted(true);
    else setError(res.error.message);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-[10px] p-6" style={{ background: "#fff", boxShadow: "var(--shadow-lg, 0 4px 24px rgba(15,39,68,.10), 0 1px 4px rgba(15,39,68,.06))" }}>
        {submitted ? (
          <div className="py-4 text-center">
            <p className="mb-2 text-lg font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>Report received</p>
            <p className="mb-6 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>Thank you. Our team will review this content.</p>
            <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: "var(--blue, #1E5FA8)" }}>Close</button>
          </div>
        ) : (
          <>
            <h2 className="mb-5 text-lg font-semibold" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>Report content</h2>

            <div className="mb-4 space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid var(--border, #DDD8D0)", background: "#fff", color: "var(--text, #0F1A26)" }}
              >
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="mb-5 space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                Additional details <span className="font-normal" style={{ color: "var(--text-3, #6A7A8A)" }}>(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Describe the issue…"
                className="w-full resize-none rounded-[6px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid var(--border, #DDD8D0)" }}
              />
            </div>

            {error && <p className="mb-4 text-sm" style={{ color: "var(--red, #A82020)", fontFamily: mono }}>{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="rounded-full px-4 py-2 text-sm transition-colors" style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--text-2, #3A4A5A)" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90" style={{ background: "var(--red, #A82020)" }}>
                {submitting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}