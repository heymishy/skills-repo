## Contract Proposal — Restyle the existing auth panel as the page's closing CTA

**What will be built:**
CSS/layout changes to `templates/landing.html`'s existing `.auth-panel` block, reducing its visual size/prominence to fit as a closing CTA below the 4 new hero cards. No changes to the panel's HTML structure beyond what's needed for the new visual weight (same buttons, same form fields, same `<a href>`/`action` attributes).

**What will NOT be built:**
Any change to `/auth/*` route handlers; any new auth provider; any change to email form validation.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Playwright: computed size/proportion comparison vs. pre-redesign baseline | E2E |
| AC2 | Unit test asserting `href`/`action` attributes unchanged | Unit |
| AC3 | Playwright viewport test at 320px/1280px, all elements clickable | E2E |

**Assumptions:**
"Reduced visual weight" is asserted via a computed bounding-box/height-proportion comparison, not subjective visual judgement — the coding agent should pick a concrete, defensible threshold (e.g. panel height as % of total page height decreases from today's baseline) when implementing the E2E assertion.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html` (CSS/layout only), `tests/check-lphf-s5-*.js` (new, may extend `tests/check-lab-s1.2-landing-page.js`'s existing mock pattern), `tests/e2e/lphf-s5-*.spec.js` (new).
