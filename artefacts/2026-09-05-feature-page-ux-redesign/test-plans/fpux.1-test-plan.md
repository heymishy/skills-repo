## Test Plan: Unify `/features/:slug`'s visual language across feature-level and per-story sections

**Story reference:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.1-unify-feature-page-visual-language.md
**Epic reference:** artefacts/2026-09-05-feature-page-ux-redesign/epics/page-and-nav-redesign.md
**Test plan author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

**Test runner confirmed from `package.json`:** `npm test` → `node scripts/run-all-tests.js` (custom Node/assert test runner — see any `tests/check-*.js` file for the convention). `npm run test:e2e` → `playwright test` (ADR-018, the sole E2E framework in this repo).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Feature-level list and per-story accordion use the same token set, zero visual seam | 2 tests | — | 1 test | — | — | 🟢 |
| AC2 | All colors/borders/backgrounds resolve to themed values in light and dark | — | — | 2 tests | — | — | 🟢 |
| AC3 | Keyboard focus visible + Enter/Space toggles `<summary>` | — | — | 2 tests | — | — | 🟢 |
| AC4 | WCAG 2.1 AA contrast ratio in both themes | — | — | 2 tests | — | — | 🟢 |
| AC5 | Existing "Delete this feature" button behaviour unchanged (regression guard) | 1 test | — | — | — | — | 🟢 |

**E2E tooling check (Step 3a):** AC1, AC2, AC3, AC4 all trigger the browser-layout-dependent pattern (visual rendering — border/radius/typography consistency, colour/theme resolution, focus-ring visibility, contrast ratio). Playwright is configured (`npm run test:e2e`, ADR-018) — per the condition for blocking ("no tooling"), this condition is **not met**, so these ACs are covered by real E2E tests below rather than falling back to manual-only or requiring a RISK-ACCEPT.

**Test-data note (also see Test Data Strategy below):** the real `/features/:slug` route's grouped (multi-story) rendering path cannot be reached through Playwright's existing E2E fixtures today — `WUCE_REPOSITORIES` is unset in test mode, so `_listArtefacts` always returns `noArtefacts: true` regardless of slug (confirmed via `tests/e2e/feature-navigation.spec.js`'s own documented behaviour). Rather than standing up real repo/artefact fixtures (out of scope for this story — no backend/data changes per discovery), the E2E tests below call `html-shell.js`'s exported `renderShell()` directly with fixture `bodyContent` containing the new `.sw-epic-group`/`.sw-story-row` markup, then load the resulting real HTML (real CSS, real tokens, zero fakes) via Playwright's `page.setContent()`. This exercises the actual shared stylesheet and actual component markup without requiring the full authenticated route, a running server against real data, or new E2E fixture infrastructure.

---

## Coverage gaps

None. Every AC has at least one automated test (unit or E2E) — no manual-only scenarios and no RISK-ACCEPT required, since E2E tooling is available and the fixture-rendering approach above avoids the missing-repo-data gap.

---

## Test Data Strategy

**Source:** Synthetic (fixture HTML fragments, built via `renderShell()` and hand-written markup fragments for `.sw-epic-group`/`.sw-story-row` — no real feature/story data, no database).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no dependency.
**Owner:** Self-contained — tests generate their own fixture markup in setup.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture page containing both an `.sw-card` (existing) and an `.sw-epic-group` (new) element | Synthetic, built in test setup via `renderShell()` | None | |
| AC2 | Same fixture, rendered once with `data-theme="light"` and once with `data-theme="dark"` on `<html>` | Synthetic | None | |
| AC3 | Same fixture with a real `<details>`/`<summary>` pair | Synthetic | None | |
| AC4 | Same fixture — contrast computed from real computed styles | Synthetic | None | |
| AC5 | A fixture `journeyForPage` object with `journeyId` set, passed to the existing (unchanged) delete-button render path | Synthetic, matching the existing test convention in `tests/check-*.js` for this route | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — synthetic fixtures are fully self-contained and available now.

---

## Unit Tests

### `renderGroupedArtefactIndexHtml` emits `sw-epic-group` class, not inline styles

- **Verifies:** AC1
- **Precondition:** A `grouped` object with 1 epic containing 2 stories, each with ≥1 artefact.
- **Action:** Call `renderGroupedArtefactIndexHtml(grouped, featureSlug, {})` and inspect the returned HTML string.
- **Expected result:** The returned string contains `class="sw-epic-group"` for the epic wrapper and does **not** contain the old inline `style="margin:8px 0;padding:10px 14px;border:1px solid var(--line);border-radius:10px"` literal.
- **Edge case:** No.

### `renderStory` emits `sw-story-row` class, not inline styles

- **Verifies:** AC1
- **Precondition:** A single story object with ≥1 artefact.
- **Action:** Call the (currently module-private, to be exported for testability) story-row renderer and inspect the returned HTML string.
- **Expected result:** The returned string contains `class="sw-story-row"` and does **not** contain the old inline `style="margin:4px 0 4px 16px;padding:6px 10px;border:1px solid var(--line);border-radius:8px"` literal.
- **Edge case:** No.

### Existing "Delete this feature" button markup is unchanged (regression guard)

- **Verifies:** AC5
- **Precondition:** `journeyForPage` fixture with `journeyId: 'j-1'`, `productId: 'p-1'`.
- **Action:** Call `handleGetFeatureArtefacts`'s HTML-rendering path (or the extracted delete-section renderer) with this fixture.
- **Expected result:** The returned HTML contains `id="alrf-s10-delete-feature-btn"` and the existing `confirm(...)`/`fetch(...)` script block, byte-identical to the pre-story version (diffed against the current `features.js` source).
- **Edge case:** No.

---

## Integration Tests

None — this story has no new component handoffs (no new data flow, no new adapter). The Unit tests above already exercise the real render functions directly; the E2E tests below exercise the real CSS in a real browser. No intermediate integration seam exists that isn't covered by one of those two layers.

---

## NFR Tests

### WCAG 2.1 AA — keyboard focus visibility and operability

- **NFR addressed:** Accessibility
- **Measurement method:** E2E test E3 below (Tab to `<summary>`, assert `outline` is not `none`; press Enter, assert `[open]` toggles)
- **Pass threshold:** Focus outline computed style is not `none` / `0px`; `<details open>` attribute present after Enter
- **Tool:** Playwright

### WCAG 2.1 AA — contrast ratio

- **NFR addressed:** Accessibility
- **Measurement method:** E2E test E4 below (compute contrast ratio from real computed `color`/`background-color`)
- **Pass threshold:** ≥ 4.5:1 for normal text, ≥ 3:1 for large text/UI components, in both light and dark theme
- **Tool:** Playwright + a small contrast-ratio helper function (WCAG relative-luminance formula) in the test file

### Performance

- **NFR addressed:** Performance
- **Note:** Story NFR states "no regression from current baseline (informal)" — no automated test written; confirmed by direct operator observation at DoD, matching this session's own established live-verification convention for informal NFRs.

---

## E2E Tests (Playwright, `npm run test:e2e`)

### E1 — `.sw-epic-group` computed style matches `.sw-card`'s reference values (AC1)

- **Setup:** Build fixture HTML via `renderShell({ bodyContent: '<div class="sw-card" id="ref"></div><details class="sw-epic-group" id="new"><summary>Epic</summary></details>' })`; load via `page.setContent(html)`.
- **Action:** Read `getComputedStyle` for both `#ref` and `#new`.
- **Expected result:** `border-radius`, `border-width`, `border-style`, and `background-color` are identical between the two elements (both resolve to the same `--surface`/`--line`/`8px` token values) — i.e. the new component is not visually distinguishable in its base card treatment from the existing, already-consistent `.sw-card`.

### E2a — `.sw-epic-group`/`.sw-story-row` resolve correctly in light theme (AC2)

- **Setup:** Fixture HTML with `data-theme="light"` on `<html>`.
- **Action:** Read computed `background-color`/`color` for `.sw-epic-group` and `.sw-story-row`.
- **Expected result:** Values match the light-theme token values defined in `html-shell.js`'s `:root` block (`--surface: #FFFFFF`, `--ink: #18181B`, etc. — assert against the actual token values read from the same computed-style call, not hardcoded duplicates, so the test doesn't silently drift from the real tokens).

### E2b — `.sw-epic-group`/`.sw-story-row` resolve correctly in dark theme (AC2)

- **Setup:** Same fixture with `data-theme="dark"` on `<html>`.
- **Action:** Same computed-style reads.
- **Expected result:** Values match the dark-theme token block (`--surface: #1C1C1A`, `--ink: #F4F4F2`, etc.) — and are **different** from the light-theme values read in E2a, proving the theme switch actually changes rendering (not just present but inert).

### E3 — Keyboard focus visibility and operability (AC3)

- **Setup:** Fixture with a real `<details class="sw-story-row"><summary>Story</summary>...</details>`.
- **Action:** `page.keyboard.press('Tab')` until the `<summary>` is focused; read `getComputedStyle(activeElement).outline`; then `page.keyboard.press('Enter')`.
- **Expected result:** Computed `outline` is not `none`/`0px` while focused (visible ring, matching `--accent`); after Enter, the parent `<details>` element's `open` attribute is present (was absent before).

### E4 — Contrast ratio in both themes (AC4)

- **Setup:** Same fixtures as E2a/E2b.
- **Action:** Compute the WCAG relative-luminance contrast ratio between `.sw-story-row summary`'s computed `color` and its computed `background-color` (inherited from `.sw-epic-group`/`.sw-card`'s `--surface`), in both light and dark theme.
- **Expected result:** Ratio ≥ 4.5:1 in both themes (normal text threshold — `.sw-story-row summary`'s 14px is below the 18.66px/24px "large text" cutoff at its default weight).

---

## Out of Scope for This Test Plan

- Full pixel-level screenshot-diff visual regression (e.g. Percy, Playwright screenshot baselines) — the computed-style assertions above (E1, E2a, E2b) give a strong, real-CSS signal without introducing a new screenshot-baseline maintenance burden for this solo-operator repo. This is a deliberate choice, not an oversight — noted for `/definition-of-ready`'s own CSS-layout-dependent AC classification step.
- Testing the full authenticated `/features/:slug` route end-to-end against real multi-story artefact data — no E2E fixture for seeded repo/artefact data currently exists in this repo (confirmed via `feature-navigation.spec.js`), and standing one up is out of this story's scope (no backend/data changes, per discovery).
- Any behaviour of `_renderArtefactListByType`'s own artefact-list-item rendering (type labels, resume links, dates) — unchanged by this story, already covered by existing tests.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No true end-to-end test against a real, fully-authenticated, real-data `/features/:slug` page | E2E fixtures in this repo don't currently seed real multi-story artefact data (`WUCE_REPOSITORIES` unset in test mode) | E1–E4 render the real CSS/real component markup via `renderShell()` + `page.setContent()` directly, which exercises the actual stylesheet without needing the full data path — a deliberate, real substitute, not a skipped test |
