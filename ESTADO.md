# ESTADO — BELONG

_Actualizado: 2026-10-01 (revisión inicial del cerebro)_

## Objetivo
Llevar BELONG a beta pública estable: producto social con impacto medible, datos reales y calidad verificable (CI + pruebas).

## Siguiente (máx. 5; una tarea = un PR)
1. **CI mínimo**: GitHub Actions con lint + `tsc` + `vitest` (hoy no existe `.github/`; ROADMAP Fase 3 P0).
2. **Verificar OAuth Google/Apple** en Supabase Auth (commit 87ac6d5 sin validar credenciales; handoff 2026-09-04).
3. **Aplicar/confirmar migración pendiente** `20260916000001_circle_invite_notifications.sql` en el entorno enlazado (commit 4a0d5d2 la dejó "pending").
4. **Migrar `components/features/notifications` → engine** (primer corte de Fase 2; 5 imports, el más usado).
5. **Decidir esquema de imágenes** para proyectos/comunidades/eventos (bloquea Live Builders/Missions al nivel de referencia; requiere decisión humana).

## En curso / Bloqueado
- **Rebuild Fase 2 (ROADMAP: Engine Migration) — parcial**: aún existen 10 carpetas en `components/features/` (circles, collaboration, events, impact, messages, notifications, recommendations, settings, social con imports; `profile` sin imports, borrable) con 25 imports desde 19 archivos. Criterio de salida ("cero imports de components/features") NO cumplido. Existen engines nuevos (circles, social, impact, billing, marketplace) que sí siguen el patrón, pero los legados de la lista de la Fase 2 (events, messages, notifications, settings) no migraron.
- **Rebuild Fase 3 (Calidad) — parcial**: hay 23 archivos de test Vitest (engines ai, impact, identity, opportunity, circles, social…); faltan CI/GitHub Actions, Playwright E2E, Sentry, rate limiting en auth, type-gen en CI. `lib/env.ts` ya se usa (TD-07 parcialmente resuelto). Criterio de salida ("CI verde en cada PR") NO cumplido.
- Nota de ambigüedad: `BELONG_ROADMAP.md` usa otras "Fase 2 Purpose / Fase 3 Vision" (Purpose Engine y Vision Engine): sin código ni migraciones → no iniciadas. Pendiente confirmar a cuál se refiere "rebuild fases 2 y 3".
- Bloqueado: 5 imágenes/arte de misiones (mission-startup, portfolio, community, growth, default) `public/images/missions/mission-*.webp` faltantes (handoff 2026-08-17); aprobación visual humana de secciones del dashboard sin confirmar.
- Bloqueado: de-boxing del hero (handoff 2026-08-17) sin evidencia de cierre en el git log.

## Hecho (desde git log, últimos 30 commits: 2026-08-18 → 2026-09-26)
- Social Core V1, descubrimiento social y experiencia conectada en tiempo real.
- Impact: Belong Score, Impact Passport, Momento Belong streak (+ badge en dashboard).
- Accountability Circles: backend, UI, check-ins, fix de recursión RLS, notificación a invitados.
- Marketplace: imágenes de listados, categoría real, fixes de creación.
- Auth: botones Google/Apple.
- Celebración de colaboraciones confirmadas; fixes de z-index modal y canales realtime.
- Home: sugerencias con personas reales, universo móvil compacto.
- Subagentes de marketing/growth; primera imagen de Instagram alojada (PR #5 mergeado).

## Registro
- 2026-10-01 — Cerebro creado: CLAUDE.md ampliado, ESTADO.md, docs/cerebro/, 2 subagentes. Sin cambios de código.
