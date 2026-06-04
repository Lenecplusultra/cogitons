"""
Cogitons GitHub Setup Script — Complete
Creates all 13 labels, 9 milestones, and 117 issues across all phases.
Usage:
    export GITHUB_TOKEN=your_token_here
    python /tmp/setup_github.py
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# ── Config ────────────────────────────────────────────────────────────────────

REPO = "Lenecplusultra/cogitons"
TOKEN = os.environ.get("GITHUB_TOKEN", "")

if not TOKEN:
    print("ERROR: Set your token first:")
    print("  export GITHUB_TOKEN=your_token_here")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
}


def api(method, path, data=None):
    url = f"https://api.github.com{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 422 and "already_exists" in body:
            return {"_exists": True}
        print(f"  HTTP {e.code}: {body[:200]}")
        return None


def post(path, data):
    return api("POST", path, data)


def get(path):
    return api("GET", path)


# ── Labels ────────────────────────────────────────────────────────────────────

LABELS = [
    ("backend", "0075ca", "All server-side FastAPI code"),
    ("frontend", "e4e669", "All Next.js UI code"),
    ("database", "d93f0b", "SQLAlchemy models, Alembic migrations, schema changes"),
    ("auth", "0052cc", "Authentication and session management"),
    ("admin", "b60205", "Admin-only functionality"),
    ("moderation", "e11d48", "Reporting, content removal, user suspension"),
    ("devops", "5319e7", "Infrastructure, deployment, CI/CD, environment config"),
    ("testing", "0e8a16", "Automated tests and manual QA checks"),
    ("security", "ee0701", "Security-sensitive changes: hashing, CORS, rate limits"),
    ("feature", "a2eeef", "New user-facing functionality"),
    ("bug", "d73a4a", "Something is broken"),
    ("documentation", "cfd3d7", "Docs, .env.example, README, seed content"),
    (
        "good first issue",
        "7057ff",
        "Suitable for a new contributor with minimal context",
    ),
]


def create_labels():
    print("\n── Labels ──────────────────────────────────────────────────────")
    for name, color, desc in LABELS:
        r = post(
            f"/repos/{REPO}/labels", {"name": name, "color": color, "description": desc}
        )
        if r and r.get("_exists"):
            print(f"  skip  {name}")
        elif r and r.get("id"):
            print(f"  ✅    {name}")
        else:
            print(f"  ❌    {name}")
        time.sleep(0.2)


# ── Milestones ────────────────────────────────────────────────────────────────

MILESTONES = [
    ("Phase 0 — Foundation", "2026-04-12", "Dev environment works end-to-end"),
    (
        "Phase 1 — Authentication & Users",
        "2026-04-26",
        "Users can create accounts, verify email, log in, reset password",
    ),
    (
        "Phase 2 — Subjects",
        "2026-05-03",
        "Users can browse subjects. Admins can create and manage subjects.",
    ),
    (
        "Phase 3 — Discussions",
        "2026-05-10",
        "Core product works — users can create, read, sort, and delete discussions",
    ),
    (
        "Phase 4 — Responses",
        "2026-05-14",
        "Users can reply to discussions, edit and delete their own responses",
    ),
    (
        "Phase 5 — Useful Votes",
        "2026-05-16",
        "Users can mark discussions and responses as Useful — quality signal active",
    ),
    (
        "Phase 6 — Search & Feed",
        "2026-05-18",
        "Users can search the platform and see a home feed of recent discussions",
    ),
    (
        "Phase 7 — Reports & Moderation",
        "2026-05-22",
        "Users can report content. Admins can take full moderation actions.",
    ),
    (
        "Phase 8 — Polish & Launch",
        "2026-05-30",
        "Platform is tested, seeded, deployed, and open to first 100 users",
    ),
]


def create_milestones():
    print("\n── Milestones ───────────────────────────────────────────────────")
    milestone_map = {}
    for title, due, desc in MILESTONES:
        r = post(
            f"/repos/{REPO}/milestones",
            {
                "title": title,
                "due_on": f"{due}T23:59:59Z",
                "description": desc,
            },
        )
        if r and r.get("_exists"):
            print(f"  skip  {title}")
        elif r and r.get("number"):
            milestone_map[title] = r["number"]
            print(f"  ✅    {title} → #{r['number']}")
        else:
            print(f"  ❌    {title}")
        time.sleep(0.3)

    # Fetch existing to fill gaps
    existing = get(f"/repos/{REPO}/milestones?state=all&per_page=100")
    if existing:
        for m in existing:
            if m["title"] not in milestone_map:
                milestone_map[m["title"]] = m["number"]

    return milestone_map


# ── Issues ────────────────────────────────────────────────────────────────────

ISSUES = {
    "Phase 0 — Foundation": [
        (
            "Set up monorepo folder structure (backend/, frontend/, docs/)",
            ["devops", "documentation"],
        ),
        ("Scaffold FastAPI backend with app/ module layout", ["backend", "devops"]),
        ("Add GET /api/v1/health endpoint", ["backend", "feature"]),
        ("Scaffold Next.js 14 frontend with TypeScript", ["frontend", "devops"]),
        ("Configure Tailwind CSS on frontend", ["frontend", "devops"]),
        ("Set up Supabase project and obtain DATABASE_URL", ["database", "devops"]),
        ("Configure SQLAlchemy 2.0 and Alembic", ["backend", "database"]),
        ("Create initial Alembic migration (all V1 tables)", ["database", "feature"]),
        (
            "Add .env.example files for backend and frontend",
            ["devops", "documentation"],
        ),
        ("Set up GitHub Actions CI (lint, type-check, tests)", ["devops", "testing"]),
        ("Deploy frontend placeholder to Vercel", ["frontend", "devops"]),
        ("Deploy backend placeholder to Railway/Render", ["backend", "devops"]),
        ("Verify frontend-to-backend API connection end-to-end", ["devops", "testing"]),
    ],
    "Phase 1 — Authentication & Users": [
        ("Create users SQLAlchemy model", ["backend", "database", "auth"]),
        ("Create email_verification_tokens model", ["backend", "database", "auth"]),
        ("Create password_reset_tokens model", ["backend", "database", "auth"]),
        ("Create refresh_tokens model", ["backend", "database", "auth"]),
        ("Implement bcrypt password hashing utility", ["backend", "auth", "security"]),
        (
            "Implement JWT access + refresh token issuance",
            ["backend", "auth", "security"],
        ),
        ("Implement POST /api/v1/auth/signup", ["backend", "auth", "feature"]),
        ("Implement POST /api/v1/auth/verify-email", ["backend", "auth", "feature"]),
        (
            "Implement POST /api/v1/auth/resend-verification",
            ["backend", "auth", "feature"],
        ),
        ("Implement POST /api/v1/auth/login", ["backend", "auth", "feature"]),
        ("Implement POST /api/v1/auth/refresh", ["backend", "auth", "feature"]),
        ("Implement POST /api/v1/auth/logout", ["backend", "auth", "feature"]),
        (
            "Implement POST /api/v1/auth/password-reset/request",
            ["backend", "auth", "feature"],
        ),
        (
            "Implement POST /api/v1/auth/password-reset/confirm",
            ["backend", "auth", "feature"],
        ),
        ("Implement GET /api/v1/users/me", ["backend", "feature"]),
        ("Implement PATCH /api/v1/users/me", ["backend", "feature"]),
        ("Implement GET /api/v1/users/{username}", ["backend", "feature"]),
        (
            "Configure Resend email integration (verification + reset)",
            ["backend", "auth"],
        ),
        ("Build signup page", ["frontend", "auth", "feature"]),
        ("Build login page", ["frontend", "auth", "feature"]),
        ("Build email verification confirmation page", ["frontend", "auth", "feature"]),
        ("Build resend verification page", ["frontend", "auth", "feature"]),
        ("Build forgot password page", ["frontend", "auth", "feature"]),
        ("Build reset password page", ["frontend", "auth", "feature"]),
        ("Build profile page (view and edit)", ["frontend", "feature"]),
        (
            "Implement auth state management (user context / cookies)",
            ["frontend", "auth"],
        ),
    ],
    "Phase 2 — Subjects": [
        ("Create subjects SQLAlchemy model", ["backend", "database"]),
        ("Create subject_slug_history model", ["backend", "database"]),
        ("Implement GET /api/v1/subjects (paginated)", ["backend", "feature"]),
        ("Implement GET /api/v1/subjects/{slug}", ["backend", "feature"]),
        ("Implement POST /api/v1/subjects (admin)", ["backend", "feature", "admin"]),
        (
            "Implement PATCH /api/v1/subjects/{id} with slug history transaction",
            ["backend", "feature", "admin"],
        ),
        (
            "Implement PATCH /api/v1/subjects/{id}/status (admin)",
            ["backend", "feature", "admin"],
        ),
        ("Build subjects list page", ["frontend", "feature"]),
        ("Build subject detail page", ["frontend", "feature"]),
        (
            "Build admin subject management page (create, edit, archive)",
            ["frontend", "admin", "feature"],
        ),
    ],
    "Phase 3 — Discussions": [
        ("Create discussions SQLAlchemy model", ["backend", "database"]),
        (
            "Implement GET /api/v1/subjects/{slug}/discussions (paginated, sort: recent | most_useful)",
            ["backend", "feature"],
        ),
        ("Implement POST /api/v1/discussions", ["backend", "feature"]),
        ("Implement GET /api/v1/discussions/{id}", ["backend", "feature"]),
        (
            "Implement PATCH /api/v1/discussions/{id} (owner only)",
            ["backend", "feature"],
        ),
        (
            "Implement DELETE /api/v1/discussions/{id} with response cascade (soft delete)",
            ["backend", "feature"],
        ),
        ("Build create discussion page (title + body form)", ["frontend", "feature"]),
        (
            "Build discussion detail page (body, author, timestamp, edited indicator)",
            ["frontend", "feature"],
        ),
        ("Build discussion edit and delete controls", ["frontend", "feature"]),
        (
            "Build Recent / Most Useful sort controls on subject page",
            ["frontend", "feature"],
        ),
        ("Build numbered pagination controls", ["frontend", "feature"]),
    ],
    "Phase 4 — Responses": [
        (
            "Create responses SQLAlchemy model (flat — no parent_id)",
            ["backend", "database"],
        ),
        (
            "Implement GET /api/v1/discussions/{id}/responses (paginated)",
            ["backend", "feature"],
        ),
        ("Implement POST /api/v1/discussions/{id}/responses", ["backend", "feature"]),
        ("Implement PATCH /api/v1/responses/{id} (owner only)", ["backend", "feature"]),
        (
            "Implement DELETE /api/v1/responses/{id} (soft delete)",
            ["backend", "feature"],
        ),
        ("Build response list (chronological, flat)", ["frontend", "feature"]),
        ("Build reply box at bottom of discussion thread", ["frontend", "feature"]),
        ("Build inline edit response form", ["frontend", "feature"]),
        ("Build delete response confirmation dialog", ["frontend", "feature"]),
        (
            "Build locked discussion UI state (no reply box, locked indicator)",
            ["frontend", "feature"],
        ),
    ],
    "Phase 5 — Useful Votes": [
        (
            "Create votes SQLAlchemy model with unique composite constraint",
            ["backend", "database"],
        ),
        (
            "Implement POST /api/v1/votes/toggle (create or delete vote row)",
            ["backend", "feature"],
        ),
        (
            "Add Useful button to discussion cards (subject page, search results)",
            ["frontend", "feature"],
        ),
        ("Add Useful button to discussion detail page (body)", ["frontend", "feature"]),
        ("Add Useful button to each response in thread", ["frontend", "feature"]),
        (
            "Update vote count in UI after toggle (optimistic update)",
            ["frontend", "feature"],
        ),
        (
            "Handle visitor Useful click — trigger login prompt (Flow F-16)",
            ["frontend", "feature"],
        ),
    ],
    "Phase 6 — Search & Feed": [
        (
            "Implement GET /api/v1/search (ILIKE across subjects + discussions)",
            ["backend", "feature"],
        ),
        (
            "Implement GET /api/v1/feed (featured subjects + recent discussions)",
            ["backend", "feature"],
        ),
        ("Build global search bar in navigation", ["frontend", "feature"]),
        (
            "Build search results page (subjects first, discussions second)",
            ["frontend", "feature"],
        ),
        (
            "Build empty search result state with browse subjects link",
            ["frontend", "feature"],
        ),
        ("Build home feed with recent discussions section", ["frontend", "feature"]),
        ("Build featured subjects section on home page", ["frontend", "feature"]),
    ],
    "Phase 7 — Reports & Moderation": [
        ("Create reports SQLAlchemy model", ["backend", "database", "moderation"]),
        (
            "Create moderation_logs SQLAlchemy model",
            ["backend", "database", "moderation"],
        ),
        ("Implement POST /api/v1/reports", ["backend", "feature", "moderation"]),
        (
            "Implement GET /api/v1/admin/reports (paginated queue)",
            ["backend", "admin", "moderation"],
        ),
        (
            "Implement POST /api/v1/admin/reports/{id}/dismiss",
            ["backend", "admin", "moderation"],
        ),
        (
            "Implement POST /api/v1/admin/content/remove (soft delete)",
            ["backend", "admin", "moderation"],
        ),
        (
            "Implement POST /api/v1/admin/discussions/{id}/lock",
            ["backend", "admin", "moderation"],
        ),
        (
            "Implement POST /api/v1/admin/discussions/{id}/unlock",
            ["backend", "admin", "moderation"],
        ),
        (
            "Implement POST /api/v1/admin/users/{id}/suspend",
            ["backend", "admin", "moderation"],
        ),
        (
            "Implement POST /api/v1/admin/users/{id}/restore",
            ["backend", "admin", "moderation"],
        ),
        (
            "Ensure ModerationLog entry is written on every admin action",
            ["backend", "moderation", "testing"],
        ),
        ("Build report modal with reason field", ["frontend", "feature", "moderation"]),
        ("Build admin reports queue page", ["frontend", "admin", "moderation"]),
        (
            "Build moderation action controls (dismiss, remove, lock, suspend)",
            ["frontend", "admin", "moderation"],
        ),
        (
            "Build locked discussion indicator in thread view",
            ["frontend", "moderation"],
        ),
        ("Build suspended account message on login page", ["frontend", "moderation"]),
    ],
    "Phase 8 — Polish & Launch": [
        ("Write backend integration tests for all auth endpoints", ["testing", "auth"]),
        (
            "Write backend integration tests for discussion and response endpoints",
            ["testing"],
        ),
        (
            "Write backend integration tests for vote, search, and feed endpoints",
            ["testing"],
        ),
        (
            "Write backend integration tests for report and admin endpoints",
            ["testing", "moderation"],
        ),
        ("Run all 21 user-flow manual checks (full journey test)", ["testing"]),
        ("Verify CORS is configured to production domain only", ["security", "devops"]),
        (
            "Verify rate limiting is active on all auth endpoints",
            ["security", "backend"],
        ),
        (
            "Verify all soft-delete behavior across discussions and responses",
            ["testing", "backend"],
        ),
        (
            "Verify moderation logs are written for all admin actions",
            ["testing", "moderation"],
        ),
        (
            "Verify input validation and sanitization on all POST/PATCH endpoints",
            ["testing", "security"],
        ),
        ("Run full responsive design check on mobile browser", ["frontend", "testing"]),
        (
            "Audit and fix loading states and error states on all pages",
            ["frontend", "feature"],
        ),
        (
            "Seed minimum 20 subjects in production database",
            ["devops", "documentation"],
        ),
        (
            "Seed minimum 50 discussions across top subjects",
            ["devops", "documentation"],
        ),
        ("Connect production custom domain to Vercel", ["devops"]),
        (
            "Confirm SSL certificate is active on production domain",
            ["devops", "security"],
        ),
        ("Final production deployment and smoke test", ["devops", "testing"]),
    ],
}


def create_issues(milestone_map):
    print("\n── Issues ───────────────────────────────────────────────────────")
    total = 0
    for milestone_title, issues in ISSUES.items():
        m_number = milestone_map.get(milestone_title)
        if not m_number:
            print(f"\n  WARNING: milestone not found: {milestone_title}")
            continue
        print(f"\n  {milestone_title} (milestone #{m_number})")
        for title, labels in issues:
            r = post(
                f"/repos/{REPO}/issues",
                {
                    "title": title,
                    "labels": labels,
                    "milestone": m_number,
                    "assignees": ["Lenecplusultra"],
                },
            )
            if r and r.get("_exists"):
                print(f"    skip  {title[:70]}")
            elif r and r.get("number"):
                print(f"    ✅  #{r['number']:>3}  {title[:70]}")
                total += 1
            else:
                print(f"    ❌  {title[:70]}")
            time.sleep(0.4)
    print(f"\n  Created {total} new issues.")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Cogitons GitHub Setup — Complete")
    print(f"Repo: {REPO}")
    print(
        f"Labels: {len(LABELS)} | Milestones: {len(MILESTONES)} | Issue groups: {len(ISSUES)}"
    )
    create_labels()
    milestone_map = create_milestones()
    create_issues(milestone_map)
    print(f"\n✅ Done. https://github.com/{REPO}/issues")
