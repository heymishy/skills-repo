## Story: Delete (detach) a product

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-4-product-crud-and-isolation.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin**,
I want to **delete a product from wuce without deleting the underlying GitHub repo**,
So that **I can clean up mistakes or discontinued products without any risk of destroying real git history**.

## Benefit Linkage

**Metric moved:** None directly. Honest linkage: this story closes MVP scope item 6 (product management UX) — a structural completeness gap (zero delete capability exists today) — not a numeric-target-moving story. It's recorded in the benefit-metric coverage matrix as an accepted scope item without direct metric linkage, per the /definition scope-gap resolution: necessary MVP scope doesn't have to move a metric if the discovery explicitly named it as required functionality.

## Architecture Constraints

Explicit product decision from discovery: MVP never deletes the underlying GitHub repo — detach only.

## Dependencies

- **Upstream:** None (independent of repo-config stories — deletion works whether or not a repo was ever connected)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given an existing product, When a tenant admin deletes it, Then the product record (and its associated wuce-side data — journeys, standards cache) is removed, but the underlying GitHub repo is untouched — verified by checking the repo still exists and is unmodified after deletion.

**AC2:** Given a delete action, When the confirmation step is presented, Then it explicitly states the repo will NOT be deleted — avoiding any ambiguity that could cause an operator to hesitate, or conversely assume something is deleted that isn't.

**AC3:** Given a product is deleted, When a tenant admin later tries to access it (e.g. via a bookmarked URL), Then they see a clear "this product no longer exists" response, not a crash or a confusing partial-data view.

## Out of Scope

- Deleting the GitHub repo itself — explicit discovery boundary.
- Soft-delete/undo — out of scope; a hard delete is acceptable for MVP given the repo itself is never at risk.

## NFRs

- **Performance:** None identified.
- **Security:** Only the product's own tenant admin can delete it — standard tenant-scoping, no new pattern.
- **Accessibility:** Standard confirmation dialog.
- **Audit:** Deletion logged (who, when, which product) via existing PostHog pattern — important since this is a destructive action even if scoped to detach-only.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
