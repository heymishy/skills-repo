## Test Plan: Fix three /ideate UX gaps — resume panel loss, no way to signal completion, cramped canvas layout

**Story reference:** artefacts/2026-08-10-ideate-resume-panels-and-wrap-up/stories/rapp-s1-resume-panels-and-wrap-up.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Gap type | Risk |
|----|-------------|------|----------|------|
| AC1 | assumption cards init assignment present when populated | 1 test | — | 🟢 |
| AC2 | condition items init assignment present when populated | 1 test | — | 🟢 |
| AC3 | no init assignments when neither field populated | 1 test | — | 🟢 |
| AC4 | init assignments never appear for non-ideate skills | 1 test | — | 🟢 |
| AC5 | client script hydrates both on page load | 1 test | — | 🟢 |
| AC6 | wrap-up button present for in-progress ideate | 1 test | — | 🟢 |
| AC7 | wrap-up button absent once done | 1 test | — | 🟢 |
| AC8 | wrap-up button never appears for non-ideate | 1 test | — | 🟢 |
| AC9 | canvas-section has non-zero min-height | 1 test | — | 🟢 |

---

## Coverage gaps

None blocking. Live-verification on staging (Chrome-driven) is the appropriate confirmation for the actual visual/interactive experience (resumed panels rendering, button click behaviour, canvas layout at real viewport sizes) beyond what server-rendered-HTML unit assertions can prove — planned as part of this story's own completion, not a formal E2E spec addition (matching the precedent that not every UI fix gets a dedicated Playwright spec; `rdac-s1`'s existing real-browser spec already covers the underlying resume-rendering mechanism this story extends).

---

## Test Data Strategy

**Source:** Direct unit-level session-state construction (`registerHtmlSession` + direct field assignment) against the real, unmodified `handleGetChatHtml` handler — matches this repo's established convention for skills.js render-path tests (see `check-a3-ideate-artefact-disk-match.js`, `check-a4-session-store-state.js`).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no real staging or credits dependency.
**Owner:** Self-contained.

---

## Unit Tests

### check-rapp-s1-resume-panels-and-wrap-up.js

- **Verifies:** AC1–AC9
- **Scenario:** Nine tests directly rendering `/ideate` (and, for negative-gating assertions, `/discovery`) chat sessions with varying `assumptionCards`/`conditionItems`/`done` state, asserting the exact server-rendered HTML markers each fix is responsible for.
- **Tooling:** Node, no external dependencies — matches every other `check-*.js` file's convention in this repo.

## Regression Tests

- `check-a3-ideate-artefact-disk-match.js`, `check-a4-session-store-state.js` — canvas/assumption resume mechanics, re-run unmodified.
- `check-icv-s1-ideate-canvas-turn2-render-fix.js`, `check-bri-s3.1-mock-llm-gateway.js`, `check-mgtc-s1-turn-index-cycling.js`, `check-isc-s1-ideate-success-lens-cycling.js` — the isc-s1/isc-s2/mgtc-s1 chain this story builds directly on top of, re-run unmodified.
- `check-wusl1-chat-streaming.js` — streaming turn-submission mechanics (same script region), re-run unmodified.
- `check-dsh-s3-render-chat-readonly.js`, `check-cmtt-s1-chat-message-text-truncation-fix.js`, `check-cdpl-s1-canvas-panel-layout-fix.js`, `check-iwu1-context-manifest.js` — other chat-view.js/skills.js render-path tests in the same files this story touches, re-run unmodified.
- `tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js` — full-pipeline E2E (both entry points, resume checks at multiple stages), re-run unmodified to confirm no regression to the broader journey flow.
- `tests/e2e/rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js` — real-browser resume rendering (diagram/artefact/conversation) at the `/definition` stage, re-run unmodified to confirm the canvas-section min-height change and hydration additions don't regress the already-proven resume mechanism.

**Pre-existing, confirmed-unrelated failures excluded from this story's regression gate** (verified via a clean-master stash comparison — identical failure counts before and after this story's changes): `check-mfc2-chat-ux-improvements.js` (1 failure), `check-iwu2-right-panel-layout.js` (9 failures), `check-inc2.1-conditions-panel.js` (5 failures), `check-inc4-canvas-panel.js` (5 failures).

---

## Out of Scope for This Test Plan

- A real-staging Playwright variant — live Chrome-driven verification on staging is this story's own completion criterion, not a new automated spec, per the story's own Out of Scope section.
- Fixing the 4 pre-existing failing test files listed above — out of scope for this story per its own Out of Scope section.

---

## Test Gaps and Risks

None identified as blocking.
