## Story: Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As a **tech lead or CoP/domain expert viewing any product in their tenant**,
I want **to see the guardrails/standards that apply org-wide, from a single repo my tenant has designated as the org-level source**,
So that **I can distinguish what's a broad floor from what's specific to one product** (per the discovery's "Guardrails and standards are largely invisible... no delineation between org and product" problem statement).

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI
**How:** This story delivers the org-level half of the view — without it, the product-level view alone (`wugs-s2`) cannot show the org/product delineation the discovery explicitly names as core to the problem.

## Architecture Constraints

- **No existing `tenants` table to extend.** Confirmed via `scripts/migrate-schema-*.js` — `tenant_id` is a scattered `VARCHAR` value across `users`, `journeys`, `products`, and other tables; there is no canonical tenant-level settings row in this codebase today. This story introduces a **new** table, `tenant_org_repo` (`tenant_id` PK, `repo_owner`, `repo_name`, `seeded_at`), rather than retrofitting a tenants table that doesn't exist — a smaller, more targeted schema addition than inventing general tenant-settings infrastructure this feature doesn't otherwise need.
- **Multi-tenancy (ADR-025):** `tenant_org_repo` is keyed by `tenant_id`, following the same application-layer scoping pattern as every other tenant-scoped table — no schema-per-tenant shortcut.
- **Schema-first (ADR-003):** the new table and its columns must be added to the relevant schema/migration file in the same commit as the code that reads/writes it.
- **Reuse `wugs-s1`'s fetch function** for the actual repo read, same as `wugs-s2` — no second GitHub-API call path.
- **Per `decisions.md`'s ARCH entry #1:** the org repo is nominated per-tenant (not a fixed platform-wide repo), and seeded with a small, deliberately minimal starter set (1-2 generic entries) on first designation — this story implements exactly that seeding step.

## Dependencies

- **Upstream:** `wugs-s1` (fetch function) must be complete. `wugs-s6` (Epic 2's branch+PR write adapter) must also be complete — first-time org-repo seeding (AC1) writes real content and, per `decisions.md`'s SLICE entry resolving this cross-epic sequencing question, seeding goes through the same PR-gated write path as any other edit, not a direct-commit exception. This means `wugs-s3` cannot be fully implemented until part of Epic 2 (`wugs-s6`) exists, breaking the otherwise-clean Epic 1/Epic 2 boundary for this one story.
- **Downstream:** `wugs-s4` (no-connected-repo fallback) depends on this story's org-level rendering being correct, since the fallback state still shows org-level content.

## Acceptance Criteria

**AC1:** Given a tenant with no `tenant_org_repo` row yet, When a tenant admin/tech lead first designates an org repo (via a settings action introduced by this story), Then a `tenant_org_repo` row is created and the designated repo is seeded with exactly these two starter entries (verbatim, not paraphrased):
- `.github/architecture-guardrails.md` seeded with: `"## Getting Started\n\nThis file records your organisation's architectural decisions and constraints — the things every product should respect unless explicitly overridden. Add an entry here whenever your team makes a structural choice that should apply broadly (e.g. 'All new services must expose a health-check endpoint at /health'). Delete this section once you've added your own guardrails."`
- `standards/getting-started.md` seeded with: `"# Getting Started\n\nThis folder holds your organisation's engineering standards — practices every product is expected to follow. Add a file per discipline as your standards mature (e.g. security, data handling, accessibility). A reasonable first standard: all code changes require a passing test suite before merge. Delete this file once you've added your own standards."`

**AC2:** Given a tenant with a designated org repo already containing `.github/architecture-guardrails.md` and `standards/`, When any product's guardrails/standards view is rendered, Then the org-level section shows that repo's real, current content — identical mechanism to `wugs-s2`'s product-level read, applied to the org repo instead.

**AC3:** Given a tenant has not yet designated an org repo, When a product's view is rendered, Then the org-level section shows an explicit "no org repo designated yet" state with a way to designate one — not a silent empty section.

**AC4:** Given two different products under the same tenant, When each product's view is rendered, Then both show the identical org-level content (same designated repo) — proving org-level is tenant-scoped, not accidentally product-scoped.

**AC5:** Given a product under Tenant A and a product under Tenant B, When each views their org-level section, Then Tenant A never sees Tenant B's designated org repo content or vice versa — cross-tenant isolation, matching ADR-025.

## Out of Scope

- **UI for changing/re-designating the org repo after first set** — this story covers first-time designation + seeding; a full settings-management UI for changing it later is a follow-on, not blocking MVP (view still works with whatever is designated).
- **Multi-level org hierarchies** — flat tenant → single org repo only, per discovery's Out of Scope.
- **Aggregating across multiple product repos as an org-level fallback** — explicitly rejected in `decisions.md`'s ARCH entry #1; a single designated repo only.

## NFRs

- **Performance:** Same as `wugs-s2` — no hard target, GitHub API latency accepted.
- **Security:** Same escaping requirement as `wugs-s2` (`MC-SEC-01`) for org-repo content. Cross-tenant isolation (AC5) is a hard NFR, not advisory — must be covered by an explicit test, not just implied by `tenant_id` scoping.
- **Accessibility:** Same as `wugs-s2`.
- **Audit:** Org-repo designation (AC1) is a state-changing action — audit-logged via PostHog (`org_repo_designated` event with tenant_id, repo_owner, repo_name), matching this platform's existing capture convention.

## Complexity Rating

**Rating:** 2 — new table + seeding logic is a genuine addition, though the read mechanism itself reuses `wugs-s1`/`wugs-s2`'s already-proven pattern.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (Medium)

---CANVAS-JSON: {"type":"data-model","title":"Data model — org-level repo designation","content":{"mermaid":"erDiagram\n    PRODUCTS {\n        text product_id PK\n        text tenant_id\n        text repo_owner\n        text repo_name\n    }\n    TENANT_ORG_REPO {\n        text tenant_id PK\n        text repo_owner\n        text repo_name\n        timestamptz seeded_at\n    }\n    PRODUCTS }o--|| TENANT_ORG_REPO : \"scoped by tenant_id (no FK -- same application-layer pattern as other tenant-scoped tables)\""}}---
