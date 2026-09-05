# Contract Proposal — Unify `/features/:slug`'s visual language across feature-level and per-story sections

**Story:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.1-unify-feature-page-visual-language.md
**Date:** 2026-09-05

---

## What will be built

Two new shared CSS classes in `src/web-ui/utils/html-shell.js`'s `DESIGN_SYSTEM_CSS` constant:
- `.sw-epic-group` — card-styled `<details>` wrapper for a phase/epic, matching `.sw-card`'s `background: var(--surface); border: 1px solid var(--line); border-radius: 8px` treatment
- `.sw-story-row` — list-row-styled `<details>` wrapper for a story, matching `.sw-list li`'s `border-top: 1px solid var(--line)` divider convention (no border on the first row)
- `<summary>` typography for each (epic: 15px/weight 600/`var(--ink)`; story: 14px/weight 500, matching `.sw-frow-title`)
- A CSS-drawn or Unicode-glyph chevron, rotated via `transform` on `[open]` — no icon font/library
- A visible `--accent` focus ring on `<summary>`, matching `.sw-input:focus`'s existing convention

`src/web-ui/routes/features.js`'s `renderGroupedArtefactIndexHtml` (epic wrapper) and its internal `renderStory` function updated to emit these classes instead of their current inline `style="..."` attributes. `renderStory` exported from the module (currently private) so the test plan's Unit Tests can call it directly.

## What will NOT be built

- No change to `_renderArtefactListByType`, `getFeatureStoryStructure`, `groupArtefactsByStory`, or any data-fetching code — this story only changes how already-correct data is styled.
- No icon font or component library dependency — the chevron is CSS-drawn or a plain Unicode character.
- No automated pixel-level screenshot-diff/visual-regression tooling (e.g. Percy) — computed-style E2E assertions substitute for this, per the test plan's explicit Out of Scope note.
- No change to `.sw-card`, `.sw-section-title`, `.sw-list`, or any other existing shared class — only two new classes are added.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests confirm `sw-epic-group`/`sw-story-row` classes present and old inline `style=` literals absent in rendered HTML; E2E test compares computed style of `.sw-epic-group` against `.sw-card` | Unit + E2E |
| AC2 | E2E test reads computed `background-color`/`color` on the new classes in `data-theme="light"` and `data-theme="dark"`, asserting they resolve to the correct token values and differ between themes | E2E |
| AC3 | E2E test tabs to a `<summary>`, asserts a visible (non-`none`) computed `outline`, then presses Enter and asserts the parent `<details>`'s `open` attribute toggles | E2E |
| AC4 | E2E test computes the WCAG relative-luminance contrast ratio from real computed `color`/`background-color` in both themes, asserting ≥ 4.5:1 | E2E |
| AC5 | Unit test confirms the existing "Delete this feature" button markup and inline script are byte-identical to the pre-story version | Unit |

## Assumptions

- `.sw-list li`'s existing divider convention (`border-top` on non-first children) is the correct reuse target for spacing between sibling story rows within one epic group.
- `renderStory`'s return contract (an HTML string, or `''` for a story with no artefacts) is unchanged by this story — only its internal markup/class output changes.
- No new E2E fixture infrastructure is needed: fixture rendering goes through `html-shell.js`'s real, already-exported `renderShell()` function with synthetic `bodyContent`, loaded via Playwright's `page.setContent()` — not the full authenticated `/features/:slug` route (which cannot currently render real multi-story data in this repo's E2E environment).

## Estimated touch points

**Files:** `src/web-ui/utils/html-shell.js`, `src/web-ui/routes/features.js`, new `tests/check-fpux.1-*.js`, new `tests/e2e/fpux.1-*.spec.js`
**Services:** None
**APIs:** None
