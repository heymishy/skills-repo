## Test Plan: Route the journey navigator's active-stage link through the existing resume flow

**Story reference:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/stories/aslr-s1-route-active-stage-link-through-resume.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## Pre-implementation investigation (informs this plan)

Direct source inspection confirmed the exact blast radius before writing this plan:

- **Four unsafe call sites, all in `journey.js`.** Every `journey.activeSessionId`-based redirect across `journey.js`/`skills.js` was checked. `journey.js:478,1578,1717,2326,2376,2445` and `skills.js:1179` all create a brand-new session immediately before redirecting (always safe). `journey.js:2907` first verifies the session exists in memory (`_kcrsSession && _kcrsSession.done`) before using it (safe). Four build the raw chat URL from the stored `activeSessionId` with zero verification and zero fallback: the step-nav "active stage" breadcrumb (line 891), the "← Current stage" button's `currentChatUrl` (line 931-933, rendered at 1013/1326 — this is the literal link clicked during live reproduction), `handleGetStageReview`'s not-done fallback (line 628-632), and `handleGetJourneyStageView`'s own no-artefact-yet fallback (line 775-779).
- **The fix target already exists and is already tested.** `handleGetJourneyResume` (`journey.js:1413-1580`) implements the full fallback chain: live session → immediate redirect; Redis-restorable → restore and redirect; neither → create a fresh session seeded with all completed prior-stage artefacts, link it to the journey, update `activeSessionId`, redirect. Existing coverage: `check-s0.1-resume-guard.js`, `check-s0.2-resume-existing-session.js`, `check-s0.4-resume-redis-session.js`.
- **The change itself is four identical `href`/`Location` construction changes**, from a raw `/skills/:skill/sessions/:id/chat` URL to `/journey/:featureSlug/resume`. `journey.featureSlug` is already in scope at each of the four sites.
- **One existing test's expectation is now outdated by design:** `check-jsvr-s1-wire-stage-view-route.js`'s "unknown stageName" edge-case test asserts the OLD raw-URL redirect target; it must be updated to assert the new `/resume` target (its intent — "this fallback is reachable and works" — is unchanged, only the specific target moves).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Live in-memory session: all 4 sites still reach it | re-run existing suite | — | — | — | — | 🟢 |
| AC2 | Redis-restorable session: restores and continues | re-run existing suite | — | — | — | — | 🟡 |
| AC3 | Neither memory nor Redis: fresh session, not a 404 | 1 test per site (4 total, in `check-s0.2`/new file) | — | — | — | — | 🔴 |
| AC4 | Fresh session's ID recorded as the journey's new `activeSessionId` | covered by AC3's tests | — | — | — | — | 🟡 |
| AC5 | `isDone` branch links unchanged | 1 test | — | — | — | — | 🟢 |
| AC6 | `handleGetStageReview`'s fallback routes through `/resume` | 1 test | — | — | — | — | 🔴 |
| AC7 | `handleGetJourneyStageView`'s own fallback routes through `/resume` | 1 test + update to `check-jsvr-s1`'s existing assertion | — | — | — | — | 🔴 |
| AC8 | Existing resume/stage-view suites pass unchanged | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None — this is a mechanically-repeated construction change across 4 sites in 2 functions, against an already-well-tested target endpoint. The genuinely new behaviour (AC3/AC4/AC6/AC7) is directly testable by rendering the step-nav HTML / calling the two fallback-containing handlers directly and asserting the emitted `href`/`Location`, then relying on `handleGetJourneyResume`'s own already-covered fallback behaviour for what that target does next (not re-testing `handleGetJourneyResume` itself, which is out of scope — see below).

---

## Test Data Strategy

**Source:** Synthetic — a fake/stubbed journey record with a `featureSlug`, `activeSkill`, and `activeSessionId`, following the existing pattern in `check-s0.2-resume-existing-session.js` and this repo's other `journey.js` step-nav rendering tests.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

New tests added to `tests/check-aslr-s1-active-stage-link-resume.js`. AC1-AC4 are exercised indirectly (via `check-s0.2`/`check-s0.4`'s existing, unmodified coverage of `handleGetJourneyResume` itself — this file only proves each of the four call sites now points AT that endpoint).

### AC1/AC5: step-nav's active-stage link, "Current stage" button, and completed-stage link

- **Action:** Render `handleGetJourneyStageView`'s full page (via a stage that has a completed artefact, so the early fallback isn't hit) for a journey with one completed, non-viewed stage (`ideate`) and an active stage (`benefit-metric`) whose `activeSessionId` is a stale ID.
- **Expected result:** The active stage's step-nav `<a href="...">` and the "← Current stage" button's `href` are both `/journey/<featureSlug>/resume`; the old raw `/skills/.../sessions/<staleId>/chat` fragment appears nowhere in the page (AC1). The completed `ideate` stage's link is unchanged: `/journey/<journeyId>/stage/ideate` (AC5).

### AC3/AC4 (the fix, exercised via the existing resume endpoint's own coverage)

- Already covered by `check-s0.2-resume-existing-session.js`'s AC4 ("stale activeSessionId not in memory (post-deploy): create new session") and `check-s0.4-resume-redis-session.js` — re-run to confirm no regression, per AC8. Not re-tested here.

### AC6: `handleGetStageReview`'s fallback

- **Action:** Call `handleGetStageReview` directly for a journey whose active session is not in memory (`getGetHtmlSession` stubbed to return `null`).
- **Expected result:** 302 to `/journey/<featureSlug>/resume`, not the old raw `/skills/.../sessions/<id>/chat` URL.

### AC7: `handleGetJourneyStageView`'s own no-artefact-yet fallback

- **Action:** Call `handleGetJourneyStageView` for the journey's active stage, which has no recorded artefact yet.
- **Expected result:** 302 to `/journey/<featureSlug>/resume`. `check-jsvr-s1-wire-stage-view-route.js`'s existing "unknown stageName" edge-case assertion is updated to expect this same target instead of the old raw URL.

### AC8 (regression guard): full existing resume/stage-view suite

- **Action:** Re-run `check-s0.1-resume-guard.js`, `check-s0.2-resume-existing-session.js`, `check-s0.4-resume-redis-session.js`, `check-jsvr-s1-wire-stage-view-route.js`, `check-frsr-s1-feature-row-session-resume.js`, `check-dsh-s4-fix-resume-conversation-link.js`.
- **Expected result:** All pass — `handleGetJourneyResume` itself is not modified by this story; `check-jsvr-s1`'s one updated assertion (AC7) is the only intentional change to an existing file.

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
