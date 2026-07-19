# Implementation Plan: Fix "New feature" redirecting to the sign-in page for logged-in users

**Story reference:** artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
**Test plan reference:** artefacts/2026-07-19-new-feature-redirect-fix/test-plans/jrf-s1-test-plan.md
**DoR contract reference:** artefacts/2026-07-19-new-feature-redirect-fix/dor/jrf-s1-dor-contract.md

---

## Routing Trace — Current State

Traced `src/web-ui/server.js` (router chain) and `src/web-ui/routes/journey.js` (handlers):

1. **Redirect source:** `handlePostProductFeature` (products.js:751-772) — Creates journey in Postgres via INSERT, then redirects to `/journeys/<journeyId>/discovery` (PLURAL, line 767 and 769).
2. **Registered routes for `/journey/...` (SINGULAR):**
   - `/journey` (GET) — `handleGetJourney` — journey home/list screen (server.js:1654)
   - `/journey/<featureSlug>/resume` (GET) — `handleGetJourneyResume` — resume journey at last stage (server.js:1660)
   - `/journey/<journeyId>/stage-review` (GET) — stage artefact review panel (server.js:1665)
   - `/journey/<journeyId>/reference` (GET/POST) — reference docs (server.js:1670-1678)
   - `/journey/<journeyId>/reference-modal` (GET) — strategy grounding modal (server.js:1680)
   - `/journey/<journeyId>/stories` (GET/POST) — story list form (server.js:1710-1720)
   - `/journey/<journeyId>/complete` (GET) — journey completion screen (server.js:1722)
   - Other API routes for specific actions
3. **No route found matching `/journey/<journeyId>/discovery`** — no existing route explicitly handles "show the discovery stage."
4. **How handlePostJourney creates journeys (journey.js:324):** Creates journey, creates skill session, then redirects to `/skills/<startSkill>/sessions/<sessionId>/chat` (line 420). For new-product flow (line 397), redirects to `/journey/<journeyId>/reference-modal` instead.

---

## Analysis and Decision

**Problem:** `handlePostProductFeature` (line 767) redirects to `/journeys/<journeyId>/discovery` which does not match any registered route (`/journeys/` is plural; all routes use `/journey/` singular). Unmatched requests fall through to server.js's final `else` branch (line ~1800+), which renders the login page unconditionally.

**Solution:** `handlePostProductFeature` should follow the same pattern as `handlePostJourney`:
1. Create a skill session (like handlePostJourney does at journey.js:405-420)
2. Redirect to `/skills/discovery/sessions/<sessionId>/chat` (the live discovery skill chat, like handlePostJourney does at line 420)

This makes sense because:
- A freshly created journey has no stage active yet — the discovery skill session is the first thing that runs
- handlePostJourney already does this correctly
- The skill-chat URL is where the operator can actually "begin work" (AC2)
- This follows existing patterns in the codebase

**Why this approach over other options:**
- *Not* creating a new `/journey/<journeyId>/discovery` route — unnecessary; the skill chat is the real interface for discovery work
- *Not* redirecting to `/journey/<journeyId>/stories` or other existing journey routes — those are stage-progression routes that assume setup work is already done; a new journey needs skill session creation first

---

## Implementation Tasks

### Task 1: Write integration tests covering IT1–IT5

**File:** `tests/check-jrf-s1-new-feature-redirect.js` (new)

Write 5 integration tests matching the test plan's IT1–IT5:
- **IT1:** POST to `/products/:id/features`, assert response redirects to a real, resolvable route (200 status, not login page)
- **IT2:** Inspect response body from IT1 redirect, assert it contains discovery skill content (not login page HTML, not unrelated journey)
- **IT3:** Directly request the target route used by IT1 redirect (regression: existing route behavior unchanged)
- **IT4:** POST to `/products/:id/features` with no session, assert redirect to sign-in (auth guard works)
- **IT5:** Run full test suite, confirm baseline failure count is unchanged (67/345 documented in known-baseline-failures.json)

**Acceptance:** All tests fail initially (RED state per TDD).

---

### Task 2: Fix `handlePostProductFeature` redirect

**File:** `src/web-ui/routes/products.js` (line 751–772)

**Changes:**
1. Extract relevant setup from handlePostJourney's flow:
   - Get `repoRoot` (already via req)
   - Call `getRegisterHtmlSession()` to create a session ID
   - Call `getLinkSessionToJourney()` to link session to the journey
   - If `_journeyStore.setActiveSession` exists, call it with `journeyId`, `sid`, `'discovery'`
   - Update on-disk stage (try/catch, via `_journeyDisk.updateStage`)
2. Change redirect target from `/journeys/<journeyId>/discovery` to `/skills/discovery/sessions/<sessionId>/chat` (following handlePostJourney pattern at line 420)
3. Extract required constants from the top of journey.js (if they're not already exported): crypto, path, etc.

**Verification:** Task 1 tests should pass (GREEN state per TDD).

---

### Task 3: Verify no regression across full test suite

**Acceptance Criteria from AC4:**
- Run the full test suite via `npm test` or `node scripts/run-all-tests.js`
- Confirm failure count matches baseline: 67/345 (from known-baseline-failures.json)
- No NEW failing files introduced
- All passing tests remain passing

---

## File Touchpoints

| File | Change | Rationale |
|------|--------|-----------|
| `src/web-ui/routes/products.js` | Modify `handlePostProductFeature` (lines 751–772): add session creation, change redirect target | Fix the redirect target and wire it correctly |
| `tests/check-jrf-s1-new-feature-redirect.js` | Create new test file | Cover IT1–IT5 from test plan |
| `src/web-ui/server.js` | No changes expected | Router chain already correctly registered; no new route needed |
| `src/web-ui/routes/journey.js` | No changes expected | Reuse existing exported functions; handlePostJourney already works correctly |

---

## Dependencies and Exports

- **From journey.js:** `getRegisterHtmlSession`, `getLinkSessionToJourney`, `_journeyStore`, `_journeyDisk`, `_mockScenarioForStage`
- **From routes/product-repo.js or similar:** Session persistence if needed
- **Built-ins:** `crypto` (randomUUID), `path`

---

## Risk Mitigation

- **AC3 (auth guard):** The change preserves the auth check in `handlePostProductFeature` (line 754 checks `req.session.tenantId`). Unauthenticated requests will not reach the journey-creation code; they'll still be redirected to sign-in by the existing auth layer upstream.
- **Regression:** IT5 ensures no other route's behaviour changes.
- **Session wiring:** Follow handlePostJourney's exact pattern; do not invent new session logic.

---

## Definition of Complete

1. ✅ All 5 tests (IT1–IT5) in `check-jrf-s1-new-feature-redirect.js` pass
2. ✅ Full test suite run shows 67/345 baseline failures (no new regressions)
3. ✅ `handlePostProductFeature` now redirects to a valid route that shows discovery stage
4. ✅ Authenticated users can click "New Feature" and land on the discovery skill chat (AC2)
5. ✅ Unauthenticated requests still redirect to sign-in (AC3)
6. ✅ No code in other route handlers was modified (AC4)
