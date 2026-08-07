# AC Verification Script: Make feature rows in a product's view clickable, linking through to persisted conversation/artefacts

**Story reference:** artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
**Technical test plan:** artefacts/2026-07-24-feature-row-session-resume-link/test-plans/frsr-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude (agent), operator-directed | **Date:** 2026-07-24 | **Context:** [x] Post-merge (automated, see notes)

---

## Setup

**Before you start:**
1. Have a product with at least one feature that has completed at least one pipeline stage.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: You can click a feature to see its detail

**Covers:** AC1

**Steps:**
1. Open a product's page.
2. Click on a feature in the list.

**Expected outcome:** You're taken to a real page about that feature — not just staring at unclickable text.

**Pass / Fail:** PASS — verified via `tests/check-frsr-s1-feature-row-session-resume.js` (AC1 unit tests: the card renders as a real `<a href="/features/:slug">`, no nested anchors with the discovery-artefact suffix link) and `tests/e2e/frsr-s1-feature-row-session-resume.spec.js` (real browser: a real feature row is clicked and keyboard-activated, both navigate to `/features/:slug`).

---

### Scenario 2: You can see the actual conversation that happened at a stage

**Covers:** AC2, AC3, AC4

**Steps:**
1. From the feature's detail page (Scenario 1), find a completed stage (e.g. discovery).
2. Look for a way to resume/view its conversation, alongside the existing "View" link.
3. Click it.

**Expected outcome:** You see the real back-and-forth conversation that happened at that stage — not just the final written artefact.

**Pass / Fail:** PASS — verified via `tests/check-frsr-s1-feature-row-session-resume.js`: AC2 (`completeStage()` now records the `sessionId` active at completion time, existing fields unaffected, backward-compatible when omitted), AC3 (`/features/:slug` shows a "Resume conversation" link alongside the existing "View" link exactly when a stage's session is resolvable, and only then), AC4 (following the link reaches `handleGetChatHtml`'s real, unmodified turn-history rendering — asserted via unique marker content, not just a status code). Also verified the NFR-Performance requirement: the featureSlug→journeyId lookup runs exactly once per page render regardless of artefact-row count, and the NFR-Security requirement: the resume link is rejected for a non-owning tenant identically to the existing direct-route guard, while the owning user's own link still succeeds.

---

### Scenario 3: An old, no-longer-available conversation says so clearly

**Covers:** AC5

**Steps:**
1. (With engineering help) find or arrange a very old completed stage whose conversation is no longer available.
2. Try to view its conversation.

**Expected outcome:** You get a clear "not available" message — not a blank page or a confusing error.

**Pass / Fail:** PASS — verified via `tests/check-frsr-s1-feature-row-session-resume.js` (AC5): a `completedStages` entry whose `sessionId` resolves in neither the in-memory session store nor Redis (simulating post-eviction) returns the exact same 404 "Session not found" message `handleGetChatHtml` already produces for any other unresolvable session — no new, different, or silent failure mode.

---

## Summary

Total scenarios: 3 | Manual gap scenarios: 0 | All 3 verified via automated test coverage (10 unit/integration tests in `tests/check-frsr-s1-feature-row-session-resume.js` + 2 Playwright E2E tests in `tests/e2e/frsr-s1-feature-row-session-resume.spec.js`).
