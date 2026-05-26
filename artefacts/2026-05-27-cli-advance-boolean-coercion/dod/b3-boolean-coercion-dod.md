# Definition of Done: Fix cli-advance Boolean Coercion (B3)

**PR:** #374 | **Merged:** 2026-05-27
**Story:** artefacts/2026-05-27-cli-advance-boolean-coercion/stories/b3-cli-advance-boolean-coercion.md
**Test plan:** artefacts/2026-05-27-cli-advance-boolean-coercion/test-plans/b3-boolean-coercion-test-plan.md
**DoR artefact:** artefacts/2026-05-27-cli-advance-boolean-coercion/dor/b3-boolean-coercion-dor.md
**Assessed by:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `"true"` → boolean `true` for `releaseReady` | ✅ | T1 in `tests/check-b3-boolean-coercion.js` — T1a: exitCode 0, T1b: `story.releaseReady === true`, T1c: `typeof === 'boolean'`, T1d: stdout contains slug+id | Automated test — 4 assertions pass in CI | None |
| AC2 — `"false"` → boolean `false` for `releaseReady` | ✅ | T2 in `tests/check-b3-boolean-coercion.js` — T2a: exitCode 0, T2b: `story.releaseReady === false`, T2c: `typeof === 'boolean'` | Automated test — 3 assertions pass in CI | None |
| AC3 — Non-coercible value rejected (exit 8, no write) | ✅ | T4 in `tests/check-b3-boolean-coercion.js` — `releaseReady=maybe` → exit 8, stderr names field+acceptable values, state file unchanged | Automated test — 4 assertions pass in CI | None |
| AC4 — Non-boolean string fields unaffected | ✅ | T5 in `tests/check-b3-boolean-coercion.js` — `stage=implementation` and `health=green` remain strings | Automated test — 4 assertions pass in CI | None |
| AC5 — Integer coercion (cdg.6) not broken | ✅ | T3 in `tests/check-b3-boolean-coercion.js` — `acVerified=4` stored as number `4`, `typeof === 'number'` | Automated test — 3 assertions pass in CI (regression) | None |
| AC6 — Schema validation passes after boolean field written | ✅ | T6 in `tests/check-b3-boolean-coercion.js` — `check-pipeline-state-integrity.js` exits 0, no `schema_valid: FAILED` output | Automated integration test — 3 assertions pass in CI | None |

**T7 (track enum validation) — beyond original 6 ACs:** T7 was added as part of the root-cause fix: adding `track` to `ENUM_FIELDS` to prevent `track=defect` (a schema-invalid value) from being silently written. This is in scope as a companion fix to the BOOLEAN_FIELDS pattern; it is not an out-of-scope deviation.

---

## Scope Deviations

None. The `track` field addition to `ENUM_FIELDS` (T7) was identified as a root cause of CI failures for the same PR — it is a direct extension of the defect fix scope, not external scope addition.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (T1–T6 per test plan; T7 added as root-cause companion)
**Tests passing in CI:** 26 / 26 (all assertions across T1–T7 pass on master after PR #374 squash-merge commit `2619630`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — `"true"` → boolean `true` | ✅ | ✅ | 4 assertions |
| T2 — `"false"` → boolean `false` | ✅ | ✅ | 3 assertions |
| T3 — integer coercion regression | ✅ | ✅ | 3 assertions |
| T4 — invalid boolean value → exit 8 | ✅ | ✅ | 4 assertions |
| T5 — non-boolean string fields unaffected | ✅ | ✅ | 4 assertions |
| T6 — schema validation passes after boolean write | ✅ | ✅ | 3 assertions |
| T7 — `track` enum validation | ✅ | ✅ | 5 assertions; companion to root-cause fix |

**Full test suite:** `npm test` → 194 scripts / 0 failures on master after merge.

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No NFRs declared for this story | N/A | Story NFRs section: "None — reviewed 2026-05-27. This is a pure in-process coercion fix; no I/O, network, or security surface changes." |

---

## Metric Signal

This feature has no benefit metrics defined (`metrics: []` in pipeline-state.json). The benefit linkage in the story references CDG M4 (pipeline-state schema validation reliability — zero post-advance schema violations), which is owned by the `2026-05-19-cli-deterministic-governance` feature. No metric signal write is required here.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| CDG M4 (schema validation reliability) | ✅ | Immediately — the fix prevents a whole class of boolean-field schema violations | Signal should be recorded against the CDG feature at next `/record-signal` run |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- Record CDG M4 signal via `/record-signal` against `2026-05-19-cli-deterministic-governance` (low priority — metric was linked by reference, not formally tracked here)

---

## DoD Observations

1. **`track` enum mismatch between schema and `validate-trace.sh`** — `validate-trace.sh` has `tracks_without_discovery = {'short', 'defect', 'library', 'spike'}` which includes `defect` and `spike` as exemptions, but neither is a valid schema enum value. The `track` ENUM_FIELDS guard now makes this a dead code path (the CLI rejects invalid track values before they reach disk). No code fix to the bash script is needed but this gap is worth noting for any future script update. — `/improve` candidate.

2. **Root-cause fix required a second PR commit after initial green CI** — The T7 track-validation additions (`e26db99`) were pushed to the B3 branch after PR #374 initially passed CI. GitHub's PR triggered a re-run and the PR was squash-merged including T7 as a single commit (`2619630`). No pipeline integrity issue, but the out-of-order commit sequence (implementation → fix CI → fix root cause) added a second round of CI. The `/tdd` discipline (write failing test before fix) would have caught this at RED phase. — `/improve` candidate (minor).
