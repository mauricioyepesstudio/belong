# BELONG — creación confirmada, 2026-10-17

## PROJECT
- Checkout aislado belong-isolated-20261017, base remota 2026-07-16-gbly en 186c034d8a0f12b940bd6b9a66e1735bfa8a204f.
- Ruta /projects/[id]?tab=tasks, loader lib/data/projects → lib/core/projects/project-workspace → ProjectDetailScreen → ProjectTasksTab → createProjectTask.

## STATUS
- El handler captura rechazo de la acción; no muestra éxito ni borra texto/añade tarjeta sin ID confirmado. Conserva lock pendiente, liberación finally y deduplicación del ID ya refrescado.
- Reproducción con acción simulada: rechazar promesa o resolver con taskId ausente/vacío. Antes había rechazo sin manejar o tarjeta sin ID; ahora toast de confirmación incierta, borrador y lista intactos. Éxito con ID confirmado conserva funcionamiento previo.
- Una excepción puede ocurrir después de insertar: aviso pide refrescar antes de reintentar. No garantiza ausencia de escritura ni idempotencia de creación.
- PR10 persistencia f29573d y PR13 Goals 1d8563c confirmados integrados, preservados. PR1/2/8/11/12/23 intactos; no duplicar.

## FILES
- engines/project/components/workspace/tasks-tab.tsx (solo handler)
- engines/project/__tests__/task-create-sync.test.ts
- ESTADO.md y este handoff.

## VALIDATION
- 11 regresiones nuevas PASS: pendiente, error devuelto, rechazo, ID ausente/vacío, retry, doble llamada, éxito y deduplicación tras refresco.
- Suite194 PASS/8 integraciones SKIP. TypeScript, lint focalizado, build producción Next16.2.10 y diff check PASS; warning metadataBase preexistente. Revisión independiente testing/git-release GO. CI y estado preparado/integrado/desplegado/verificado finales: tarea central belong-task-create-failure-20261017.
- Harness del handler real con hooks/acciones simuladas, no DOM ni Supabase/RLS vivo. Sin cuenta/proyecto de prueba autorizado para validar recorrido autenticado; no inventar navegador ni guardado real.
- Sin cambios de JSX/composición/estilos: no rediseño visual para aprobar.

## NEXT ACTION
- Cuenta/proyecto autorizado: crear tarea, simular interrupción, refrescar antes de reintentar y comprobar ID persistido sin perder borrador ante rechazo; revisión de rechazo de Goals como slice separado futuro.

## DO NOT TOUCH
- Env, credenciales, configuración Supabase/Vercel, esquema/RLS, reglas de impacto y módulos ajenos.

## CONTENT
- Se conserva equivalente reciente del13: exec-c305f33d-980a-4667-8bbd-de4ffdb0e19c.png, metas/proyectos/comunidad; QA original documentado. No se afirma disponibilidad de bytes locales tras limpieza, ni se produce duplicado.
- Caption: Una meta clara ayuda a dar el siguiente paso. En BELONG, organiza proyectos y metas con tu comunidad. Empieza aquí: https://belong-ruddy.vercel.app
- Producido/listo para compartir aquí, no programado/publicado. Autorización de cuenta/canal y evidencia del proveedor no verificadas en esta entrega.

## GIT
- Cambio pequeño reversible, cuatro archivos previstos. Commit/PR y SHA de producción finales se registran en cerebro central mediante lease esperado. Sin secretos ni assets alterados.
