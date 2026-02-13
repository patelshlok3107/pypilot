# PyPilot - AI Python Learning SaaS

Production-style full-stack MVP for a gamified Python learning platform:
- Next.js + Tailwind + Monaco frontend
- FastAPI backend with JWT auth and PostgreSQL
- AI tutor endpoints (explain, debug, practice generation)
- Sandboxed code-runner microservice
- XP/levels/achievements/streaks/daily missions
- Monthly report cards
- Admin analytics and Stripe subscription APIs

## Quick Start

1. Copy environment template:
```bash
cp .env.example .env
```

2. Fill required secrets in `.env`:
- `OPENAI_API_KEY`
- `API_SECRET_KEY`
- `STRIPE_SECRET_KEY` (optional for non-billing local dev)
- `API_INTERNAL_URL` (defaults to `http://api:8000` in Docker)

3. Run all services:
```bash
docker compose up --build
```

4. Open:
- Web app: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

## Product Blueprint

Full architecture, schema map, folder tree, MVP roadmap, UI layout, and deployment details:
- `docs/PyPilot-SaaS-Blueprint.md`

## Key Code Entrypoints

- Backend API: `apps/api/app/main.py`
- Database models: `apps/api/app/db/models.py`
- AI service: `apps/api/app/services/ai_tutor.py`
- Code runner: `services/code-runner/app/main.py`
- Frontend workspace shell: `apps/web/components/shell/app-shell.tsx`
- Frontend playground: `apps/web/components/playground/code-playground.tsx`

## Notes

This is a production-oriented MVP scaffold. It is intentionally structured for rapid iteration to a launch-ready SaaS with monitoring, billing, and advanced security hardening.
