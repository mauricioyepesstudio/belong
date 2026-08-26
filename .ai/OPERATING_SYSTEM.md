# BELONG AI Operating System v1

## Mission
Run BELONG as an owner-supervised multi-agent product organization. Agents may plan, implement, test, review, and prepare pull requests without requiring Mauricio for routine execution. Human escalation is reserved for material product, security, cost, publishing, credential, legal/compliance, or production decisions.

## Core loop
1. ORCHESTRATOR reads priorities and backlog.
2. PRODUCT decomposes objectives into bounded tasks with acceptance criteria.
3. ENGINEERING/UX/GROWTH agents execute in isolated branches or worktrees.
4. QA + SECURITY validate behavior, tests, auth/RLS, migrations, and regressions.
5. REVIEWER checks evidence against acceptance criteria.
6. PROOF LOOP records evidence and result.
7. APPROVED work may move to Done / PR-ready. Rejected work returns to Rework.
8. OWNER BRIEF reports only completed, in-review, blocked, rejected, risks, cost, and decisions needed.

## Agents
- orchestrator: priorities, dependencies, concurrency, stop conditions
- product: scope, user flows, acceptance criteria
- ux: usability, hierarchy, accessibility, responsive behavior
- frontend: Next.js/UI implementation
- backend: APIs, Supabase, schema, services
- security: auth, RLS, grants, secrets, abuse paths
- qa: automated/manual verification, regression coverage
- community-trust: moderation, belonging/safety mechanics, trust model
- growth: activation, retention, referrals, experiments
- analytics: instrumentation and KPI interpretation
- reviewer: independent acceptance/proof decision

## Owner escalation policy
Do not interrupt the owner for routine bugs, lint, tests, refactors, copy fixes, or implementation choices that are reversible and within existing scope.
Escalate only when one of these is true:
- production deploy, merge to protected/default branch, destructive migration, or irreversible data operation
- secrets/credentials/permissions are required
- external publishing or paid spend is required
- legal/compliance/safety risk is material
- architecture choice materially changes committed product scope
- expected cost exceeds configured budget
- two review cycles fail for the same task

## Task contract
Every task must include: objective, owner-agent, dependencies, files/systems allowed, acceptance criteria, verification commands, evidence required, rollback note, and escalation trigger.

## Proof contract
A task is not Done because an agent says it is Done. Required proof can include tests, SQL validation, screenshots, API responses, migration checks, git diff, commit SHA, and reviewer verdict. The existing Proof Loop is the canonical approval gate.

## Parallelism rules
- Prefer independent worktrees/branches for parallel agents.
- Never let two agents edit the same file concurrently unless the orchestrator explicitly sequences them.
- Migrations are serialized.
- Security and reviewer agents must not be the same execution role that authored the change.

## Morning Owner Brief
Return a compact report:
- Completed
- In review
- Reworked/rejected
- Blocked
- Needs owner decision
- Tests/security status
- PRs/commits
- Cost/tokens when available
- Next autonomous actions

## Initial implementation backlog
1. Formalize machine-readable task schema and agent registry.
2. Connect Proof Loop evidence to task/reviewer records.
3. Add orchestrator queue with dependency/status transitions.
4. Add owner-decision queue distinct from normal blockers.
5. Add consolidated owner brief endpoint/view.
6. Add budget/concurrency/stop controls.
7. Add scheduled runner only after local deterministic execution is proven.

## Non-goals for v1
- Unbounded autonomous production changes
- Autonomous paid spend
- Autonomous credential rotation
- Agents bypassing review/proof
- Large framework migration solely to support agents
