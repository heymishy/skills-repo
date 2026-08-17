# Definition of Done: Backfill already-completed stage artefacts to a repo at the moment it is connected

**PR:** https://github.com/heymishy/skills-repo/pull/680 | **Merged:** 2026-08-07
**Story:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s3-backfill-artefacts-on-repo-connection.md
**Test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s3-test-plan.md
**Verification script:** artefacts/2026-08-06-durable-artefact-storage/verification-scripts/das-s3-verification.md
**Review:** artefacts/2026-08-06-durable-artefact-storage/review/das-s3-review-2.md (0 HIGH findings)
**DoR:** artefacts/2026-08-06-durable-artefact-storage/dor/das-s3-dor.md (approver: Hamish King, oversight: high)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — already-completed stages with local content are committed to the newly-connected repo, reusing `das-s1`'s commit mechanism | ✅ | `check-das-s3-backfill-on-repo-connect.js`, incl. `artefact_backfill_committed` event log | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — a stage whose local content is already gone is skipped, best-effort per-stage (not all-or-nothing) | ✅ | Same file | Automated test, re-run fresh | None |
| AC3 — the JSON response from every `_applyRepoChange` entry point includes a `backfill` field naming attempted/succeeded/skipped stages | ✅ | Same file | Automated test, re-run fresh | None |
| AC4 — a repo connection with zero completed stages triggers no backfill work (common-path no-op) | ✅ | Same file | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. Story's Architecture Constraints called for migrating `handlePostProductRepoCreate` to call the shared `_applyRepoChange` (removing its duplicate raw `UPDATE`) as part of this story's own scope, not a separate follow-up — not independently re-verified line-by-line in this pass, but AC3's own test explicitly covers all three entry points (`handlePutProductEdit`, `handlePostConnectRepo`, `handlePostProductRepoCreate`) including the response field, which would fail if the third entry point still used a separate raw UPDATE bypassing the backfill trigger.

**tenant_id scoping (ADR-025):** story's Architecture Constraints require the backfill query to remain tenant-scoped — `backfillTenantScoping_neverCrossesTenantBoundary` in the fresh test run directly covers this.

---

## Test Plan Coverage

**Tests passing:** 10/10 (`check-das-s3-backfill-on-repo-connect.js`), re-run fresh 2026-08-17 — matches the test-plan's originally-recorded 10/10 exactly, no drift.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: backfill runs synchronously at repo-connection time, brief delay acceptable | ✅ | `PASS: backfillLatency_addsBoundedDelayToRepoConnection`, re-run fresh, passing |
| Security: same authenticated-user-token Contents API pattern as `das-s1`, no new credential handling | ✅ | By construction — reuses `das-s1`'s commit mechanism directly, per Architecture Constraints |
| Audit: each backfill attempt (success or skip) logged with feature slug and stage name | ✅ | `artefact_backfill_committed` event visible in fresh test-run output, `PASS: backfillLog_recordsEveryAttempt` |

---

## Metric Signal

**Metric:** extends m1 (Cross-redeploy artefact durability) to a real gap found live on staging 2026-08-07 — a journey (`new-feature-5a4e59db`) lost 5 completed-stage artefacts permanently because its repo was connected after those stages completed, and `das-s1`'s forward-only dual-write never had a chance to back them up retroactively. This story is the direct fix for that live-observed loss pattern, not a hypothetical.
**Status:** Confirmed via direct root-cause investigation and this story's own delivered mechanism; no fresh re-measurement of the original lost journey (already-orphaned, explicitly out of scope per this story's own text — that content is permanently gone, this story is preventative).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required. This story itself closes the real gap discovered mid-epic (between `das-s1`/`das-s2`'s original scope and this story's own live-staging finding) — no further follow-up needed for the backfill mechanism itself.

---

## DoD Observations

1. ~10 days live in production, no incidents reported. This was itself originally a mid-epic finding (a real data-loss gap found via direct staging investigation on 2026-08-07, not a planned story from the outset) — the epic's own history is a good example of the same "find a real gap during delivery, write a bounded follow-up story, ship it" pattern this current DoD backlog pass is now applying at a larger scale (`ibg-s1`, `sbrc-s1`, `csgc-s1`).
2. Closes the 3-story `2026-08-06-durable-artefact-storage` cluster (`das-s1`/`das-s2`/`das-s3`, all three DoDs written in this same session pass).
