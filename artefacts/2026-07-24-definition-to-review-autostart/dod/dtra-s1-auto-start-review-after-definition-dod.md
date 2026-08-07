# Definition of Done: Completing /definition moves straight into /review, no manual story-list confirm step

**PR:** #587 | **Merged:** 2026-07-24
**Story:** artefacts/2026-07-24-definition-to-review-autostart/stories/dtra-s1-auto-start-review-after-definition.md
**Test plan:** artefacts/2026-07-24-definition-to-review-autostart/test-plans/dtra-s1-auto-start-review-after-definition-test-plan.md
**DoR artefact:** artefacts/2026-07-24-definition-to-review-autostart/dor/dtra-s1-auto-start-review-after-definition-dor.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "parseable definition artefact redirects straight to a new /review session" | `tests/check-dtra-s1-auto-start-review-after-definition.js` | None |
| AC2 | ✅ | "the full extracted story list (not just the first story) is set on the journey" | `tests/check-dtra-s1-auto-start-review-after-definition.js` | None |
| AC3 | ✅ | "unparseable definition artefact falls back to /journey/:id/stories, unchanged" | `tests/check-dtra-s1-auto-start-review-after-definition.js` | None |
| AC4 | ✅ | "GET /journey/:id/stories and POST /api/journey/:id/stories still work directly" | `tests/check-dtra-s1-auto-start-review-after-definition.js` | None |

---

## Scope Deviations

None — `extractStoryIdsFromDefinitionArtefact`'s parsing rules unchanged; no edit-before-review UI added; `handlePostStories` (manual path) untouched in behaviour.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (auto-start redirect) | ✅ | ✅ | |
| AC2 (full story list) | ✅ | ✅ | |
| AC3 (fallback preserved) | ✅ | ✅ | |
| AC4 (manual page still works) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| None beyond existing behaviour (per story's own NFR section) | ✅ | Reuses the same session-creation and tenant-scoping already in place for the manual path — no new attack surface |

No CSS-layout-dependent test-plan gaps — this is a server-route behavioural fix, no UI layout involved.

---

## Metric Signal

No feature-level `metrics` array exists for this short-track fix (per CLAUDE.md's short-track convention — test-plan → DoR → coding agent, no discovery/benefit-metric stage). Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. Found and fixed a real, unrelated inconsistency while investigating this story: `journey.js`'s local `STAGE_ORDER` (used only for ordering `priorArtefacts` on session resume) lists `test-plan` before `review`, while `journey-store.js`'s `STAGE_SEQUENCE` and the actual per-story sequence run `review` before `test-plan`. Flagged in this story's own PR description and decisions.md, not fixed here (separate, unscoped bug). **Tag as `/improve` candidate:** two independent hardcoded stage-order lists exist in this codebase and can silently drift out of sync — worth a follow-up story to consolidate them into one source of truth.
2. Extracted a shared `_startReviewSessionForJourney` helper used by 3 call sites that previously each duplicated the same review-session-start logic — a small, low-risk refactor bundled cleanly with the behavioural fix since all 3 call sites needed the identical new logic anyway.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Completing /definition moves straight into /review, no manual story-list confirm step".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Are any scope deviations or follow-up actions that should block release not flagged?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
