# Definition of Done: wsd-s1 — extract cli-advance.js's mutation core into applyAdvance()

**Track:** Standard-track
**PR:** https://github.com/heymishy/skills-repo/pull/888 | **Merged:** 2026-09-14 (merge commit `22e0ad1c`)
**Test plan:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-15-web-ui-pipeline-state-durability/dor/wsd-s1-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-pcr-s1-pipeline-state-scope.js` (25 checks) and `tests/check-shr1-schema-harness.js` (11 passed) both re-run fresh against the refactored `cli-advance.js` — pass unchanged, confirming `advance()`'s external behaviour, signature, and return shape are identical to before the extraction. | automated test re-run | None |
| AC2 | ✅ | New `tests/check-wsd-s1-advance-core-extraction.js` T3-T8 call `applyAdvance(state, featureSlug, storyId, rawFields)` directly against in-memory fixtures (no file on disk): field validation (enum rejection, prototype-pollution guard, boolean coercion), and mutation logic (feature-scoped vs story-scoped splitting, epic-nested story lookup, auto-stamped `updatedAt`) all verified to match `advance()`'s existing rules. | automated test (new file, 20 assertions) | None |
| AC3 | ✅ | T8 asserts `result.storyWasCreated === true` is present as a real field on `applyAdvance()`'s return object (not only embedded in `stderr` text) when a no-match `storyId` triggers the `acv-s1` new-record path. | automated test | None |

**Confirmed in CI, not just locally:** all 7 required PR #888 checks passed (Cross-tenant isolation spec, Lint/typecheck/test/build, Playwright E2E smoke, Run assurance gate, Scenario A/B E2E staging, Watermark gate) before merge — checked via `gh pr checks 888 --watch`, not assumed from a self-report.

---

## Scope Deviations

None. Pure structural extraction as scoped — no validation rule changed, no CLI argument parsing touched, no wsd-s2 mechanics pulled forward.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T9 (T1/T2 regression re-runs of pre-existing files; T3-T9 the 7 new behavioural cases, implemented as 20 individual assertions in one new file)
**Tests passing in CI:** all PR #888 checks green; locally, `check-wsd-s1-advance-core-extraction.js` 20/20, `check-pcr-s1-pipeline-state-scope.js` 25/25, `check-shr1-schema-harness.js` 11/11

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — `check-pcr-s1-pipeline-state-scope.js` unchanged | ✅ | ✅ | 25 checks OK |
| T2 — `check-shr1-schema-harness.js` unchanged | ✅ | ✅ | 11 passed |
| T3 — `applyAdvance()` in-memory mutation | ✅ | ✅ | exitCode 0, field mutated, same object reference returned |
| T4 — invalid enum rejected, no mutation | ✅ | ✅ | exitCode 8, state byte-identical before/after |
| T5 — epic-nested story resolution | ✅ | ✅ | mutates `feature.epics[].stories[]` correctly |
| T6 — prototype-pollution guard | ✅ | ✅ | `__proto__` rejected with exitCode 8 |
| T7 — boolean coercion | ✅ | ✅ | `releaseReady` stored as real boolean, not string |
| T8 — `storyWasCreated` as a real field | ✅ | ✅ | asserted on the result object directly |
| T9 — `advance()` end-to-end file wrapper | ✅ | ✅ | real temp file: successful write verified on disk; invalid-field case verified to write nothing at all (byte-identical file before/after) |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Backward compatibility — zero behavioural change for existing callers | ✅ | T1/T2 regression re-runs pass unchanged; T9 confirms the file-based wrapper's on-disk behaviour is identical |
| Performance — negligible | ✅ | Same synchronous, in-process logic; no new I/O added to the hot path |

---

## Metric Signal

Contributes to **Pipeline-state accuracy for web-UI-originated features** (Tier 1, Metric 1) and **Silent-failure elimination** (Tier 2, Meta Metric 1) as the prerequisite foundation — this story alone makes no user-visible change; wsd-s2 (depends on this story's `applyAdvance()` export) is the story that closes the actual metric gap.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding for this story. wsd-s2 is next, now unblocked (`applyAdvance()` is merged to master).

---

## DoD Observations

1. **Extracting a pure, state-object-based core before building the GitHub-API writer avoided a second independent implementation of the same validation rules.** This directly follows the `decisions.md` rationale (ADR-026, reuse over re-implementation) and the session's own recent lesson from the `asf-s1` splitter bugs, where two independent parsers for related shapes drifted from each other.
2. **The rebase-on-push pattern recurred again during this story's own bookkeeping commit** (non-fast-forward, `origin/master` had moved from a concurrent squash-merge of this same PR) — resolved cleanly with a plain rebase, no conflicts, consistent with the pattern already established earlier this session for `.github/pipeline-state.json` conflicts.
