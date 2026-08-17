---

name: belong-verify

description: Validate a BELONG change efficiently without wasting context or rerunning unnecessary full-project checks.

---



\# BELONG Verification Skill



Use after implementation work.



Validation order:



1\. Identify changed files.

2\. Run ESLint only on changed frontend files where possible.

3\. Run targeted tests for the changed subsystem.

4\. Run:

&#x20;  npx tsc --noEmit -p tsconfig.json

5\. Run full production build only when:

&#x20;  - the slice is complete

&#x20;  - routing/config changed

&#x20;  - release/commit is being prepared

&#x20;  - explicitly requested



For visual work also verify:



\- localhost page loads

\- no console errors

\- no horizontal overflow

\- interactive controls work

\- keyboard focus works

\- reduced motion is respected

\- real data still renders



Return only:



ENGINEERING

\- typecheck: PASS/FAIL

\- lint: PASS/FAIL

\- tests: PASS/FAIL

\- build: PASS/FAIL or NOT REQUIRED



VISUAL

\- reviewed route

\- regressions

\- remaining differences

\- approval recommendation



Do not edit product code unless explicitly asked to fix a validation failure.

Do not commit.

Do not push.



