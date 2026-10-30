# Definition of Done: Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture

**PR:** [#1043](https://github.com/heymishy/skills-repo/pull/1043) | **Merged:** 2026-10-30
**Story:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s2-journey-js-fixture-retrofit-batch.md
**Test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s2-journey-js-fixture-retrofit-batch-test-plan.md
**DoR artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s2-dor.md
**Assessed by:** Copilot
**Date:** 2026-10-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 4 files migrated (`check-ep1-s3-journey-backfill.js`, `check-ep1-s4-stage-routing.js`, `check-ep1-s5-error-handling.js`, `check-pan-s1-product-aware-navigation.js`). Fresh re-run on merged master (this session): 10/0, 23/0, 8/0, 29/0 — all identical to pre-migration baselines. | integration-real-code | None |
| AC2 | ✅ | Fresh re-run on merged master: `node scripts/check-journey-fixture-usage.js` reports PASS (0 findings) for all 4 migrated files. | integration-real-code | None |
| AC3 | ✅ | Full suite passed cleanly on PR #1043's CI (8/8 checks). Local fresh spot-check on master shows the same known pre-existing `check-pipeline-state-integrity.js` failure only, no new failures. | integration-real-code | None |
| AC4 | ✅ | Fresh re-sweep on merged master (this session): raw flagged count = 13 (12 real candidates + the 1 synthetic `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` fixture, never a real target). 12 is within the target 11–13 range for a 4-file batch. | integration-real-code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. One real finding surfaced and handled correctly during delivery, not a deviation from this story's own scope:

**Mock-shape mismatch found and fixed during Task 5 (`check-pan-s1-product-aware-navigation.js`):** the shared fixture's default `tenantId` (`'t1'`) didn't match this test's own seeded data (`'tenant-1'`), which `handleGetJourney`'s real tenant filter depends on. Fixed with an explicit session override, independently verified against the real filter logic in `src/web-ui/routes/journey.js` by two separate review passes (not guessed or assumed compatible) before this PR opened. This is exactly the kind of silent-divergence risk this epic exists to close, caught before merge rather than shipped as a regression.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4
**Tests passing in CI:** 4/4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Each migrated file reports 0 findings | ✅ | ✅ | Fresh re-run this session, all 4 files |
| Hand-rolled count drops by batch size | ✅ | ✅ | Fresh re-sweep this session: 16→12 |
| Each migrated file's assertions pass unchanged | ✅ | ✅ | Fresh re-run this session, all 4 files |
| Full regression suite, no new failures | ✅ | ✅ | PR #1043: all 8 CI checks passed |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none identified | N/A | Per story NFRs |
| Security — tests/ only, no src/ change | ✅ | `nfr-profile.md`: confirmed all 4 stories' deliverables live under `tests/`/`scripts/` only (shared entry, re-confirmed at this DoD) |
| Accessibility / Audit | N/A | No UI, not applicable |

All NFRs verified — no gaps.

---

## Metric Signal

**m2 — journey.js fixture duplication (continued):** Measurement-ready? **Yes.**

> **journey.js fixture duplication, continued (m2)**
> Signal: on-track
> Evidence: Count dropped from 16 to 12 hand-rolled files (fresh re-sweep this session, matching PR evidence) — within the target range (11–13) for a 4-file batch, meeting the minimum validation signal ("at least 3 files migrated, full suite stays green throughout"). 4 files migrated (exceeding the minimum of 3), full suite remained green throughout delivery (confirmed via CI and this DoD's own fresh re-run).
> Date measured: 2026-10-30

**m7 — Divergence-bug incidence (cross-cutting):** Measurement-ready? **Not yet.**

> **Divergence-bug incidence (cross-cutting, extended scope) (m7)**
> Signal: not-yet-measured
> Evidence note: Same as `tfhc-s1`'s own DoD — this metric's measurement window is stories AFTER this MVP ships, not the MVP itself. This story's own delivery is itself a positive data point for the metric's underlying premise: a real divergence risk (the `tenantId` mock-shape mismatch above) was caught and fixed *before* merge by this story's own review discipline, not shipped as a new `ctpl-s1`-class bug.
> Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Migrating the remaining 12 of 16 hand-rolled `journey.js` files beyond this batch — explicit fast-follow per `discovery.md` Out of Scope item 1. No ticket filed yet.

---

## DoD Observations

1. **Already logged `/improve` candidates (carried over from `tfhc-s1`'s DoD, apply equally here):** the `/test-plan` skill's missing `testPlan.artefact` write instruction, and `check-pipeline-state-integrity.js`'s C3 check having no RISK-ACCEPT carve-out.
2. **Real GitHub merge conflict (process-level, not a code/AC issue):** PR #1043 hit a merge conflict on `pipeline-state.json` after `/branch-complete` opened it — the feature branch's copy had been synced once (at `/verify-completion`) but `/branch-complete`'s own later master write was never re-synced. Fixed with a second sync commit after the operator flagged it. Written up as a formal improve-proposal (`workspace/proposals/2026-10-30-branch-complete-improve-proposal.md`) — its recommended fix (sync immediately after PR creation, not just before) was applied proactively on `tfhc-s3`'s own `/branch-complete` run and avoided a repeat.
3. **Pattern worth repeating (already captured in `workspace/capture-log.md`):** the mock-shape-mismatch catch on `check-pan-s1-product-aware-navigation.js` is a concrete, positive instance of this epic's own core premise working as intended — independent re-derivation of real filter logic, not assumed compatibility, caught a real latent bug before it could ship.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture" (tfhc-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
