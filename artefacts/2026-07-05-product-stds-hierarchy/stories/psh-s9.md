## Story: psh-s9 — Org-level standard promotion and per-product opt-out

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e5-standards-library.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **product owner/operator**,
I want **to promote a product-level standard to org-level so it applies to all my products by default, and to opt specific products out of an org-level standard**,
So that **shared practices (e.g. our React coding guide) are available across all my org's products without duplicating the definition, and individual products can opt out where the standard doesn't apply — supporting Phase 2 cross-org sharing readiness (M4a secondary signal)**.

## Benefit Linkage

**Metric moved:** M4a (Standards library adoption rate) — promoting a standard to org-level increases the value of each defined standard (it now applies everywhere by default), which makes standards more useful and encourages further adoption. This story does not directly emit a new metric event but makes M4a-contributing standards more valuable.
**How:** Org-level standards apply to all products in the tenantId. Opt-out is per-product. This feature is primarily plumbing for M4b (injection rate) — psh-s10 cannot correctly implement org-level injection without this story's opt-out mechanism.

## Architecture Constraints

- **ADR-003 (schema-first):** The `standard_product_optouts` table (or equivalent junction table) introduced in this story must be added via idempotent migration. No new pipeline-state.json fields are introduced.
- **Phase 2 readiness:** The `visibility = 'public'` value in the `standards` table CHECK constraint (set in psh-s1) must remain. This story must not remove or weaken it. The `'public'` value is reserved for Phase 2 cross-org sharing and must not be promoted to in this story.
- **MC-SEC-01:** Standard names rendered in opt-out UI must be HTML-escaped.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s1 (standards table with visibility column), psh-s8 (at least one product-level standard must exist before promotion makes sense).
- **Downstream:** psh-s10 (standards injection must query both product-level and org-level standards, minus opt-outs — this story provides that data model).

## Acceptance Criteria

**AC1 (promotion):** Given a standard exists with `visibility = 'product'`, when the operator promotes it to org-level, then the `standards` table is updated: `visibility` changes from `'product'` to `'org'`. HTTP 200 is returned. The standard now appears in the standards list for every other product in the same org (tenantId).

**AC2 (org standard visibility in all products):** Given an org-level standard exists (`visibility = 'org'`, `org_id = tenantId`), when the standards list is loaded for any product in the same org, then the org-level standard appears with a `[Org]` badge or indicator distinguishing it from product-level standards.

**AC3 (opt-out):** Given an org-level standard exists and the operator opts a specific product out of it, when the opt-out is saved, then a row is inserted into `standard_product_optouts` with `product_id` and `standard_id`. The opted-out standard no longer appears as active for that product in the standards list or injection queries.

**AC4 (opt-out reversal):** Given a product has opted out of an org-level standard, when the operator reverses the opt-out, then the `standard_product_optouts` row is deleted. The org-level standard is active again for that product.

**AC5 (public visibility guard):** Given the standards management endpoint accepts a `visibility` field, when an operator submits `visibility = 'public'` via any API call (including direct HTTP request), then the server returns HTTP 400 with `"reason": "public_visibility_not_available"`. The standard is not updated. The `'public'` visibility is reserved for Phase 2.

**AC6 (schema — new table):** Given the server starts and runs migrations, when the migration block executes, then a `standard_product_optouts` table exists with columns: `optout_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `product_id UUID REFERENCES products(product_id) ON DELETE CASCADE`, `standard_id UUID REFERENCES standards(standard_id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `UNIQUE(product_id, standard_id)`. Re-running does not error.

## Out of Scope

- Cross-org sharing (`visibility = 'public'`) — Phase 2. Signposted in epic artefact and in AC5 guard.
- Standards approval or review workflow before promotion — post-MVP.
- Bulk opt-out (opting a product out of all org standards) — post-MVP; per-standard opt-out is sufficient for MVP.

## NFRs

- **Security:** `req.session.tenantId` is the sole authoritative source for tenantId on all read and write operations. No cross-tenant standard visibility.
- **Idempotency:** Promoting an already-org-level standard (`visibility = 'org'`) must be a no-op, not an error.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Standard visibility update, new opt-out junction table, public visibility guard. No AI calls. Schema migration is additive.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependencies (psh-s1, psh-s8) confirmed complete
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic (Medium)
