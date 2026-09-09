## Test Plan: /journey's unconditional autofocus on the "new feature" input auto-scrolls past the entire feature list on every page load

**Story reference:** `artefacts/2026-09-10-journey-autofocus-scroll-trap/stories/jasb-s1-remove-unconditional-autofocus-on-journey-new-feature-input.md`
**Epic reference:** None — short-track
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-09-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `/journey` (no `?new=1`) loads with `window.scrollY === 0`, no focus-triggered scroll | — | — | 1 test | — | — | 🟢 |
| AC2 | `/journey?new=1` still autofocuses/scrolls `#jh-fname` into view (existing behaviour preserved) | — | — | 1 test | — | — | 🟢 |
| AC3 (regression guard) | "Start a new feature" form still submits and creates a journey correctly | — | — | 1 test | — | — | 🟢 |

All three ACs are flagged CSS-layout-dependent per Step 3a (auto-scroll-into-view on focus, and `window.scrollY`, are real browser layout/rendering behaviour — not reproducible in jsdom, which implements neither `Element.prototype.focus()`'s scroll side effect nor real layout/scroll geometry). Playwright is already configured for this repo (`playwright.config.js`, `tests/e2e/`, ADR-018) — Option 1 (E2E browser test) is used for all three, per the skill's own trigger-pattern guidance. No E2E tooling gap.

---

## Coverage gaps

None. All three ACs have a real E2E test — no manual-only scenario needed since Playwright is already configured for this repo.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup via the existing `/test/seed-durable-stage` endpoint (`server.js`, staging-safe test endpoint per `architecture-guardrails.md`), same pattern already used by `tests/e2e/ep1-s4-stage-selector.spec.js`.
**PCI/sensitivity in scope:** No — no real data, no sensitive fields; synthetic feature slugs and stage names only.
**Availability:** Available now — `/test/seed-durable-stage` already exists and is exercised by existing E2E specs.
**Owner:** Self-contained — the test itself seeds and tears down its own data; no external dependency.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Enough seeded journeys that the page is taller than the viewport (otherwise the test can't distinguish "no scroll happened" from "there was nothing to scroll to") | `/test/seed-durable-stage`, looped | None | Seed at least 40 synthetic journeys (`jasb-e2e-scenario1-<n>-<timestamp>`), each with one completed stage (`discovery`) — matches this repo's own observed real-world page height (269 real features ≈ 27,600px; ~40 synthetic rows is comfortably enough to exceed a standard 743–900px viewport and reproduce the original bug if regressed) |
| AC2 | One seeded journey is sufficient — this AC tests the `?new=1` entry point's own focus behaviour, not list length | `/test/seed-durable-stage` | None | |
| AC3 | None beyond a valid session (`withAuth`) — the form itself creates new data via submission | N/A | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## E2E Tests

### AC1: `/journey` loads scrolled to top when no `?new=1` is present

- **Verifies:** AC1
- **Precondition:** Authenticated session (`withAuth`). At least 40 synthetic journeys seeded for this tenant via `/test/seed-durable-stage`, each in the `discovery` stage, so the rendered page height exceeds the viewport height.
- **Action:** `page.goto('/journey')` (no query string). Read `window.scrollY` and `document.activeElement` via `page.evaluate()`.
- **Expected result:** `window.scrollY === 0`. `document.activeElement` is `document.body` (or at minimum, is not `#jh-fname`) — no element received focus-triggered scroll on load.
- **Edge case:** No — this is the primary regression case (the bug this story fixes). Must currently FAIL against the unmodified code (the whole point of writing it before the fix).

### AC2: `/journey?new=1` still autofocuses and scrolls the "Feature name" input into view

- **Verifies:** AC2 (regression guard — existing "+ New feature" entry-point behaviour must not be lost while fixing AC1)
- **Precondition:** Authenticated session (`withAuth`). At least one seeded journey present (list content itself is incidental to this AC).
- **Action:** `page.goto('/journey?new=1')`. Check whether `#jh-fname` is the focused element (`page.locator('#jh-fname')` — Playwright's own `toBeFocused()` assertion) and that it is within the viewport (`toBeInViewport()`).
- **Expected result:** `#jh-fname` is focused and visible in the viewport immediately after load — the intended, explicit "+ New feature" click-through behaviour is unchanged.
- **Edge case:** No.

### AC3 (regression guard): "Start a new feature" form still submits correctly

- **Verifies:** AC3
- **Precondition:** Authenticated session (`withAuth`).
- **Action:** `page.goto('/journey')`. Fill `#jh-fname` with a unique synthetic feature name (`jasb-s1-ac3-<timestamp>`). Leave the default `startSkill` radio selection (`discovery`, already `checked`). Submit the form.
- **Expected result:** The submission succeeds — response redirects into a new skill session (`/skills/discovery/sessions/:id/chat` or the journey's own redirect target), matching this repo's existing `POST /api/journey` behaviour unchanged (same assertion shape as `tests/e2e/pnfc-s1-new-feature-choice.spec.js`'s own successful-submission check). No change to field names, validation, or the `startSkill`/`profileName` values sent.
- **Edge case:** No.

---

## NFR Tests

None — confirmed with story owner. This story's NFR section states "None material" for Performance, Security, and Availability; the Accessibility NFR (keyboard operability of the form) is already covered by AC3's own assertion that the form remains fully functional, not a separate measurable threshold requiring its own test.

---

## Out of Scope for This Test Plan

- Pagination/virtualization of the feature list itself, or any performance test of page load time at 269+ features — out of scope for the story, and therefore for this test plan.
- Any test of `_mergeStateFeaturesIntoJourneyList`, card content/ordering, or the "No product" bucket filter — unchanged by this story, already covered by existing tests (`ep1-s4-stage-selector.spec.js` and others).
- Unit-level testing of the `showNewForm` boolean's computation (`req.query.new === '1'`) — already implicitly covered by every existing test that exercises `?new=1` vs. no query string; not re-tested in isolation here since the fix only changes what that existing, already-correct boolean gates.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Test uses ~40 synthetic journeys, not the real 269 currently on staging | Seeding 269 real-shaped journeys per test run would be slow and brittle; 40 is empirically enough to exceed any realistic viewport height and reproduce the bug | If viewport sizes in CI ever grow enough that 40 rows no longer exceeds one screen, increase the seed count — flagged here so a future maintainer knows why the number was chosen, not just that it exists |
