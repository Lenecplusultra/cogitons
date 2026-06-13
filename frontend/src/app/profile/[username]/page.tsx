// frontend/src/app/profile/[username]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface ProfileStats {
  discussions: number;
  responses: number;
  useful_votes_received: number;
}
interface ActiveInItem {
  subject_title: string;
  subject_slug: string;
  discussion_count: number;
  response_count: number;
}
interface ProfileDiscussion {
  id: string;
  subject_title: string;
  subject_slug: string;
  title: string;
  body: string;
  useful_count: number;
  response_count: number;
  viewer_voted: boolean;
  edited: boolean;
  created_at: string;
}
interface ProfileResponse {
  id: string;
  discussion_id: string;
  discussion_title: string;
  subject_title: string;
  subject_slug: string;
  body: string;
  useful_count: number;
  viewer_voted: boolean;
  edited: boolean;
  created_at: string;
}
interface PublicProfile {
  id: string;
  username: string;
  bio: string | null;
  created_at: string;
  stats: ProfileStats;
  active_in: ActiveInItem[];
  recent_discussions: ProfileDiscussion[];
  recent_responses: ProfileResponse[];
  status?: "active" | "suspended" | "removed";
  role?: "user" | "admin";
}

const AVATAR_COLORS = ["#1E5FA8", "#1A6645", "#7A3A80", "#C05020"];
function avatarColor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days >= 1) return `${days}d ago`;
  if (hrs >= 1) return `${hrs}h ago`;
  if (mins >= 1) return `${mins}min ago`;
  return "just now";
}

const mono = "'DM Mono', monospace";
const serif = "'Lora', Georgia, serif";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, loading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<"discussions" | "responses">("discussions");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Admin action state
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const isOwner = currentUser?.username === username;
  const isAdmin = currentUser?.role === "admin";
  const isAdminViewingOther = isAdmin && !isOwner;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.users.getByUsername(username);
        if (cancelled) return;
        if (res.success) {
          setProfile(res.data as PublicProfile);
        } else {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  function startEditing() {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditBio(profile.bio ?? "");
    setEditError(null);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setEditLoading(true);
    try {
      const res = await api.users.updateMe({
        username: editUsername !== profile?.username ? editUsername : undefined,
        bio: editBio !== (profile?.bio ?? "") ? editBio : undefined,
      });
      if (!res.success) {
        setEditError(res.error.message);
        return;
      }
      if (editUsername !== profile?.username) {
        await refresh();
        router.replace(`/profile/${editUsername}`);
        return;
      }
      setProfile((p) => (p ? { ...p, username: editUsername, bio: editBio || null } : p));
      await refresh();
      setEditing(false);
    } catch {
      setEditError("Something went wrong. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSuspend() {
    if (!profile) return;
    if (!confirm(`Suspend ${profile.username}? They will not be able to log in.`)) return;
    setAdminActionLoading(true);
    setAdminActionError(null);
    const res = await api.moderation.suspendUser(profile.id, { notes: adminNotes || undefined });
    setAdminActionLoading(false);
    if (res.success) {
      setProfile((p) => (p ? { ...p, status: "suspended" } : p));
      setAdminNotes("");
    } else {
      setAdminActionError(res.error.message);
    }
  }

  async function handleRestore() {
    if (!profile) return;
    if (!confirm(`Restore ${profile.username}? They will be able to log in again.`)) return;
    setAdminActionLoading(true);
    setAdminActionError(null);
    const res = await api.moderation.restoreUser(profile.id, { notes: adminNotes || undefined });
    setAdminActionLoading(false);
    if (res.success) {
      setProfile((p) => (p ? { ...p, status: "active" } : p));
      setAdminNotes("");
    } else {
      setAdminActionError(res.error.message);
    }
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--cream, #FAF8F5)" }}>
        <div className="text-center">
          <h1 className="text-xl" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
            Couldn&apos;t load this profile
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
            Something went wrong. Please refresh and try again.
          </p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--cream, #FAF8F5)" }}>
        <div className="text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <h1 className="text-xl" style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>
            User not found
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
            This account doesn&apos;t exist or has been removed.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm hover:underline" style={{ color: "var(--blue, #1E5FA8)" }}>
            Go home
          </Link>
        </div>
      </main>
    );
  }

  if (authLoading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--cream, #FAF8F5)" }}>
        <p className="text-sm" style={{ color: "var(--text-3, #6A7A8A)" }}>
          Loading…
        </p>
      </main>
    );
  }

  const stats = profile.stats ?? { discussions: 0, responses: 0, useful_votes_received: 0 };
  const activeIn = profile.active_in ?? [];
  const discussions = profile.recent_discussions ?? [];
  const responses = profile.recent_responses ?? [];
  const initial = profile.username[0]?.toUpperCase() ?? "?";

  // ── Editing: white card, not the navy hero ───────────────────────────────
  if (editing) {
    return (
      <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>
        <div className="mx-auto max-w-[640px] px-6 py-10">
          <section
            className="rounded-[10px] p-6 md:p-8"
            style={{
              background: "#fff",
              border: "1px solid var(--border-soft, #E8E4DC)",
              boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))",
            }}
          >
            <h1 className="mb-6 text-xl" style={{ fontFamily: serif, fontWeight: 600, color: "var(--navy, #0F2744)" }}>
              Edit profile
            </h1>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  maxLength={40}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ border: "1px solid var(--border, #DDD8D0)", background: "#fff" }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text, #0F1A26)" }}>
                  Bio <span className="font-normal" style={{ color: "var(--text-3, #6A7A8A)" }}>(optional)</span>
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Tell the community about yourself…"
                  className="w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ border: "1px solid var(--border, #DDD8D0)", background: "#fff" }}
                />
                <p className="text-right text-xs" style={{ color: "var(--text-3, #6A7A8A)" }}>
                  {editBio.length}/300
                </p>
              </div>
              {editError && (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--red-bg, #FAE8E8)", color: "var(--red, #A82020)" }}>
                  {editError}
                </p>
              )}
              <div className="flex gap-3">
                <Button type="submit" disabled={editLoading} style={{ backgroundColor: "var(--blue, #1E5FA8)", color: "#fff" }}>
                  {editLoading ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={editLoading}>
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    );
  }

  // ── Display ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen" style={{ background: "var(--cream, #FAF8F5)" }}>
      {/* Navy hero */}
      <section
        style={{
          background:
            "radial-gradient(ellipse 80% 120% at 0% 50%, rgba(30,95,168,.35) 0%, transparent 60%), var(--navy, #0F2744)",
        }}
      >
        <div className="mx-auto max-w-[1000px] px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-semibold text-white"
              style={{ background: avatarColor(profile.username), boxShadow: "0 0 0 4px rgba(255,255,255,.08)" }}
            >
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              {/* Name row + Edit */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl text-white" style={{ fontFamily: serif, fontWeight: 600 }}>
                    {profile.username}
                  </h1>
                  {isAdminViewingOther && profile.status && profile.status !== "active" && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(168,32,32,.25)", color: "#FFC9C9" }}>
                      {profile.status}
                    </span>
                  )}
                  {isAdminViewingOther && profile.role === "admin" && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}>
                      admin
                    </span>
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={startEditing}
                    className="shrink-0 rounded-full px-4 py-1.5 text-sm text-white transition-colors hover:bg-white/10"
                    style={{ border: "1px solid rgba(255,255,255,.25)", background: "transparent" }}
                  >
                    Edit profile
                  </button>
                )}
              </div>

              <p className="mt-1 text-sm" style={{ fontFamily: mono, color: "rgba(255,255,255,.5)" }}>
                @{profile.username} · Member since{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </p>

              {/* Bio + stats */}
              <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <p className="max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.6)" }}>
                  {profile.bio ?? (isOwner ? "No bio yet." : "")}
                </p>
                <div className="flex shrink-0 gap-8">
                  <StatHero value={stats.discussions} label="discussions" />
                  <StatHero value={stats.responses} label="responses" />
                  <StatHero value={stats.useful_votes_received} label="useful votes received" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-[1000px] px-6 py-8">
        {/* Admin controls */}
        {isAdminViewingOther && profile.role !== "admin" && (
          <div
            className="mb-6 rounded-[10px] p-5"
            style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
              Admin controls
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Notes for moderation log (optional)…"
              className="mb-3 w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ border: "1px solid var(--border, #DDD8D0)" }}
            />
            {adminActionError && (
              <p className="mb-3 text-sm" style={{ color: "var(--red, #A82020)" }}>
                {adminActionError}
              </p>
            )}
            {profile.status === "suspended" ? (
              <Button variant="outline" onClick={handleRestore} disabled={adminActionLoading} style={{ borderColor: "#9ACAB0", color: "var(--green, #1A6645)" }}>
                {adminActionLoading ? "Restoring…" : "Restore account"}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleSuspend} disabled={adminActionLoading} style={{ borderColor: "#E0A0A0", color: "var(--red, #A82020)" }}>
                {adminActionLoading ? "Suspending…" : "Suspend account"}
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_240px] md:items-start">
          <div>
            <div className="mb-4 flex gap-1 border-b" style={{ borderColor: "var(--border-soft, #E8E4DC)" }}>
              <TabButton active={tab === "discussions"} onClick={() => setTab("discussions")}>
                Discussions
              </TabButton>
              <TabButton active={tab === "responses"} onClick={() => setTab("responses")}>
                Responses
              </TabButton>
            </div>

            {tab === "discussions" ? (
              discussions.length === 0 ? (
                <EmptyState text="No discussions yet." />
              ) : (
                discussions.map((d) => (
                  <Link key={d.id} href={`/discussions/${d.id}`} className="block">
                    <ContentCard>
                      <CardHead username={profile.username} subject={d.subject_title} time={timeAgo(d.created_at)} />
                      <h3 className="mb-1 text-[15px]" style={{ fontFamily: serif, fontWeight: 500, color: "var(--navy, #0F2744)" }}>
                        {d.title}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                        {d.body}
                      </p>
                      <CardFooter useful={d.useful_count} voted={d.viewer_voted} replies={d.response_count} edited={d.edited} />
                    </ContentCard>
                  </Link>
                ))
              )
            ) : responses.length === 0 ? (
              <EmptyState text="No responses yet." />
            ) : (
              responses.map((r) => (
                <Link key={r.id} href={`/discussions/${r.discussion_id}`} className="block">
                  <ContentCard>
                    <CardHead username={profile.username} subject={r.subject_title} time={timeAgo(r.created_at)} />
                    <p className="mb-1 text-[12px]" style={{ color: "var(--text-3, #6A7A8A)" }}>
                      Replied to{" "}
                      <span style={{ fontFamily: serif, color: "var(--navy, #0F2744)" }}>{r.discussion_title}</span>
                    </p>
                    <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed" style={{ color: "var(--text-2, #3A4A5A)" }}>
                      {r.body}
                    </p>
                    <CardFooter useful={r.useful_count} voted={r.viewer_voted} edited={r.edited} />
                  </ContentCard>
                </Link>
              ))
            )}
          </div>

          <aside
            className="rounded-[10px] p-5"
            style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
          >
            <p className="mb-3 text-xs uppercase tracking-wider" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
              Active in
            </p>
            {activeIn.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-4, #9AAABB)" }}>
                No activity yet.
              </p>
            ) : (
              activeIn.map((a) => (
                <Link key={a.subject_slug} href={`/subjects/${a.subject_slug}`} className="block border-b py-2.5 last:border-b-0 last:pb-0" style={{ borderColor: "var(--border-soft, #E8E4DC)" }}>
                  <p className="text-sm" style={{ color: "var(--navy, #0F2744)" }}>
                    {a.subject_title}
                  </p>
                  <p className="text-xs" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
                    {a.discussion_count} discussions · {a.response_count} responses
                  </p>
                </Link>
              ))
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ── Presentational helpers ───────────────────────────────── */

function StatHero({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-2xl text-white" style={{ fontFamily: mono, fontWeight: 500 }}>
        {value}
      </div>
      <div className="text-[10px]" style={{ color: "rgba(255,255,255,.4)" }}>
        {label}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="-mb-px px-4 py-2 text-sm transition-colors"
      style={{
        fontWeight: active ? 600 : 400,
        color: active ? "var(--navy, #0F2744)" : "var(--text-3, #6A7A8A)",
        borderBottom: active ? "2px solid var(--blue, #1E5FA8)" : "2px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

function ContentCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2.5 rounded-[10px] p-4 transition-colors hover:border-[#A8C8E8]"
      style={{ background: "#fff", border: "1px solid var(--border-soft, #E8E4DC)", boxShadow: "var(--shadow, 0 1px 3px rgba(15,39,68,.06), 0 4px 16px rgba(15,39,68,.04))" }}
    >
      {children}
    </div>
  );
}

function CardHead({ username, subject, time }: { username: string; subject: string; time: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white"
          style={{ background: avatarColor(username) }}
        >
          {username[0]?.toUpperCase()}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text-2, #3A4A5A)" }}>
          {username}
        </span>
      </div>
      <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
        {subject} · {time}
      </span>
    </div>
  );
}

function CardFooter({
  useful,
  voted,
  replies,
  edited,
}: {
  useful: number;
  voted: boolean;
  replies?: number;
  edited?: boolean;
}) {
  const pillStyle = voted
    ? { fontFamily: mono, background: "var(--green-bg, #E8F5EE)", color: "var(--green, #1A6645)", border: "1px solid #9ACAB0" }
    : { fontFamily: mono, background: "transparent", color: "var(--text-3, #6A7A8A)", border: "1px solid var(--border, #DDD8D0)" };
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]" style={pillStyle}>
        ✓ Useful · {useful}
      </span>
      {typeof replies === "number" && (
        <span className="text-[11px]" style={{ fontFamily: mono, color: "var(--text-3, #6A7A8A)" }}>
          💬 {replies} responses
        </span>
      )}
      {edited && (
        <span className="text-[10px]" style={{ fontFamily: mono, color: "var(--text-4, #9AAABB)" }}>
          · edited
        </span>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[10px] p-8 text-center text-sm" style={{ border: "1px dashed var(--border, #DDD8D0)", color: "var(--text-4, #9AAABB)" }}>
      {text}
    </div>
  );
}