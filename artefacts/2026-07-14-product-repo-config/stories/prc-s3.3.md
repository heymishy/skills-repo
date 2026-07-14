## Story: Rework standards.js routes to read-through/write-through git

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-3-standards-git-tracked.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin configuring a new product / engineer pairing**,
I want to **have the existing standards list/edit/promote/opt-out routes keep working exactly as they do today**,
So that **this architectural change (DB to git as source of truth) is invisible to anyone just using the existing UI**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact
**How:** This story is the integration point — without it, prc-s3.1 and prc-s3.2 exist but nothing in the actual product routes uses them, so the feature isn't real from a user's perspective.

## Architecture Constraints

None new — this story wires together prc-s3.1 and prc-s3.2 into the existing `standards.js` route handlers (`standardsPost`, `standardsList`, `standardsPut`, `standardsPromote`, `optoutPost`, `optoutDelete`).

## Dependencies

- **Upstream:** prc-s3.1, prc-s3.2
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the existing `standardsList`/`standardsPost`/`standardsPut` test suites (pre-existing, DB-only), When this story ships, Then those tests are updated to reflect the new git-backed behaviour and continue passing — no regression in the documented route contracts (status codes, response shapes).

**AC2:** Given `standardsPromote` (visibility-tier promotion) and `optoutPost`/`optoutDelete` (opt-out tracking), When this story ships, Then their behaviour is unchanged — only `standardsPost`/`standardsPut` (content-mutating routes) change to write-through git; promote/opt-out remain DB-only as before, per this epic's own Out of Scope.

**AC3:** Given a real end-to-end flow (create a standard via the web UI, then read it back), When both actions happen through the actual routes, Then the returned content matches exactly what was written, round-tripped through git and the cache.

## Out of Scope

- Any new route or endpoint — this story only changes the internals of existing routes.

## NFRs

- **Performance:** No route should regress in response time versus today's DB-only behaviour, per prc-s3.2's cache requirement.
- **Security:** No change to `standards.js`'s existing auth/tenant-scoping checks.
- **Accessibility:** Not applicable.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2
<!-- Mostly wiring — the hard parts were solved in prc-s3.1/prc-s3.2. -->
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
