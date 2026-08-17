\# BELONG — Project Operating Rules



BELONG is a purpose-driven social and collaboration platform.



Primary product principles:

\- Connect people.

\- Encourage constructive collaboration across differences.

\- Turn ideas into projects and measurable positive impact.

\- Optimize for meaningful value, not attention addiction.

\- Preserve real user data and honest metrics.



\## Source of truth



Repository:

C:\\Projects\\belong



Primary branch:

2026-07-16-gbly



Local app:

http://localhost:3000



Authenticated Home:

http://localhost:3000/dashboard



\## Critical safety rules



Never modify unless explicitly requested:

\- .env

\- .env.local

\- Supabase credentials

\- Vercel credentials/configuration

\- Git remotes

\- production secrets



Never:

\- fabricate production metrics

\- create parallel engines when one already exists

\- create duplicate dashboards

\- perform repository-wide refactors for a small task

\- commit visual work before visual approval

\- force push

\- use destructive Git commands without explicit approval



Preserve existing:

\- authentication

\- Supabase

\- Mission Engine

\- Impact Engine

\- Opportunity Graph

\- Communities

\- Projects

\- Organizations

\- Realtime

\- Analytics



\## Team



Use specialized subagents whenever possible:



\- orchestrator

&#x20; Plans and scopes work.



\- frontend-ui

&#x20; Implements React / Next.js / CSS / animation / responsive UI.



\- visual-qa

&#x20; Compares implementation against approved visual direction.



\- backend-supabase

&#x20; Handles database, migrations, repositories and server actions.



\- testing

&#x20; Runs targeted validation efficiently.



\- git-release

&#x20; Reviews diffs and prepares approved commits/releases.



Do not make the main agent perform every role itself.



\## Skills



Use:



/belong-visual

for dashboard and visual fidelity work.



/belong-verify

after implementation.



/belong-handoff

before:

\- ending a session

\- changing computers

\- approaching usage limits

\- switching models/agents



\## Development workflow



For every task:



1\. Orchestrator scopes one small slice.

2\. Correct specialist implements it.

3\. Testing validates it.

4\. Visual QA validates visible changes.

5\. Human visually approves visible work.

6\. Git-release prepares commit.

7\. Commit/push only after approval.



Prefer small reversible changes.



Target:

approximately 15–20 related files maximum per logical change when practical.



\## Visual dashboard rule



The approved BELONG dashboard reference is a visual contract.



For dashboard work:

\- preserve real BELONG data

\- match composition and hierarchy closely

\- do not substitute missing artwork with generic giant icons

\- do not claim visual fidelity because tests pass

\- engineering validation and visual validation are separate



\## Validation



Prefer:

1\. targeted ESLint

2\. targeted tests

3\. TypeScript

4\. full build only when appropriate



Do not repeatedly run expensive checks without reason.



\## Handoff



Always leave enough information for another session/computer to continue without rereading the full repository.



Keep handoffs concise and never include secrets.

