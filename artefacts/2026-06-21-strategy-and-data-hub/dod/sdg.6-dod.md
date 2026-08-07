# Definition of Done: sdg.6 — Callout marker detection and metrics recording

**PR:** https://github.com/heymishy/skills-repo/pull/654 | **Merged:** 2026-07-30 (merged into `feature/sdg.5`, which then reached `master` via #655)
**Story:** artefacts/2026-06-21-strategy-and-data-hub/stories/sdg.6.md
**Test plan:** artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.6-test-plan.md
**DoR artefact:** artefacts/2026-06-21-strategy-and-data-hub/dor/sdg.6-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `initMetricsFile()` creates `workspace/strategy-metrics.json` with `{"metrics":[]}` if absent; idempotent | `tests/check-sdg6-metrics-recording.js` T1 | None |
| AC2 | ✅ | Artefact scanned for literal `[Grounded in: <filename>]` pattern, case-sensitive | Same file, T2, T3 | None |
| AC3 | ✅ | Metrics entry recorded with correct JSON structure, `calloutRate` computed and rounded to 2dp | Same file, T4, T5 | None |
| AC4 | ✅ | Completion summary line for both grounded and ungrounded sessions | Same file, T6, T9 | None |
| AC5 | ✅ | Sessions without reference files tracked with `hasReferenceFiles: false`, zero counts | Same file, T7 | None |
| AC6 | ✅ | Each artefact completion produces an independent entry, no aggregation | Same file, T8 | None |

---

## Scope Deviations

None. No automatic quality scoring, no real-time feedback, no historical aggregation, no automated re-upload alerts — matching the story's out-of-scope list.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1–T10 | ✅ | ✅ | T10 explicitly confirms append-only behaviour — prior entries are never mutated |

**Gaps (tests not implemented):** None at the unit level. Per the test plan's own design, no separate integration test file was needed (unit tests cover the full write/read cycle via temp dirs) — a real end-to-end confirmation (`workspace/strategy-metrics.json` created with a real entry from an actual `/ideate` or `/discovery` session) is deferred to this DoD's own follow-up action below, serving as the M1 measurement signal.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Append-only — prior entries never mutated | ✅ | T10 |
| Literal pattern matching, not regex/fuzzy | ✅ | T2 (case-sensitive; lowercase variant does not match) |
| Metrics file location — `workspace/` root, sibling to `state.json` | ✅ | Code review — `recordMetrics` writes to `path.join(repoRoot, 'workspace')` |
| Timing — recorded immediately after artefact save, before `completeStage()` | ✅ | Code review — wired into both `journey.js`'s gate-confirm flow and `skills.js`'s auto-save flow, both reading the artefact back from disk (ougl disk canonicity) before `completeStage()`/session-done marking |

---

## Metric Signal

**M1 (Strategy content utility) — measurement mechanism now exists, but has not yet recorded a real observation.** No completed `benefit-metric.md` artefact exists for this feature (same pre-existing gap flagged in `sdg.1`/`sdg.4`/`sdg.5`'s DoD) — the metric this story is meant to feed was never formally defined in a `benefit-metric.md`, only referenced by name in each story's DoR (M1 "Strategy content utility", M3 "Callout rate measurement"). Recorded as `not-yet-measured` — evidence note: "the mechanism (strategy-metrics.js) is now live and wired into both completion paths; no real session has run against it yet to produce a first observation, and no benefit-metric.md exists to measure against even once one does."

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Run a real `/ideate` or `/discovery` session with a reference file uploaded; confirm `workspace/strategy-metrics.json` is created and contains a real entry with `stage` matching the skill used and `calloutCount >= 0` — this is the test plan's own specified integration confirmation and the first real M1 measurement.
2. The missing `benefit-metric.md` gap (flagged across all of sdg.1, sdg.4, sdg.5, sdg.6's DoDs) should be resolved — either by locating a pre-existing one that was never linked correctly, or by running `/benefit-metric` retroactively for this feature so M1/M3 have a real, measurable definition to report against.

---

## DoD Observations

1. **Epic-level completion:** with sdg.1 through sdg.6 all now `dodStatus: complete`, the entire strategy-and-data-hub epic's original 2026-06-21 scope is done. sdg.1-3 were merged 2026-06-25/26 but sat un-DoD'd for over 5 weeks; sdg.4-6 were fully unimplemented until this session found and closed the gap. Recommend checking `/trace` for this feature to confirm the full chain now reports healthy end-to-end.
2. Same PR-churn note as `sdg.5`'s DoD applies here too — this PR (#654) was originally opened against `feature/sdg.5` and reached `master` only because #655 (sdg.5's replacement PR) merged shortly after, carrying #654's already-merged-into-feature/sdg.5 commits along with it. No content was lost, but the merge history is slightly non-obvious as a result — `git log` shows #655 as the commit that brought both sdg.5 and sdg.6 into `master` together.
3. The recurring "no benefit-metric.md" gap across all 6 stories in this epic is worth a dedicated `/improve` follow-up: every story's DoR cites named metrics (M1, M3) that apparently were never captured in a real, findable `benefit-metric.md` artefact for this feature.
