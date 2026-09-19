# Contract Proposal: Add the "Product in Action" Demo Section to the Landing Page

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
**Date:** 2026-09-19
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
Add a new "Product in action" section to `src/web-ui/templates/landing.html` (the same real file `dsa-s3` already restyled, read into `_LANDING_HTML` by `src/web-ui/routes/public.js` at module load, served via `handleRoot` for `GET /`) — a browser-chrome-framed area (traffic-light dots + URL-bar-style label, matching `DESIGN.md`'s mock's own visual treatment) containing a static, clearly-labeled placeholder in place of a real demo GIF, with a single, clearly-commented swap-in point for the real asset once one exists.

**What will NOT be built:**
The real demo GIF itself (sourcing/recording is a separate, future fast-follow story). The mock's own tab-switching, multi-frame carousel (replaced with a single-GIF format per the operator's own decision). Any general-purpose asset-serving/CMS mechanism beyond what's needed for this one placeholder/future GIF. Any change to `handleRoot`'s own logic or to any other part of the page `dsa-s3` already restyled.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (section present, browser-chrome frame) | Playwright: structural assertions | E2E |
| AC2 (honest placeholder, not broken/blank) | Playwright: DOM/visibility assertions | E2E |
| AC3 (single-point swap-in simplicity) | Code review during implementation | Manual |
| AC4 (dark/light tokens) | Playwright: `getComputedStyle` read | E2E |
| AC5 (mobile, no overflow) | Playwright: `page.setViewportSize()` at 375px/390px | E2E |
| AC6 (no regression) | Playwright + Node: re-run `dsa-s3`'s own full regression suite unmodified | E2E + Node |

**Assumptions:**
`landing.html`/`public.js`'s `handleRoot` are the real target (already confirmed by `dsa-s3`'s own delivery, re-confirmed here as still accurate — no drift since `dsa-s3` merged). The exact placeholder implementation approach (inline CSS-only element vs. a small new static file under `src/web-ui/public/`) is not yet decided — investigate and decide at `/implementation-plan` time, per the story's own Complexity rationale.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html` (and possibly one new static asset file, decided at implementation time). Services: none. APIs: none.
