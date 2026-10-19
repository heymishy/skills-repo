## Test Plan: Playback capture triggers automatically when a feature reaches Definition of Done, not via a manually-issued CLI per feature

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Review reference:** artefacts/2026-10-19-real-playback-capture-automation/review/rpca-s5-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on Step 2 (test context) and Step 3 (test data strategy)

**Test context:** Option 1 — this repo's own configured runner, no stack deviation.
**Test data strategy:** Mixed. AC1/AC2 are real, code-level `checkDodGate` fixes in `scripts/playback-capture.js` — synthetic fixture `pipeline-state.json`-shaped objects, no real network/secret dependency. AC3-AC5 are SKILL.md orchestration changes (`skills/definition-of-done/SKILL.md`, `skills/feature-playback/SKILL.md`) — real-file content assertions against the actual files this story modifies, same convention `rpca-s4` already established, not fixtures standing in for them.

---

## Note on Step 3a (E2E / browser-layout detection)

Not applicable — no drag-drop, no pointer/coordinate claim, no CSS-layout-dependent AC. AC1/AC2 are pure function logic; AC3-AC5 are documentation/orchestration-instruction content.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `checkDodGate` returns ok when every story's own `dodStatus` is complete, regardless of the unwritten `feature.dodStatus` field | 2 tests | — | — | — | — | 🟢 |
| AC2 | `checkDodGate` throws, naming the specific incomplete story | 1 test | — | — | — | — | 🟢 |
| AC3 | `/definition-of-done`'s own Feature-completion trace check automatically runs `/feature-playback`'s own Steps 1-3 | 1 test | — | — | — | — | 🟢 |
| AC4 | A capture failure doesn't downgrade the DoD verdict; records a named follow-up action | 1 test | — | — | — | — | 🟢 |
| AC5 | The existing manual `/feature-playback` invocation path still works unchanged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are fully covered: AC1/AC2 by real code-level unit tests (no mocking of `checkDodGate` itself — exercises the real function against fixture state objects), AC3-AC5 by real-file content assertions against the actual governed files this story modifies.

---

## Test Data Strategy

**Source:** Synthetic fixture state objects (AC1/AC2) + real files (AC3-AC5, the actual `skills/definition-of-done/SKILL.md` and `skills/feature-playback/SKILL.md`, read fresh at test time)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture `pipeline-state.json`-shaped object with a feature containing 2+ stories, all `dodStatus: "complete"`, no top-level `feature.dodStatus` field set | Synthetic | None | Proves the fix doesn't depend on the unwritten field |
| AC2 | Same shape, one story `dodStatus` missing or not `"complete"` | Synthetic | None | |
| AC3 | The real `skills/definition-of-done/SKILL.md` content, post-change | Real file | None | Asserts the Feature-completion trace check section now describes auto-invoking `/feature-playback` |
| AC4 | Same real file, its own non-blocking-failure language | Real file | None | |
| AC5 | The real `skills/feature-playback/SKILL.md` content, post-change (already modified by `rpca-s4`) | Real file | None | Asserts the manual-trigger description/triggers list is unchanged by this story |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): `checkDodGate` returns ok when every story is complete, regardless of `feature.dodStatus`

- **Verifies:** AC1
- **Precondition:** Fixture state: a feature with 2 stories (epic-nested), both `dodStatus: "complete"`, no `feature.dodStatus` field set at all
- **Action:** Call `checkDodGate(state, featureSlug)`
- **Expected result:** Returns `{ ok: true, feature }` — does not throw
- **Edge case:** No

### AC1 (unit): `checkDodGate` returns ok when `feature.dodStatus` exists but is stale/wrong

- **Verifies:** AC1
- **Precondition:** Same fixture, but with a stale `feature.dodStatus: "in-progress"` field also present
- **Action:** Call `checkDodGate(state, featureSlug)`
- **Expected result:** Still returns `{ ok: true, feature }` — the stale field is ignored, every story's own evidence field is read directly
- **Edge case:** Yes — this is the "field exists but disagrees with reality" boundary

### AC2 (unit): `checkDodGate` throws naming the specific incomplete story

- **Verifies:** AC2
- **Precondition:** Fixture state: a feature with 2 stories, one `dodStatus: "complete"`, one `dodStatus: "in-progress"`
- **Action:** Call `checkDodGate(state, featureSlug)`
- **Expected result:** Throws an error whose message includes the specific incomplete story's own slug — not just "feature dodStatus is not complete"
- **Edge case:** No

---

## Integration Tests

None — `checkDodGate`'s own fix is pure function logic, no component handoff to test. AC3-AC5 are real-file content assertions, not integration tests in the code sense.

---

## NFR Tests

None — confirmed with story owner. No new NFR beyond what this story's own NFR section states (performance: fires once per feature, not per story; security: reuses the existing CLI/secret convention unchanged).

---

## Out of Scope for This Test Plan

- Actually running a real capture against real staging as part of this story's own automated tests — covered by `rpca-s1`'s own existing RISK-ACCEPT precedent; this story only changes the trigger point and the gate logic
- Testing `/feature-playback`'s own Step 4 editorial-review gate — unchanged by this story, already covered by that skill's own existing design

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | AC1/AC2 are real code-level tests; AC3-AC5 are real-file content assertions against files this story itself modifies | N/A |
