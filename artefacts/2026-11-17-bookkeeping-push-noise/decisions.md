# Decisions: stop bookkeeping push noise (bkn-s1)

**2026-11-17 | FINDING | Three workflows ran on every master push, and for bookkeeping pushes they added nothing**
**Evidence:** in 40 hours there were 148 master pushes, and 442 of the newest 600 master commits touch only `artefacts/`, `workspace/` or `.github/pipeline-state.json`. Each push started Improvement Agent dreaming (149 runs, all failed), Trace Commit (148) and Vulnerability Check (148), and until `ciw-s2` the Pages deploy (76 failed) and Fleet (28 failed). Source: the 2026-11-17 audit, finding 6.

**2026-11-17 | DECISION | Filter by path rather than by commit message**
**Context:** the dreaming and trace workflows already tried to skip themselves with `[post-merge]` message checks, which only stops their own re-trigger loop.
**Decision:** the trigger itself excludes the bookkeeping paths (the staging deploy's list, copied exactly), so no run is started and no runner is used; a vulnerability scan follows the dependency files plus a weekly schedule and a manual start.
**Rationale:** a skipped job still shows as a run and still costs a queue slot; a filtered trigger shows nothing. One list means one meaning of "bookkeeping".

**2026-11-17 | DECISION | Dreaming loses its push trigger now, and its fix stays in `ciw-s1`**
**Decision:** only the trigger is removed. Why it fails when it does run (its commit is pushed to master and the repository ruleset refuses it) is unchanged and still needs the operator's answers on the fine-grained token and the schedule.
**Accepted cost:** dreaming runs only on Mondays and on demand until `ciw-s1`; it was not producing anything on push anyway.

**2026-11-17 | DECISION | A guard makes the rule stick**
`tests/check-bkn-s1-bookkeeping-push-noise.js` T4 scans every workflow: any workflow that triggers on a master push must exclude the bookkeeping paths, with an allow-list that starts empty. A new push workflow without a filter fails the unit chain.

**2026-11-17 | CONSTRAINT | What this does not do**
A merge that touches only the excluded paths (for example a docs-only PR) is no longer traced by Trace Commit. The `CI Chain Status Notify` and `Deploy Group Auto-Rerun` workflows follow other workflows' runs and shrink on their own. Required checks are untouched.
