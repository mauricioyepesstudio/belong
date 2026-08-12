# BELONG repository map

Read only the documents and modules relevant to the requested change.

## Product truth

- `BELONG_CONSTITUTION.md`: non-negotiable product principles.
- `BELONG_DOMAIN_MODEL.md`: domain relationships and ownership.
- `BELONG_BLUEPRINT.md`: product surface and intended flows.
- `docs/PRODUCT_VISION.md`: audience, value, and experience priorities.
- `docs/ROADMAP.md`: current delivery state.

## Engineering truth

- `docs/ARCHITECTURE.md`: boundaries, engines, routes, and dependency direction.
- `docs/API_SPEC.md`: loaders/actions and returned data.
- `docs/DATABASE_SCHEMA.md`: tables and relationships.
- `docs/COMPONENT_LIBRARY.md`: screens and reusable patterns.
- `docs/DESIGN_SYSTEM.md`: tokens and interface conventions.
- `docs/ANALYTICS.md`: event vocabulary and tracking boundaries.
- `docs/TECHNICAL_DEBT.md`: known legacy code and pre-existing issues.

## Active authenticated Home

Trace the current implementation instead of assuming documentation is current:

1. `app/(platform)/dashboard/page.tsx`
2. `engines/dashboard/data.ts`
3. `engines/belong/data.ts`
4. `engines/belong/components/home/home-screen.tsx`
5. `systems/layout/platform-shell.tsx`
6. `systems/navigation/`

## Domain implementation

- `engines/<domain>/`: domain screens, orchestration, and types.
- `lib/data/`: authenticated loaders.
- `lib/actions/`: server-side mutations and authorization.
- `lib/core/`: shared queries and data composition.
- `systems/design-system/`: primitives and patterns.
- `engines/core/realtime/`: channel lifecycle and hooks.
- `types/database.types.ts`: generated/current database contracts.

When documentation and executable code differ, confirm behavior from the route and implementation, then update documentation only if the task authorizes it.
