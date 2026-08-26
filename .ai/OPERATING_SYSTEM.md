# BELONG AI Operating System v1

## Mission
Run BELONG as an owner-supervised multi-agent product organization. Agents may inspect, plan, implement, test, review, and prepare pull requests only inside the boundaries in `.ai/PROJECT_MANIFEST.yaml`. Production, credentials, public publishing, paid spend, destructive data actions, and cross-project writes remain human-gated.

## Source of truth
Before any task, read `.ai/PROJECT_MANIFEST.yaml`. Refuse execution when repository, path, branch, service identity, or requested scope conflicts with the manifest. Unknown service identifiers block production-facing work; never guess them.

## Core loop
1. ORCHESTRATOR validates identity, scope, dependencies, budget, and stop conditions.
2. PRODUCT converts one objective into bounded task contracts.
3. ENGINEERING, UX, or GROWTH executes in an isolated branch/worktree.
4. QA and SECURITY independently validate behavior, auth/RLS, migrations, regressions, and evidence.
5. REVIEWER compares evidence with every acceptance criterion.
6. Approved work becomes PR-ready; rejected work returns to Rework.
7. OWNER BRIEF reports outcomes, risks, cost, and decisions required.

## Agents
- orchestrator: identity checks, priorities, dependencies, concurrency, stop conditions
- product: scope, flows, acceptance criteria
- ux: usability, accessibility, responsive behavior
- frontend: Next.js/UI implementation
- backend: APIs, Supabase, schema, services
- security: auth, RLS, grants, secrets, abuse paths
- qa: verification and regression coverage
- community-trust: moderation, belonging/safety mechanics
- growth: activation, retention, referrals, experiments
- analytics: instrumentation and KPI interpretation
- reviewer: independent acceptance decision

## Autonomy
- L0 READ: inspect repositories, logs, analytics, configuration names, and public state.
- L1 DEVELOP: isolated branches/worktrees, allowed edits, tests, commits, and PR preparation.
- L2 PREVIEW: non-production preview and QA only after service identity is verified.
- L3 OWNER GATE: merge, production deploy, migrations, destructive operations, spend, public messages, publishing, payments, credentials, or permission changes.

## Escalation
Escalate when an L3 action is required; identity is unknown or mismatched; risk is material; budget is exceeded; architecture changes committed scope; two review cycles fail; or evidence is incomplete.

## Task and proof
Every task must validate against `.ai/task.schema.json`. Done requires independent review and named evidence. Proof Loop is not yet the canonical gate. It stays isolated until local Supabase validation, security review, and owner approval satisfy `.ai/PROJECT_MANIFEST.yaml`.

## Parallelism
Use isolated worktrees. Never allow concurrent edits to the same file. Serialize migrations. Author and reviewer must differ. Stop downstream work on identity, security, or migration failure.

## Owner brief
Report: Completed; In review; Reworked/rejected; Blocked; Owner decision; Tests/security; PRs/commits/evidence; Cost; Next authorized actions.

## Initial backlog
1. Verify port, Supabase ref, Vercel project, production branch, and default branch.
2. Validate task contracts automatically.
3. Add deterministic queue, dependencies, and owner-decision queue.
4. Add consolidated owner brief, budgets, audit, and stop controls.
5. Activate Proof Loop only after its gates pass.
6. Schedule execution only after deterministic local runs pass.

## Non-goals
Unbounded production changes, autonomous spending or credentials, public publishing, cross-project writes, bypassed review, or unvalidated migrations as approval mechanisms.
