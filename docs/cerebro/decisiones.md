# Decisiones

Registro de decisiones (fecha · decisión · motivo). Fuente: docs/ARCHITECTURE.md, CLAUDE.md, git log.

- 2026-07 · Arquitectura "engines + systems" congelada (v1.0.0-arch) · permitir trabajo paralelo. Importar UI desde `@/systems/design-system`, sin forks.
- 2026-07 · Un solo motor por dominio (Mission, Impact, Opportunity); prohibido crear motores/dashboards paralelos.
- 2026-08 · El dashboard de referencia (`reference/belong-dashboard-reference.png`) es contrato visual; validación visual humana separada de tests.
- 2026-08 · Métricas honestas: sin datos fabricados; huecos de datos se señalan, no se simulan.
- 2026-09 · Impact v1 "compute-on-read" (streak, Belong Score) en vez de tablas precalculadas.
- 2026-09 · Migraciones nuevas = archivo nuevo; las aplicadas no se editan (fix de RLS circles fue migración aparte).
- Flujo: commits solo tras aprobación humana; cambios pequeños, ~15–20 archivos máx.

## Pendiente de completar
- Fecha y motivo de elegir Stripe/modelo de precios.
- Decisión sobre esquema de imágenes (proyectos/comunidades/eventos).
- Cuál de los dos roadmaps (docs/ROADMAP.md vs BELONG_ROADMAP.md) es el vigente.
