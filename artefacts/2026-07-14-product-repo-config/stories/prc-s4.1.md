## Story: Edit a product's name, description, and repo association

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-4-product-crud-and-isolation.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **tenant admin**,
I want to **edit a product's name, description, and repo association after creation**,
So that **I'm not stuck with my first choice, especially the repo link if I initially connected the wrong one**.

## Benefit Linkage

**Metric moved:** Metric 2 — Products with a configured repo
**How:** Without an edit path, a tenant admin who initially skipped or mis-configured a repo association has no recovery path other than deleting and recreating the product — edit is what makes Metric 2's "100% of products configured" claim durable over time, not just at creation.

## Architecture Constraints

ADR-020: changing the repo association reuses prc-s1.2/prc-s2.1's existing connect/create logic, not a new implementation. None identified beyond that.

## Dependencies

- **Upstream:** prc-s1.2, prc-s2.1 (reuses their repo-connection logic)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given an existing product, When a tenant admin edits its name or description, Then the change is saved and reflected immediately on the product view.

**AC2:** Given an existing product with a connected repo, When a tenant admin changes the repo association to a different repo, Then future writes resolve to the new repo — confirmed via the same verification prc-s1.2 AC1 used (repo-access check before accepting the change).

**AC3:** Given a product currently has no repo connected, When a tenant admin uses this edit flow to add one, Then it works identically to first-time configuration — edit and initial-configure are not two different code paths that can drift.

## Out of Scope

- Changing a product's tenant ownership (transferring a product between tenants) — not named anywhere in discovery, genuinely out of scope.

## NFRs

- **Performance:** Standard form submission latency.
- **Security:** Same repo-access verification as prc-s1.2.
- **Accessibility:** Standard form.
- **Audit:** Edits logged via existing PostHog pattern.

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
