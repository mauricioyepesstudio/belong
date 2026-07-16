# BELONG

**Build a life that matters.**

Production platform for mission-driven builders — communities, projects, events, and connections in one place.

## Stack

- Next.js 16 · React 19 · TypeScript
- Supabase (Auth, PostgreSQL, RLS)
- Tailwind CSS v4 · Framer Motion

## Quick Start

```bash
cp .env.example .env.local   # Add Supabase credentials
npm install
npm run db:push              # Apply migrations
npm run dev
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/PRODUCT_VISION.md](./docs/PRODUCT_VISION.md) | Product mission and pillars |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | **Frozen** system architecture |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Production roadmap |
| [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | PostgreSQL schema reference |
| [docs/API_SPEC.md](./docs/API_SPEC.md) | Server actions and data loaders |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | UI standards |
| [docs/COMPONENT_LIBRARY.md](./docs/COMPONENT_LIBRARY.md) | Component inventory |

## Architecture (summary)

```
app/          → Routes (thin server pages)
engines/      → Domain logic + screens (dashboard, community, mission, ai, auth)
systems/      → Design system, layout, navigation
lib/core/     → Shared Supabase query primitives
lib/data/     → Server-side page data loaders
lib/actions/  → Server mutations
```

**Import UI from `@/systems/design-system`. Do not fork components.**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Supabase migrations |
| `npm run db:types` | Generate TypeScript types |

## License

Private — all rights reserved.
