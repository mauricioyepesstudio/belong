# BELONG — Component Library

**Status:** Frozen · July 2026  
**Rule:** Import UI from `@/systems/design-system`. Import domain UI from `@/engines/*`.

---

## Import Map

```typescript
// ✅ Correct
import { Button, FeatureScreen, StatCard } from "@/systems/design-system";
import { DashboardScreen } from "@/engines/dashboard";
import { MissionCard } from "@/engines/mission";

// ⚠️ Legacy (do not use in new code)
import { PageHeader } from "@/components/layout";
import { ProjectsView } from "@/components/features/projects/projects-view";

// ❌ Forbidden
import { Button } from "@/components/ui";           // bypass design-system
import { StatCard } from "@/components/platform/..."; // removed duplicate
```

---

## Systems — Design System Patterns

| Component | File | Props (key) | Used by |
|-----------|------|-------------|---------|
| `FeatureScreen` | `patterns/feature-screen.tsx` | label, title, description, action, toolbar, children | Community, Projects, Events, Notifications |
| `SectionPanel` | `patterns/section-panel.tsx` | title, href?, children | Dashboard |
| `StatCard` | `patterns/stat-card.tsx` | label, value, detail?, icon?, href? | Dashboard |
| `ListRow` | `patterns/list-row.tsx` | href?, icon/iconNode, title, subtitle, unread?, meta | Dashboard |
| `SearchField` | `patterns/search-field.tsx` | value, onChange, placeholder | Community |
| `ProgressBar` | `patterns/progress-bar.tsx` | value, animate? | Dashboard, Projects |
| `IconTile` | `patterns/icon-tile.tsx` | icon, variant? | Community, Events |
| `UnreadDot` | `patterns/unread-dot.tsx` | className? | Notifications |
| Notification helpers | `patterns/notification-type.tsx` | type → icon/href | Dashboard, Notifications |

---

## Systems — Layout

| Component | File | Purpose |
|-----------|------|---------|
| `AppShell` | Re-export of `PlatformShell` | Main app chrome |
| `AuthShell` | `layout/shells.tsx` | Login/register backdrop |
| `OnboardingShell` | `layout/shells.tsx` | Onboarding header + bg |
| `PageHeader` | `components/layout/page-header.tsx` | Title block (via systems/layout) |
| `PageTransition` | `components/layout/page-transition.tsx` | Route transition wrapper |

### Layout Chrome (components/layout)

| Component | Purpose |
|-----------|---------|
| `PlatformShell` | Sidebar + header + main + mobile nav |
| `Sidebar` | Desktop navigation |
| `MobileNav` | Bottom tab bar |
| `PlatformHeader` | Mobile top bar |

---

## Systems — Navigation

| Export | Purpose |
|--------|---------|
| `mainNav` | Desktop primary links |
| `secondaryNav` | Account links |
| `mobileNav` | Mobile tab links |
| `platformRoutes` | Middleware protected paths |
| `authRoutes` | Public auth paths |
| `isNavActive()` | Active route detection |
| `withNotificationBadge()` | Inject unread count badge |

---

## Engines — Screen Components

| Component | Engine | Route |
|-----------|--------|-------|
| `DashboardScreen` | dashboard | `/` |
| `CommunityScreen` | community | `/community` |
| `MissionCard` | mission | Dashboard, Profile |
| `BuildGoalBadge` | mission | Dashboard |
| `AIInsightPanel` | ai | Dashboard |

---

## Components — Auth

| Component | File | Server action |
|-----------|------|---------------|
| `LoginForm` | `auth/login-form.tsx` | `signInWithEmail` |
| `RegisterForm` | `auth/register-form.tsx` | `signUpWithEmail` |
| `ForgotPasswordForm` | `auth/forgot-password-form.tsx` | `resetPassword` |
| `OAuthButtons` | `auth/oauth-buttons.tsx` | `signInWithOAuth` |
| `AuthCard` | `auth/auth-card.tsx` | Wrapper layout |

---

## Components — Legacy Feature Views

**Migration target:** move to engines in Phase 2.

| Component | Route | Uses FeatureScreen? |
|-----------|-------|---------------------|
| `ProjectsView` | `/projects` | ✅ |
| `EventsView` | `/events` | ✅ |
| `NotificationsView` | `/notifications` | ✅ |
| `MessagesView` | `/messages` | ❌ (custom layout) |
| `ProfileView` | `/profile` | ❌ |
| `SettingsView` | `/settings` | ❌ |

---

## Components — Onboarding

| Component | File |
|-----------|------|
| `OnboardingFlow` | `onboarding/onboarding-flow.tsx` |

Multi-step: build goal → vision → name → complete. Uses Framer Motion.

---

## Components — UI Primitives

Full list in `components/ui/index.ts`. Re-exported via design-system.

| Active | Reserved (unused) |
|--------|-------------------|
| Avatar, Badge, Button, Card, EmptyState, ErrorMessage, Input, Label, Logo, Separator, Skeleton, Spinner, Tabs, Textarea, Toast | Modal, Dropdown, SuccessAnimation, LoadingOverlay |

---

## Components — Motion

| Export | File |
|--------|------|
| `FadeIn` | `motion/fade-in.tsx` |
| `StaggerList`, `StaggerItem` | `motion/fade-in.tsx` |
| `ScrollReveal` | `motion/fade-in.tsx` (unused) |

---

## Components — Shared

| Component | Status |
|-----------|--------|
| `DashboardSkeleton` | ✅ Used in platform loading |
| `GlassPanel` | ⚠️ Unused — do not use |
| `PageContent` | ⚠️ Unused — do not use |
| Other skeletons | ⚠️ Unused — reserved for per-route loading |

---

## Route → Component Map

| Route | Server page | Client component | Data |
|-------|-------------|------------------|------|
| `/` | `(platform)/page.tsx` | `DashboardScreen` | `engines/dashboard/data` |
| `/dashboard` | redirect → `/` | — | — |
| `/community` | `(platform)/community/page.tsx` | `CommunityScreen` | `lib/data/communities` |
| `/projects` | `(platform)/projects/page.tsx` | `ProjectsView` | `lib/data/projects` |
| `/events` | `(platform)/events/page.tsx` | `EventsView` | `lib/data/events` |
| `/messages` | `(platform)/messages/page.tsx` | `MessagesView` | `lib/data/messages` |
| `/notifications` | `(platform)/notifications/page.tsx` | `NotificationsView` | `lib/data/notifications` |
| `/profile` | `(platform)/profile/page.tsx` | `ProfileView` | `lib/data/profile` |
| `/settings` | `(platform)/settings/page.tsx` | `SettingsView` | `getCurrentProfile` |
| `/login` | `(auth)/login/page.tsx` | `LoginForm` | — |
| `/register` | `(auth)/register/page.tsx` | `RegisterForm` | — |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | `ForgotPasswordForm` | — |
| `/onboarding` | `onboarding/page.tsx` | `OnboardingFlow` | `getCurrentProfile` |
| `/auth/callback` | `auth/callback/route.ts` | — | OAuth handler |

---

## Duplication Register (Frozen — Do Not Reintroduce)

| Removed / deprecated | Canonical |
|---------------------|-----------|
| `components/platform/stat-card.tsx` | `systems/design-system/patterns/stat-card.tsx` |
| `components/features/dashboard/dashboard-view.tsx` | `@/engines/dashboard` |
| `components/features/community/community-view.tsx` | `@/engines/community` |
| `lib/data/dashboard.ts` | `@/engines/dashboard/data` |

---

## Related

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
