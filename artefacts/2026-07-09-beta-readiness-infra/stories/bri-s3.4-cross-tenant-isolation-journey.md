## Story: Cross-tenant isolation journey spec

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As a **first beta customer**,
I want an explicit, zero-tolerance guarantee that a different tenant can never access my data under any code path,
So that the ADR-025 tenant-isolation guard is protected by regression coverage, not just a one-time implementation that could silently break as new routes are added.

## Benefit Linkage

**Metric moved:** Metric 5 — Cross-tenant isolation suite has zero tolerance for flake or skip
**How:** This story delivers the exact suite Metric 5 measures — a dedicated, `@multi-tenant`-tagged spec asserting tenant A cannot reach tenant B's data.

## Architecture Constraints

- ADR-025: the guard being tested — application-layer tenant_id scoping (`requireJourneyAccess`/`isSameTenant` and equivalent checks across `products`, `credits`, `standards`, `user_roles`).
- ADR-018: browser-driven Playwright spec, `@multi-tenant` tag.
- Uses S2.4's seed script (2+ synthetic tenants) as its test fixture data source.

## Dependencies

- **Upstream:** S2.4 (anonymized seed script) for the two-tenant test data; S3.1 (mock LLM gateway) for the `@mocked` variant.
- **Downstream:** None — this is the terminal regression guard other stories/features are measured against going forward (per benefit-metric.md Metric 5's zero-tolerance framing).

## Acceptance Criteria

**AC1:** Given two synthetic tenants exist (per S2.4's seed data), When tenant A's authenticated session attempts to read any tenant B resource by ID (journey, product, standard) via the API, Then the response is a 404 (not a 403 that would leak existence) — consistent with the existing FORBIDDEN-vs-NOT_FOUND policy from `wuce-multi-tenancy`.

**AC2:** Given tenant A's session attempts to read the aggregate list endpoints (e.g. journey list, product list), When the response is inspected, Then it contains zero tenant B resources — not just that individual-resource access is blocked, but that list views are also filtered.

**AC3:** Given tenant A attempts a write/mutation against a tenant B resource (not just a read), When the request is made, Then it is rejected and no tenant B data is modified.

**AC4:** Given this spec runs in CI, When it executes across 20 consecutive runs, Then it has zero skips and zero flakes — any single skip or flake is treated as a defect in the guard or the test itself, not tolerated as noise (per Metric 5's zero-tolerance target).

**AC5:** Given this spec is tagged `@mocked` and `@multi-tenant`, When it runs on every PR (not just nightly), Then it uses S3.1's mock gateway and completes deterministically.

## Out of Scope

- Cross-tenant isolation for the future `TENANT_ORG_ALLOWLIST`-based org-tenancy model (multiple humans sharing one tenant) — this spec tests isolation *between* tenants; isolation/permission *within* a shared tenant is S3.3's responsibility.
- Filesystem-level or database-level penetration testing beyond the application-layer guard — this spec tests the guard's behaviour via the API/browser, not infrastructure-level access controls (matches ADR-025's stated scope).

## NFRs

- **Performance:** Contributes to the shared under-10-minute `@mocked` suite budget.
- **Security:** This is the single most security-critical spec in the entire beta-readiness effort — any failure here blocks merges of unrelated work until root-caused (per Metric 5's feedback loop in benefit-metric.md), not treated as routine CI noise.
- **Accessibility:** Not applicable.
- **Audit:** CI history for this spec's pass/skip/flake rate is reviewed on any anomaly, not on a fixed schedule (per benefit-metric.md Metric 5).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
