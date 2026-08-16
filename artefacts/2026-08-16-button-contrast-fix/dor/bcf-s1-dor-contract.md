# DoR Contract: Fix dark-mode (and light-mode) button contrast bug on the Products page

**Story reference:** artefacts/2026-08-16-button-contrast-fix/stories/bcf-s1-fix-button-contrast.md
**Test plan reference:** artefacts/2026-08-16-button-contrast-fix/test-plans/bcf-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/routes/products.js`, at the 11 lines that currently pair `background:var(--accent)` with
   `color:var(--accent-ink)` (verified via fresh `grep -n "var(--accent)" src/web-ui/routes/products.js`
   before implementation, since the triage artefact's line numbers are approximate and may have shifted),
   change `color:var(--accent-ink)` to `color:#fff`. No other property in any of these 11 style attributes
   changes.
2. New test file `tests/check-bcf-s1-button-contrast.js` covering all 4 ACs per the test plan — pure
   static-analysis tests (source-string read of `products.js` + a WCAG contrast-ratio computation against
   `html-shell.js`'s token values), no server/DOM rendering required.
3. No change to `Designate`/`Save` (already-correct reference pattern), no change to any plain text-only
   accent link, no change to the progress-bar-fill div, no change to any other file.

**What will NOT be built:**
- No refactor to a shared `.sw-btn--accent` class — flagged in `beta-003.md` as a worthwhile stretch, larger
  scope than this bug fix requires.
- No new `[data-theme]`-conditional CSS override — the fix is an unconditional inline-style value change,
  matching the existing unconditional `Designate`/`Save` pattern (see story's Architecture Constraints for
  why theme-scoping would be the more complex, not the more conservative, option).
- No change to any button's `onclick`/form-submit/event-handler logic.
- No visual-regression (Playwright) test — not needed; AC4's contrast claim is provable by direct numeric
  computation from token hex values, not by rendering a page (see test plan's E2E detection section).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (11 instances get `color:#fff`) | Unit test: read `products.js`, regex-match each of the 11 known labels' nearest `style="..."` attribute, assert `color:#fff` present and `color:var(--accent-ink)` absent | unit |
| AC2 (Designate/Save unchanged) | Unit test: assert both elements' full style strings match their pre-fix snapshot exactly | unit |
| AC3 (text-only links + progress bar untouched) | Unit test: assert snapshotted style strings for text-only links and the progress-bar-fill div are unchanged | unit |
| AC4 (measured contrast ratios) | Unit test: read `--accent` token hex values from `DESIGN_SYSTEM_CSS`, compute WCAG contrast ratio against `#fff` using the formula implemented in the test, assert ≈6.29:1 (light) and ≈4.47:1 (dark) | unit |

**Assumptions:**
- The 11 line numbers in `beta-003.md`/the story are approximate ("Line (approx)" column) — the coding agent
  must re-verify via a fresh `grep -n "var(--accent)" src/web-ui/routes/products.js` before editing, not
  trust the cited line numbers literally.
- `products.js` has no existing dedicated test file (confirmed via `grep -rl "products.js\|routes/products"
  tests/` — no direct hits for this specific inline-style pattern), so `tests/check-bcf-s1-button-contrast.js`
  is a wholly new file, not a modification of an existing one. No CORRECTION risk to a pre-existing test.
- The WCAG contrast-ratio formula (sRGB → linear, relative luminance, `(L1+0.05)/(L2+0.05)`) is implemented
  directly in the test file — no external library dependency, matching this repo's existing zero-dependency
  hand-rolled test convention.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (modified — 11 inline `color` value changes only), `tests/check-bcf-s1-button-contrast.js` (new).
Services: None.
APIs: None — no new routes, no changed request/response shape.

---

## Contract Review

Reviewed against all 4 ACs and the test plan. No mismatches found — every AC has a proposed implementation approach and a matching unit-test type. This story has no CSS-layout-dependent gap (unlike `nia-s1`'s AC3) — AC4's contrast claim is a pure numeric computation from token hex values, fully provable without a browser or visual-regression tooling, so there is nothing to RISK-ACCEPT under CLAUDE.md's B2 rule.

✅ **Contract review passed** — proposed implementation aligns with all ACs.
