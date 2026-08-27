# Implementation Plan: aslr-s1 — Route the journey navigator's active-stage link through the existing resume flow

**Story:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/stories/aslr-s1-route-active-stage-link-through-resume.md
**Test plan:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/test-plans/aslr-s1-test-plan.md
**DoR:** artefacts/2026-08-27-active-stage-link-stale-session-dead-end/dor/aslr-s1-dor.md
**Worktree:** .worktrees/aslr-s1 (branch `aslr-s1`, based on origin/master)

---

## Tasks

### Task 1 — Fix all four call sites (scope expanded mid-implementation, see decisions.md)
- `journey.js`: change all 4 raw `/skills/:skill/sessions/:id/chat` constructions built from `journey.activeSessionId` to `/journey/:featureSlug/resume`: the step-nav `isActive` branch (~891), `currentChatUrl` (~931-933, the actual "← Current stage" button clicked in live reproduction), `handleGetStageReview`'s fallback (~628-632), `handleGetJourneyStageView`'s own no-artefact-yet fallback (~775-779).
- ACs covered: AC1, AC5 (part 1 — the href/Location constructions themselves), AC6, AC7 (part 1).

### Task 2 — New regression test file + update one outdated existing assertion
- `tests/check-aslr-s1-active-stage-link-resume.js` covering AC1/AC5 (rendered HTML hrefs), AC6/AC7 (direct handler calls, fallback Locations).
- Update `check-jsvr-s1-wire-stage-view-route.js`'s "unknown stageName" edge-case assertion (was asserting the old raw URL, now asserts `/journey/:featureSlug/resume`).
- ACs covered: AC1, AC5, AC6, AC7.

### Task 3 — Regression sweep
- Re-run `check-s0.1-resume-guard.js`, `check-s0.2-resume-existing-session.js` (covers AC2/AC3/AC4 already), `check-s0.4-resume-redis-session.js`, `check-jsvr-s1-wire-stage-view-route.js`, `check-frsr-s1-feature-row-session-resume.js`, `check-dsh-s4-fix-resume-conversation-link.js`, then the full suite.
- ACs covered: AC2, AC3, AC4, AC8.

---

## Sequencing

Single-file production change; tasks are sequential (fix → test → verify) rather than parallelizable, given the small scope.
