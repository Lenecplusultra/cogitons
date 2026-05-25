# Cogitons

> A subject-centered knowledge and discussion platform for structured community conversation.

**"Come to understand a subject through community insight."**

---

## What is Cogitons?

Cogitons is a web-first platform where people explore, discuss, and understand important topics through organized public conversation. Unlike Facebook, WhatsApp, or X — where valuable knowledge disappears into noisy feeds — Cogitons organizes every discussion under a subject, making knowledge searchable, reusable, and genuinely useful over time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js · TypeScript · Tailwind CSS |
| Backend | Python · FastAPI |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + HTTP-only cookies |
| Email | Resend |
| Frontend hosting | Vercel |
| Backend hosting | Railway / Render |
| Version control | GitHub |

---

## Repository Structure

```
cogitons/
├── frontend/          # Next.js application
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── core/      # Config, security, dependencies
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   ├── repositories/ # Database access
│   │   └── utils/     # Shared utilities
│   └── migrations/    # Alembic migrations
├── docs/              # Project documents
├── infra/             # Deployment config
└── .github/           # CI/CD workflows and templates
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (or Supabase project)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

---

## Environment Variables

See `frontend/.env.example` and `backend/.env.example` for required variables.

**Never commit real `.env` files. They are in `.gitignore`.**

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching strategy, pull request process, and issue labels.

---

## Team

| Name | Role |
|---|---|
| Tex Yonzo | Developer |
| Ilan Njontu | Founder |

---

## Status

🚧 **MVP in active development — target launch May 30, 2026**

---

*Confidential — Cogitons Startup*
