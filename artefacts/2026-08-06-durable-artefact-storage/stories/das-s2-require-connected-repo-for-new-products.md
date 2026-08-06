## Story: Require a connected repo before a new product can start its first journey

**Epic reference:** artefacts/2026-08-06-durable-artefact-storage/epics/das-e1-durable-artefact-storage.md
**Discovery reference:** artefacts/2026-08-06-durable-artefact-storage/discovery.md
**Benefit-metric reference:** artefacts/2026-08-06-durable-artefact-storage/benefit-metric.md
**Domain:** [ui, web-ui]

## User Story

As a **real SaaS operator creating a new product for the first time**,
I want to **be required to connect a GitHub repo before I can start my first journey**,
So that **my completed stage artefacts are durable from day one, not silently exposed to the same redeploy-wipe gap this epic fixes**.

## Benefit Linkage

**Metric moved:** Repo-connection-required coverage (0% → 100% of new products)
**How:** Completing this story means every new product must have a connected repo before starting a journey, so Story 1's durability guarantee applies to it from the very first stage it completes, rather than the product silently missing the guarantee because it never connected a repo.

## Architecture Constraints

- **ADR-025** (Multi-tenancy, application-layer `tenant_id` scoping): the gate check reads the same `products.repo_owner`/`repo_name` columns already scoped by tenant_id — no new isolation mechanism.
- **product/constraints.md #9** (Design system compliance is structural; WCAG 2.1 AA is a hard floor, not a performance NFR) — applies since this introduces a new blocking UI state.
- **Reuse, don't rebuild:** the mechanism offered when the gate blocks is `mtrr-s2`'s existing repo-connection picker (already merged, PR #671) — this story does not build a second picker or connection flow.

## Dependencies

- **Upstream:** `mtrr-s2` (repo-connection picker UI) — this story reuses the picker directly as the resolution path when the gate blocks. `[External: mtrr-s2 lives in artefacts/2026-08-06-multi-tenant-repo-resolution/, not this feature's own stories/ dir — merged as PR #671, confirmed by operator on 2026-08-06]`
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a product with zero journeys started and no connected repo ("brand-new" is defined operationally as journey count = 0, never by product creation date), When the operator attempts to start their first journey, Then the request is rejected with a message directing them to connect a repo via `mtrr-s2`'s picker before proceeding — not a silent failure or generic error.

**AC2:** Given the operator connects a repo via the picker (or URL fallback) after being blocked, When they retry starting their first journey, Then it proceeds normally with no further restriction.

**AC3:** Given a product that already has one or more journeys but no connected repo (regardless of whether it predates this gate or has zero connected repo for any other reason), When that product's operator starts a new journey, Then the request is NOT blocked — the gate check is journey-count-based (journeys ≥ 1 → never blocked), not a creation-date comparison, matching the /clarify decision (Option A: new products only) exactly.

**AC4:** Given a brand-new product that already has a connected repo (connected during product creation), When the operator starts their first journey, Then it proceeds normally with no gate friction at all — the gate only fires for the actual gap case (no repo connected), never for an already-satisfied one.

## Out of Scope

- **Building a new repo-connection UI** — this story reuses `mtrr-s2`'s picker unchanged.
- **Retroactively migrating or blocking existing repo-less products** (see AC3) — matches the /clarify Option A decision.
- **Any change to how repo connection itself works** (the picker's own behavior, fallback, search/filter) — untouched; this story only adds a gate check before journey-start.

## NFRs

- **Performance:** The gate check is a single existing-column read (`products.repo_owner`/`repo_name`) — negligible added latency (<50ms).
- **Security:** None new — reuses the existing tenant-scoped read pattern.
- **Accessibility:** WCAG 2.1 AA hard floor for the new blocking message/UI, reusing `mtrr-s2`'s already-accessible picker component for the actual connection step.
- **Audit:** None new — no new state-changing action beyond what `mtrr-s2` already logs.

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
