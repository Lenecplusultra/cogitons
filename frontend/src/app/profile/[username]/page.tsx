"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface PublicProfile {
  id: string;
  username: string;
  bio: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, refresh } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const isOwner = currentUser?.username === username;

  // Load profile
  useEffect(() => {
    (async () => {
      const res = await api.users.getByUsername(username);
      if (res.success) {
        setProfile(res.data as PublicProfile);
      } else {
        setNotFound(true);
      }
    })();
  }, [username]);

  // Pre-fill edit form with current values
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
      // If username changed, navigate to new profile URL
      if (editUsername !== profile?.username) {
        await refresh(); // update auth context
        router.replace(`/profile/${editUsername}`);
        return;
      }
      // Otherwise update local state and exit edit mode
      setProfile((p) => p ? { ...p, username: editUsername, bio: editBio || null } : p);
      await refresh();
      setEditing(false);
    } catch {
      setEditError("Something went wrong. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Not found ──────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <h1 className="text-xl font-semibold">User not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm hover:underline"
            style={{ color: "var(--brand-blue)" }}
          >
            Go home
          </button>
        </div>
      </main>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  // ── Profile view ───────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm hover:underline"
            style={{ color: "var(--brand-blue)" }}
          >
            ← Home
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {!editing ? (
            <>
              {/* Avatar placeholder */}
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: "var(--brand-blue)" }}
              >
                {profile.username[0].toUpperCase()}
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                {profile.username}
              </h1>

              {profile.bio ? (
                <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>
              ) : (
                isOwner && (
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    No bio yet.
                  </p>
                )
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                Member since{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </p>

              {isOwner && (
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={startEditing}
                >
                  Edit profile
                </Button>
              )}
            </>
          ) : (
            <>
              <h1 className="mb-6 text-xl font-semibold">Edit profile</h1>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    maxLength={40}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
                               placeholder:text-muted-foreground focus:outline-none focus:ring-2
                               focus:ring-ring transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Bio{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="Tell the community about yourself…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
                               placeholder:text-muted-foreground focus:outline-none focus:ring-2
                               focus:ring-ring transition-colors resize-none"
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {editBio.length}/300
                  </p>
                </div>

                {editError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {editError}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={editLoading}
                    style={{ backgroundColor: "var(--brand-blue)", color: "#fff" }}
                  >
                    {editLoading ? "Saving…" : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}