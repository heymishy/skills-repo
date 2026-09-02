# Discovery: Archive Completed Features Out of pipeline-state.json

**Status:** Clarified — awaiting approval
**Created:** 2026-09-03
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude Code (agent, operator-directed — Hamish King)

---

## Problem Statement

`.github/pipeline-state.json` has grown to 1.34MB across 237 features (537+ stories, confirmed via this session's own `check-pipeline-state-integrity.js` runs). It is read in full and rewritten in full on every single state-mutating call across the entire pipeline — `skills advance`, `skills gate-advance`, and every DoR/DoD/verify-completion/branch-complete checkpoint a skill writes. A single feature's delivery through this session alone produced 15+ such full-file writes. The growth is compounding and one-directional: every feature that reaches DoD stays in the file forever, with no removal mechanism, so the file only ever grows, never shrinks. This is real, already-observed friction, not a speculative future concern: the elaborate fetch-master/read-local/merge/write sequence now mandated before every write across this repo's own skills exists specifically because concurrent-worktree writes to this one shared file have already caused real conflicts — the `pcr-s1` ("Pipeline conflict reduction") initiative and the `psms-s1` ("explicit local-first merge") story both exist because of exactly this risk, and both are already shipped, in-force parts of this repo's own delivery discipline today. Every feature added to the live file, forever, increases how often two concurrent stories collide when writing to it.

## Who It Affects

- **Coding agents/sessions driving the pipeline** (e.g. this session) — every state-mutating skill call pays the cost of reading, parsing, and rewriting the full file; multi-worktree concurrent sessions face real merge-conflict risk on this one shared file, and that risk grows with the file's own size and edit frequency.
- **CI jobs that validate pipeline-state.json** — `check-pipeline-state-integrity.js`, the merge-safety checks, `validate-trace.sh --ci` — runtime scales with total historical file size, not with the size of what actually changed in a given PR.
- **Operators using the visualiser/dashboard for governance reporting** (e.g. Hamish King, Platform Owner) — page load and query cost scale with total all-time feature count, not active work in flight.

## Why Now

Real, already-observed friction, not a speculative future concern: the `pcr-s1` and `psms-s1` initiatives — both already shipped, both referenced throughout this session's own inner-loop discipline (every single `/implementation-plan`, `/subagent-execution`, and `/branch-complete` write this session followed the "fetch origin master, read local accumulated fields, merge onto the fetched copy, write back" sequence those two initiatives established) — exist specifically because concurrent writes to this single, ever-growing file have already caused real conflicts. Every feature this pipeline delivers adds permanently to the file with no removal path today; the conflict surface and the per-write cost both grow monotonically with total historical delivery volume, not with active work in flight.

Confirmed via /clarify (git log investigation, 2026-09-03): at least 6 distinct commits in this repo's own history explicitly resolve a `pipeline-state.json` merge conflict (`5d393e3b`, `d1d1de9a`, `7a1fe5e2`, `43b5e3d1`, `349e7e2e`, `d7cff366`) — and one of them (`d7cff366`) explicitly records the *same* failure mode recurring twice within a single session (`res-s1`/`res-s2`, PR #780). This is real, repeated, already-experienced friction, not a one-off — the assumption is resolved.

## MVP Scope

Archive fully-DoD-complete features out of the live `pipeline-state.json` into a separate, dated archive store, keeping the live file limited to active and recently-completed work:

- A script (e.g. `scripts/archive-completed-features.js`) that keeps the **30 most-recently-completed features** (every story `dodStatus: "complete"`, and epic `status: "complete"` where the feature uses epics) live, and moves everything else out of the live `features[]` array into a dated archive file (e.g. `.github/pipeline-state-archive/2026-Q3.json`). Confirmed via /clarify (2026-09-03): as of this discovery, 181 of 237 features (76%) are already fully DoD-complete; keeping the 30 most recent and archiving the remaining 151 would bring the live file from 1.34MB down to roughly ~490KB — directly hitting this discovery's own ~500KB success-indicator target. A keep-N rule bounds live file size directly and predictably, rather than indirectly via a time proxy that behaves differently across fast- vs. slow-moving delivery periods.
- A copy-then-verify-then-remove sequence, never destructive-first: write the archived copy, re-validate it against `check-pipeline-state-integrity.js`'s own rules, and only then remove it from the live file.
- **Confirmed in-scope requirement (via /clarify code investigation):** `dashboards/pipeline-adapter.js`'s own `transform(state)` function must be updated to also read the archive store (or merge archived + live data before transforming) — its `'done'` card rendering for `dodStatus === 'complete'` features depends on completed work staying visible today, and this is the one concrete integration point confirmed to break without this update.
- Any other read path that needs historical data (e.g. `/trace`'s chain-health reporting, `workspace/estimation-norms.md`'s own calibration inputs, retrospective audits) must be able to find archived features — via an index file or a documented lookup convention — rather than silently losing visibility into completed work. (`/trace`/`/improve`'s skill docs showed no equivalent dependency on a quick text search, but should be re-verified against actual runtime behaviour at /definition.)
- `check-pipeline-state-integrity.js` and other CI checks continue to validate only the live file — archived features are, by definition, already fully validated and DoD-complete at archive time, so re-checking them on every CI run adds cost with no new signal.
- A manual or periodically-scheduled trigger, not an automatic step baked into `/definition-of-done`'s own state-write — a smaller, safer first step that avoids adding a new failure mode to the already-multi-step DoD write sequence.

## Out of Scope

- **Splitting the live file into per-feature files** — a materially larger structural change touching every reader/writer (`bin/skills`, dashboards, 6+ CI scripts). Deferred: archiving completed work first may reduce the live file enough that per-feature splitting turns out to be unnecessary.
- **Automatic archiving triggered directly inside `/definition-of-done` or any other skill's own state-write step** — this MVP is a separate, deliberately-run process, not baked into the existing skill flows, so it cannot introduce a new failure mode into DoD's already-complex mandatory write sequence.
- **Retroactively re-validating or migrating the shape of already-archived data** (e.g. normalizing old schema versions before archiving) — archived features are frozen as-is at archive time; schema evolution of old data is a separate concern if it ever matters.

## Assumptions and Risks

Resolved via /clarify (2026-09-03, code investigation): confirmed a real, concrete integration point that WOULD break if archiving is added without updating it. `dashboards/pipeline-adapter.js`'s own `transform(state)` function maps every entry in `state.features` into a visualiser "CYCLE" card, explicitly rendering a `'done'` state for `dodStatus === 'complete'` features (line ~124: `isDone = f.stage === 'definition-of-done' || f.dodStatus === 'complete'`) — the dashboard's own governance/history view depends on completed features staying visible in the live file today. This is now a confirmed MVP requirement, not an open assumption: `dashboards/pipeline-adapter.js` must be updated to also read the archive store (or merge archived + live data before transforming) as part of this story's own scope, not deferred. `/trace` and `/improve`'s own skill docs showed no equivalent full-history dependency on a quick grep, but this should still be re-verified against their actual runtime behaviour at /definition time, not just their skill-doc text.

Resolved via /clarify (2026-09-03): the archive rule is keep-N (N=30 most-recently-completed), not time-based — see MVP Scope.

Risk: a bug in the archive script could silently drop or corrupt a feature's data mid-move — mitigated by the copy-then-verify-then-remove sequence named in MVP Scope, never a destructive-first move.

Risk: this does not fix the underlying per-write cost for *active* features — the live file still gets rewritten in full on every write to any active feature. It only slows the live file's growth rate over time. If the number of concurrently active features itself grows very large, this MVP alone will not be sufficient, and the deferred per-feature-file split (see Out of Scope) becomes the next step.

## Directional Success Indicators

**Live pipeline-state.json size:** Baseline: 1.34MB / 237 features (2026-09-03). Target: stays under a defined ceiling (e.g. ~500KB, or a fixed active-feature-count budget) on an ongoing basis, rather than growing unbounded. Measured via: a file-size check, either in CI or a periodic manual report.

**Merge-conflict frequency on pipeline-state.json:** Baseline: 6 confirmed conflict-resolution commits found across this repo's full git history as of 2026-09-03 (`5d393e3b`, `d1d1de9a`, `7a1fe5e2`, `43b5e3d1`, `349e7e2e`, `d7cff366`), including one explicit same-session recurrence (`res-s1`/`res-s2`). Target: no regression from today, ideally trending down as concurrent write collisions become less likely against a smaller live file. Measured via: the same git-log query (`git log --all --oneline -i --grep="pipeline-state.*conflict\|conflict.*pipeline-state"`) re-run periodically after this change ships, comparing new-conflict rate per unit of delivery volume.

## Constraints

- Must not break any existing skill's state-write mandatory-final-step contract — every skill's own "State update — mandatory final step" section assumes its target feature lives in the live file's `features[]`; archiving must never remove a feature that is still actively receiving writes.
- No new npm dependencies — matches this repo's own established convention, honored across every story delivered this session.
- Must preserve `check-pipeline-state-integrity.js`'s own self-test suite passing in full (80 self-tests, 537+ real stories as of this discovery) — any change to the live file's shape must not break this validation, and the archive mechanism's own correctness should be validated the same way.

---

## Clarification log

[2026-09-03] Clarified via /clarify:
- Q: Archive eligibility rule — time-based threshold, or keep-N-most-recent?  A: Keep-N-most-recent (N=30). Confirmed via investigation: 181 of 237 features (76%) are already fully DoD-complete; keeping the 30 most recent and archiving the rest brings the live file from 1.34MB to roughly ~490KB, matching the success-indicator target directly.
- Q: The merge-conflict-frequency baseline was [UNKNOWN BASELINE] — worth a quick git-log investigation before locking scope, or accept as unmeasured?  A: Quick investigation first. Found 6 confirmed pipeline-state.json conflict-resolution commits in git history, including one explicit same-session recurrence (`res-s1`/`res-s2`, PR #780) — the friction is real and repeated, not speculative.
- Follow-up investigation (not a direct operator question, resolved via code reading): does any existing reader assume `features[]` holds 100% of all-time history? Confirmed yes — `dashboards/pipeline-adapter.js`'s `transform(state)` renders a `'done'` card for every `dodStatus === 'complete'` feature; this dashboard must be updated to also read the archive store as part of this story's own scope, now a confirmed MVP requirement rather than an open assumption.

## Contributors

- Hamish King — Platform Owner
- Claude Code — Agent (investigation, drafting)

## Reviewers

- [Name — Role]

## Approved By

[Name — Role — Date]

---

**Next step:** Human review and approval → /benefit-metric
