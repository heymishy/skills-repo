# Definition of Done: Fix hash self-comparison defect in cli-adapter advance()

**PR:** https://github.com/heymishy/skills-repo/pull/194 | **Merged:** 2026-04-27
**Story:** artefacts/2026-04-27-p1-hash-defect/stories/p1-hash-defect.md
**Test plan:** artefacts/2026-04-27-p1-hash-defect/test-plans/p1-hash-defect-test-plan.md
**DoR artefact:** artefacts/2026-04-27-p1-hash-defect/dor/p1-hash-defect-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-27

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Deviations: None
Test gaps: None

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1a–T1e: `verifyHash` receives `actual: 'c'.repeat(64)` (from `resolveSkill.contentHash`), not `actual: 'a'.repeat(64)` (the `expectedHash` value). Three-value test proves source unambiguously. | Automated — `tests/check-p1-hash-defect.js` T1 (5 assertions) | None |
| AC2 | ✅ | T2a–T2c: when `contentHash ('b'.repeat(64)) !== expectedHash ('a'.repeat(64))`, `advance()` returns `{ error: 'HASH_MISMATCH', ... }` and `advanceState` is not called. | Automated — `tests/check-p1-hash-defect.js` T2 (3 assertions) | None |
| AC3 | ✅ | T3a–T3c: when `resolveSkill` returns `null`, `advance()` returns `{ error: 'SKILL_NOT_FOUND', skillId }` and `advanceState` is not called. | Automated — `tests/check-p1-hash-defect.js` T3 (3 assertions) | None |
| AC4 | ✅ | T4a–T4c: when `contentHash === expectedHash`, `advance()` does not throw, `result.error` is undefined, and `advanceState` is called. | Automated — `tests/check-p1-hash-defect.js` T4 (3 assertions) | None |
| AC5 | ✅ | T5a–T5b: `advance()` without `skillId`/`sidecarRoot` returns `TRANSITION_NOT_PERMITTED` for blocked transitions and succeeds for permitted ones. Existing check-p4-enf-cli.js T6 (46/46 green) confirms no regression. | Automated — `tests/check-p1-hash-defect.js` T5 (2 assertions) + regression suite | None |

---

## Scope Deviations

None

---

## Test Plan Coverage

**Tests from plan implemented:** 16 / 16 total
**Tests passing in CI:** 16 / 16 implemented

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1a–T1e (AC1: verifyHash actual origin) | ✅ | ✅ | |
| T2a–T2c (AC2: HASH_MISMATCH + no state advance) | ✅ | ✅ | |
| T3a–T3c (AC3: SKILL_NOT_FOUND + no state advance) | ✅ | ✅ | |
| T4a–T4c (AC4: hash match → success + advanceState called) | ✅ | ✅ | |
| T5a–T5b (AC5: regression — transition rules preserved) | ✅ | ✅ | T6 in check-p4-enf-cli.js also updated to supply `sidecarRoot` for realistic mock; 46/46 green |

**Gaps (tests not implemented):** None

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| NFR-SEC-1: `verifyHash` never receives `actual === expected` from `advance()` when `sidecarRoot` supplied | ✅ | T1c/T1d: test passes three distinct hash values (`'a'×64`, `'b'×64`, `'c'×64`) and asserts `actual === 'c'×64` (from `resolveSkill`), proving `actual` and `expected` are independently derived. |
| NFR-PERF-1: one synchronous `resolveSkill` file read per `advance()` call — accepted | ✅ | By design and accepted in DoR. No performance budget specified; governance gate operations are not hot paths. |
| NFR-DEP-1: no new npm packages | ✅ | PR diff: no `package.json` dependency additions. `resolveSkill` uses existing `governance-package.js` implementation. |

NFR profile status updated: **Met — all NFRs verified 2026-04-27**

---

## Metric Signal

This is a short-track bug fix. There is no formal benefit-metric artefact with a `metrics[]` array. The business signal is binary: the C5 fidelity claim on the CLI surface is now **true** (was false before this fix).

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P1 fidelity — C5 hash enforcement on CLI surface | ✅ (baseline: broken — `actual === expected` always) | Immediately post-merge | Signal: `on-track` — AC1/AC2/AC3 tests pass in CI on merge commit `8584d53`. The fix closes the security gap identified in WSJF sequencing as P1, WSJF=39.0. |
