\# BELONG — Project Operating Rules



BELONG is a purpose-driven social and collaboration platform.



Primary product principles:

\- Connect people.

\- Encourage constructive collaboration across differences.

\- Turn ideas into projects and measurable positive impact.

\- Optimize for meaningful value, not attention addiction.

\- Preserve real user data and honest metrics.



\## Source of truth



Repository:

C:\\Projects\\belong



Primary branch:

2026-07-16-gbly



Local app:

http://localhost:3000



Authenticated Home:

http://localhost:3000/dashboard



\## Critical safety rules



Never modify unless explicitly requested:

\- .env

\- .env.local

\- Supabase credentials

\- Vercel credentials/configuration

\- Git remotes

\- production secrets



Never:

\- fabricate production metrics

\- create parallel engines when one already exists

\- create duplicate dashboards

\- perform repository-wide refactors for a small task

\- commit visual work before visual approval

\- force push

\- use destructive Git commands without explicit approval



Preserve existing:

\- authentication

\- Supabase

\- Mission Engine

\- Impact Engine

\- Opportunity Graph

\- Communities

\- Projects

\- Organizations

\- Realtime

\- Analytics



\## Team



Use specialized subagents whenever possible:



\- orchestrator

&#x20; Plans and scopes work.



\- frontend-ui

&#x20; Implements React / Next.js / CSS / animation / responsive UI.



\- visual-qa

&#x20; Compares implementation against approved visual direction.



\- backend-supabase

&#x20; Handles database, migrations, repositories and server actions.



\- testing

&#x20; Runs targeted validation efficiently.



\- git-release

&#x20; Reviews diffs and prepares approved commits/releases.



Marketing/growth department (never touches application code):



\- community-growth-strategist

&#x20; User acquisition, positioning, growth strategy.



\- social-content-lead

&#x20; BELONG's own external social/marketing content, not the product's in-app social features.



\- brand-taste-lead

&#x20; Visual identity and brand-taste judgment; reviews, never implements.



\- revenue-compliance-analyst

&#x20; Billing/revenue health and basic legal/privacy review. Read-only, never touches Stripe or payment code.



Do not make the main agent perform every role itself.



\## Skills



Use:



/belong-visual

for dashboard and visual fidelity work.



/belong-verify

after implementation.



/belong-handoff

before:

\- ending a session

\- changing computers

\- approaching usage limits

\- switching models/agents



\## Development workflow



For every task:



1\. Orchestrator scopes one small slice.

2\. Correct specialist implements it.

3\. Testing validates it.

4\. Visual QA validates visible changes.

5\. Human visually approves visible work.

6\. Git-release prepares commit.

7\. Commit/push only after approval.



Prefer small reversible changes.



Target:

approximately 15–20 related files maximum per logical change when practical.



\## Visual dashboard rule



The approved BELONG dashboard reference is a visual contract.



For dashboard work:

\- preserve real BELONG data

\- match composition and hierarchy closely

\- do not substitute missing artwork with generic giant icons

\- do not claim visual fidelity because tests pass

\- engineering validation and visual validation are separate



\## Validation



Prefer:

1\. targeted ESLint

2\. targeted tests

3\. TypeScript

4\. full build only when appropriate



Do not repeatedly run expensive checks without reason.



\## Handoff



Always leave enough information for another session/computer to continue without rereading the full repository.



Keep handoffs concise and never include secrets.




---

## Cerebro (segundo cerebro del proyecto)

Este proyecto lo resume el cerebro central (AI-Projects-Control-Plane) cada lunes; mantener ESTADO.md al día.

Estado y prioridades: `ESTADO.md`. Contexto de negocio/marca/decisiones: `docs/cerebro/`.

### Qué es y para quién
BELONG es una plataforma social y de colaboración con propósito ("Build a life that matters"): conecta constructores, convierte ideas en proyectos y mide impacto real. Público: personas y organizaciones orientadas a misión (builders, comunidades, creadores). Detalle: `docs/PRODUCT_VISION.md`.

### Stack
Next.js 16 · React 19 · TypeScript · Supabase (Auth, Postgres, RLS, Realtime) · Tailwind v4 · Framer Motion · Stripe (billing) · Vitest. Despliegue en Vercel.

### Capacidades (solo lo que el código justifica)
- Auth email + Google/Apple (UI cableada; credenciales de proveedor sin verificar → propuesta de validación).
- Comunidades, proyectos, eventos, mensajes, notificaciones, conexiones (`lib/actions`, `lib/data`).
- Mission Engine, Impact Engine (Belong Score, Impact Passport, Momento Belong streak), Opportunity Graph.
- Accountability Circles (membresía, check-ins, invitaciones con notificación).
- Marketplace (listados con imagen y categoría), Organizaciones, Billing/Stripe (`engines/billing`, `app/api/webhook`).
- Social Core V1, feed global, Home/dashboard con "universo", Live Builders, Impact Ripple.
- AI Copilot basado en reglas (`engines/ai`); LLM real = **propuesta** (ROADMAP Fase 5).
- Engines Purpose y Vision (BELONG_ROADMAP fases 2–3): **propuesta**, no hay código.
- App móvil, API REST `/api/v1`: **propuesta**, no existen.

### Lo que no se toca
Ver "Critical safety rules" arriba (.env*, credenciales Supabase/Vercel, remotes, secretos) y no modificar migraciones ya aplicadas; las nuevas van como archivo nuevo.
