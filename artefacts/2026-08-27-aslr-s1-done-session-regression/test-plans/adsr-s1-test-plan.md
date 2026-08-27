## Test Plan: Stop churning fresh sessions for an already-done stage

**Story reference:** artefacts/2026-08-27-aslr-s1-done-session-regression/stories/adsr-s1-preserve-direct-link-for-done-sessions.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## Pre-implementation investigation (informs this plan)

Confirmed live on `wuce-staging` (2026-08-27, minutes after `aslr-s1` deployed): two distinct skill-session IDs fired full turn cycles ~70 seconds apart on the same journey while the operator navigated resume → current stage → continue to next stage, then hit `403 Forbidden` on gate-confirm. Root cause confirmed by direct code inspection: `handleGetJourneyResume`'s own comment (`journey.js:1502-1509`) documents that a `done` session is deliberately never resumed there — it always spawns fresh. `kcrs-s1`'s own code (`journey.js:2904-2911`, `handleGetJourneyById`) already solved this exact conflict: check `getGetHtmlSession()(journey.activeSessionId)` first; if it resolves, link directly; only fall through to `/resume` if it doesn't. `aslr-s1`'s 4 call sites never applied this existence check.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | step-nav isActive link: direct link when session exists (done or not) | 1 test | — | — | — | — | 🔴 |
| AC2 | currentChatUrl: same | 1 test | — | — | — | — | 🔴 |
| AC3 | handleGetStageReview: direct link when session exists but not done | 1 test | — | — | — | — | 🔴 |
| AC4 | handleGetJourneyStageView fallback: direct link when session exists | 1 test | — | — | — | — | 🔴 |
| AC5 | All 4 still fall through to /resume when session missing | re-run aslr-s1 suite | — | — | — | — | 🟢 |
| AC6 | Done session survives view-then-gate-confirm without churn | 1 test | — | — | — | — | 🔴 |
| AC7 | Existing aslr-s1 + resume/stage-view suites pass | re-run | — | — | — | — | 🟢 |

---

## Coverage gaps

None — the fix pattern is a direct, minimal application of `handleGetJourneyById`'s own already-tested logic; the only new behaviour (AC1-AC4, AC6) is directly testable via the exact same technique `check-aslr-s1-active-stage-link-resume.js` already uses (render/call the handler, assert the emitted href/Location), extended with a "session exists" fixture case that file didn't previously cover.

---

## Test Data Strategy

**Source:** Synthetic — extends `check-aslr-s1-active-stage-link-resume.js`'s existing fixture/mock pattern (journeyStore + `setGetHtmlSession` stub, matching `check-s0.2-resume-existing-session.js`'s convention).
**PCI/sensitivity in scope:** No
**Availability:** Available now.

---

## Unit Tests

Extends `tests/check-aslr-s1-active-stage-link-resume.js` in place (this is a direct correction of that story's own scope, not a separate concern).

### AC1/AC2: step-nav link and "Current stage" button, session exists and is done

- **Action:** Render `handleGetJourneyStageView`'s full page for a journey whose active stage's session IS registered in memory (`setGetHtmlSession` returns a `{ done: true, ... }` object for the active session ID) and is `done`.
- **Expected result:** Both the step-nav active-stage link and the "Current stage" button's href are `/skills/:skill/sessions/:id/chat` for that exact session ID — NOT `/journey/:featureSlug/resume`.

### AC3: handleGetStageReview, session exists but not done

- **Action:** Call `handleGetStageReview` with `getGetHtmlSession` stubbed to return `{ done: false, skillName: 'discovery' }` for `journey.activeSessionId`.
- **Expected result:** 302 directly to `/skills/discovery/sessions/:id/chat` — NOT `/resume`.

### AC4: handleGetJourneyStageView's own fallback, session exists

- **Action:** Call `handleGetJourneyStageView` for the active stage (no artefact recorded), with `getGetHtmlSession` stubbed to return a real session object for `journey.activeSessionId`.
- **Expected result:** 302 directly to that session's chat URL — NOT `/resume`.

### AC5 (regression guard): all 4 still fall through to `/resume` when session is genuinely missing

- **Action:** Re-run `check-aslr-s1-active-stage-link-resume.js`'s existing AC6/AC7 tests (the "no memory, no Redis" cases) unmodified.
- **Expected result:** Still redirect to `/journey/:featureSlug/resume` — the original fix is not reverted.

### AC6: view-then-gate-confirm does not churn sessions

- **Action:** Register a `done` session with a drafted artefact. Follow the step-nav link's resolved href (now the direct chat URL, per AC1). Then call `handleGetStageReview` for the same journey. Assert `journey.activeSessionId` is unchanged across both calls (no new session was registered).
- **Expected result:** Same session ID throughout — no churn.

### AC7 (regression guard): full existing suite

- **Action:** Re-run `check-aslr-s1-active-stage-link-resume.js`, `check-s0.1/s0.2/s0.4`, `check-jsvr-s1-wire-stage-view-route.js`, `check-frsr-s1-feature-row-session-resume.js`, `check-dsh-s4-fix-resume-conversation-link.js`, then the full suite.
- **Expected result:** All pass.

---

## Out of Scope for This Test Plan

- Re-testing `handleGetJourneyById`'s own existing `kcrs-s1` coverage — unmodified, already proven.
- A live Fly-restart-based E2E reproduction of the original churn — the unit-level fixtures directly reproduce the exact condition (a `done` in-memory session) without needing real infrastructure timing.
