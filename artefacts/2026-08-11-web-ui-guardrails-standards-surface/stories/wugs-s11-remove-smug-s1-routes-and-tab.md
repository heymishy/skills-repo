## Story: Remove `smug-s1`'s promote/opt-out routes and old Standards tab rendering

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-4-smug-s1-migration.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **tech lead viewing their product**,
I want **the "Standards" tab to be the new repo-backed view (Epic 1-3's work), not the old DB-backed promote/opt-out page**,
So that **I don't land on a superseded page that shows disconnected, non-governed data**.

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI
**How:** Removes the old, competing view so 100% of product visits to "Standards" land on the real, repo-backed view the metric measures — leaving the old page live would mean some fraction of visits still see the disconnected DB data.

## Architecture Constraints

- **Remove, don't redirect-and-hide** — per `decisions.md`'s ARCH entry #4, this is a clean supersession; `handleGetProductStandardsTab`, `_renderStandardsTab`, `handlePutStandardPromote`, `handlePostStandardOptout`, and `standardsPost`/`standardsList`/`standardsPut` in `standards.js` are deleted, not left dead-code-present-but-unrouted.
- **Nav entry repointed, not duplicated** — the existing "Standards" nav link (fixed for its own missing-nav bug in `rapp-s2`) now points at the new repo-backed view's route, not a second, separate nav entry.
- **Regression check against `rapp-s2` and `smug-s1`'s own test suites** — `check-smug-s1-standards-tab-and-query-fix.js` and `check-rapp-s2-standards-tab-nav-and-breadcrumb.js` will fail once these routes are removed (by design — they test the removed code); this story must also remove or explicitly retire those test files, not leave them failing in the suite.

## Dependencies

- **Upstream:** Epics 1-3 must be live and confirmed working (per this epic's own sequencing rationale) before this story starts.
- **Downstream:** `wugs-s12` (DB table removal) — this story removes the routes/handlers; `wugs-s12` removes the underlying tables once no code references them.

## Acceptance Criteria

**AC1:** Given the old routes (`GET /products/:id/standards-tab`, `PUT .../standards/:id/promote`, `POST .../standards/:id/optout`) are called after this story merges, When requested, Then they return 404 — the routes no longer exist, not just unlinked from nav.

**AC2:** Given a tenant navigates to "Standards" from a product page, When clicked, Then they land on the new repo-backed view (`wugs-s2`/`wugs-s3`'s rendering) — the nav link is repointed, not duplicated.

**AC3:** Given `check-smug-s1-standards-tab-and-query-fix.js` and `check-rapp-s2-standards-tab-nav-and-breadcrumb.js` (which test the now-removed code), When this story's changes are complete, Then both test files are removed from the suite (their subject no longer exists) — not left present-and-failing.

**AC4:** Given the full regression suite is run after this story, When executed, Then no other test file references the removed `standards.js` exports (`standardsPost`, `standardsList`, `standardsPut`, `handlePutStandardPromote`, `handlePostStandardOptout`) — confirmed via a repo-wide grep before merge, not assumed.

## Out of Scope

- **`standards.js`'s file itself, if any non-removed code still lives there** — if the file becomes fully empty after removal, delete the file; if any shared helper remains genuinely in use elsewhere, keep only that helper (verify via grep, don't assume).
- **DB table removal** — `wugs-s12`.

## NFRs

- **Performance:** None specific.
- **Security:** None new — removal only.
- **Accessibility:** None new.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2 — mechanical removal, but requires careful grep-verified cross-referencing to avoid leaving dead imports or broken test references.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (Medium)
