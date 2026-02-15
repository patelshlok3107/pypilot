# PyPilot SaaS Blueprint

## 1. Full System Architecture

### High-level architecture

```txt
[ Next.js Web App ]
      |
      | HTTPS REST
      v
[ FastAPI API Gateway ] -----> [ OpenAI API ] (AI tutor / debug / practice generation)
      |      |\
      |      | \-----> [ Stripe API ] (subscriptions + billing)
      |      |
      |      +-------> [ Code Runner Service ] (sandboxed Python execution)
      |
      +-------> [ PostgreSQL ] (users, course, progress, gamification, reports)
```

### Key runtime flows

1. Auth flow:
- Web calls `/auth/signup` or `/auth/login`.
- API hashes password (`bcrypt`) and returns JWT.
- Web stores JWT and sends it in `Authorization: Bearer ...`.

2. Learning flow:
- Web loads `/courses/catalog`.
- Student opens lesson (content + quiz + coding challenge).
- Challenge runs through `/progress/challenges/submit` -> Code Runner.
- Lesson completion triggers XP + level + streak + achievements.

3. AI tutor flow:
- Web calls `/ai/explain`, `/ai/debug`, `/ai/practice`.
- API sends structured tutoring prompt to OpenAI model.
- Response returned as mentor-style guidance.

4. Report card flow:
- `/reports/monthly/current` computes or returns the current month report.
- Skill score = weighted quiz + submission pass-rate + activity score.

## 2. Database Schema (PostgreSQL)

### Core entities

- `users`
- `courses`
- `modules`
- `lessons`
- `quiz_questions`
- `coding_challenges`
- `lesson_progress`
- `submissions`
- `achievements`
- `user_achievements`
- `daily_missions`
- `user_missions`
- `monthly_reports`
- `subscriptions`

### Relationship summary

- `courses 1..n modules`
- `modules 1..n lessons`
- `lessons 1..n quiz_questions`
- `lessons 1..n coding_challenges`
- `users 1..n lesson_progress`
- `users 1..n submissions`
- `users n..n achievements` via `user_achievements`
- `users n..n daily_missions` via `user_missions`
- `users 1..n monthly_reports`
- `users 1..n subscriptions`

## 3. Folder Structure

```txt
.
├─ docker-compose.yml
├─ .env.example
├─ apps/
│  ├─ api/
│  │  ├─ Dockerfile
│  │  ├─ requirements.txt
│  │  └─ app/
│  │     ├─ main.py
│  │     ├─ core/
│  │     │  ├─ config.py
│  │     │  └─ security.py
│  │     ├─ db/
│  │     │  ├─ models.py
│  │     │  ├─ session.py
│  │     │  └─ seed.py
│  │     ├─ schemas/
│  │     ├─ services/
│  │     └─ api/
│  │        ├─ deps.py
│  │        └─ routers/
│  └─ web/
│     ├─ app/
│     │  ├─ login/ signup/
│     │  └─ (student)/
│     │     ├─ dashboard/
│     │     ├─ learn/
│     │     ├─ practice/
│     │     ├─ playground/
│     │     ├─ achievements/
│     │     ├─ report-card/
│     │     ├─ settings/
│     │     └─ admin/
│     ├─ components/
│     └─ lib/
├─ services/
│  └─ code-runner/
│     ├─ Dockerfile
│     └─ app/main.py
├─ scripts/bootstrap.ps1
└─ docs/PyPilot-SaaS-Blueprint.md
```

## 4. MVP Development Plan

### Phase 1 (Foundation)
- Auth, DB schema, seeded curriculum, dashboard shell, JWT security.

### Phase 2 (Core Learning)
- Lesson UI, quizzes, coding challenge submission, XP/levels/streaks.

### Phase 3 (AI + Playground)
- Monaco editor + runner service + AI debug/explain/practice generation.

### Phase 4 (Monetization + Admin)
- Stripe checkout + webhook sync + admin analytics + course controls.

### Phase 5 (Student Retention)
- Daily missions, leaderboard, monthly report cards, analytics tuning.

## 5. Example UI Layout

```txt
+--------------------------------------------------------------+
| Sidebar (Dashboard/Learn/Practice/Playground/...)            |
|--------------------------------------------------------------|
| Top Bar: Student Profile | Level | XP | Logout               |
|--------------------------------------------------------------|
| Main Workspace                                               |
|  - Dashboard cards (XP, level, streak, rank)                |
|  - Progress charts + mission widgets                         |
|  - Learn view with lesson + quiz + coding challenge          |
|  - Playground split: Monaco editor + output + AI debug       |
+--------------------------------------------------------------+
```

## 6. Core Backend Code Areas

- Auth + JWT: `apps/api/app/api/routers/auth.py`
- Core schema: `apps/api/app/db/models.py`
- Gamification logic: `apps/api/app/services/gamification.py`
- Report generation: `apps/api/app/services/reporting.py`
- AI tutor integration: `apps/api/app/services/ai_tutor.py`
- Playground API: `apps/api/app/api/routers/playground.py`
- Secure execution service: `services/code-runner/app/main.py`

## 7. Frontend Starter Code Areas

- Workspace shell: `apps/web/components/shell/app-shell.tsx`
- Auth gate: `apps/web/components/shell/auth-gate.tsx`
- Dashboard: `apps/web/app/(student)/dashboard/page.tsx`
- Learn flow: `apps/web/app/(student)/learn/page.tsx`
- Practice center: `apps/web/app/(student)/practice/page.tsx`
- Playground UI: `apps/web/components/playground/code-playground.tsx`

## 8. Deployment Instructions

### Local (Docker)

1. Copy environment template:
```bash
cp .env.example .env
```
2. Fill secrets in `.env`:
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `API_SECRET_KEY`

3. Start stack:
```bash
docker compose up --build
```

4. Access:
- Web: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`
- Code runner health: `http://localhost:8100/health`

### Production deployment recommendation

- Web: Vercel or Cloud Run (Next.js container)
- API + Runner: AWS ECS / GCP Cloud Run
- DB: Managed PostgreSQL (RDS / Cloud SQL / Supabase)
- Cache/queues (next step): Redis
- File/object storage (next step): S3-compatible
- Monitoring: OpenTelemetry + Grafana/Loki + Sentry
- Secrets: cloud secret manager (never .env in production)

## 9. Security Notes

- JWT auth with hashed passwords (`bcrypt`).
- Code runner has timeout + memory limits and blocked high-risk imports.
- For production hardening, move runner to isolated VM/pod with no outbound network and per-run container isolation.
- Add rate limiting and abuse detection before public launch.

## 10. Immediate Next Production Tasks

1. Add Alembic migrations and CI migration checks.
2. Add Redis-backed job queue for report generation and heavy AI tasks.
3. Add deterministic challenge test runner (unit tests per challenge).
4. Add email verification, password reset, and OAuth providers.
5. Add observability + SLA alerting for AI and code execution latency.
