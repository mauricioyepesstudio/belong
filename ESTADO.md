# ESTADO — BELONG

## 2026-10-20 — Decisión del consejo de fundadores: congelar

- Veredicto y razones: `control-plane/consejo/CONSEJO.md` en AI-Projects-Control-Plane (fuente: `consejo.json`).
- **Desarrollo nuevo CONGELADO desde el 20-oct (cj-016).** Solo se aceptan arreglos de errores y seguridad. No se agregan funciones, pantallas ni integraciones hasta que haya evidencia de demanda: 5 conversaciones con organizaciones (academias, bootcamps, iglesias) para círculos de compromiso. El publicador de redes termina el 26-oct y no se renueva sin aprobación.
- Objetivos: Conversaciones con organizaciones para la versión B2B (meta 30 días: 5; 90 días: 5).
- Se desecha si: Sin 1 organización interesada por escrito en 30 días: se archiva como red social de consumo, se apaga el publicador después del 26-oct y queda como caso de estudio del portafolio. Fecha de revisión: 2026-11-19.
- Agentes del consejo instalados en `.claude/agents/`: alianzas-canales, analista-metricas, consejo-director. Reglas: no envían, publican, cobran ni gastan sin aprobación de Mauricio; null = sin medir.
- Tareas:
  - cj-016 · 2026-10-27 · consejo-director: Congelar el desarrollo nuevo de BELONG y anotarlo en su ESTADO.md
  - cj-017 · 2026-11-02 · alianzas-canales: Lista de 10 organizaciones (academias, bootcamps, iglesias) para validar círculos de compromiso y un mensaje borrador
  - cj-018 · 2026-11-19 · Mauricio: Tener 5 conversaciones con organizaciones o decidir archivar

## Evidencia de entrega — 2026-10-20, creación de metas confirmada en servidor

- Base remota `75e6ca6`; PR10/13 y el manejo cliente de creación del PR27 se conservan. `createProjectGoal` solicita el ID insertado antes de devolver éxito y revalidar; error o fila ausente conservan el fallo explícito, sin afirmar que una respuesta incierta significa ausencia de escritura.
- Sin JSX, estilos, esquema, permisos, credenciales, métricas o datos vivos modificados. La herramienta de perfiles demo permanece sin activar.
- Pruebas, TypeScript, build, revisión, PR y commit desplegado se registran al cierre en la tarea central `belong-goal-create-persistence-20261020`. Handoff: `docs/cerebro/2026-10-20-goal-create-persistence.md`. Aceptación autenticada pendiente de cuenta/proyecto autorizados; no presentar integraciones omitidas como aprobadas.
- Creativo equivalente del18 conservado, producido/listo aquí; no programado ni publicado externamente.

## Evidencia de entrega — 2026-10-20, perfiles demo diarios

- Generador `systems/demo-profiles` + `scripts/demo-profiles.ts` + workflow `.github/workflows/demo-profiles.yml` (diario, **apagado** hasta `DEMO_PROFILES_ENABLED=true`). Marcas: `app_metadata.is_demo`, `@demo.belong.app`, bio "🧪 Perfil de prueba.". Borrado en bloque con `delete-all`. Guía: `docs/DEMO_PROFILES.md`.
- 6 tests nuevos PASS; lint y TypeScript PASS. No probado contra Supabase real (sin acceso desde el agente). Pendiente dueño: secrets + variable en GitHub. Sin migraciones.

## Evidencia de entrega — 2026-10-18, confirmación de progreso de metas

- `goals-tab.bumpProgress` captura rechazos inesperados sin alterar metas y evita solicitudes simultáneas para el mismo ID en este componente. Guard liberado siempre; no se afirma exclusión entre sesiones.
- Aviso neutral de confirmación incierta: refrescar antes de reintentar; el servidor podría haber escrito antes de rechazar. Sin cambios de JSX, estilos, servidor, esquema, permisos o secretos. PR10/13 preservados.
- Suite 201 PASS / 8 integraciones SKIP; 10 casos focalizados PASS y lint focalizado/TypeScript PASS. Build, revisión, PR y SHA desplegado se registran al cierre central en `belong-goal-progress-rejection-20261018`.
- Creativo nuevo producido, listo para compartir aquí, no programado ni publicado. Evidencia y caption: `docs/cerebro/2026-10-18-goal-progress-rejection.md`. Aceptación autenticada pendiente de cuenta/proyecto autorizados.


## Evidencia de entrega — 2026-10-17, creación de tareas confirmada

- `tasks-tab.handleCreate` captura rechazos inesperados y exige un ID no vacío antes de mostrar éxito, borrar borrador o añadir tarjeta. Error devuelto, rechazo o confirmación incompleta conservan texto y estado actual; lock liberado y deduplicación preservada.
- Aviso neutral: refrescar el tablero antes de reintentar, porque una excepción posterior a insertar no demuestra ausencia de escritura. No se afirma idempotencia de creación entre peticiones ni se cambia servidor.
- 11 regresiones nuevas PASS; suite194 PASS/8 integraciones SKIP. TypeScript y lint focalizado PASS; build, CI, revisión y SHA real de entrega se registran al cierre en tarea central `belong-task-create-failure-20261017`.
- Sin JSX/estilos, esquema, RLS, permisos, secretos ni presupuesto. PR10/13 ya integrados verificados; pendientes autenticados no se presentan como exitosos. Handoff: `docs/cerebro/2026-10-17-task-creation-confirmation.md`. Pieza equivalente del13 conservada; no publicación externa.

## Evidencia de entrega — 2026-10-16, aprobación y asignación confirmadas

- `tasks-tab.handleApprove/handleClaim` esperan confirmación antes de actualizar tarjeta/responsable. Errores devueltos y promesas rechazadas conservan el estado actual; se elimina el rollback de la lista completa que podía borrar cambios de otras tareas. El guard por ID se comparte con movimiento y se libera siempre; se mantienen propietario, avisos y actividad solo tras éxito.
- Sin JSX, estilos, composición, assets, servidor, esquema, RLS, permisos, secretos ni presupuesto. Scope y release revisados por especialistas: GO para comportamiento, no rediseño visual.
- 15 regresiones nuevas +8 previas focalizadas PASS; suite183 PASS/8 integraciones SKIP. Lint focalizado y TypeScript PASS. Build y CI del commit exacto, PR e integración/despliegue al cierre en tarea central `belong-task-approval-claim-sync-20261016`; no inferir despliegue de este registro de preparación.
- Handoff/reproducción: `docs/cerebro/2026-10-16-approval-claim-confirmation.md`. Falta cuenta/proyecto autorizado para aceptación autenticada; no se afirman navegador, RLS vivo ni bloqueo de asignación entre sesiones. Creativo equivalente del13 conservado; no publicación externa.

## Evidencia de entrega — 2026-10-15, movimiento confirmado de tareas

- `tasks-tab.moveTask` espera confirmación antes de cambiar columna/orden. Errores y excepciones conservan el estado; bloqueo por tarea evita movimientos simultáneos del mismo ID. Propietario, advertencias y callback de éxito preservados.
- Sin cambios de JSX, composición o estilos; sin cambios de servidor, esquema, permisos o secretos. Persistencia y Goals siguen integrados. Otros PR abiertos intactos.
- Ocho regresiones nuevas PASS; suite completa 168 PASS / 8 SKIP. ESLint focalizado, TypeScript, build y diff PASS; revisión independiente GO. PR, integración y despliegue al cierre en la tarea central `belong-task-move-sync-20261015`.
- Evidencia, reproducción y handoff: `docs/cerebro/2026-10-15-task-movement-confirmation.md`. Recorrido autenticado real pendiente de cuenta/proyecto de prueba; no confundir hooks simulados con navegador.
- Creativo del 2026-10-13 conservado por reciente y equivalente; ninguna publicación externa en esta entrega. Siguiente slice separado: rollback de aprobar/reclamar tareas sin sobrescribir cambios de otras tareas.

## Evidencia de entrega — 2026-10-14, estado de tareas concurrente
- Base remota `5f8ec83cf7a798b7390e935da36494f20ab76ae9`. Se preservan PR10 y Goals; PR abiertos #1/#2/#8/#11/#12 no duplicados.
- `updateProjectTask` exige que siga vigente el estado observado cuando solicita un cambio de estado. Una aprobación o reapertura obsoleta no guarda ni registra efectos de éxito. Sin cambios visuales, esquema, RLS, permisos o secretos.
- Tres regresiones nuevas: aprobaciones concurrentes, reapertura obsoleta y edición ordinaria; 160 PASS / 8 SKIP, persistencia 30/30 y focalizados 43/43. ESLint, TypeScript, build y diff PASS; revisión independiente GO. PR/producción al cierre en la tarea central `belong-task-status-cas-20261014`.
- Evidencia y handoff: `docs/cerebro/2026-10-14-task-status-concurrency.md`. Recorrido autenticado pendiente de cuenta/proyecto BELONG; no inventar éxito de integraciones omitidas.
- Contenido del 2026-10-13 conservado por ser reciente y equivalente: producido/listo aquí, no publicado en redes. Próximo slice: error de movimiento optimista de tareas en `tasks-tab`; no corregido en esta entrega.

_Actualizado: 2026-10-13 (entrega focalizada; prioridades históricas de 2026-10-01 conservadas)_

## Objetivo
Llevar BELONG a beta pública estable: producto social con impacto medible, datos reales y calidad verificable (CI + pruebas).

## Siguiente (máx. 5; una tarea = un PR)
1. **Fase 2 — resto de la migración**: `/projects`, `/profile` y datos de `lib/data` → engines (ROADMAP Fase 2; `components/features` ya no existe).
2. **Fase 3 — GitHub Actions**: lint + `tsc` + `vitest` (+ build) en cada PR (hoy no existe `.github/`).
3. Decidir esquema de imágenes para proyectos/comunidades/eventos (requiere decisión humana).
4. Fase 3 P1: type-gen de Supabase en CI y rate limiting en acciones de auth.
5. Fase 3 P0: Playwright E2E (auth, onboarding, dashboard).

## En curso / Bloqueado
- **Bloqueado — requiere al dueño**: migración `20260916000001_circle_invite_notifications.sql` NO aplicada; aplicar con `supabase db push` en el proyecto de BELONG Labs.
- **Bloqueado — requiere al dueño**: OAuth Google/Apple (commit 87ac6d5) no verificado; probar en producción.
- **Rebuild Fase 2 (ROADMAP: Engine Migration) — hecha para `components/features`** (rama `fase2-engines`, PR #7): las 9 carpetas pasaron a `engines/<dominio>/components` (circles, collaboration [nuevo], events, impact, messages, notifications, settings, social; recommendations → opportunity) y `profile` se borró. Cero imports de `components/features`. Falta: `/projects`, `/profile` y `lib/data` → engines (ver Siguiente).
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

## Evidencia de entrega — 2026-10-06, sincronización de metas
- Base verificada: `f29573d882e0001dc2d868834f7b108d08c85637` en `2026-07-16-gbly`. La corrección previa del servidor exige persistencia antes de registrar finalización/impacto.
- Slice local `fix/goal-progress-ui-sync-20261006`: `/projects/[id]`, pestaña Goals, conserva el porcentaje guardado mientras espera la respuesta y si el guardado falla; solo confirma el incremento al guardar y marca 100% como completado. Sin rediseño ni cambios de permisos/esquema.
- Validación local: ESLint focalizado, TypeScript, build y `git diff --check` PASS. Vitest: **129 PASS, 8 SKIP**; 3 regresiones nuevas verifican espera/error, finalización y progreso parcial. Revisión independiente sin hallazgos.
- Límite de evidencia: los tests de UI usan un harness del manejador, no un navegador. Las 8 pruebas Supabase requieren cuentas E2E configuradas y se omiten; el recorrido autenticado real continúa pendiente. Este registro no acredita despliegue de este slice.
- Coordinación: PRs abiertos #8 (migración de loaders), #9 (CI), #11 (E2E) y #12 (rate limiting) pertenecen a Claude; no se duplican aquí. #8 también modifica este documento: preservar sus cambios y este registro al integrar.
- Siguiente objetivo: comprobar en `/projects/[id]` con usuario de prueba autorizado que un guardado rechazado conserva el porcentaje y muestra el error, y que 75→100 confirmado oculta el botón de incremento; completar el recorrido E2E autenticado sin declarar pruebas omitidas como exitosas.


## Evidencia de entrega — 2026-10-09, persistencia de tareas
- Base: `0af8ed55fdabdc9a405ed37c074febfb72f3d91f`, con correcciones previas de persistencia, metas, reapertura de tareas y avisos de progreso preservadas.
- Cambio preparado en `fix/belong-delivery-20261009`: `updateProjectTask` confirma una fila guardada antes de registrar actividad, impacto, notificaciones o recalcular progreso. Un update sin fila ahora devuelve error; no representa trabajo completado. Sin rediseño, esquema, permisos o secretos.
- Evidencia local: lint focalizado, TypeScript, build y diff PASS; Vitest **136 PASS, 8 SKIP**, suite de persistencia **16/16 PASS**. Revisión independiente sin bloqueos. No commit, push ni despliegue desde esta implementación.
- Límite: no hay cuenta de prueba autorizada ni acceso al proyecto Supabase disponibles en este checkout para acreditar el recorrido real; las 8 pruebas de integración se omiten. La compilación no acredita autenticación, RLS o funcionamiento completo en producción.
- Estado vigente de calidad: existe `.github/workflows/ci.yml`; las referencias anteriores a falta de CI son históricas. No se duplica el trabajo de Claude en PRs #8/#11/#12.
- Contenido producido y listo para compartir aquí: `exec-472fef38-f5c2-43ec-900e-4e9599ed3099.png` (2026-10-09), tareas colaborativas y trabajo guardado; no publicado externamente ni incorporado a la app. Caption y evidencia: `docs/cerebro/2026-10-09-task-persistence-gate.md`.
- Siguiente slice: validar que el responsable elegido al crear una tarea pertenece al proyecto, como ya exige la actualización de tareas; no implementado en esta entrega. Siguiente prueba real: usuario autorizado, proyecto de prueba, update rechazado o tarea eliminada, sin impacto/notificación de éxito; confirmar guardado y reapertura con progreso veraz.

## Evidencia de entrega — 2026-10-10, responsables de tareas
- Base remota actual `bd34308d6c475e9e94a52c99d30158ac79781b17`. PR #10 y corrección de `goals-tab` #13 siguen integrados; el progreso se confirma después de guardar. No se duplican los PR abiertos de Claude #8/#11/#12.
- `createProjectTask` ahora comprueba membresía del responsable en el mismo proyecto antes de insertar tarea o registrar actividad/impacto. Una consulta fallida o una persona externa devuelve error. Se conserva la autorización del creador y la creación sin responsable; no hay cambios visuales, de esquema o políticas.
- Validación: ESLint focalizado, TypeScript, build y diff PASS; Vitest **146 PASS / 8 SKIP**, 10 regresiones nuevas; revisión independiente GO. Evidencia y PR: `docs/cerebro/2026-10-10-task-assignee-membership.md`. El cierre con commit integrado, despliegue real y estado de verificación está en la tarea central `belong-task-assignee-20261010`; no confundir cambio preparado con desplegado.
- Se conserva la pieza visual producida el 2026-10-09 por ser reciente y equivalente al objetivo: lista para compartir aquí, no publicada en redes. No se genera un duplicado.
- Próximo objetivo: comprobar creación y asignación/rechazo en proyecto de prueba autorizado. Sigue faltando cuenta de prueba y acceso al proyecto Supabase de BELONG para verificar ese recorrido autenticado; las pruebas omitidas no se declaran exitosas.

## Evidencia de entrega — 2026-10-11, progreso agregado persistido
- Base remota `252fda2e025a0b72f91263923cd924968be40798`. PR #10 y la corrección de `goals-tab` #13 siguen integrados; los PR abiertos de Claude #8/#11/#12 no se duplican.
- `updateProjectTask` confirma que la escritura de `projects.progress` devuelve una fila. Si la tarea quedó guardada pero el agregado falla o no modifica el proyecto, devuelve una advertencia en vez de representar sincronización completa. Sin cambios visuales, de esquema, RLS o permisos.
- Validación: ESLint focalizado, TypeScript, build y diff PASS; Vitest **147 PASS / 8 SKIP**, con persistencia **17/17 PASS**. Evidencia y límites: `docs/cerebro/2026-10-11-project-progress-persistence.md`; cierre real en la tarea central `belong-functional-delivery-20261011`. El recorrido autenticado continúa pendiente de cuenta y proyecto de prueba de BELONG.
- Se conserva la pieza visual producida el 2026-10-09 por ser reciente y equivalente; lista para compartir aquí, no publicada externamente. No se genera un duplicado.
- Próximo objetivo: verificar en un proyecto autorizado que completar/reabrir una tarea conserva la tarea y el porcentaje agregado después de recargar.

## Evidencia de entrega — 2026-10-13, validación del progreso de metas
- Base remota `ef685a1f431a8006d33d02bff5e2251c010f9d70`. PR10 de persistencia y PR13 de `goals-tab` siguen integrados; PR18 de progreso agregado también se conserva.
- `updateProjectGoalProgress` rechaza valores no numéricos o no finitos después de autenticar y antes de consultar o modificar la meta. Evita convertir entradas malformadas en finalización o progreso cero; los números finitos conservan el límite de 0–100.
- Evidencia: `docs/cerebro/2026-10-13-goal-progress-validation.md`; tarea central `belong-goal-progress-validation-20261013` con lease esperado. Sin cambios visuales, de esquema, RLS, permisos o secretos.
- Validación: **157 pruebas PASS / 8 SKIP**, persistencia focalizada **27/27**, sincronización Goals **3/3**; ESLint, TypeScript, build y diff PASS; revisión independiente GO.
- Pieza de metas producida y revisada el 2026-10-13: `exec-c305f33d-980a-4667-8bbd-de4ffdb0e19c.png`; lista para compartir aquí, no publicada externamente. Caption y QA en el cerebro.
- Siguiente prueba: usuario y proyecto de BELONG autorizados, incremento guardado y rechazo sin progreso/actividad/impacto falso. Acceso autenticado real pendiente; no declarar como exitosas las integraciones omitidas.
