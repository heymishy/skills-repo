# Discovery: Archive Completed Features Out of pipeline-state.json

**Status:** Approved
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

**Critical finding via /clarify audit (2026-09-03): a working archive mechanism already exists, ran once, and was then silently abandoned — this MVP explicitly supersedes it rather than building alongside it.** `scripts/archive-completed-features.js` (207 lines, no external deps, idempotent-aware) archived 21 real features into `.github/pipeline-state-archive.json` on 2026-05-13, cleanly removed from the live file with zero duplication (verified directly). It has not been run since — the live file grew from whatever it was in May to 237 features today with no further archiving, entirely because the trigger was manual and nobody kept running it. Decided (see decisions.md): replace the old script's eligibility rule (`stage === "definition-of-done" && health === "green"`) with keep-N=30, but **preserve the existing archive file location, top-level `archive` pointer convention, and JSON shape** — the 21 already-archived features need no migration, since they're already in the correct, still-valid format.

**Second finding, operator-confirmed (2026-09-03): `dashboards/pipeline-viz.html` — the one dashboard with existing archive-merge logic (`mergeArchivedState()`) — has not actually been used in ~5 months and is being fully deprecated as part of this initiative's own scope**, not kept alive for archive-format compatibility as originally assumed. Confirmed reason (operator, 2026-09-03): it has been fully superseded by the real product's own web UI (`src/web-ui/` — the multi-tenant `wuce` application this repo's own `skills-framework` product is itself dogfooded through, as directly observed during this session's own live Chrome validation of `pdt-1`–`pdt-4`) — not simply neglected, genuinely replaced by a better tool. This does not extend to `dashboards/index.html`/`dashboards/pipeline.html` (the dashboards `pipeline-adapter.js` serves) — only `pipeline-viz.html` specifically has been named as superseded; those two remain in scope for the `pipeline-adapter.js` archive-awareness fix below unless told otherwise. This is real, substantial work, not a one-line deletion: `pipeline-viz.html` has three dedicated pre-commit/CI scripts running on every single commit in this repo today — `.github/scripts/check-viz-syntax.js`, `.github/scripts/check-viz-behaviour.js`, `.github/scripts/check-governance-sync.js` (plus the `.github/scripts/viz-functions.js` module they test against) — and is referenced in `.github/workflows/pages.yml` (deployed to GitHub Pages as part of the whole `dashboards/` directory) and `.github/workflows/copilot-setup-steps.yml` (an error-message reference to its `DEFAULT_GOVERNANCE_GATES` constant). All of this needs to be removed or updated as part of deprecating the file, not just the HTML file itself. Because `pipeline-viz.html` is going away, its own `mergeArchivedState()` no longer constrains the new archive format at all — the format only needs to satisfy the archive script and `dashboards/pipeline-adapter.js` (the dashboard that actually is in active use, per `index.html`/`pipeline.html`).

- A script (replacing `scripts/archive-completed-features.js`) that keeps the **30 most-recently-completed features** (every story `dodStatus: "complete"`, and epic `status: "complete"` where the feature uses epics) live, and moves everything else out of the live `features[]` array into `.github/pipeline-state-archive.json` — same file, same shape, same `state.archive` pointer convention the existing tooling already reads.
- A copy-then-verify-then-remove sequence, never destructive-first: write the archived copy, re-validate it against `check-pipeline-state-integrity.js`'s own rules, and only then remove it from the live file. (The existing script already does this correctly — the new version keeps this property, only the eligibility rule changes.)
- **Confirmed in-scope requirement (via /clarify code investigation):** `dashboards/pipeline-adapter.js`'s own `transform(state)` function (used by `dashboards/index.html` and `dashboards/pipeline.html` — the dashboards actually in active use) has zero archive-awareness today and must be updated to also merge archive data. This is the one dashboard confirmed to need real code changes, and now the *only* one, since `pipeline-viz.html` (see below) is being deprecated rather than updated.
- **New, brought in-scope via operator confirmation (2026-09-03): fully deprecate `dashboards/pipeline-viz.html`**, unused for ~5 months. Concretely: remove the HTML file itself; remove or retarget `.github/scripts/check-viz-syntax.js`, `.github/scripts/check-viz-behaviour.js`, `.github/scripts/check-governance-sync.js`, and `.github/scripts/viz-functions.js` (currently run on every commit via this repo's pre-commit hook — removing the file without removing these would break every future commit); update `.github/workflows/pages.yml` so the Pages deploy no longer ships a dead page; update or remove the `pipeline-viz.html` reference in `.github/workflows/copilot-setup-steps.yml`'s own error message. If `check-governance-sync.js` validates something genuinely useful (keeping `governance-gates.yml` and a `DEFAULT_GOVERNANCE_GATES` constant in sync) independent of `pipeline-viz.html` specifically, that validation's *purpose* may need to move somewhere else rather than being deleted outright — a /definition-time judgment call, not resolved here.
- Retire `scripts/archive-completed-features.js` and its orphaned test files (`tests/check-archive.js`, `tests/check-p4-obs-archive.js`, `tests/check-p4-obs-status.js` — currently not wired into `scripts/run-all-tests.js` at all, silently not running despite one being DoD-complete work) — either replace them with new tests for the keep-N rule, or adapt and re-wire the existing ones if their assertions still apply to the shared parts of the mechanism (the copy-then-verify-then-remove sequence, the archive file shape).
- **New, brought in-scope directly per operator instruction (2026-09-03): an enforcement mechanism so this cannot silently go dormant a second time**, addressing the exact root cause of why the prior mechanism was abandoned (purely manual, no enforcement, nobody remembered to keep running it):
  - A scheduled GitHub Actions workflow (cron, e.g. weekly) that runs the archive script automatically — no human has to remember to trigger it.
  - A CI gate check (in the same family as this repo's existing `watermark-gate.yml`/`assurance-gate.yml` pattern) that fails if the live file's size or feature count exceeds the target ceiling with no recent archive run — a reactive backstop that catches drift if the scheduled job is ever disabled, fails silently, or someone turns it off, which is exactly the failure mode that happened to the prior mechanism.
- Any other read path that needs historical data (e.g. `/trace`'s chain-health reporting, `workspace/estimation-norms.md`'s own calibration inputs, retrospective audits) must be able to find archived features via the existing `state.archive` pointer convention, rather than silently losing visibility into completed work. (`/trace`/`/improve`'s skill docs showed no equivalent dependency on a quick text search, but should be re-verified against actual runtime behaviour at /definition.)
- `check-pipeline-state-integrity.js` and other CI checks continue to validate only the live file — archived features are, by definition, already fully validated and DoD-complete at archive time, so re-checking them on every CI run adds cost with no new signal.

## Out of Scope

- **Splitting the live file into per-feature files** — a materially larger structural change touching every reader/writer (`bin/skills`, dashboards, 6+ CI scripts). Deferred: archiving completed work first may reduce the live file enough that per-feature splitting turns out to be unnecessary.
- **Automatic archiving triggered directly inside `/definition-of-done` or any other skill's own state-write step** — the scheduled-workflow + CI-gate approach (see MVP Scope) achieves the same "don't go dormant" goal without adding a new failure mode to DoD's already-complex mandatory write sequence. A skill-embedded trigger remains deferred.
- **Retroactively re-validating or migrating the shape of already-archived data** — moot for the 21 features already archived in 2026-05, since the format is being preserved rather than changed; would only apply if a future, separate initiative changes the archive format itself.

## Assumptions and Risks

Resolved via /clarify (2026-09-03, code investigation): confirmed a real, concrete integration point that would break if archiving is added without updating it. `dashboards/pipeline-adapter.js`'s own `transform(state)` function maps every entry in `state.features` into a visualiser "CYCLE" card, explicitly rendering a `'done'` state for `dodStatus === 'complete'` features — this dashboard's own governance/history view depends on completed features staying visible, and has zero archive-awareness today (unlike `pipeline-viz.html`, which already has working archive-merge logic). This is a confirmed MVP requirement.

Resolved via /clarify (2026-09-03): the archive rule is keep-N (N=30 most-recently-completed), not time-based — see MVP Scope.

Resolved via /clarify audit (2026-09-03): a working archive mechanism already exists (`scripts/archive-completed-features.js`) and ran successfully once, on 2026-05-13, archiving 21 features cleanly. It was never run again. Root cause: purely manual trigger, no enforcement, nobody remembered to keep running it. This directly informs the new "enforcement mechanism" requirement in MVP Scope (scheduled workflow + CI gate) — without it, this MVP would very plausibly repeat the exact same failure mode a second time.

[ASSUMPTION] A weekly cron cadence for the scheduled archive workflow is an acceptable enforcement interval — unconfirmed, requires /clarify or a /definition-time decision. Too infrequent risks the same slow drift the prior mechanism suffered from (just slower); too frequent adds CI/Action-minute cost for marginal benefit given the live file only grows by a handful of features per week under this repo's own current delivery pace.

Risk: a bug in the archive script could silently drop or corrupt a feature's data mid-move — mitigated by the copy-then-verify-then-remove sequence named in MVP Scope, never a destructive-first move (a property the existing script already has and the replacement must keep).

Risk: this does not fix the underlying per-write cost for *active* features — the live file still gets rewritten in full on every write to any active feature. It only slows the live file's growth rate over time. If the number of concurrently active features itself grows very large, this MVP alone will not be sufficient, and the deferred per-feature-file split (see Out of Scope) becomes the next step.

Risk: the CI gate (fails a PR if the live file exceeds the target ceiling) could itself become a source of the exact merge-conflict friction this whole initiative is trying to reduce, if it fires on an unrelated PR just because nobody has run the scheduled archive job recently. Mitigate by having the gate check trigger (or at least clearly instruct) an on-demand archive run rather than just failing with no remediation path.

## Directional Success Indicators

**Live pipeline-state.json size:** Baseline: 1.34MB / 237 features (2026-09-03). Target: stays under a defined ceiling (e.g. ~500KB, or a fixed active-feature-count budget) on an ongoing basis, rather than growing unbounded. Measured via: a file-size check, either in CI or a periodic manual report.

**Merge-conflict frequency on pipeline-state.json:** Baseline: 6 confirmed conflict-resolution commits found across this repo's full git history as of 2026-09-03 (`5d393e3b`, `d1d1de9a`, `7a1fe5e2`, `43b5e3d1`, `349e7e2e`, `d7cff366`), including one explicit same-session recurrence (`res-s1`/`res-s2`). Target: no regression from today, ideally trending down as concurrent write collisions become less likely against a smaller live file. Measured via: the same git-log query (`git log --all --oneline -i --grep="pipeline-state.*conflict\|conflict.*pipeline-state"`) re-run periodically after this change ships, comparing new-conflict rate per unit of delivery volume.

**Time since last successful archive run (the enforcement indicator — directly targets the prior mechanism's own failure mode):** Baseline: ~113 days as of 2026-09-03 (last run 2026-05-13, never repeated). Target: never exceeds the chosen cron interval by more than one missed cycle — i.e. the scheduled workflow is demonstrably still running, not silently dead the way the prior manual process went unnoticed for ~4 months. Measured via: the archive script's own `archivedAt` timestamp in `.github/pipeline-state-archive.json`, checked by the CI gate itself (see MVP Scope) rather than requiring a separate manual check.

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
- Broader audit (dispatched during /clarify, not a direct operator question): a fork agent audited every other reader of `pipeline-state.json`'s `features[]` for archive impact. Critical finding: a working archive mechanism (`scripts/archive-completed-features.js`) already existed, ran once (2026-05-13, 21 features, clean removal verified), and was never run again — purely manual trigger, no enforcement. Also found `dashboards/pipeline-viz.html` already has working archive-merge logic (`mergeArchivedState()`), unlike `pipeline-adapter.js`.
- Operator instruction (2026-09-03, mid-session, not a formal AskUserQuestion): "We should also ensure that this doesn't repeat again, and enforce a mechanism to keep it trimmed." Resolved by moving the "automatic enforcement" item from Out of Scope into MVP Scope — a scheduled GitHub Actions workflow plus a CI gate backstop, directly addressing why the prior mechanism went dormant.
- Operator instruction (2026-09-03, mid-session): "pipeline viz hasn't been used for 5 months and needs to be fully deprecated." Resolved by adding full deprecation of `dashboards/pipeline-viz.html` (the HTML file, its 3 dedicated pre-commit/CI scripts, and its `pages.yml`/`copilot-setup-steps.yml` references) as an explicit MVP Scope item, and correcting the earlier finding that this file "needs no changes" — it needs full removal instead, which also simplifies the new archive format's own constraints since it no longer needs to satisfy `pipeline-viz.html`'s own `mergeArchivedState()` shape expectations.
- Operator instruction (2026-09-03, mid-session): "That pipeline viz has been fully superseded with Web UI." Confirms the deprecation isn't neglect — `pipeline-viz.html` was genuinely replaced by `src/web-ui/` (the real `wuce` product this repo's own `skills-framework` product is dogfooded through). Scoped narrowly: this does not extend to `dashboards/index.html`/`dashboards/pipeline.html`, which remain in scope for the separate `pipeline-adapter.js` archive-awareness fix unless told otherwise.

## Contributors

- Hamish King — Platform Owner
- Claude Code — Agent (investigation, drafting)

## Reviewers

- Hamish King — Platform Owner

## Approved By

Hamish King — Platform Owner — 2026-09-03

---

**Next step:** Human review and approval → /benefit-metric
