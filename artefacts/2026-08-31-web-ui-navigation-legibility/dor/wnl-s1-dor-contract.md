# Contract Proposal — Collapse the always-expanded "Ref docs" context manifest into a single summary indicator

**Story:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s1-collapse-context-manifest.md
**Date:** 2026-09-10

---

**What will be built:**
`buildContextManifestHtml()` (`src/web-ui/routes/skills.js:2680`) is wrapped: its existing per-file chip output (unchanged) is nested inside a native `<details>` element, closed by default. A new summary line (inside `<summary>`) shows "Context loaded (N files) ✓" when all files loaded, or a distinct warning form (e.g. "Context loaded (M of N files) ⚠") when at least one file has `status: 'warn'`.

**What will NOT be built:**
No new collapse/expand JS — the native `<details>`/`<summary>` toggle mechanism is used as-is. No persistent cross-session "remember expanded state" preference. No change to which files are loaded or the loaded/missing detection logic itself.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `collapsed-by-default-all-loaded`, `collapsed-summary-reflects-exact-file-count` | Unit |
| AC2 | `expand-reveals-unchanged-chip-list` | Unit |
| AC3 | `native-details-element-present-not-custom-js` (structural check; interaction itself untestable-by-nature) | Unit |
| AC4 | `warning-cue-visible-without-expanding`, `warning-cue-absent-when-all-loaded` | Unit |
| AC5 | `per-file-markup-regression-guard`, `iwu1-existing-suite-still-passes` | Unit + Integration |
| AC6 | Native semantics (untestable-by-nature beyond AC3's structural check) | Manual (verification script) |

**Assumptions:**
No assumption about a specific summary copy string beyond what the story's own AC1 example suggests ("Context loaded (N files) ✓") — exact wording is an implementation choice within that shape. Assumes `iwu.1`'s existing test file requires no modification (confirmed likely but not certain until the implementation actually runs it, per the test plan's own Integration Test).

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js` (one function), `tests/check-wnl-s1-context-manifest-collapse.js` (new).
Services: None.
APIs: None.
