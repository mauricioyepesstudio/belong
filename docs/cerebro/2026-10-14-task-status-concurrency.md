# BELONG — estado de tareas y aprobaciones concurrentes, 2026-10-14

## Resultado

En `/projects/[id]`, la aprobación y el movimiento de tareas usan `updateProjectTask`. Antes, dos aprobaciones podían leer el mismo estado `review`, actualizar por ID y registrar ambas actividad/notificación de finalización. Ahora, una escritura que solicita estado exige que siga vigente el estado observado. Si otro cambio ya lo modificó, no devuelve fila y se conserva el error `Task could not be updated`, sin actividad, impacto, notificación, progreso agregado o revalidación de éxito.

Se conservan autenticación, membresía, aprobación por propietario y validación del responsable. Los cambios que no solicitan estado mantienen el comportamiento anterior. PR10 de persistencia y la corrección de `goals-tab` siguen integrados; no hay cambios de UI, esquema, RLS, permisos, secretos, presupuesto ni motores.

## Evidencia y coordinación

Base remota `5f8ec83cf7a798b7390e935da36494f20ab76ae9`, rama principal `2026-07-16-gbly`; checkout aislado `belong-run-20261014`, rama `codex/belong-functional-20261014`. Tarea `target_repository_implementation`: `belong-task-status-cas-20261014`, reclamada con queue/head esperados y ningún otro lease activo de BELONG. PR abiertos #1/#2/#8/#11/#12 preservados.

Tres regresiones con consultas simuladas y estado compartido comprueban: dos aprobaciones con la misma lectura producen una escritura y un registro de finalización; una reapertura obsoleta no sobrescribe un estado nuevo; una edición ordinaria de título/orden mantiene su comportamiento. Persistencia focalizada 30/30; conjunto focalizado 43/43; Vitest completo 160 PASS / 8 SKIP. ESLint focalizado, TypeScript, build y diff aprobados. Orquestación, backend, testing y revisión independiente de release/security GO. El cierre del PR se registra al finalizar en el [cerebro central](https://github.com/mauricioyepesstudio/AI-Projects-Control-Plane/blob/agency-coordination-v1/queue.json).

Estado del código: preparado. El PR, commit integrado, despliegue y SHA real de producción se conservan en la tarea central para distinguir preparación de integración/despliegue/verificación.

## Límites y siguiente objetivo

No hay una cuenta de prueba autorizada ni acceso conectado al proyecto Supabase de BELONG; el conector solo muestra EvolUSA/InMigration. Las 8 integraciones omitidas no se consideran verificadas. Los dobles no prueban RLS ni concurrencia contra PostgreSQL real. La condición de estado no cubre transiciones ABA ni carreras entre agregados de tareas diferentes.

Prueba pendiente: en un proyecto autorizado, dos sesiones del propietario aprueban la misma tarea; recargar y comprobar un registro de finalización y un rechazo de escritura obsoleta. Siguiente slice: corregir `tasks-tab.moveTask`, que mantiene el estado optimista cuando falla un movimiento; no implementado aquí.

## Contenido reciente

Se conserva la pieza de metas producida y revisada el 2026-10-13: `exec-c305f33d-980a-4667-8bbd-de4ffdb0e19c.png`. Objetivo: proyectos, metas y comunidad basados en capacidades reales y paleta del repositorio. Estado: producido, listo para compartir aquí, no publicado en redes. Es reciente y equivalente; no se genera un duplicado el 2026-10-14.

Caption/CTA: Una meta clara ayuda a dar el siguiente paso. En BELONG, organiza proyectos y metas con tu comunidad. Empieza aquí: https://belong-ruddy.vercel.app
