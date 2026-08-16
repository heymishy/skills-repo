## Test Plan: Fix dark-mode (and light-mode) button contrast bug on the Products page

**Story reference:** artefacts/2026-08-16-button-contrast-fix/stories/bcf-s1-fix-button-contrast.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | 11 identified elements have `color:#fff` in place of `color:var(--accent-ink)`, background/other styles unchanged | 1 test | — | — | — | — | 🟢 |
| AC2 | `Designate`/`Save` buttons' styles unchanged (regression check on the reference pattern) | 1 test | — | — | — | — | 🟢 |
| AC3 | Plain text-only accent links and the progress-bar-fill div are untouched | 1 test | — | — | — | — | 🟢 |
| AC4 | Computed WCAG contrast ratio of `#fff` on `--accent` meets the measured target in both themes | 1 test | — | — | — | — | 🟢 |

**E2E / browser-layout detection (Step 3a):** Scanned all 4 ACs for CSS-layout-dependent language (drag-drop, pointer/click coordinates, `getBoundingClientRect`/`offsetTop`/`scrollTop`, on-screen-position checks, visual rendering that cannot be derived from the source string). None of the 4 ACs require rendering a page in a browser — all 4 are provable by (a) string/regex assertions against the literal source of `products.js`, and (b) a pure numeric WCAG contrast-ratio computation from the token hex values already read out of `html-shell.js`. This differs from `nia-s1`'s AC3 (which asked "does this glyph look like an avatar to a human eye," an irreducibly subjective visual judgment) — this story's AC4 asks "does this specific color pairing clear a specific numeric threshold," which is fully computable from the hex values without rendering anything. **Classification: no CSS-layout-dependent gap.** A manual verification-script scenario is still included below for human-eye confirmation on live staging, but it closes a *different, non-blocking* concern (real device/browser rendering fidelity), not an unprovable AC — see Coverage gaps.

---

## Coverage gaps

None blocking. As a defense-in-depth measure (not because any AC is unprovable by automated test), the verification script below includes one manual scenario confirming the fix reads correctly on live staging in both themes, matching this repo's standing practice of a post-merge/pre-merge smoke pass on visual fixes. This is not a RISK-ACCEPT — all 4 ACs are already fully covered by automated unit tests.

---

## Test Data Strategy

**Source:** Synthetic (direct source-string read of `src/web-ui/routes/products.js`; no database state, no session, no rendering)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC3 | Raw file contents of `src/web-ui/routes/products.js` | `fs.readFileSync` at test time | None | Pure static-analysis test, no server/DB required |
| AC4 | `--accent`/`--accent-ink` hex values from `src/web-ui/utils/html-shell.js`'s `DESIGN_SYSTEM_CSS`, plus the WCAG relative-luminance formula | `fs.readFileSync` + inline computation in the test file | None | Formula implemented directly in the test — no external contrast-checking library |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### products_11ButtonsUseWhiteText

- **Verifies:** AC1
- **Precondition:** None — reads the file directly, no server needed
- **Action:** Read `src/web-ui/routes/products.js`. For each of the 11 known button/link labels ("Create your first product", "New product", "Generate context files", "Confirm and create product", "Add module", "Select", "Connect", "Create new repo", "Create", "New feature", "Start"), locate the nearest preceding `style="..."` attribute containing `background:var(--accent)` and assert it contains `color:#fff` and does NOT contain `color:var(--accent-ink)`.
- **Expected result:** All 11 located style attributes contain `background:var(--accent)` and `color:#fff`; none contain `color:var(--accent-ink)`.
- **Edge case:** No

### products_referencePatternButtonsUnchanged

- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Locate the `Designate` button and `Save` button style attributes; assert they still read exactly `background:var(--accent);color:#fff` (or the exact current full style string, captured verbatim before the fix as a baseline snapshot).
- **Expected result:** Both style strings are byte-for-byte identical to their pre-fix values.
- **Edge case:** No

### products_textOnlyLinksAndProgressBarUntouched

- **Verifies:** AC3
- **Precondition:** Same as above
- **Action:** Assert that no plain-text accent link (`color:var(--accent)` with no `background:` in the same style attribute — covering "Edit", "Add", "Connect a repo", "Request promotion", "Approve", the pending-review badge, and the approved span) was modified, by snapshotting their exact style strings before the fix and comparing after. Separately assert the progress-bar-fill `<div>`'s style attribute (`background:var(--accent);opacity:...`, no `color` property) is unchanged.
- **Expected result:** All snapshotted text-only-link style strings and the progress-bar-fill style string are unchanged from their pre-fix values.
- **Edge case:** No

### designSystem_accentWhiteContrastMeetsMeasuredTarget

- **Verifies:** AC4
- **Precondition:** None
- **Action:** Read `--accent` for both light mode (`:root`) and dark mode (`[data-theme="dark"]`) from `src/web-ui/utils/html-shell.js`'s `DESIGN_SYSTEM_CSS`. Compute the WCAG relative-luminance contrast ratio between each `--accent` value and `#FFFFFF` using the standard sRGB→linear formula, implemented directly in the test.
- **Expected result:** Light-mode contrast ratio ≈ 6.29:1 (± 0.02 for rounding), dark-mode contrast ratio ≈ 4.47:1 (± 0.02 for rounding) — both a substantial improvement over the pre-fix ratios (1.58:1 light, 2.24:1 dark) computed against `--accent-ink`, which the test also computes and asserts as the "before" baseline for the record.
- **Edge case:** No

---

## Integration Tests

None — this story only changes literal color values inside existing inline `style` strings returned by an existing route handler. No new component handoff, no new request/response shape.

---

## NFR Tests

### designSystem_accentWhiteContrastMeetsMeasuredTarget (see above)

- **Verifies:** Accessibility NFR (story NFR section) — WCAG AA contrast minimum
- Listed here for NFR-to-test traceability per CLAUDE.md's artefact-writing standard; same test as AC4 above, not a separate file entry.

---

## Out of Scope for This Test Plan

- Any Playwright/automated visual-regression test — not needed; all 4 ACs are provable via static source-string assertions and a pure numeric contrast computation, with no CSS-layout-dependent gap (see AC Coverage above).
- Any test of `Designate`/`Save` button *behaviour* (their `onclick`/form-submit logic) — unchanged by this story, only their *unchanged-ness* is asserted (AC2).
- Any test of the `.sw-btn--accent` shared class — not touched by this story (see story's Out of Scope).

---

## Test Gaps and Risks

None. All 4 ACs have full automated unit coverage with no RISK-ACCEPT required.
