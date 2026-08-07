## Test Plan: Make feature rows in a product's view clickable, linking through to persisted conversation/artefacts

**Story reference:** artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Feature rows are real links | 1 test | — | 1 test | — | — | 🟢 |
| AC2 | completeStage() records sessionId | 1 test | — | — | — | — | 🟢 |
| AC3 | Artefact-index page shows "Resume conversation" link when resolvable | — | 1 test | — | — | — | 🟢 |
| AC4 | Resume link reuses existing handleGetChatHtml rendering | — | 1 test | — | — | — | 🟢 |
| AC5 | Evicted/missing session shows honest message, not silent failure | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None — no CSS-layout/visual dependency; AC1's E2E check is a simple link-presence/keyboard-activation check, tooling already configured (ADR-018).

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A product with 1+ features | Synthetic fixture | None | |
| AC2 | A journey completing a real stage via `handlePostGateConfirm` | Synthetic, mirrors existing gate-confirm test fixtures | None | |
| AC3-AC4 | A feature with a completed stage whose sessionId is now resolvable (post-AC2) | Synthetic | None | |
| AC5 | A completed stage whose session has been evicted/removed | Synthetic (directly manipulate the session store's own store to simulate eviction) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### featureRowRendersAsRealLink

- **Verifies:** AC1
- **Precondition:** A merged feature item with a resolvable slug
- **Action:** Render `_renderPvcItemRow` (or its successor) for this item
- **Expected result:** Output contains a real `<a href="/features/...">` element wrapping the row, not a bare `<div>`
- **Edge case:** No

### completeStageRecordsSessionId

- **Verifies:** AC2
- **Precondition:** A journey with `activeSessionId` set to a known value
- **Action:** Call `completeStage(journeyId, skillName, artefactPath, usageSummary)`
- **Expected result:** The resulting `completedStages` entry includes `sessionId` matching the journey's `activeSessionId` at call time, in addition to all fields already recorded today
- **Edge case:** No

---

## Integration Tests

### artefactIndexShowsResumeLinkWhenSessionResolvable

- **Verifies:** AC3
- **Components involved:** `handleGetFeatureArtefacts`, `renderArtefactIndexHtml`, journey store (post-AC2 shape)
- **Precondition:** A feature with a completed stage whose `completedStages` entry has a real `sessionId`
- **Action:** GET `/features/:slug`
- **Expected result:** The corresponding artefact row shows a "Resume conversation" (or equivalent) link to `/skills/:skillName/sessions/:sessionId/chat`, alongside the existing "View" link — both present, neither replaced

### resumeConversationLinkReachesRealChatHistory

- **Verifies:** AC4
- **Components involved:** `handleGetChatHtml` (reused, unmodified)
- **Precondition:** Same as above; the session has real turn history
- **Action:** Follow the "Resume conversation" link
- **Expected result:** The rendered page shows the exact same turn history `handleGetChatHtml` would show if reached directly by its existing route — confirms no new/duplicated rendering logic was introduced

### evictedSessionShowsHonestMessage

- **Verifies:** AC5
- **Components involved:** `handleGetChatHtml`'s existing "Session not found" path, reused
- **Precondition:** A `completedStages` entry with a `sessionId` that no longer resolves (removed from both in-memory store and Redis, simulating eviction)
- **Action:** Follow the "Resume conversation" link for this stage
- **Expected result:** A clear "Session not found"-equivalent message is shown — matches `handleGetChatHtml`'s own existing not-found handling, not a new, different failure mode

---

## E2E Tests

### clickingFeatureRowNavigatesToArtefactIndex

- **Verifies:** AC1 (end-to-end confirmation)
- **Precondition:** A logged-in test session viewing a product's page with 1+ features
- **Action:** Click (and separately, keyboard-activate) a feature row in a real browser (Playwright, local `NODE_ENV=test` harness)
- **Expected result:** Navigates to `/features/:slug` for that feature — both mouse and keyboard activation work

---

## NFR Tests

### featureArtefactIndexLookupBounded

- **NFR addressed:** Performance
- **Measurement method:** Assert the featureSlug→journeyId→completedStages lookup added to `/features/:slug` executes once per page render, not once per artefact row (e.g. via a call-count spy on the lookup function)
- **Pass threshold:** Exactly one lookup call regardless of artefact-row count
- **Tool:** Node test runner

### resumeConversationLinkRespectsExistingSecurityGuard

- **NFR addressed:** Security
- **Measurement method:** Reuse `handleGetChatHtml`'s own existing NFR-Security test pattern (confirmed from `a4-ideate-session-resume.spec.js`'s own NFR-Security check) — assert a cross-tenant/cross-user resume attempt via this new link is rejected identically
- **Pass threshold:** Same rejection behaviour as the existing, already-tested direct route
- **Tool:** Node test runner / Playwright

---

## Out of Scope for This Test Plan

- `handleGetChatHtml`'s own internal rendering/session-restore correctness — already covered by its own existing test suite, reused not duplicated.
- The kanban board's own separate card-click behaviour — out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-world session-eviction timing (7-day default) cannot be fully exercised in a fast test run | Time-based, external constraint | AC5's test simulates eviction directly (removing the session from both stores) rather than waiting out the real window — sufficiently proves the honest-failure-message behaviour |
