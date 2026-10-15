# BELONG — movimientos de tareas confirmados, 2026-10-15

## Resultado y reproducción

En `/projects/[id]`, pestaña Tasks, el selector y drag/drop usan `moveTask` en `tasks-tab.tsx`. Antes, la tarjeta cambiaba de columna antes de guardar; una respuesta con error solo mostraba un aviso y dejaba el movimiento aparente en pantalla. Reproducción: iniciar un movimiento, demorar la respuesta de `moveProjectTask` y resolverla con `{ error: "Task could not be updated" }`; el estado local ya había cambiado.

Ahora el estado y orden cambian únicamente después de confirmación. Mientras espera o si hay error/excepción, conserva el estado local existente y no llama al refresco de actividad. Usa actualización funcional, sin restaurar una captura antigua de toda la lista. Conserva la comprobación del propietario para completar tareas y las advertencias de progreso parcial. Un bloqueo por ID evita movimientos simultáneos de la misma tarea y se libera en `finally`; tareas distintas siguen siendo independientes.

No cambia JSX, composición, estilos ni controles. La revisión de orquestación y release lo clasifica como sincronización de comportamiento, no nueva dirección visual. No modifica servidor, esquema, permisos, secretos, presupuesto ni motores. Persistencia PR10, Goals y la condición de estado de PR20 se conservan.

## Validación y límites

Ocho regresiones invocan el handler real del selector con hooks y acciones simuladas: espera/error, éxito, advertencia, excepción/reintento, propietario, bloqueo y liberación por tarea, preservación de otros campos y movimientos independientes. Suite completa: 168 PASS / 8 SKIP por credenciales de integración ausentes. ESLint focalizado, TypeScript, build y diff aprobados. Orquestación, frontend, testing y revisión independiente de release/composición GO.

Los tests no son un navegador ni acreditan el ciclo real de props/`useEffect`, RLS o una sesión autenticada en producción. No hay cuenta de prueba autorizada de BELONG disponible. `handleApprove`/`handleClaim` conservan sus rollbacks existentes y el orden de refrescos del contenedor queda fuera del alcance.

## Coordinación y handoff

Base remota `b07575600c517aff81a95c85eb21644f7eb68496`, rama principal `2026-07-16-gbly`. Checkout aislado `belong-run-20261015`, rama `codex/belong-task-move-sync-20261015`. Tarea `target_repository_implementation`: `belong-task-move-sync-20261015`, reclamada con queue/head esperados; sin otro lease activo de BELONG. PR1/2/8/11/12 intactos.

Estado preparado. [Cola/cerebro central](https://github.com/mauricioyepesstudio/AI-Projects-Control-Plane/blob/agency-coordination-v1/queue.json) registra PR, commit integrado, despliegue y SHA real de producción al completar los controles. Archivos: componente Tasks, test `task-move-sync.test.ts`, ESTADO y este documento. Excluir entorno, dependencias, build y cambios ajenos.

Próximo paso de aceptación: con una cuenta y proyecto de prueba autorizados, mover tarea y rechazar un guardado; comprobar columna/orden intactos, reintentar con éxito y recargar. Siguiente slice separado: preservar cambios de otras tareas cuando falla aprobar/reclamar una tarea.

## Contenido reciente

Se conserva la pieza de metas del 2026-10-13, `exec-c305f33d-980a-4667-8bbd-de4ffdb0e19c.png`, cuyo objetivo es proyectos, metas y comunidad, con paleta y capacidades reales. Su producción y QA están registrados en el cerebro del 13 de octubre; es reciente y equivalente y no se genera un duplicado. No se publica externamente durante esta entrega.

Caption/CTA conservado: Una meta clara ayuda a dar el siguiente paso. En BELONG, organiza proyectos y metas con tu comunidad. Empieza aquí: https://belong-ruddy.vercel.app
