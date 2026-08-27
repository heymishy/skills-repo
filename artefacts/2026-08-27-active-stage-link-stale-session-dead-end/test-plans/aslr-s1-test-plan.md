## Test Plan: Route the journey navigator's active-stage link through the existing resume flow

**Story reference:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/stories/aslr-s1-route-active-stage-link-through-resume.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## Pre-implementation investigation (informs this plan)

Direct source inspection confirmed the exact blast radius before writing this plan:

- **Exactly one unsafe call site.** Every `journey.activeSessionId`-based redirect across `journey.js`/`skills.js` was checked. `journey.js:1578,1717,2326,2376,2445` and `skills.js:1179` all create a brand-new session immediately before redirecting (always safe). `journey.js:2907` first verifies the session exists in memory (`_kcrsSession && _kcrsSession.done`) before using it (safe). `journey.js:891` — the step-nav "active stage" breadcrumb — is the only one that builds the URL from the stored ID with zero verification and zero fallback.
- **The fix target already exists and is already tested.** `handleGetJourneyResume` (`journey.js:1413-1580`) implements the full fallback chain: live session → immediate redirect; Redis-restorable → restore and redirect; neither → create a fresh session seeded with all completed prior-stage artefacts, link it to the journey, update `activeSessionId`, redirect. Existing coverage: `check-s0.1-resume-guard.js`, `check-s0.2-resume-existing-session.js`, `check-s0.4-resume-redis-session.js`.
- **The change itself is a single `href` construction** inside the step-nav renderer's `isActive` branch (`journey.js:891`), from a raw `/skills/:skill/sessions/:id/chat` link to `/journey/:featureSlug/resume`. `journey.featureSlug` is already in scope two lines earlier in the same function (line 872).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Live in-memory session: breadcrumb still reaches it | 1 test | — | — | — | — | 🟢 |
| AC2 | Redis-restorable session: breadcrumb restores and continues | 1 test | — | — | — | — | 🟡 |
| AC3 | Neither memory nor Redis: breadcrumb creates a fresh session, not a 404 | 1 test | — | — | — | — | 🔴 |
| AC4 | Fresh session's ID is recorded as the journey's new `activeSessionId` | 1 test | — | — | — | — | 🟡 |
| AC5 | `isDone` branch links unchanged | 1 test | — | — | — | — | 🟢 |
| AC6 | Existing resume-flow suite passes unchanged | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None — this is a single-function, single-line-of-construction change with an already-well-tested target endpoint. The only genuinely new behaviour (AC3/AC4) is directly testable by rendering the step-nav HTML and asserting the emitted `href`, then separately confirming `handleGetJourneyResume`'s own already-covered fallback behaviour is what that `href` leads to (not re-testing `handleGetJourneyResume` itself, which is out of scope — see below).

---

## Test Data Strategy

**Source:** Synthetic — a fake/stubbed journey record with a `featureSlug`, `activeSkill`, and `activeSessionId`, following the existing pattern in `check-s0.2-resume-existing-session.js` and this repo's other `journey.js` step-nav rendering tests.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

New tests added to `tests/check-aslr-s1-active-stage-link-resume.js`.

### AC1: step-nav's active-stage link no longer points at the raw session URL

- **Action:** Render the step-nav HTML (via the same internal renderer `journey.js:891` belongs to, or by rendering a full stage-view page) for a journey with `activeSkill` set to a stage and `activeSessionId` set to some session ID.
- **Expected result:** The active stage's `<a href="...">` is `/journey/<featureSlug>/resume`, NOT `/skills/<skill>/sessions/<id>/chat`.

### AC2 (regression guard, exercised via the existing resume endpoint): live in-memory session

- **Action:** Register an in-memory skill session matching the journey's `activeSessionId`, not done. Call `GET /journey/:featureSlug/resume`.
- **Expected result:** 303 to `/skills/:skill/sessions/:id/chat` for that exact session — matches `check-s0.2-resume-existing-session.js`'s existing coverage; re-run to confirm no regression from this story's link change (which never touches `handleGetJourneyResume` itself).

### AC3: Redis-restorable session

- **Action:** No in-memory session; fake Redis adapter returns turn data for `activeSessionId`. Call `GET /journey/:featureSlug/resume`.
- **Expected result:** 303 into the restored session — matches `check-s0.4-resume-redis-session.js`'s existing coverage; re-run to confirm.

### AC4 (the fix): neither memory nor Redis — fresh session created, not a 404

- **Action:** `activeSessionId` set on the journey, but absent from both the in-memory store and the fake Redis adapter (simulating a genuinely evicted/expired session — the exact condition confirmed live on production 2026-08-27). Click-equivalent: follow the step-nav link's `href` from AC1, i.e. `GET /journey/:featureSlug/resume`.
- **Expected result:** 303 to a **new** session ID's chat URL (different from the stale `activeSessionId`) — not a 404. The new session is seeded with `priorArtefacts` for every completed stage.

### AC5: journey record updated with the new session ID

- **Action:** After AC4's flow completes, inspect the journey record (`_journeyStore.getJourney(journeyId)`).
- **Expected result:** `activeSessionId` now equals the new session's ID, not the original stale one.

### AC6: `isDone` branch unchanged

- **Action:** Render the step-nav HTML for a journey with at least one completed (non-active) stage.
- **Expected result:** That stage's link is still `/journey/:journeyId/stage/:skillName` — byte-identical to pre-fix behaviour.

### AC7 (regression guard): full existing resume-flow suite

- **Action:** Re-run `check-s0.1-resume-guard.js`, `check-s0.2-resume-existing-session.js`, `check-s0.4-resume-redis-session.js`.
- **Expected result:** All pass unchanged — `handleGetJourneyResume` itself is not modified by this story.

---

## Integration Tests

None beyond the unit-level `GET /journey/:featureSlug/resume` exercises above — these already ARE integration-level (they hit the real route handler, not a mocked one), consistent with how `check-s0.*` already tests this endpoint.

---

## E2E Tests

None new. The production occurrence that motivated this story (an old, genuinely-expired session) is not practically reproducible as a fast CI E2E test — the unit-level AC4 test (no memory, no Redis) is the direct, faster-running equivalent of that exact condition.

---

## NFR Tests

None named — story's own NFR section confirms negligible performance cost (one extra same-origin redirect hop) and no new security surface (the resume endpoint already enforces `requireJourneyAccess`).

---

## Out of Scope for This Test Plan

- Testing `handleGetChatHtml`'s 404 page itself — unchanged by this story, already covered by `def-s1`'s and `frsr-s1`'s own test suites.
- Testing any of the other 7 already-confirmed-safe `journey.activeSessionId` call sites — confirmed safe by direct code inspection (see Pre-implementation investigation), not by new tests, matching this repo's existing convention of documenting an investigation rather than testing a negative for code that already has its own established test coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| A future new step-nav-style link that reads `activeSessionId` directly, bypassing `/resume` | Nothing in the codebase structurally prevents a future call site from repeating this exact mistake | Documented in the story's evidence trail as the specific anti-pattern to avoid; no automated lint/structural guard proposed here as it would be disproportionate to a Complexity-1 fix |
