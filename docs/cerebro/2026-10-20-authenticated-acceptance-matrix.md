# Matriz de aceptación autenticada — 2026-10-20

## Alcance

Esta entrega endurece exclusivamente las pruebas de aceptación existentes. No añade funciones,
pantallas, usuarios, migraciones, políticas RLS ni permisos.

Las suites de integración requieren dos cuentas BELONG existentes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `E2E_TEST_EMAIL`
- `E2E_TEST_EMAIL_2`
- `E2E_TEST_PASSWORD`

Si falta cualquiera de esos valores, la aceptación autenticada queda **BLOCKED / SKIP**. Las pruebas
unitarias no sustituyen esta evidencia.

## Matriz

| Dimensión | Evidencia autenticada/RLS | Evidencia local con dobles | Estado en esta ejecución |
| --- | --- | --- | --- |
| Creación | Owner crea proyecto, tarea y meta temporales y vuelve a leer cada fila | Creación de tareas y metas exige fila confirmada antes de éxito | BLOCKED: no hay credenciales BELONG |
| Permisos | Segunda cuenta no puede leer ni modificar trabajo antes de pertenecer; después de unirse recibe el acceso permitido por las políticas actuales | Membresía del actor, pertenencia del responsable y aprobación del owner están cubiertas | BLOCKED: no hay credenciales BELONG |
| Progreso | Miembro guarda estado de tarea y porcentaje de meta y los vuelve a leer | Rechazos, cero filas y efectos posteriores al guardado están cubiertos | BLOCKED: no hay credenciales BELONG |
| Concurrencia | Dos escrituras condicionadas por el mismo estado observado producen una confirmación y una escritura obsoleta sin filas | CAS de estado y locks de UI tienen regresiones focalizadas | BLOCKED: no hay credenciales BELONG |

## Límites de autorización

Las políticas actuales permiten a miembros del proyecto gestionar tareas y metas. La regla
«solo el owner aprueba trabajo completado» se aplica en la acción de servidor, no se atribuye a RLS.
Esta entrega no cambia esa separación.

Las pruebas ya no contienen fallback de `auth.signUp` ni escritura `users.upsert`: solo inician
sesión con cuentas existentes. La limpieza elimina comentarios, likes, tareas y metas únicamente
por los IDs creados por la ejecución; se retiraron los deletes globales.

## Ejecución actual

No hay archivo `.env.local` ni variables Supabase/E2E disponibles en el checkout. Por tanto,
las 11 comprobaciones de integración con Supabase se reportan omitidas, no aprobadas. El siguiente paso es ejecutar
esta matriz contra un proyecto BELONG autorizado con dos cuentas existentes, sin crear usuarios.
