## Test Plan: Make the default mock-gateway /ideate scenario actually cycle through lenses, assumptions, conditions, and completion

**Story reference:** artefacts/2026-08-10-ideate-success-lens-cycling/stories/isc-s1-ideate-success-lens-cycling.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Gap type | Risk |
|----|-------------|------|----------|------|
| AC1 | turnIndex 0 = Lens A, cluster-tree + assumption marker | 1 test | — | 🟢 |
| AC2 | turnIndex 2 = Lens B, differs from turn 0, has assumption + condition markers | 1 test | — | 🟢 |
| AC3 | turnIndex 4/6 = Lens C/D, each differs from every prior turn | 1 test | — | 🟢 |
| AC4 | turnIndex 8 = final artefact-completion turn, valid ARTEFACT-START/END block | 1 test | — | 🟢 |
| AC5 | turnIndex beyond 8 clamps to the final entry | 1 test | — | 🟢 |
| AC6 | existing dependent tests updated and pass with zero regression | 5 existing files re-run | — | 🟢 |

---

## Coverage gaps

None. Pure fixture-content addition plus two existing tests' raw-shape read sites updated.

---

## Test Data Strategy

**Source:** The fixture file itself (`tests/e2e/fixtures/llm-gateway/ideate.success.json`), read via the real, unmodified `getMockResponse()`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

### check-isc-s1-ideate-success-lens-cycling.js

- **Verifies:** AC1–AC5
- **Scenario:** Call `getMockResponse('ideate', model, 'success', turnIndex)` at `turnIndex` 0, 2, 4, 6, 8, and 100 (beyond-scripted), asserting: distinct content at each of 0/2/4/6, the correct marker types present at each stage (assumption at 0 and 2, condition at 2, artefact-completion block at 8), and that turnIndex 100 returns the same content as turnIndex 8 (clamping).
- **Tooling:** Node, no external dependencies — matches every other `check-*.js` file's convention in this repo.

## Regression Tests

- `check-a3-ideate-artefact-disk-match.js` — re-run, updated to read `fixture.responses[0].response`.
- `check-a4-session-store-state.js` — re-run, updated to read `fixture.responses[0].response`.
- `check-icv-s1-ideate-canvas-turn2-render-fix.js` — re-run unmodified.
- `check-mds-s1-diagram-showcase-fixtures.js` — re-run, `EXISTING_FIXTURE_CHECKSUMS` updated to drop `ideate.success.json` (this story's own deliberate, intentional change to that file).
- `check-bri-s3.1-mock-llm-gateway.js` — re-run unmodified.
- `check-mgtc-s1-turn-index-cycling.js` — re-run unmodified (proves the underlying turnIndex plumbing this story's fixture now actually exercises for real).

---

## Out of Scope for This Test Plan

- Live Chrome/E2E re-verification against staging — done manually as part of this story's own live review (not a new automated E2E spec); the operator's original ask was fixed-and-verified live, not locked into a Playwright spec.

---

## Test Gaps and Risks

None identified as blocking.
