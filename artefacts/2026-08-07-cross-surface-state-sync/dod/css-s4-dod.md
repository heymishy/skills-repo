# Definition of Done: Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net

**PR:** https://github.com/heymishy/skills-repo/pull/1020 (merged into `feature/css-s3`, then carried into `master` via PR #1021) | **Merged:** 2026-10-25
**Story:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s4-full-gate-coverage-and-reconciliation-safety-net.md
**Test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s4-test-plan.md
**DoR artefact:** artefacts/2026-08-07-cross-surface-state-sync/dor/css-s4-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-css-s4-gate-vocabulary.js` (22 tests, T1-T7): `GATE_TO_JOURNEY_STAGE`'s keys derived from `gate-map.js`'s own 7-key export (not re-typed); the 5 journey-representable gates map correctly; the 2 CLI-only gates (`branch-complete`, `definition-of-done`) safely no-op with no attempted journey write; a representable gate syncs correctly with no conflict; a genuine conflict is detected and the push is skipped. `tests/check-css-s4-css-s2-vocabulary.js` (8 tests) proves css-s2's own direction (`pipeline-state-github-writer.js`) was already generic across all 7 values — no code change needed there, this is evidence not new logic. `scripts/check-sync-mechanism-is-parameterized.js` + its test wrapper (1 test) structurally confirm one parameterized implementation, not 7 hand-written copies, satisfying this story's own NFR | `integration-real-code` | None |
| AC2 | ✅ (after a material fix found at final review) | `tests/check-css-s4-reconciliation.js` (15 tests, T1-T5): `reconciliation.js`'s `reconcile()` uses the CALLING request's own live context/writer (never a stored credential — T3 proves context passthrough), and replays the gap's OWN stored `storyId`/`stateUpdate` (not whatever the triggering request happens to be writing). **A material defect was found at this story's own final cross-cutting review and fixed before this DoD**: the first implementation replayed the triggering request's own payload instead of the original failed write's payload, meaning an unrelated later request could mark a gap "resolved" without ever recovering the lost data. Fixed in commit `51aa3554` by having `logReconciliationGap` persist the failed write's own `storyId`/`stateUpdate` at log time, with T5 added as a direct regression test (a gap with no stored payload safely no-ops, writer never called) | `integration-real-code` | None in final shipped behaviour — the defect was caught and fixed pre-merge, not a post-hoc gap (see DoD Observations) |
| AC3 | ✅ (correctly scoped as Manual, not yet measurable) | `decisions.md`'s RISK-ACCEPT entry and `css-s4-verification.md`'s Edge case scenario both correctly scope this as requiring 4 weeks of real production usage after the epic merges — it cannot be measured at implementation time, and was never claimed to be. This is the honest-reporting AC itself being honestly reported: "not-yet-measured" is the correct answer right now, not a gap | `manual` (deferred by design) | None — explicitly scoped as deferred from the start, matching the AC's own "honest reporting, not assumed to pass" wording |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded in final shipped behaviour. AC2's own build-time defect (found and fixed before merge) is documented above and in DoD Observations, not treated as a deviation since it never shipped.

---

## Scope Deviations

None. No out-of-scope item (real-time push notifications for reconciliation gaps, any change to `gate-map.js`'s own 7 values or structure) was implemented. Confirmed via this story's own commit history across all 5 tasks — every commit traces to a task in `artefacts/2026-08-07-cross-surface-state-sync/plans/css-s4-plan.md` or a documented review/final-review finding, verified at `/verify-completion` time (`git log --oneline feature/css-s3..HEAD`, 16 commits, zero unexplained).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 tasks' worth, all implemented (structural NFR check, full 7-gate vocabulary test, reconciliation test, css-s2-direction vocabulary test)
**Tests passing in CI:** 46 / 46 across this story's 4 dedicated test files (22 + 8 + 15 + 1)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — gate vocabulary (T1-T7) | ✅ | ✅ | 22 tests, grew from the plan's own loosely-estimated ~19 once the AC2 return-contract fix added 3 more assertions to the same file |
| AC1 — css-s2-direction full-vocabulary proof | ✅ | ✅ | 8 tests (1 structural + 7 gate values) |
| AC1 — structural NFR check (parameterized, not 7 copies) | ✅ | ✅ | 1 test (wrapping a standalone `scripts/` governance script) |
| AC2 — reconciliation (T1-T5) | ✅ | ✅ | 15 tests, grew from an original estimate of 7-9 once the final-review defect fix added T5 as a direct regression test |

**Gaps (tests not implemented):** None. Every task-level test file exceeded its own plan-stage estimate — consistent with this epic's own established pattern (css-s1/css-s2/css-s3's DoDs record the same thing) of plan-time test-count estimates being conservative relative to what review cycles actually surface.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (one parameterized mechanism, not 7 hand-written copies) | ✅ | `scripts/check-sync-mechanism-is-parameterized.js` — structural check, independently re-reviewed for regex robustness (one Important finding — whitespace-brittle regex — found and fixed) |
| Security (no credential storage/reuse in reconciliation) | ✅ | `check-css-s4-reconciliation.js` T3 — context/writer come from the calling request only, `reconcile()`'s own signature has no credential parameter at all after the AC2 fix removed the `storyId`/`stateUpdate` args it previously (incorrectly) took from the caller |
| Audit (reconciliation resolution logged with the same rigor as css-s3's conflict log) | ✅ | `sync_log.resolved_at` tracks resolution state; `reconciliation.js` is pure orchestration over `sync-log.js`'s own data-access functions (matching `conflict-resolver.js`'s real precedent, confirmed by an independent code-quality review after an initial version duplicated `sync_log` SQL access) |
| Accessibility | ✅ N/A | No UI surface change |

---

## Metric Signal

**Measurement-ready gate:** Not yet for m2's own full-vocabulary coverage signal — real usage data across all 5 representable gate types does not exist yet, this story only just merged. **Measurement-ready gate for AC3 specifically: No** (by design — AC3 itself requires a 4-week real-usage window, per the story's own wording).

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|----------------|
| m1: Automatic cross-surface agreement rate | not-yet-measured | css-s4 is the FINAL story of the epic — all 4 stories (css-s1 through css-s4) are now merged and DoD-complete, which is the real precondition for m1 to become measurable. The 90% minimum-validation-signal threshold from `benefit-metric.md` requires a real 4-week production usage window starting now, not at this DoD's own write time | null |
| m2: Conflict-resolution correctness (no silent overwrites) | not-yet-measured | css-s4 extends css-s3's own conflict-resolution mechanism to the 5 representable gates (previously only reachable in css-s1's direction for a single gate) — a real signal still requires an actual conflict to occur under real multi-gate usage | null |

---

## Outcome

**COMPLETE**

No deviations in final shipped behaviour. One material defect (AC2's payload-replay bug) was found at this story's own final cross-cutting review and fixed before merge — the review process working exactly as designed, not a gap that shipped. No test gaps. No unauthorized scope expansion.

**Follow-up actions:**
1. Owner: Hamish King — AC3's own real measurement is now unblocked (all 4 stories merged) but requires waiting out the 4-week real-usage window per `benefit-metric.md`'s own measurement method. Set a reminder/revisit point ~4 weeks from 2026-10-25.
2. Owner: Hamish King — m1/m2's own first real signals depend on the same 4-week window; both remain `not-yet-measured` until then, by design, not as an open gap.

---

## DoD Observations

1. `css-s4` is epic-nested (`css-e1-cross-surface-state-sync`). Per CLAUDE.md's epic-nested story state bookkeeping rule, this DoD's state write is applied directly on `master` after confirming the real merge chain (PR #1020 → `feature/css-s3`, then PR #1021 → `master`) via `gh pr view` and `git log`, not inferred from branch-local state.
2. **This story's own final cross-cutting review found a material, genuinely significant defect** (AC2's reconciliation mechanism replaying the wrong request's payload) — the kind of bug that would have silently defeated the entire reconciliation safety net's purpose (marking gaps "resolved" without ever actually recovering the lost data) had it shipped. Caught specifically because the final review step traces through a concrete end-to-end scenario by hand across all 5 tasks together, not just each task in isolation — the per-task spec-compliance and code-quality reviews that preceded it had each individually approved the code that, combined, produced this defect. This is the single clearest justification in this epic for why the final cross-cutting review step exists as its own distinct gate, separate from per-task review.
3. This DoD completes the epic: all 4 stories (css-s1, css-s2, css-s3, css-s4) are now `dodStatus: "complete"`. Per CLAUDE.md's parent-propagation rule, the epic's own `status` is set to `"complete"`.
4. Both metrics (m1, m2) remain `not-yet-measured` across all 4 stories' DoDs — correctly, since the epic's own walking-skeleton-to-full-mechanism design means no story alone could produce a real signal; only real usage of the now-complete mechanism, over the 4-week window `benefit-metric.md` specifies, can.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net (css-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
