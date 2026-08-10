## Definition of Ready: smug-s1 — Standards management has a fully-built backend but no way to reach it by clicking anything

**Story:** artefacts/2026-08-10-standards-management-ui-gap/stories/smug-s1-standards-tab-and-query-fix.md
**Review artefact:** artefacts/2026-08-10-standards-management-ui-gap/review/smug-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-standards-management-ui-gap/test-plans/smug-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/standards.js` — fix `standardsList`'s query to match `setStandardsAdapter`'s promoted/opted-out semantics (AC6).
- `src/web-ui/routes/products.js` — new Standards tab route/render function, following the existing Kanban/Roadmap nav-link pattern.
- `server.js` — wire the new HTML route.
- New test file: `tests/check-smug-s1-standards-tab-and-query-fix.js`.

**Files explicitly out of scope (must not be touched):**
- `standards.js`'s existing `PUT /standards/:id/promote`, `POST/DELETE /standards/:id/optout` handler contracts — reused as-is.
- `server.js`'s `setStandardsAdapter` — reference implementation only, not modified.
- Any standards-creation route or UI.

### Architecture Constraints

No new architectural decision — reuses the existing product-page tab pattern and existing API contracts. No ADR required.

### Human oversight

**Medium** — new UI surface (unlike a pure data-plumbing fix), but bounded: a list view plus two buttons calling already-existing, already-tested endpoints.

### Coding Agent Instructions

1. In `src/web-ui/routes/standards.js`, rewrite `standardsList`'s SQL to match `setStandardsAdapter`'s query shape: `(product_id = $1 OR (visibility = 'org' AND org_id = $2)) AND NOT IN (SELECT standard_id FROM standard_product_optouts WHERE product_id = $1)`.
2. Add a new `handleGetProductStandardsTab` (or extend `_renderProductView`) in `products.js` rendering: a nav link "Standards" alongside Kanban/Roadmap; a list of standards from the fixed `standardsList`, each row showing name + visibility (own/org-promoted); a "Promote to org" button on own-not-yet-promoted standards calling the existing `PUT /standards/:id/promote`; an "Opt out" button on org-promoted standards calling the existing `POST /standards/:id/optout`.
3. Wire the new route in `server.js`.
4. Write the tests per the test plan.
5. Run the new test file plus existing `standards.js`/`products.js` test suites unmodified — zero regression.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (none — list rendering, no layout-sensitive ACs)

**PROCEED: Yes**
