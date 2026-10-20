# Owner Statements SaaS — BELONG project handoff

Updated: 2026-10-19
Coordination task: `belong-owner-saas-update-20261019`
Status: prepared for authenticated project registration; **not inserted into BELONG**.

## Project fields

Working name: **Owner Statements SaaS**. This is a descriptive working title, not a registered brand.

### English description

A bilingual monthly-close and owner-reporting product for property managers. Import existing spreadsheets and statement PDFs, match records to units using an external property identifier, review expense differences, approve matching records in batches, and publish statements and annual documents to each authorized owner. A functional pilot exists; the next phase validates commercial demand and prepares secure customer-separated deployments. Production readiness, automated integrations, and financial time savings remain to be verified.

### Descripción en español

Producto bilingüe de cierre mensual e informes para administradores de propiedades. Importa hojas de cálculo y PDFs existentes, relaciona registros con unidades mediante un identificador externo, permite revisar diferencias de gastos, aprobar coincidencias por lotes y publicar estados y documentos anuales para cada propietario autorizado. Existe una base funcional de piloto; la siguiente fase validará demanda comercial y preparará instalaciones seguras separadas por cliente. La preparación para producción, las integraciones automáticas y el ahorro de tiempo siguen pendientes de verificación.

Suggested project status after registration: `active` only while work is actually underway. Do not invent a completion percentage, deadline, team membership, revenue, customer count, or project UUID.

## Implementation record and boundaries

The pilot work reported in the project handoff includes:
- Administrator and owner flows with unit-scoped document access.
- Monthly spreadsheet import, unit identifier mapping, expense review, reconciliation, and batch approval.
- Bulk statement upload and extraction for supported text-PDF layouts, with review before publication.
- Monthly statements and annual documents, with administrative removal/replacement workflows.
- English default and Spanish language option; mobile-adapted portal.
- Persistent pilot storage and backup/restore checks reported previously.

This document does not execute the pilot, rerun its tests, or certify those capabilities as production-ready. The previous external presentation environment is intentionally paused. Do not restore its access as part of BELONG registration.

Planned, not completed:
- Independent brand and synthetic demonstration data.
- Customer isolation, production authentication/recovery, monitoring, and restoration verification.
- Repeatable import templates, extraction confidence and source references.
- Controlled paid validation and measured before/after close times.
- Commercial subscription billing and support limits.
- Native store applications and external software/mail automation, only after separate implementation and verification.

No Make scenario, email connector, property-management software integration, store listing, or autonomous development agent is represented here as active.

## Proposed goals for BELONG

Create these through the existing project workspace after the owner has registered or identified the project. Goals are proposals, not completed impact:
1. Prepare an independent demonstration using fictional units and documents; verify both languages.
2. Verify isolation, permissions, private document access, and backup restoration on the candidate customer environment.
3. Measure a baseline and resulting monthly-close time on an authorized sample.
4. Conduct customer discovery and seek two paid pilot commitments; these are targets, not forecasts.
5. Publish an evidence-backed release checklist distinguishing working, tested, and planned features.

## Safe registration flow

The route is BELONG's authenticated `/projects` workspace. This is a real domain record, not a hardcoded portfolio card.

1. Authenticate as Mauricio using his existing BELONG account. Verify the current profile.
2. Find an existing project owned by that profile before creating one, to avoid duplicates.
3. Confirm an existing community in which the profile is a member. Do not invent a community ID, create memberships silently, or impersonate an owner.
4. If a matching project exists, use the existing owner-authorized `updateProject` action to update its name/description as appropriate.
5. Otherwise use `createProject({ name, communityId, description })`. Ownership and organization are resolved by the existing action. It creates `project_members` and preserves domain analytics/impact behavior.
6. Add a concise development post through `createProjectPost` only once the project exists and membership is verified. That action can notify the project owner; follow the current task's communication authorization before using it.
7. Verify the returned project ID and reopen the genuine `/projects/[id]` record to confirm persistence, ownership, text, and permissions.
8. Record the actual project URL and verification date in the central coordination task only after success.

Do not use a service-role bypass, direct unauthenticated insert, public mock dataset, seed migration, or parallel project catalog to make this appear complete.

## Access blocker and checks performed

- Inspected repository `AGENTS.md`, the BELONG product engineering skill and repository map, `CLAUDE.md`, and the executable `lib/actions/projects.ts` contract.
- `createProject` requires a current profile and community membership. `updateProject` requires the current profile to own the existing project.
- A verified authenticated BELONG owner session, matching project ID, and eligible community are not available in this execution.
- The connected database inventory did not provide a verified BELONG database. No unrelated database was modified.
- A local-path read on the selected remote workstation returned ENOENT; it is not evidence that the repository or production app is missing.
- This handoff contains no database writes, application code, schema changes, authentication changes, private documents, credentials, presentation links, or live pilot links.
- Runtime, browser, database, build, and integration checks are **not run for this documentation-only change**.

Next operator action: resume the existing coordination task and register/update the real project through an authorized BELONG session, then verify the saved record. Do not mark registration as completed from the presence of this file.
