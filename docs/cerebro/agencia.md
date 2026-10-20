# Agencia BELONG — departamentos, agentes y tareas recurrentes

Pedido del dueño (2026-10-20): que BELONG avance cada día en investigación, mejora, desarrollo, pruebas y aprobación, con un departamento por función. Se **reutilizan los 12 agentes existentes** de `.claude/agents/`; se agregan solo `research-analyst` (Investigación) y `estado-keeper` (ESTADO.md al día), que no tenían dueño. Las reglas de `CLAUDE.md` mandan sobre este documento.

Flujo diario: **Investigación → Producto → Ingeniería → QA → Aprobación → (dueño: merge/publicar)**. Crecimiento y Operaciones en paralelo. Cada tarea = un PR pequeño con criterio de aceptación observable. Nada se integra, publica, migra ni cobra sin el OK del dueño.

| Departamento | Agentes | Responsabilidad |
|---|---|---|
| Coordinación | `orchestrator`, `estado-keeper` (nuevo) | Elige el PR del día, evita duplicar PRs abiertos, mantiene `ESTADO.md` |
| Investigación | `research-analyst` (nuevo) | Referentes, demanda, comunidades objetivo; solo lectura con fuentes y fecha |
| Producto y diseño | `orchestrator`, `brand-taste-lead`, `visual-qa` | Tareas pequeñas con aceptación; dirección visual aprobada |
| Ingeniería | `frontend-ui`, `backend-supabase`, `engine-migration-auditor` | Implementa en rama; migración Fase 2 a engines |
| QA y pruebas | `testing`, `visual-qa` | Vitest, TypeScript, lint, build; comparación visual |
| Aprobación y release | `migration-reviewer`, `git-release`, `revenue-compliance-analyst` | Gate de migraciones, PR y riesgos de cobro antes de pedir merge |
| Crecimiento y contenido | `community-growth-strategist`, `social-content-lead`, `brand-taste-lead` | Comunidad, piezas en inglés listas pero no publicadas sin OK |
| Operaciones y datos | `revenue-compliance-analyst`, `estado-keeper` | Métricas honestas (contribuciones aceptadas), costos |

## Tareas recurrentes por departamento

Tomadas de `ESTADO.md` (Siguiente y Bloqueado) y de la cola central al 2026-10-20.

**Coordinación**
1. Cada día: revisar `git log`, PRs abiertos (#1, #2, #8, #11, #12, #23) y la cola central; elegir un solo slice y anotarlo. Aceptación: línea fechada en `ESTADO.md`.
2. Resolver PRs viejos: #8 tiene conflictos, #1/#2 son de agosto; proponer al dueño rebasar o cerrar con motivo.
3. `estado-keeper`: compactar las "Evidencias de entrega" largas en Hecho; mantener Siguiente en máximo 5.

**Investigación**
1. Semanal: 5 comunidades/organizaciones con misión que serían usuarios beta, con fuente pública. Aceptación: tabla en `docs/cerebro/`.
2. Comparativa de 3 productos de colaboración con propósito: qué mide cada uno como "impacto". Aceptación: nota con enlaces.

**Producto y diseño**
1. Decidir el esquema de imágenes para proyectos/comunidades/eventos (Siguiente #3): propuesta con opciones para que el dueño elija.
2. Cerrar los bloqueos visuales: 5 imágenes de misiones faltantes y de-boxing del hero; propuesta + aprobación visual.

**Ingeniería**
1. Fase 2: `/projects`, `/profile` y `lib/data` → engines (Siguiente #1), un dominio por PR.
2. Fase 3 P1: type-gen de Supabase en CI (Siguiente #4); rate limiting ya está en PR #12.
3. Un slice de robustez por día como los recientes (confirmación de servidor antes de mostrar éxito), con regresiones.

**QA y pruebas**
1. Cada PR: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build`; resultado en el PR.
2. Playwright E2E (PR #11) en CI una vez integrado.
3. Aceptación autenticada (12 tareas de la cola central). **Desde 2026-10-20 la cuenta de prueba existe** y está guardada como secretos de GitHub Actions `E2E_USER_EMAIL` y `E2E_USER_PASSWORD` (más `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`). Tarea prioritaria: workflow `.github/workflows/acceptance.yml` **solo manual** (`workflow_dispatch`) que mapea esos secretos a `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD`, inicia sesión con Playwright y recorre las tareas bloqueadas (crear/mover/aprobar tarea, metas, progreso), marcando con prefijo `[E2E]` todo dato que cree y borrándolo al final. Nunca imprimir los secretos ni usar `SUPABASE_SERVICE_ROLE_KEY` desde el navegador. Solo hay una cuenta: las pruebas que necesiten un segundo usuario se marcan "pendiente segunda cuenta", sin crear cuentas.

**Aprobación y release**
1. `migration-reviewer` antes de cualquier migración; `git-release` revisa rama, CI y descripción del PR.
2. `revenue-compliance-analyst`: todo lo que toque Stripe/billing o claims de impacto.

**Crecimiento y contenido**
1. Una pieza por semana en inglés sobre una función real entregada; lista, no publicada sin autorización.
2. Plan de comunidad para la beta: 3 canales y el mensaje de invitación.

**Operaciones y datos**
1. Semanal: contribuciones aceptadas y usuarios activos reales en `ESTADO.md`; `null` = no medido.
2. Workflow de perfiles demo (`DEMO_PROFILES_ENABLED`): mantener apagado hasta que el dueño lo active.

## Lo que solo el dueño puede desbloquear
- Cuenta de prueba de BELONG y acceso a su proyecto Supabase (hoy bloquean 12 tareas).
- Migración `20260916000001_circle_invite_notifications.sql` sin aplicar y la migración de rate limiting del PR #12.
- Verificar OAuth Google/Apple en producción.
- Merges de PRs y publicación en redes.
