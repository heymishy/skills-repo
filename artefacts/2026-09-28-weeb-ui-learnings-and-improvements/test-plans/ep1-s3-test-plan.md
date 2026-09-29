## Test Plan: Skill launcher redesign — show 5 primary CTAs, hide chained skills

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Test plan author:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

**E2E/browser-layout detection (Step 3a):** AC1 ("Primary CTAs occupy the top 50% of the launcher panel and use larger text/button sizing compared to the advanced section") and AC4 ("uses smaller text size, lower contrast, indentation, or a collapsed state") both describe on-screen visual/layout properties that a DOM-simulation environment (jsdom) cannot reliably verify — `getBoundingClientRect`-style layout and rendered contrast/size are not computed in jsdom. This repo has Playwright configured and in active use (`tests/e2e/*.spec.js`) — both ACs are handled as real E2E browser tests, not DOM-presence checks or manual scenarios, matching this repo's own established convention (Option 1: add an E2E test using the configured framework).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Exactly 5 primary CTAs rendered, larger sizing, top 50% of panel | — | — | 1 test | — | CSS-layout-dependent | 🔴 |
| AC2 | Chained skills not shown in primary section | 1 test | — | 1 test | — | — | 🟢 |
| AC3 | Advanced affordance shows all 41+ skills | 1 test | — | 1 test | — | — | 🟢 |
| AC4 | Advanced section visually de-emphasized | — | — | 1 test | — | CSS-layout-dependent | 🔴 |
| AC5 | Backward compatibility — clicking an advanced skill launches it | — | 1 test | — | — | — | 🟢 |
| AC6 | Entry-point list is stable across sessions | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC1 and AC4 are CSS-layout-dependent and covered by real E2E browser tests (Playwright) — not silently downgraded to DOM-presence checks or left as manual-only.

---

## Test Data Strategy

**Source:** Synthetic — a fixed `PRIMARY_SKILLS` constant and a static list of all known skills (mirroring this repo's real skill directory listing) provided to the launcher component under test.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Rendered launcher page (real browser) | Playwright fixture page | None | Measures actual rendered CTA count, panel position, font/button size |
| AC2 | Full 41+ skill list (a static fixture matching this repo's real `skills/` directory count) | Synthetic fixture | None | Confirms none of the 27+ chained skills render in the primary section |
| AC3 | Same fixture as AC2 | Synthetic fixture | None | Confirms the advanced affordance surfaces the complete list |
| AC4 | Rendered launcher page (real browser) | Playwright fixture page | None | Measures actual computed style (font-size, contrast, or collapsed state) of the advanced section |
| AC5 | Same fixture; a stub for "launch skill session" | Synthetic | None | Confirms clicking an advanced-section skill still triggers the real launch call |
| AC6 | Launcher rendered twice — once fresh, once with a simulated prior session/localStorage state | Synthetic | None | Confirms the primary CTA list doesn't drift based on prior state |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Primary section renders exactly the 5 hardcoded PRIMARY_SKILLS, no more, no fewer

- **Verifies:** AC2 (structural half — DOM presence, not layout)
- **Precondition:** Launcher component given the full 41+ skill fixture list
- **Action:** Render the launcher; query the primary section's own DOM
- **Expected result:** Primary section contains exactly 5 skill entries, matching `PRIMARY_SKILLS` (discovery, ideate, reverse-engineer, spike, improve) by name; none of the other 36+ skills appear there
- **Edge case:** No

### Advanced-section DOM contains the complete 41+ skill list (structural, not visual)

- **Verifies:** AC3 (structural half)
- **Precondition:** Same fixture as above; advanced section expanded
- **Action:** Query the advanced section's own DOM after expansion
- **Expected result:** All 41+ skills present, including the 5 primary ones (the advanced list is the complete, unfiltered set)
- **Edge case:** No

### Entry-point list is identical across a fresh render and a render with simulated prior session state

- **Verifies:** AC6
- **Precondition:** Render 1 — clean state, no localStorage. Render 2 — same component, with a simulated `localStorage` entry recording a different, prior skill selection
- **Action:** Compare the primary CTA list from both renders
- **Expected result:** Both renders show the identical 5-skill `PRIMARY_SKILLS` list, in the identical order — no drift based on prior session state
- **Edge case:** Yes — the story's own named stability requirement

---

## Integration Tests

### Real router dispatch: clicking a primary CTA launches the correct skill session

- **Verifies:** AC2 (behavioural half — the click actually works, not just that the button is present)
- **Components involved:** Launcher component, this codebase's real skill-session-launch call path
- **Precondition:** Launcher rendered with the real launch-session function wired (not stubbed at the call-site, only its network/session-creation side effect stubbed)
- **Action:** Click a primary CTA (e.g. "discovery")
- **Expected result:** The real launch-session call is invoked with `skill: 'discovery'` — confirms the button is genuinely wired, not just visually present

### Real router dispatch: clicking an advanced-section skill launches it (backward compatibility)

- **Verifies:** AC5
- **Components involved:** Launcher component, advanced section, real launch-session call path
- **Precondition:** Advanced section expanded; launch-session call stubbed at its network/session-creation boundary only
- **Action:** Click a chained skill in the advanced section (e.g. "clarify")
- **Expected result:** The real launch-session call is invoked with `skill: 'clarify'` — confirms advanced-section access is not merely visible but genuinely functional, matching the story's own backward-compatibility requirement

---

## E2E Tests (Playwright, real browser — CSS-layout-dependent ACs)

### AC1: exactly 5 primary CTAs are visually prominent, occupying the top of the launcher panel with larger sizing

- **Verifies:** AC1
- **Precondition:** Real browser, launcher page loaded fresh (no prior session state)
- **Action:** Load the launcher page; measure the bounding rectangles and computed font-size of the 5 primary CTA buttons versus the (collapsed) advanced section
- **Expected result:** Exactly 5 buttons render above the advanced section's own top edge; each primary CTA's computed font-size and button dimensions are strictly larger than the advanced section's own default (collapsed-state) sizing; all 5 are keyboard-focusable via Tab in document order before the advanced section's own first focusable element
- **Tool:** `npx playwright test tests/e2e/ep1-s3-launcher-layout.spec.js`

### AC4: the advanced section is visually de-emphasized and collapsed by default

- **Verifies:** AC4
- **Precondition:** Real browser, launcher page loaded fresh
- **Action:** Load the launcher page; inspect the advanced section's own initial rendered state (before any click) and its computed style once expanded
- **Expected result:** On initial load, the advanced section is in a collapsed state (not showing the full skill list) OR renders with measurably smaller font-size / lower contrast than the primary CTAs (at least one real, measurable visual distinction — not merely a DOM `aria-label` claiming the distinction exists); expanding it (via click) reveals the full list without a page reload
- **Tool:** `npx playwright test tests/e2e/ep1-s3-launcher-layout.spec.js`

---

## NFR Tests

### Launcher renders within the stated performance budget

- **NFR addressed:** Performance
- **Measurement method:** Playwright's own navigation timing API — measure time from page load start to the primary CTAs being present and interactive
- **Pass threshold:** <100ms (matches the story's own stated NFR)
- **Tool:** `npx playwright test tests/e2e/ep1-s3-launcher-layout.spec.js` (same spec file as the AC1/AC4 E2E tests, additional assertion)

### Accessibility — keyboard navigation and screen-reader labeling

- **NFR addressed:** Accessibility
- **Measurement method:** Playwright's own accessibility tree inspection (`page.accessibility.snapshot()` or axe-core if already a dependency in this repo — confirm before adding a new one, per the story's own "No new npm dependencies" constraint) — assert every primary and advanced-section button has an accessible name and is reachable via Tab
- **Pass threshold:** 100% of CTA buttons have a non-empty accessible name; Tab order reaches all 5 primary CTAs before any advanced-section button
- **Tool:** `npx playwright test tests/e2e/ep1-s3-launcher-layout.spec.js`

---

## Out of Scope for This Test Plan

- Any test of `ep1-s1`'s aggregator or `ep1-s2`'s `/api/signals` endpoint — separate stories, separate test plans.
- Visual regression / pixel-diff screenshot testing — the E2E tests above assert computed style and bounding-box relationships, which is sufficient for this story's own ACs; full visual regression tooling is a Phase 5 concern per the epic's own scope.
- Config.yml parameterization of the entry-point list — explicitly out of scope for this story itself.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
