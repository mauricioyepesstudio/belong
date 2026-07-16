# BELONG — Design System

**Status:** Frozen · July 2026  
**Canonical import:** `@/systems/design-system`  
**Tokens:** `app/globals.css`

Do not create parallel UI primitives. Extend this system.

---

## Design Philosophy

BELONG UI targets **Apple × Linear × Notion** quality:

- **Dark-first** — deep base, elevated surfaces, subtle borders
- **Quiet confidence** — typography and spacing do the work
- **Purposeful motion** — stagger, fade, progress; respects `prefers-reduced-motion`
- **Glass & glow** — brand violet used sparingly for focus and CTAs
- **Accessible** — focus rings, aria labels, semantic HTML

---

## Color Tokens

Defined in `:root` (`app/globals.css`):

| Token | Usage |
|-------|-------|
| `--bg-base` | Page background |
| `--bg-elevated` | Cards, sidebar |
| `--bg-surface` | Nested surfaces |
| `--bg-hover` / `--bg-active` | Interactive states |
| `--fg-primary` → `--fg-faint` | Text hierarchy |
| `--brand-primary` | CTAs, active nav, accents |
| `--brand-glow` | Hero glow, selection |
| `--success/warning/error/info` | Semantic states |
| `--border-default/subtle/strong` | Borders |

Tailwind aliases: `bg-bg-base`, `text-fg-primary`, `border-border`, `text-brand`, etc.

---

## Typography Scale

| Class | Use |
|-------|-----|
| `.text-display-xl` | Marketing hero (rare) |
| `.text-display` | Page titles |
| `.text-heading-lg` | Section titles |
| `.text-heading` | Card titles |
| `.text-body-lg` / `.text-body` | Body copy |
| `.text-caption` | Secondary text |
| `.text-micro` | Labels, metadata |
| `.text-label` | Eyebrow labels (uppercase) |
| `.text-gradient` | Brand gradient text |

**Font:** Geist Sans (via `next/font`), Geist Mono for code.

---

## Spacing & Layout

| Token | Value | Use |
|-------|-------|-----|
| `--sidebar-width` | 272px | Desktop nav |
| `--header-height` | 60px | Top bar |
| `--mobile-nav-height` | 68px | Bottom tab bar |

**Platform content:** `max-w-7xl` centered, `px-4 md:px-6 lg:px-8`, `py-6 md:py-8 lg:py-10`

---

## Radius & Shadow

| Token | Use |
|-------|-----|
| `--radius-sm` → `--radius-3xl` | Components |
| `--shadow-sm/md/lg` | Elevation |
| `--shadow-glow` | Brand emphasis |

Default card radius: `rounded-2xl`. Buttons/inputs: `rounded-xl`.

---

## Surfaces

### Standard card
```
border border-border-subtle bg-bg-elevated rounded-2xl
hover:border-border hover:bg-bg-surface (interactive)
```

### Glass panel (`.surface-glass`)
Blur + semi-transparent background + inner highlight. Use for onboarding inputs, overlays.

### Hero band (dashboard)
Gradient overlay `from-brand/10` + elevated card container.

---

## Motion

| Utility | Use |
|---------|-----|
| `FadeIn` | Page section entrance |
| `StaggerList` / `StaggerItem` | Grid/list reveals |
| `animate-aurora` | Background ambient (onboarding, hero) |
| `animate-shimmer` | Skeleton loading |
| Progress bar | Spring width animation (800ms) |

**Easing:** `--ease-out` / `[0.21, 0.47, 0.32, 0.98]`  
**Rule:** No motion for motion's sake. One animation per viewport section max.

---

## Component Patterns (Design System)

Import from `@/systems/design-system`:

| Pattern | Purpose |
|---------|---------|
| `FeatureScreen` | Standard page: header + toolbar + content |
| `SectionPanel` | Dashboard section with "View all" link |
| `StatCard` | Metric tile with optional href |
| `ListRow` | Avatar/icon + title + subtitle row |
| `SearchField` | Consistent search input |
| `ProgressBar` | Project progress |
| `IconTile` | Rounded icon container |
| `UnreadDot` | Notification indicator |
| `getNotificationIcon/Href` | Type → icon/route mapping |

---

## Primitives (via design-system re-export)

From `components/ui/` — **do not import `@/components/ui` directly in feature code**:

| Primitive | Variants |
|-----------|----------|
| `Button` | default, secondary, ghost, destructive; sm/lg; isLoading |
| `Badge` | default, brand, success, warning, error, outline |
| `Card` | Header, Title, Content, Footer |
| `Input`, `Textarea`, `Label` | Form fields |
| `Tabs` | With optional counts |
| `Avatar` | sm/md/lg/xl; image or fallback initials |
| `EmptyState` | icon, title, description, action (href or onClick) |
| `Skeleton` | Loading placeholders |
| `Toast` | Global via `ToastProvider` |

---

## Reserved / Unused Primitives

These exist in `components/ui/` but are **not approved for use** until design review:

- `Modal`
- `Dropdown`
- `SuccessAnimation`
- `LoadingOverlay`

Do not use in new code without adding to this doc.

---

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Use `FeatureScreen` for new pages | Copy-paste PageHeader + layout |
| Use design-system patterns | Duplicate StatCard, ListRow, etc. |
| Use semantic tokens | Hardcode hex colors |
| Match existing hover/focus states | Invent new border styles per screen |
| Use `EmptyState` for zero data | Inline "no data" text in cards |

---

## Related

- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) — full inventory
- [ARCHITECTURE.md](./ARCHITECTURE.md) — where UI code lives
