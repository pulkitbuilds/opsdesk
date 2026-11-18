# OpsDesk for TBO (Next.js + Postgres, Vercel-ready)
Context-rich, travel-aware ops ticketing MVP: tickets linked by TBOH/agency/intent, routing with audit reasons, side threads with explicit recipients, travel-aware SLA, first-class escalation, insights and uncapped export.

## Stack
Next.js 14 (App Router; API route handlers are the server) · Neon serverless Postgres · jose (JWT cookie session) · bcryptjs. All MIT/Apache-2.0 licensed.

## Run locally
1. Create a free Postgres DB at neon.tech (or use Vercel's Neon integration).
2. `cp .env.example .env.local` and fill `DATABASE_URL`, `AUTH_SECRET` (16+ chars), `DEMO_PASSWORD`.
3. `npm install && npm run dev` → http://localhost:3000. Schema + seed data are created automatically on first request.
`npm test` runs the domain-logic tests. `GET /api/health` checks the DB.

## Deploy on Vercel
1. Push this folder to GitHub → Import in Vercel (framework: Next.js, no extra config).
2. Add Storage → Neon (sets `DATABASE_URL`/`POSTGRES_URL`), or paste your own connection string.
3. Add env vars `AUTH_SECRET` and `DEMO_PASSWORD`. Deploy. Pick the Vercel function region closest to the DB (Project Settings → Functions).

## Demo accounts (password = `DEMO_PASSWORD`, default `demo1234`)
asha@tbo.demo (agent, India) · ben@tbo.demo (agent, UAE) · chitra@tbo.demo (Escalation Manager) · dev@tbo.demo (Lead) · sunrise@agency.demo and gulf@agency.demo (agency requesters). **Change DEMO_PASSWORD for any public deployment.**

## Problems → features
1. Context: ticket fields incl. TBOH/check-in; auto links on TBOH or agency+intent; rule-based intent suggestion (manual override); timeline.
2. Routing: region + priority + availability + load scoring, audit reason on the timeline; triage/my queue/region/intent/escalation views; Lead toggles availability.
3. Side threads: explicit recipient list stored on the thread (not the ticket group), unchanged on transfer; internal notes vs external replies; hidden from requesters.
4. SLA: priority hours, tightened to 2h/6h within 24h/72h of check-in/LCD; at-risk/breached badges; Escalate to EM changes owner/status with timeline entry.
5. Insights: weekly themes with samples; queue health.
6. Data: Postgres persistence; `/api/export` streams all rows by keyset pagination (no cap); indexes on TBOH, agency+intent, status+owner.
7. Roles enforced server-side: requesters see only their agency (and only status events); EM sees escalated tickets; Lead-only export/availability.

## Security notes
Signed httpOnly SameSite=Lax session cookie (8h), bcrypt passwords, parameterised SQL only, input validation on every route, security headers, no secrets in code.

## Assumptions
Single TBO org · demo credentials, no IdP · simulated availability/regions · intent = keyword rules · regional calendar flag not implemented · retention: keep all, archive closed tickets after 12 months (not automated).

## Scaling path
Read replicas + materialized views for dashboards; async export jobs to object storage; Postgres LISTEN/NOTIFY or CDC → SSE/websocket and webhooks (UI currently polls every 20s); partition `events` by month. Cost: one Postgres instance instead of per-add-on API tiers.

## Not built
CSAT, ML intent, webhooks, multi-tenant, login rate limiting, automated archival.
