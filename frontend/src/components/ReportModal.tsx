// frontend/src/components/ReportModal.tsx
"use client";

import { useState } from "react";
import { api, type ReportReason } from "@/lib/api";

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
    setSubmitting(true);
    setError(null);
    const res = await api.moderation.submitReport({
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || undefined,
    });
    setSubmitting(false);
    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-[#1A3C5E] mb-2">Report received</p>
            <p className="text-sm text-gray-500 mb-6">
              Thank you. Our team will review this content.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-medium text-white bg-[#2E6DA4] hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-[#1A3C5E] mb-5">Report content</h2>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700">Reason</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] bg-white"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-5">
              <span className="text-sm font-medium text-gray-700">
                Additional details{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Describe the issue…"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E6DA4] resize-none"
              />
            </label>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded text-sm font-medium text-white bg-red-500 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}