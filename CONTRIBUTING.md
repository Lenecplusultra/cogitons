# Contributing to Cogitons

## Branching Strategy

We use **GitHub Flow**:

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Setup, config, maintenance |

**Examples:**
```
feature/auth-flow
feature/subject-pages
feature/discussion-create
fix/login-validation
chore/setup-ci
```

## Pull Request Process

Every meaningful change goes through a pull request into `main`.

A PR must include:
- What changed
- Why it changed
- Screenshots if the UI changed
- Testing notes

## Issue Labels

| Label | Use |
|---|---|
| `frontend` | Frontend work |
| `backend` | Backend work |
| `database` | Schema / migration work |
| `auth` | Authentication / authorization |
| `moderation` | Moderation features |
| `bug` | Something broken |
| `feature` | New feature |
| `documentation` | Docs update |
| `good first issue` | Good for new contributors |

## Secrets

Never commit `.env` files or secrets to the repository.
Use `.env.example` files to document required variables without values.

Production secrets are managed in deployment platform dashboards (Vercel, Railway).
