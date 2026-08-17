---

name: belong-handoff

description: Create a compact BELONG session handoff so another Claude/Codex session or computer can continue without rereading the repository.

---



\# BELONG Handoff Skill



Use when:

\- ending a work session

\- switching computers

\- Claude usage limit is near

\- another agent/model will continue

\- before leaving unfinished staged work



Create a compact handoff containing only:



\## PROJECT

\- repository path

\- branch

\- current route/task



\## STATUS

\- what was completed

\- what is currently staged/uncommitted

\- what is intentionally not committed



\## FILES

\- exact changed files

\- exact new files



\## VALIDATION

\- typecheck

\- lint

\- tests

\- build

\- browser/visual review



\## CURRENT PROBLEM

\- one concise description



\## NEXT ACTION

\- exactly one next implementation action



\## DO NOT TOUCH

\- environment files

\- credentials

\- Supabase/Vercel configuration

\- unrelated modules



\## REFERENCE

\- approved visual reference path if available



\## GIT

\- current branch

\- clean/dirty state

\- latest relevant commit



Keep the handoff concise.

Do not dump code.

Do not repeat repository history.

Do not include secrets.



