# BELONG — entrega focalizada, 2026-10-09

## Objetivo y resultado
Evitar que una actualización sin fila guardada parezca trabajo completado. `updateProjectTask` ahora solicita el ID persistido con `.select("id").maybeSingle()` y devuelve el error de base de datos, o `Task could not be updated` si no vuelve una fila, antes de actividad, impacto, notificación, recálculo de progreso y revalidación.

Base `0af8ed55fdabdc9a405ed37c074febfb72f3d91f`; rama `fix/belong-delivery-20261009`. Cambio preparado en [PR #16](https://github.com/mauricioyepesstudio/belong/pull/16). Integración y despliegue pendientes en este registro; el cierre con commit real, controles y límites se conserva en la [tarea central](https://github.com/mauricioyepesstudio/AI-Projects-Control-Plane/blob/agency-coordination-v1/queue.json), ID `belong-functional-delivery-20261009`. Se conservan los recorridos de reapertura y las advertencias de sincronización de progreso anteriores. No hay cambios visuales, migraciones, grants, secretos ni billing.

## Validación y límites
- ESLint focalizado, TypeScript, build y diff check: PASS.
- Vitest: **136 PASS / 8 SKIP**; persistencia: **16/16 PASS**.
- Tres regresiones nuevas: error de escritura, actualización sin fila y finalización guardada con impacto/notificación/progreso correctos. Los casos de error verifican ausencia de esos efectos y de recálculo/revalidación.
- Revisión independiente de git-release: sin bloqueos.
- No se ha probado este slice en navegador autenticado o contra el Supabase real: no hay cuenta de prueba autorizada ni acceso al proyecto disponibles en este checkout. Las ocho integraciones omitidas no se presentan como exitosas.

## Contenido de crecimiento
Archivo producido y revisado por el coordinador: `exec-472fef38-f5c2-43ec-900e-4e9599ed3099.png`, 2026-10-09. Tema: convertir ideas en tareas colaborativas y trabajo guardado; distinto de la pieza general del 6 de octubre. Ilustración y wordmark de texto, sin inventar logo; paleta del repositorio. Estado: listo para compartir aquí, **no publicado externamente**, no copiado a assets de la app.

Caption:
> Una idea crece cuando se convierte en trabajo compartido. En BELONG, organiza proyectos, define tareas y construye con tu comunidad. Da tu próximo paso: https://belong-ruddy.vercel.app

## Próxima acción
Implementar por separado la comprobación de membresía del responsable en `createProjectTask`, siguiendo el requisito ya existente en `updateProjectTask`. Mantener el trabajo de Claude en PRs #8/#11/#12 sin duplicarlo. La siguiente prueba de producción necesita usuario y proyecto de prueba autorizados; comprobar rechazo sin éxito falso y el guardado/reapertura de trabajo con progreso veraz.
