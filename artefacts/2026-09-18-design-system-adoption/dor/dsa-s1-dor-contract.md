# Contract Proposal: Restyle the Artefact Viewer to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Date:** 2026-09-18
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
Updated CSS custom-property values in `src/web-ui/utils/html-shell.js`'s `:root`/dark-mode blocks (the `--green`/`--amber`/`--red` → `--success`/`--warn`/`--danger` rename, plus all color hex values, applied to match `DESIGN.md`'s token tables). Markup/layout adjustments in `src/web-ui/views/artefact-view.js`'s `renderArtefact` function and `src/web-ui/routes/artefact.js`'s `handleArtefactRoute` handler to match `DESIGN.md`'s "Artefact/document viewer" layout pattern (two-column, `minmax(0,1fr) 320px`, Source Serif 4 doc body, Sign-off + Comments sidebar cards).

**What will NOT be built:**
Any change to `handleArtefactRoute`'s existing injectable adapters (`setFetcher`, `setJourneyStore`, `setLogger`) or the artefact-fetching/sign-off/comment logic itself — this story is presentation-only. The light/dark toggle mechanism in `settings.js` is also out of scope — only the token *values* it applies are changed.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read against every named color custom property | E2E |
| AC2 (light-mode tokens) | Playwright: same, after toggling light mode | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on the two-column layout, doc body font, sidebar cards | E2E |
| AC4 (no regression) | Playwright: re-run `artefact-preview.spec.js`, `artefact-read.spec.js`, `artefact-writeback.spec.js`, `wuce20-artefact-index-html.spec.js` unmodified | E2E |

**Assumptions:**
`renderArtefact` and `handleArtefactRoute` are the real, correct target functions for this restyle (confirmed via direct code read, not assumed from file names alone).

**Estimated touch points:**
Files: `src/web-ui/utils/html-shell.js`, `src/web-ui/views/artefact-view.js`, `src/web-ui/routes/artefact.js`. Services: none. APIs: none (no new routes or endpoints).
