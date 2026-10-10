# Definition of Done: Free node positioning persisted across reloads

**PR:** https://github.com/heymishy/skills-repo/pull/972 | **Merged:** 2026-10-10
**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**Test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-10-infinite-canvas/dor/ic-s2-dor.md
**Assessed by:** Claude (session definition-of-done pass)
**Date:** 2026-10-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — drag saves position; reload shows the saved position, not auto-layout | ✅ | Real Chrome tab: a real `mousedown`→10×`mousemove`→`mouseup` sequence on a canvas node fired a real `PATCH /journeys/j1/stages/s1/position` → 200; a genuine page reload (re-invoking `handleGetJourneyCanvas` against the same mutated pool) rendered the node at `left: 528px; top: -201px`, read directly from its DOM `style`, matching the drag direction/magnitude | `live-verified` | None |
| AC2 — `NULL` position falls back to `ic-s1`'s unchanged auto-layout | ✅ | Real Chrome tab: a stage with `position_x/position_y: null` rendered at the left-to-right auto-layout spot; a stage with a stored position (500, 300) rendered at its own distinct spot, correct connecting line between the two | `live-verified` | None |
| AC3 — cross-tenant stage id → 404 (not 403), zero mutation | ✅ | Integration test: mock pool returns no matching row for a cross-tenant stage id; handler returns 404; zero `UPDATE` calls recorded | `integration-real-code` | None |
| AC4 — migration is idempotent, nullable columns, no backfill | ✅ | Real Postgres instance (disposable Docker container, destroyed immediately after): ran the migration twice, inserted a pre-existing row before the second run, confirmed both columns exist as nullable `DOUBLE PRECISION` and the pre-existing row's values remain `NULL` — no backfill attempted | `integration-real-code` (against a real, disposable database, not a mock) | None |
| AC5 — updating one stage never touches another | ✅ | Integration test: updating stage A issues exactly one `UPDATE`, targeting only A's id; B's id never appears in the UPDATE params. Also confirmed live: the un-dragged "Evaluate" stage (stored position 500/300) rendered at the same position across every screenshot this session, before and after dragging "Discover" | `integration-real-code` + `live-verified` | None |
| AC6 — failed save shows a visible toast, never silent | ✅ | Real Chrome tab: patched `window.fetch` to reject the `.../position` request (equivalent to a real network failure), performed a real drag — `#sw-stage-reorder-error` showed the correct text ("Stage position not saved — please try again") and the `--visible` class, confirmed within the real 3-second display window (not after the auto-hide `setTimeout` had already fired, which a first, slower check attempt had mistakenly caught) | `live-verified` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded against the merged code.

---

## Scope Deviations

None. Confirmed via `git log master..HEAD` before merge (see `/verify-completion`'s Step 3): every commit mapped directly to this story's own ACs or to standard pipeline bookkeeping.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 5 / 6 in this repo's own PR-checks gate (AC4's migration test is `DATABASE_URL`-gated and correctly SKIPs there — this repo's own `pr-checks.yml` has no `DATABASE_URL` configured, matching `ep5-s1`'s own established precedent for migration tests). **6 / 6 confirmed in this DoD pass** by running the full test file against a real, disposable Postgres instance (a throwaway Docker container, destroyed immediately after the run) rather than leaving `testPlan.passing` understated or fabricating the count — `pipeline-state.json`'s own `check-pipeline-state-integrity.js` C3 check correctly flagged the merged-but-under-passing-count state, and the honest resolution was to obtain a real result, not to adjust the number without evidence.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC4 — migration idempotent, no backfill | ✅ | ✅ | Confirmed against a real disposable Postgres container this session (SKIPs in the standard PR-checks CI gate, by design) |
| AC3 — cross-tenant 404, zero mutation | ✅ | ✅ | |
| AC5 — single-stage isolation | ✅ | ✅ | |
| Regression — viewer-role session denied (not an original AC/test-plan item — added during Task 2's own independent verification) | ✅ | ✅ | Real server dispatch, seeded viewer session, RED/GREEN-verified |
| AC2 — NULL falls back to auto-layout, stored position used when set | ✅ | ✅ | |
| AC6 — failure toast | ✅ | ✅ | |

Full suite at merge: 735/735. One `requireNonViewer` access-control gap (not an original AC, but a real security-consistency defect) was found during independent verification of the implementer's own Task 2 report and fixed before merge, with its own real integration test added.

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Position-save latency — fire-and-forget, no blocking spinner | ✅ | Live observation: the node visually stays exactly where dropped the instant the drag completes; the `PATCH` fires in the background with no spinner or visible delay to the drag gesture itself. |
| Authorisation — ownership-check-before-mutation / 404-not-403 (D13) | ✅ | AC3's own test directly confirms this. The `UPDATE` statement itself has no redundant `tenant_id` filter — intentional, matching `handleDeleteFeatureMapping`'s own identical established pattern: the preceding `SELECT` ownership check already proves the stage id belongs to the requesting tenant before any mutation runs, so the mutation statement needs only the already-validated id. |
| Multi-tenancy — position data tenant-scoped like the rest of the feature | ✅ | Same evidence as Authorisation above — the ownership-check query joins through `customer_journeys.tenant_id`. |
| Input validation — N/A, no free-text/file-upload surface | ✅ N/A | Confirmed: positions are numeric coordinates (`typeof x/y !== 'number'` guarded with a 400), written by the canvas library itself, not operator-typed text. |

---

## Metric Signal

**M1 — Spatial layout actually used**
Signal: not-yet-measured
Evidence: `contributingStories` corrected in this DoD pass to include `ic-s2` (the story's own "Benefit Linkage" section explicitly names it as the literal mechanism M1 measures — "a node moved away from its default position and kept there" — but `pipeline-state.json`'s `metrics[].contributingStories` was never updated to reflect this at `/definition` time; fixed here rather than left silently stale). Measurement is now structurally possible (the feature is merged), but no real operator has dragged and persisted a node in production yet — target is "≥1 ... within 2 weeks of release," and release (deploy + real usage window) has not yet elapsed.
Date measured: null

**M2 — Operator CX judgment vs. the list view it replaced**
Signal: not-yet-measured
Evidence note: feature-wide qualitative judgment metric, not attributable to `ic-s2` specifically more than `ic-s1`/`ic-s3`/`ic-s4` collectively — `contributingStories` intentionally left empty pending the full epic shipping.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. All ACs satisfied, no deviations, no open gaps.

---

## DoD Observations

1. **A real, disposable-infrastructure verification beats a fabricated or understated number.** `check-pipeline-state-integrity.js`'s own C3 check correctly flagged `ic-s2` as merged with `testPlan.passing` (5) below `totalTests` (6) — AC4's migration test is real and written, but structurally SKIPs in this repo's own PR-checks CI gate (no `DATABASE_URL` configured there, matching `ep5-s1`'s own established precedent). Rather than either leaving the count honestly-but-incompletely understated or fabricating a "6" with no real evidence behind it, started Docker Desktop, ran a disposable Postgres container, got a genuine 6/6 pass, then destroyed the container immediately. The checker's own binary totalTests/passing model has no concept of a legitimately-SKIPped-by-design test — worth a follow-up story to add that nuance (a `skipped` count, exempted from the C3 invariant) so this doesn't require standing up real infrastructure by hand every time a `DATABASE_URL`-gated story merges.
2. **`contributingStories` can silently drift from a story's own stated benefit linkage.** `ic-s2.md`'s own "Benefit Linkage" section named it as the literal mechanism for metric M1 at story-write time, but `pipeline-state.json`'s `metrics[].contributingStories` was never updated to reflect this — found and corrected during this DoD pass, not before. Worth a `/definition`-time or `/review`-time check: does every story's own "Benefit Linkage" section have a matching `contributingStories` entry in `pipeline-state.json`?
3. **A RISK-ACCEPT logged mid-session (Chrome disconnect interrupting the sibling-view regression check) was genuinely closed out in a follow-up session**, not left to rot — see `decisions.md`'s own "RESOLVED 2026-10-11" addendum to that entry. Confirms the RISK-ACCEPT mechanism worked as intended: real, trackable, time-bounded, not a way to quietly drop a check.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Free node positioning persisted across reloads" (ic-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
