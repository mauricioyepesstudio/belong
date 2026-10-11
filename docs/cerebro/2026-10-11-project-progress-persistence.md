# BELONG — persistencia del progreso agregado, 2026-10-11

## Objetivo
Evitar que una tarea guardada parezca haber sincronizado el progreso del proyecto cuando el `UPDATE` agregado no modificó ninguna fila. `updateProjectTask` conserva la tarea persistida, pero ahora exige que la escritura de `projects.progress` devuelva el proyecto actualizado. Un error de base de datos mantiene su detalle; una respuesta sin fila devuelve una advertencia clara antes de responder.

Base remota `252fda2e025a0b72f91263923cd924968be40798`; checkout aislado `belong-run-20261011`. Sin cambios visuales, de esquema, RLS, permisos, credenciales, facturación o motores. Se preservan PR #10 (persistencia antes de impacto), PR #13 (`goals-tab` confirma progreso tras guardar), PR #14/#15 (reapertura y advertencias), PR #16/#17 y los PR abiertos de Claude #8/#11/#12.

## Evidencia y límites
La tarea central es `belong-functional-delivery-20261011`, reclamada con lease esperado. La validación, PR, commit integrado y despliegue exacto se registran en la cola central al cerrar.

Entrega preparada en [PR #18](https://github.com/mauricioyepesstudio/belong/pull/18), commit funcional `b8ededa521dee6c8c915f6da06207e149b0458e5`.

- ESLint focalizado: PASS, 0 errores.
- Persistencia focalizada: **17/17 PASS**.
- Suite completa: **147 PASS / 8 SKIP**; las ocho integraciones requieren credenciales Supabase.
- TypeScript, build Next.js 16.2.10 (9/9 páginas estáticas) y `git diff --check`: PASS.
- Revisión independiente de orquestación, backend, testing y release/security: GO. Riesgo bajo; el cálculo agregado sigue siendo no transaccional, condición preexistente documentada.

El recorrido autenticado contra Supabase real continúa pendiente porque no hay cuenta ni proyecto de prueba autorizado de BELONG disponible. Las pruebas con dobles verifican el contrato de la acción, pero no acreditan RLS o datos reales. No se modifica `updateProjectMemberRole`: el repositorio no contiene una política `UPDATE` para `project_members`, y corregir permisos está fuera del alcance autorizado.

## Contenido
La pieza visual del 9 de octubre sigue siendo reciente y equivalente al tema de trabajo colaborativo guardado. Archivo `exec-472fef38-f5c2-43ec-900e-4e9599ed3099.png`; estado: producido, listo para compartir aquí, no publicado externamente. No se crea un duplicado ni se incorpora a la aplicación.

Caption:
> Una idea crece cuando se convierte en trabajo compartido. En BELONG, organiza proyectos, define tareas y construye con tu comunidad. Da tu próximo paso: https://belong-ruddy.vercel.app

## Próximo objetivo
Con acceso autorizado, completar o reabrir una tarea en un proyecto de prueba y comprobar que la tarea y el porcentaje agregado coinciden después de recargar. Mantener cualquier fallo agregado como advertencia, sin revertir ni representar falsamente la tarea ya guardada.
