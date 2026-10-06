# ESTADO — BELONG

_Actualizado: 2026-10-01 (revisión inicial del cerebro)_

## Objetivo
Llevar BELONG a beta pública estable: producto social con impacto medible, datos reales y calidad verificable (CI + pruebas).

## Siguiente (máx. 5; una tarea = un PR)
1. **Fase 2 — cierre**: PR #8 (rama `fase2-resto`) mueve todo `lib/data` a `engines/<dominio>` (project, community, events, messages, notifications, settings [ex profile], ai, social/connections, organization, billing, marketplace) y elimina `lib/data` (el barrel no tenía usos). Tras el merge, solo queda revisar "un patrón por ruta" (vistas a `FeatureScreen`) y actualizar `docs/COMPONENT_LIBRARY.md`.
2. **Fase 3 — GitHub Actions**: lint + `tsc` + `vitest` (+ build) en cada PR (hoy no existe `.github/`).
3. Decidir esquema de imágenes para proyectos/comunidades/eventos (requiere decisión humana).
4. Fase 3 P1: type-gen de Supabase en CI y rate limiting en acciones de auth.
5. Fase 3 P0: Playwright E2E (auth, onboarding, dashboard).

## En curso / Bloqueado
- **Bloqueado — requiere al dueño**: migración `20260916000001_circle_invite_notifications.sql` NO aplicada; aplicar con `supabase db push` en el proyecto de BELONG Labs.
- **Requiere al dueño**: OAuth Google verificado 2026-10-02; falta probar Apple y borrar el secreto antiguo de Google en Google Cloud.
- **Rebuild Fase 2 (ROADMAP: Engine Migration) — hecha para `components/features`** (rama `fase2-engines`, PR #7): las 9 carpetas pasaron a `engines/<dominio>/components` (circles, collaboration [nuevo], events, impact, messages, notifications, settings, social; recommendations → opportunity) y `profile` se borró. Cero imports de `components/features`. Fusionado en producción 2026-10-02. Falta: `lib/data` → engines (ver Siguiente).
- **Rebuild Fase 3 (Calidad) — parcial**: hay 23 archivos de test Vitest (engines ai, impact, identity, opportunity, circles, social…); faltan CI/GitHub Actions, Playwright E2E, Sentry, rate limiting en auth, type-gen en CI. `lib/env.ts` ya se usa (TD-07 parcialmente resuelto). Criterio de salida ("CI verde en cada PR") NO cumplido.
- Aclarado: "fases 2 y 3" = `docs/ROADMAP.md`. `BELONG_ROADMAP.md` (Purpose/Vision) es visión de producto futura, no compite.
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
- 2026-10-01 — Respuestas del dueño: roadmap técnico vigente = docs/ROADMAP.md; prioridades reordenadas; bloqueos de migración y OAuth registrados.
- 2026-10-01 — Cerebro creado: CLAUDE.md ampliado, ESTADO.md, docs/cerebro/, 2 subagentes. Sin cambios de código.
- 2026-10-01 — Fase 2: migración components/features → engines (un commit por carpeta; solo mover y reimportar). Rama `fase2-engines`, PR #7.
- 2026-10-02 — PR #7 fusionado. Google OAuth funcionando (Site URL + secreto nuevo); Apple sin probar. Fase 2: todo `lib/data` → engines y `lib/data` eliminado (rama `fase2-resto`, PR #8; un commit por módulo, solo mover y reimportar).
