# Definition of Done: ep1-s5 — Error Handling and Graceful Degradation

**PR:** https://github.com/heymishy/skills-repo/pull/811 | **Merged:** 2026-09-01
**Story:** artefacts/new-feature-af17f555/stories/ep1-s5.md
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s5-test-plan.md
**DoR artefact:** artefacts/new-feature-af17f555/dor/ep1-s5-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

AC1 — every named error condition (pipeline-state.json unreachable, artefact file missing, artefact file unreadable, journey backfill fails, stage routing indeterminate) is logged to server stdout and PostHog with context, excludes the affected component, and allows session start to continue.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 8/8 unit/integration tests passing (`tests/check-ep1-s5-error-handling.js`), including a monkey-patched unreadable-file case and a full resume-flow integration test confirming a clean 404 rather than a crash | `tests/check-ep1-s5-error-handling.js`, full local suite (591 files), CI's assurance gate + traceability validation | Operator-facing one-liner disclosure ("Feature history incomplete…") NOT implemented — see Scope Deviations |

---

## Scope Deviations

**Deferred, disclosed NFR gap:** the story's own NFR text calls for "operator messages one-liners, non-blocking, in session header" when critical data is missing. This pass wires the logging/PostHog side of every named error condition (the part with real technical risk — previously-silent failures now surfaced) but does not add the operator-facing disclosure banner itself, which requires touching the chat-view session-header rendering layer — not otherwise touched by this story or any other story in this epic to date.

This mirrors `ep1-s3`'s own precedent (`ep1-s3-dod.md`, same deferral for a session-header disclosure banner) — both left in `decisions.md` as related, unresolved UI-surfacing work rather than silently dropped.

No cross-story bugs were found or fixed while implementing this story (unlike `ep1-s1`/`ep1-s3`/`ep1-s4`) — investigation confirmed the DoR contract's premise held: the error-boundary/logging layer this story adds genuinely did not exist yet anywhere in the codebase touched by `ep1-s1`–`ep1-s4`.

---

## Test Plan Coverage

**Tests from plan implemented:** 8/8 unit/integration (test plan speced this exact count)
**Tests passing in CI:** 8/8 local + full local suite (591 files, 1 pre-existing known flake unrelated to this change, 0 new failures) + CI's assurance gate, traceability validation, watermark gate, cross-tenant isolation, lint/typecheck/test/build, Playwright smoke, and both staging E2E scenarios (A/B) — all passing

| Test area | Implemented | Passing | Notes |
|-----------|-------------|---------|-------|
| `_logCrossChannelError` structured logging, never throws | ✅ | ✅ | |
| `_mergeStateFeaturesIntoJourneyList` — malformed pipeline-state.json logs `artefact_load_error` | ✅ | ✅ | |
| `_mergeStateFeaturesIntoJourneyList` — absent (not malformed) pipeline-state.json does NOT log | ✅ | ✅ | Distinguishes "missing" from "error" — a missing file is expected, not a failure |
| `backfillJourneyFromPipelineState` logs `stage_routing_error` on `getNextSkill` fallback | ✅ | ✅ | |
| `backfillJourneyFromPipelineState` does NOT log when routing succeeds normally | ✅ | ✅ | |
| `skills.js` `_KEY_DIRS` per-file read failure logs `artefact_load_error` naming the file | ✅ | ✅ | Simulated via a targeted `fs.readFileSync` monkey-patch (directory-named-like-a-file doesn't reach `readFileSync` — the artefact walker recurses into it instead) |
| `handleGetJourneyResume` integration — degrades to clean 404, not a crash, when backfill has nothing to backfill | ✅ | ✅ | |

**Gaps (tests not implemented):** Route/handler E2E coverage check (grepped `tests/e2e/*.spec.js` for specs referencing the touched failure-path code) found zero matching specs — accepted as low risk since all changes are purely additive to failure paths; success paths are byte-identical to before. No E2E test independently exercises the operator-facing disclosure banner, because that banner is not implemented in this pass (see Scope Deviations).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No error blocks session start (graceful degradation) | ✅ | Integration test confirms `handleGetJourneyResume` falls through to a clean 404 rather than crashing when backfill fails |
| All errors logged with context (featureSlug, stage, errorType, timestamp) | ✅ | `_logCrossChannelError` unit tests assert structured fields present in every log line |
| PostHog events: `artefact_load_error`, `journey_backfill_error`, `stage_routing_error` | ✅ | All 3 named event types wired and exercised by dedicated tests |
| Operator messages one-liners, non-blocking, in session header | ❌ | Not implemented this pass — deferred, disclosed (see Scope Deviations) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Web UI Session Start Share | ❌ | Not yet — `ep1-s6` (PostHog instrumentation) has not shipped; no measurement infrastructure exists yet | Signal: not-yet-measured |
| Metric 3 — Handoff Context Load Success | ❌ | Not yet — same blocker | Signal: not-yet-measured. This story's own error logging (`artefact_load_error` etc.) is itself a likely input signal for M3 once `ep1-s6` wires the aggregation/dashboard side |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Operator-facing disclosure banner ("Feature history incomplete…") remains unimplemented — requires session-header rendering-layer work not otherwise in scope for this epic. Consider a follow-up story if the operator wants it delivered, or accept the logging-only version as sufficient for now (errors are fully observable server-side and via PostHog even without an in-UI banner).
2. Metric signals (M1, M3) remain `not-yet-measured` until `ep1-s6` ships.
3. `ep1-s6`'s own AC references "unifying instrumentation" with this story's error-event shape — investigate at `ep1-s6` implementation time whether `_logCrossChannelError`'s existing 3 event types should be reused/extended rather than duplicated for the 6 named success-path events.

---

## DoD Observations

1. Unlike the three prior stories in this epic, this story's original DoR contract held up under investigation without needing correction — the error-boundary/logging layer it specifies genuinely did not exist anywhere in the touched code paths. Flagged here as a positive counter-example to the pattern noted in `ep1-s1`/`ep1-s3`/`ep1-s4`'s own DoD Observations (not every story in this epic needed a DoR correction).
2. The distinction between "file is missing" (expected, not logged) and "file exists but fails to read/parse" (a real error, logged) was deliberately tested as two separate cases — a naive implementation could easily have conflated the two and either over-logged (spamming PostHog for every feature with no prior artefacts) or under-logged (missing a genuine encoding/permissions failure). Worth carrying forward as a general pattern for `ep1-s6`'s own instrumentation work.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s5 — Error Handling and
Graceful Degradation.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the deferred operator-facing disclosure banner acceptable to leave open, or should it block this story's own completeness?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Given ep1-s6 references unifying instrumentation with this story's error-event shape, is the follow-up note specific enough to prevent duplicate work?
Report findings as HIGH / MEDIUM / LOW.
```
