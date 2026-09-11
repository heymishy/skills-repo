# Implementation Plan: Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400 (csgc-s1)

**Story:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/stories/csgc-s1-story-extraction-regression-test-and-gate-confirm-investigation.md
**Test plan:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/test-plans/csgc-s1-test-plan.md
**DoR:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/dor/csgc-s1-dor.md

---

## Task 1: Story-extraction regression test against the real fixture (AC1, AC2)

**Files:** `tests/check-csgc-s1-story-extraction-and-gate-confirm.js` (new)

- Loads `tests/e2e/fixtures/llm-gateway/definition.success.json` directly, extracts its real artefact content.
- AC1: calls `extractStoryIdsFromDefinitionArtefact` directly, asserts `["mock-fixture.1"]`.
- AC2: sets up a real journey via `journey-store.js`, wires a session carrying that real artefact content, calls `handlePostGateConfirm`, asserts it redirects straight to review with the full story list set.

**Status:** committed

---

## Task 2: Gate-confirm 400 investigation via the real streaming path (AC3)

**Files:** same test file

- T3a: drives `handlePostTurnStreamHtml` fully (real streaming handler, mocked LLM executor only), then calls `handlePostGateConfirm` — confirms no 400.
- T3b: forces `session.done` back to false (simulating an out-of-sequence call) — confirms this DOES 400, pinpointing the exact mechanism.
- Conclusion: the original observation is an artifact of the debug script's own construction (premature call), not reachable via the real production client. AC3 closed via outcome (b).

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
