# Contract Proposal: Restyle the Landing Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
**Date:** 2026-09-18 (re-signed 2026-09-19 for the FEATURE-WIDE mobile-responsiveness amendment, new AC5)
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
Restyle `src/web-ui/templates/landing.html` (read into `_LANDING_HTML` by `src/web-ui/routes/public.js` at module load, served via `handleRoot` for `GET /`) to match `DESIGN.md`'s "Marketing/landing" layout pattern, applying the token values already updated by `dsa-s1`, and its new "Responsive behavior" section's Marketing/landing minimum bar (AC5).

**What will NOT be built:**
Any change to `handleRoot`'s own logic (auth redirect, PostHog capture, CSRF token substitution, `posthog-js` wiring). No change to marketing copy.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on hero/sections/screenshot-frame | E2E |
| AC4 (no regression) | Re-run the real landing-page regression suite (9 Node + 5 E2E files) — corrected 2026-09-19 from an earlier wrong reference; see `decisions.md` | Node + E2E |
| AC5 (mobile responsive) | Playwright: `page.setViewportSize()` at 375px/390px, `document.body.scrollWidth` measurement; must not regress AC4's own existing 320px-overflow specs | E2E |

**Assumptions:**
`landing.html`/`public.js`'s `handleRoot` are the real target (confirmed via direct code trace, correcting the story's own initial file-ambiguity, resolved during `/review`). Whether the existing layout needs new explicit CSS to satisfy AC5, or already reflows without changes, is not yet confirmed — investigate at `/implementation-plan` time.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html`. Services: none. APIs: none.
