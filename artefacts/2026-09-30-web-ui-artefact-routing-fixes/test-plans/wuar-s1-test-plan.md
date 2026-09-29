## Test Plan: Extend the Sonnet drift-guard to cover benefit-metric, decisions, and definition-of-done

**Story reference:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/stories/wuar-s1.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30
**Note:** Narrowed from the original v1 plan (5 tests, AC1–AC5) after AC1–AC3 (the review save-path fix) were dropped — see decisions.md Decision 1. This version covers the remaining AC1/AC2 (formerly AC4/AC5).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | 3 new skills appear in drift array when unoverridden | 1 test | — | — | — | — | 🟢 |
| AC2 | Existing 5 + new 3 all pass when correctly overridden | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. `checkModelRoutingDrift` is a pure function — no rendered UI, no real web-UI session needed for coverage.

---

## Test Data Strategy

**Source:** Synthetic — injected `envVars` objects matching `checkModelRoutingDrift`'s own existing testable pattern (see `tests/check-psrc-verify-s3-model-routing-drift.js`, which this story also updates for its own 5→8 extension — see Note below).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `envVars` object with no `WUCE_MODEL_OVERRIDE_*` keys set | Synthetic | None | Matches `checkModelRoutingDrift`'s existing test convention exactly |
| AC2 | `envVars` object with all 8 skills' overrides set to `claude-sonnet-4-6` | Synthetic | None | Confirms extension doesn't break the original 5 |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `benefit-metric`, `decisions`, and `definition-of-done` are flagged when unoverridden

- **Verifies:** AC1
- **Precondition:** `envVars` object with none of the 8 `WUCE_MODEL_OVERRIDE_*` keys set
- **Action:** Call `checkModelRoutingDrift(envVars)`
- **Expected result:** Returned array includes entries for all 8 `DRIFT_GUARD_SONNET_SKILLS` (the original 5 plus `benefit-metric`, `decisions`, `definition-of-done`), each with `resolvedModel` containing `'haiku'`
- **Edge case:** No

### All 8 skills correctly pass when their overrides resolve to Sonnet

- **Verifies:** AC2
- **Precondition:** `envVars` object with all 8 `WUCE_MODEL_OVERRIDE_*` keys set to `'claude-sonnet-4-6'`
- **Action:** Call `checkModelRoutingDrift(envVars)`
- **Expected result:** Returned array is empty — confirms the extension doesn't break the drift-guard's own existing healthy-state behaviour for the original 5, and correctly clears for the 3 new ones too
- **Edge case:** No

---

## Note: pre-existing test file updated, not just a new one added

`tests/check-psrc-verify-s3-model-routing-drift.js` (psrc-verify-s3's own original 6-test file) hardcodes `DRIFT_GUARD_SONNET_SKILLS`'s length (`assert.strictEqual(result.length, 5, ...)`) and the literal 5-skill list. Extending `DRIFT_GUARD_SONNET_SKILLS` to 8 entries makes that specific assertion fail as written. This story updates that pre-existing test in place (its `makeHealthyEnvVars()` helper gains the 3 new overrides; the "all N drift when unoverridden" test's expected count and skill list are updated from 5 to 8) rather than adding a second, overlapping test file — the two other pre-existing tests in that file (`...ExactlyOneWhenOneOverrideMissing`, `...NeverIncludesDiscoveryOrIdeate`) are unaffected by the extension and require no change. This IS this story's real regression-safety net for AC2 for the original 5 skills, in addition to the new unit tests above.

---

## Integration Tests

None — `checkModelRoutingDrift` is already exercised by the same real call site (`server.js`'s startup drift-guard wiring) that shipped and was verified in `psrc-verify-s3`; this story extends its input list without changing that call site's own signature or wiring.

---

## NFR Tests

None — confirmed with story owner. Story's own NFR section states all 4 categories as Not Applicable.

---

## Out of Scope for This Test Plan

- Any live, real web-UI session test of an actual `/benefit-metric`/`/decisions`/`/definition-of-done` turn — this plan tests the pure drift-check function directly, matching this repo's own established convention (no local test suite connects to a real deployed session); real-environment confirmation happens at DoD via a live check, same as `psrc-verify-s2`/`s3`.
- Setting the real Fly secrets for the 3 new overrides — DoD-time operator action, not a test-plan concern.
- Any test of `computeArtefactSavePath`/review-artefact-splitter behaviour — out of this story's scope entirely (decisions.md Decision 1); no change was made there, so no new test is needed.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
