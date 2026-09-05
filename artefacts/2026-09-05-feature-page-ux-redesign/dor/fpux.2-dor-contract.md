# Contract Proposal — Audit and fix the navigation path into `/features/:slug`

**Story:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.2-audit-and-fix-nav-path.md
**Date:** 2026-09-05

---

## What will be built

An audit of the three real entry points into `/features/:slug`, documented in the story's own write-up, tracing the actual route/link chain in `src/web-ui` (likely `routes/products.js`'s dashboard rendering, `views/features-view.js`, and `routes/journey.js`'s DoD/resume-link handling — exact files TBD until the audit runs). Any dead-end, 404, or unauthenticated-redirect-loop hop found is fixed in the relevant route/view file, with a regression test for that specific defect. `benefit-metric.md`'s M3 row updated with the real baseline (entry-point count/click count) and target established by the audit.

## What will NOT be built

- No visual/design changes to the dashboard, product page, or breadcrumb — that's `fpux.1`'s scope, bounded to the `/features/:slug` page itself.
- No new entry points (search, bookmarks, etc.) — per discovery's own "no new functionality" boundary.
- No change to any route that doesn't lead to `/features/:slug`.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Manual — an independent reviewer `grep -rn`s the route table and cross-checks against the story's own documented entry-point list | Manual |
| AC2 | E2E tests follow each of the 3 named entry points (dashboard, product page, story DoD), asserting the final URL matches `/features/:slug` with a 200 status and no intermediate 404/redirect loop | E2E |
| AC3 | A regression test is written at implementation time for whatever specific defect (if any) the AC1/AC2 audit finds; if none is found, this AC closes as "no defect found" in the DoD | TBD (written when the defect, if any, is known) |
| AC4 | Unit test reads `benefit-metric.md` and asserts the M3 row no longer contains the placeholder strings "Not yet established"/"TBD" | Unit |

## Assumptions

- The three entry points named in discovery (dashboard, product page, story DoD) are a reasonable starting hypothesis for the audit, not assumed to be exhaustive — AC1 exists specifically to test that assumption.
- No defect is presumed to exist going in; AC3's gap is honestly declared as "unknown until AC1/AC2 run," not silently skipped.

## Estimated touch points

**Files:** TBD until the audit runs — most likely among `src/web-ui/routes/products.js`, `src/web-ui/views/features-view.js`, `src/web-ui/routes/journey.js`; `artefacts/2026-09-05-feature-page-ux-redesign/benefit-metric.md`; new `tests/check-fpux.2-*.js`; new `tests/e2e/fpux.2-*.spec.js`
**Services:** None
**APIs:** None
