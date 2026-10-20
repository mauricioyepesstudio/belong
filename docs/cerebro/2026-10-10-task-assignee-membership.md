# BELONG — responsables de tareas, 2026-10-10

## Resultado
`createProjectTask` valida que un responsable elegido pertenece al mismo proyecto, igual que ya exige `updateProjectTask`. La consulta filtra por `project_id` y `user_id`; si no encuentra membresía o devuelve error, rechaza la creación antes de insertar tarea, actividad, impacto o revalidar. Las tareas sin responsable y la autorización del creador conservan su comportamiento.

Base remota: `bd34308d6c475e9e94a52c99d30158ac79781b17`; rama aislada `fix/belong-assignee-membership-20261010`. Sin cambios visuales, esquema, RLS, permisos, credenciales o facturación. No se amplía la regla de asignación para propietarios sin membresía explícita. La comprobación en la acción no es una restricción transaccional contra bajas de miembros concurrentes.

## Evidencia y estado
La tarea `belong-task-assignee-20261010` fue reclamada con lease esperado en la [cola central](https://github.com/mauricioyepesstudio/AI-Projects-Control-Plane/blob/agency-coordination-v1/queue.json). Cambio preparado en [PR #17](https://github.com/mauricioyepesstudio/belong/pull/17), con commit funcional `6f462fbc314f31bda5aa3f138615f441e8625e5c`. Este documento acompaña el cambio preparado; la cola registra el cierre con PR, checks, commit integrado, despliegue real y límites de verificación.

ESLint focalizado y diff check: PASS. Vitest: **146 PASS / 8 SKIP**, con **10/10** regresiones nuevas de asignación y **16/16** de persistencia. Los casos nuevos cubren persona externa, miembro de otro proyecto, usuario distinto en el mismo proyecto, error con/sin datos, miembro válido, creación sin responsable, rechazo del creador y título vacío. Revisión independiente de orquestación y release/security: GO. TypeScript y build de producción: PASS (Next.js 16.2.10, 9/9 páginas estáticas). El recorrido autenticado necesita cuenta y proyecto de prueba autorizados de BELONG; no se acredita con mocks o una compilación. No se modifican datos reales para probar.

## Continuidad
PR #10 de persistencia y PR #13 de metas ya están integrados: `goals-tab` confirma progreso después del guardado y conserva el valor previo al fallar. Se preservan #14/#15/#16. Los PR abiertos de Claude #8/#11/#12 no se duplican ni se integran en este slice.

La pieza visual del 9 de octubre ya es reciente y equivalente al objetivo de tareas colaborativas. Archivo `exec-472fef38-f5c2-43ec-900e-4e9599ed3099.png`, producido y revisado; listo para compartir aquí, no publicado en redes. No se produce una copia ni se incorpora a assets de la app. Caption:

> Una idea crece cuando se convierte en trabajo compartido. En BELONG, organiza proyectos, define tareas y construye con tu comunidad. Da tu próximo paso: https://belong-ruddy.vercel.app

## Próximo objetivo
Validar creación sin responsable, asignación a miembro del mismo proyecto y rechazo de una persona externa en un proyecto de prueba autorizado. No presentar el estado desplegado como recorrido autenticado verificado.
