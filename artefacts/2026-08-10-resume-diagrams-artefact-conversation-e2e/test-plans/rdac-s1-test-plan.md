## Test Plan: Lock in "resuming a completed stage shows diagrams, artefact, and conversation together" with a real browser E2E test

**Story reference:** artefacts/2026-08-10-resume-diagrams-artefact-conversation-e2e/stories/rdac-s1-lock-in-resume-scenario-with-e2e.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | E2E | Gap type | Risk |
|----|-------------|-----|----------|------|
| AC1 | Diagram renders as a real mermaid SVG on the resumed view | 1 scenario | — | 🟢 |
| AC2 | Real artefact content renders on the resumed view | (same scenario) | — | 🟢 |
| AC3 | Conversation (skill's final message) renders, not dropped | (same scenario) | — | 🟢 |
| AC4 | No live interactive control -- genuinely read-only | (same scenario) | — | 🟢 |

All four ACs are asserted within a single Playwright spec (one real browser session, one journey, one turn) since they describe different facets of the SAME resumed page render, not independent scenarios.

---

## Coverage gaps

None. This is itself the E2E-coverage gap being closed; no further Playwright tooling decision is required (already configured and used elsewhere in this repo).

---

## Test Data Strategy

**Source:** A real journey driven through the mock-gateway-backed local harness, reusing `design-definition-canvas-render.spec.js`'s own `driveJourneyToStage`/`useIsolatedTenant` helper pattern (duplicated, not imported, per that file's own convention).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no real staging or credits dependency.
**Owner:** Self-contained.

---

## E2E Tests

### rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js

- **Verifies:** AC1, AC2, AC3, AC4
- **Scenario:** Drive a fresh journey through discovery/benefit-metric/design via the fast mock-gateway JSON path, then complete `/definition`'s own turn through the real streaming chat UI (the local `NODE_ENV=test` stub adapter server.js wires for the streaming endpoint). Navigate to `/journey/:id/stage/definition` (the now-completed, historical stage's resume view) and assert: the `program-design` CANVAS-JSON marker renders as a real mermaid SVG (AC1); the real artefact text renders (AC2); the skill's own final message renders in `#chat-messages` (AC3); no `<textarea>`/submit-button interactive controls are present (AC4).
- **Tooling:** Playwright, local `NODE_ENV=test` harness — no real staging.

---

## NFR Tests

None beyond the ACs above.

---

## Out of Scope for This Test Plan

- A real-staging variant of this spec — not needed; the operator already live-confirmed the underlying fix on real staging this session.

---

## Test Gaps and Risks

None identified as blocking. Verified 3x locally (`--repeat-each` equivalent, run individually) with zero flakiness before considering this story done.
