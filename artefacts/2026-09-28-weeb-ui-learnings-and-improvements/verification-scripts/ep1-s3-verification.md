# AC Verification Script: Skill launcher redesign — show 5 primary CTAs, hide chained skills

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s3-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5) | **Date:** 2026-09-30 | **Context:** [x] Pre-code (automated, real-test evidence in lieu of manual browser walkthrough — see Notes per scenario)

---

## Setup

**Before you start:**
1. Open the web UI dashboard in a browser, signed in.
2. Clear your browser's localStorage for this site first, so you're seeing a genuinely fresh launcher (no prior session state affecting it).

**Reset between scenarios:** Reload the page fresh between scenarios; clear localStorage again if you've triggered any session-history behavior.

---

## Scenarios

---

### Scenario 1: Only 5 skills are shown up front, and they're the big, obvious buttons

**Covers:** AC1

**Steps:**
1. Load the dashboard's skill launcher.
2. Count the large, prominent buttons at the top.

**Expected outcome:**
> Exactly 5 buttons: Discovery, Ideate, Reverse-engineer, Spike, Improve. They're visibly bigger/more prominent than anything below them.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via real Playwright E2E test `tests/e2e/ep1-s3-launcher-layout.spec.js` ("AC1: primary CTAs render above the advanced section, with larger sizing") against a real rendered `/skills` page (real webServer, real `listSkills` adapter wired via `WIRE_SKILL_ADAPTERS=true`, real Chromium browser). Asserts: 1-5 primary buttons present; primary section renders above the advanced section (bounding-box Y comparison); primary button font-size (15px) genuinely greater than advanced-summary font-size (13px). This E2E run itself found and fixed a real defect: primary buttons initially rendered smaller (13px) than the advanced summary (~14px default) — fixed in `src/web-ui/skill-launcher.js` with explicit inline sizing. Confirmed passing: `NODE_ENV=test npx playwright test tests/e2e/ep1-s3-launcher-layout.spec.js` → `2 passed`.

---

### Scenario 2: The other 36+ skills are nowhere to be seen by default

**Covers:** AC2

**Steps:**
1. On the same loaded page, look at everything visible without clicking anything.

**Expected outcome:**
> You don't see `/definition`, `/test-plan`, `/dor`, `/clarify`, `/estimate`, or any other chained skill listed as a button anywhere in the main view.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `tests/check-ep1-s3-skill-launcher.js` ("AC2: primary section contains exactly the 5 primary skills, no chained skills") — asserts the primary section (`.el-primary` block) contains all 5 primary skill names and explicitly does NOT contain `test-plan`/`clarify` (representative chained skills). Confirmed passing.

---

### Scenario 3: You can still get to every skill if you need to

**Covers:** AC3

**Steps:**
1. Find and click whatever link, button, or toggle gives access to "all skills" or "advanced".

**Expected outcome:**
> A full list appears with all 41+ skills, including the 5 primary ones and every chained one, all readable and clickable.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `tests/check-ep1-s3-skill-launcher.js` ("AC3: advanced section contains the complete, unfiltered skill list (including primaries)") — asserts every skill in a 7-skill fixture (including all 5 primaries and 2 chained) appears inside the `<details class="el-advanced">` section. Confirmed passing.

---

### Scenario 4: The "advanced" area looks clearly secondary

**Covers:** AC4

**Steps:**
1. Compare the visual weight of the primary 5 buttons versus the advanced section (before and after expanding it).

**Expected outcome:**
> The advanced section is smaller text, lower contrast, or starts collapsed — something makes it obviously not the main focus of the page. You shouldn't have to squint to tell which 5 are "the real options."

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via real Playwright E2E test `tests/e2e/ep1-s3-launcher-layout.spec.js` ("AC4: the advanced section is collapsed by default and visually de-emphasized") — asserts the real `<details>` element's `.open` property is `false` on load (no `open` attribute), the `.el-advanced-body` is not visible before interaction, and becomes visible after clicking the summary with no page reload (native `<details>` behaviour, zero JS). Confirmed passing: `2 passed` (same run as AC1 above).

---

### Scenario 5: Clicking an advanced skill actually works

**Covers:** AC5

**Steps:**
1. Open the advanced section.
2. Click on a chained skill you wouldn't normally see up front — e.g. `/clarify`.

**Expected outcome:**
> A new session for that exact skill starts, same as if it were a primary button. Nothing is blocked or broken.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `tests/check-ep1-s3-skill-launcher.js` ("AC5: an advanced-section (non-primary) skill still has a real, correctly-targeted launch form") — asserts a chained skill (`test-plan`) in the advanced section has a real `<form method="POST" action="/api/skills/test-plan/sessions">`, this codebase's own established no-JS session-launch convention, identical mechanism to primary CTAs. Confirmed passing.

---

### Edge case: The 5 primary skills never change based on what you did before

**Covers:** AC6

**Steps:**
1. Use the launcher for a bit — click into a session, come back to the launcher.
2. Reload the page.

**Expected outcome:**
> The same 5 primary buttons (Discovery, Ideate, Reverse-engineer, Spike, Improve) are still there, same order, regardless of what you just did.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `tests/check-ep1-s3-skill-launcher.js`: "PRIMARY_SKILLS is exactly the 5 stable, hardcoded names in order (AC6)" (asserts the constant itself) and "AC6: PRIMARY_SKILLS list and rendered primary section are identical across repeated renders" (asserts two renders with different CSRF tokens produce byte-identical primary/advanced structure — no session-state input exists that could drift it). Both confirmed passing.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — 5 prominent primary CTAs | ✅ Pass | Real Playwright E2E (structural + CSS sizing) |
| Scenario 2 — Chained skills hidden by default | ✅ Pass | Unit test (AC2) |
| Scenario 3 — Advanced access reaches everything | ✅ Pass | Unit test (AC3) |
| Scenario 4 — Advanced section visually secondary | ✅ Pass | Real Playwright E2E (collapsed state + expand behaviour) |
| Scenario 5 — Advanced skills actually work | ✅ Pass | Unit test (AC5) |
| Edge case — List is stable | ✅ Pass | Unit tests (AC6 x2) |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

**Context note:** Claude-in-Chrome (real interactive browser) was unavailable throughout this session ("Browser extension is not connected", confirmed on repeated attempts including after explicit operator confirmation of an active, logged-in Chrome session). Real Playwright browser automation was substituted for the CSS-layout-dependent scenarios (1 and 4) — a genuine, unstubbed real-browser check via this repo's own independently-configured E2E infrastructure (ADR-018), not a DOM-presence proxy. This substitution itself surfaced and led to fixing two real defects (see decisions.md, "Real E2E run found and fixed 2 genuine gaps", 2026-09-30) that a manual click-through or a mocked test would not necessarily have caught either.

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| Scenario 1 (initial run) | Primary buttons visibly larger than advanced section | Primary buttons rendered smaller (13px vs ~14px) | MED | Fixed implementation — see decisions.md 2026-09-30 |
| (E2E infra) | `/skills` renders real skill data under Playwright's webServer | Real `listSkills` adapter never wired under `NODE_ENV=test` (shared `playwright.config.js` gap, not ep1-s3-specific) | MED | Fixed implementation — added `WIRE_SKILL_ADAPTERS: 'true'` to `playwright.config.js` |
| NFR tests (initial pass) | Test plan enumerates 9 tests (3 unit + 2 integration + 2 E2E + 2 NFR) | Only 7 implemented (performance and accessibility NFR tests missing) | LOW | Fixed implementation — added both, see below |

## NFR verification (9/9 test-plan tests now implemented and passing)

**Performance** (`tests/check-ep1-s3-skill-launcher.js`, "NFR-Performance"): measures `renderSkillLauncher()`'s own execution time via `process.hrtime.bigint()` against the story's stated <100ms budget — implemented as a server-side render-time measurement rather than full-browser navigation timing, since the story's NFR text ("launcher renders in <100ms") describes the render itself, and a real E2E navigation timing assertion at a 100ms threshold would be dominated by unrelated network/browser overhead and prone to environmental flakiness. Confirmed passing (actual: sub-millisecond for a pure string-concatenation function).

**Accessibility** (`tests/e2e/ep1-s3-launcher-layout.spec.js`, "NFR-Accessibility"): real Playwright test asserting (a) every primary CTA button has a non-empty accessible name (`textContent`), and (b) walking the real Tab order from document start confirms all 5 primary buttons are reached before the advanced section's `<summary>` disclosure control (the only advanced-section element that is ever Tab-reachable while `<details>` is collapsed — its body content is not, by native HTML semantics). Confirmed passing. No new npm dependency added, per the story's own constraint (no axe-core or similar; used Playwright's own accessibility-tree/DOM primitives).
