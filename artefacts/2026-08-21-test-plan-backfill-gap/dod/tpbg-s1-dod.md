# Definition of Done: Backfill missing test-plan artefacts for 11 already-shipped stories

**PR:** None — pure `artefacts/`/`pipeline-state.json` bookkeeping, no `src/`/`scripts/`/`tests/` changes; committed directly to master per CLAUDE.md's "State and artefact updates — no standalone PR required" carve-out (commits `2e8b211c`, and the related `3348c3d2`/`9e27eb7d` from the same investigation).
**Story:** artefacts/2026-08-21-test-plan-backfill-gap/stories/tpbg-s1-backfill-missing-test-plan-artefacts.md
**Test plan:** No dedicated test-plan.md for this story itself — the work IS test-plan authorship; verification is `/trace`'s own `test_plan_coverage` check, re-run fresh (see below).
**Assessed by:** Claude (agent)
**Date:** 2026-08-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — each of the 11 stories reviewed, real coverage reconstructed or gap flagged | ✅ | 11 test-plan.md files written, each citing the real, already-passing test file(s) from the story's own DoD/story text | Direct review of each story.md + dod.md, cross-referenced against real test files | One genuine gap found (see below) |
| AC2 — `/trace`'s `test_plan_coverage` reports 0 MISSING for these 11 | ✅ | `validate-trace.sh --ci` re-run fresh: `6 passed, 0 warnings, 0 failed` (was `1 failed`, 21 MISSING at session start — 10 resolved separately as false positives, these 11 resolved by this story) | Automated check, re-run this session | None |
| AC3 — `pipeline-state.json`'s `testPlan.artefact` updated for all 11 | ✅ | All 11 story entries updated in commit `2e8b211c`, confirmed via direct read-back | Automated script + integrity check (`check-pipeline-state-integrity.js`, same 3 known pre-existing C3 failures, unrelated) | None |

---

## Scope Deviations

**One genuine test-coverage gap surfaced, not fixed here (by design):** `r-canvas-render-and-story-extraction-fix`'s AC3 (`extractStoryIdsFromDefinitionArtefact` — story extraction logic) has no automated regression test, only a manual verification noted at merge time; a related, unexplained `400` on `POST /api/journey/:id/gate-confirm` was also never root-caused. This story's own AC1 explicitly anticipated this possibility ("some items may turn out to be real test-coverage gaps, not just missing paperwork") and routes it correctly rather than fabricating a test-plan claiming coverage that doesn't exist. **Already tracked separately as F3 / `csgc-s1`** (`artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/`) — not duplicated here.

---

## Test Plan Coverage

**`/trace` result:** `validate-trace.sh --ci` — 6 passed, 0 warnings, 0 failed (confirmed locally with a working Python interpreter shim, and independently confirmed on PR #750's own CI re-run after merging this fix into `feature/lrtc-s1`).
**Gaps:** None remaining in `test_plan_coverage` for the 11 stories in this backfill's scope. The one real underlying test-coverage gap found (`r-canvas-render-and-story-extraction-fix` AC3) is out of this story's scope by design — tracked at F3/`csgc-s1`.

---

## NFR Status

No dedicated NFRs — documentation/traceability backfill only.

---

## Metric Signal

Restores `/trace`'s `test_plan_coverage` check to a true 100% pass rate — removes a standing, repo-wide false-CI-failure risk that was blocking unrelated PRs (found via `lrtc-s1`'s PR #750).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story's own scope. The genuinely-flagged gap (`r-canvas-render-and-story-extraction-fix` AC3) remains open under its own existing tracking (F3/`csgc-s1`) — not a new action item.

---

## DoD Observations

1. This story was executed in a single session directly from a live CI failure investigation — the story artefact was written retroactively (documenting the plan) alongside the actual backfill work, rather than a formal test-plan → DoR → coding-agent handoff, since the "implementation" IS test-plan authorship reconstructed from already-shipped, already-tested code. This matches `templates/retrospective-story.md`'s own documented convention for exactly this situation.
2. All 11 backfilled test-plan.md files are reconstructions, not new test design — every cited test file and AC-to-test mapping was verified to already exist and already be documented in the corresponding story.md/dod.md before being written into the new test-plan.md.
3. Confirms the earlier hypothesis from `dod-backlog-findings.md` F13: the root cause across all 21 originally-flagged stories was consistently a missing `testPlan.artefact` bookkeeping link (10 cases) or a genuinely-never-written artefact (these 11 cases) — never a case of tests actually not existing for already-shipped code, except the one flagged exception.
