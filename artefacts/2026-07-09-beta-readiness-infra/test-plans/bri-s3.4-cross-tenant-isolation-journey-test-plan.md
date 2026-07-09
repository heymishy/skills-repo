## Test Plan: Cross-tenant isolation journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.4-cross-tenant-isolation-journey.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

<!--
  Gap types:
    CSS-layout-dependent — relies on real browser rendering (drag-drop, getBoundingClientRect, CSS position)
    DOM-behaviour       — e2e-testable but not jsdom-compatible
    External-dependency — relies on third-party API/service unavailable in test
    Untestable-by-nature — inherently non-automatable (e.g. visual aesthetics, physical hardware)
-->

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Tenant A reading tenant B's resource by ID returns 404, not 403 | 1 | 1 | 1 | — | — | 🟢 |
| AC2 | Aggregate list endpoints return zero tenant B resources for tenant A | — | 1 | 1 | — | — | 🟢 |
| AC3 | Tenant A write/mutation against tenant B resource is rejected, no data modified | — | 1 | 1 | — | — | 🟢 |
| AC4 | Zero skips/flakes across 20 consecutive CI runs | — | — | — | — | See Coverage gaps | 🟡 |
| AC5 | Spec tagged `@mocked`/`@multi-tenant`, uses S3.1 gateway, deterministic completion | — | — | 1 | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| "Zero skip/flake over 20 consecutive runs" is a threshold observed across repeated executions, not a single assertion a pre-implementation test can make | AC4 | Untestable-by-nature | The spec itself is fully automatable; what's not directly testable pre-implementation is the empirical zero-flake outcome, which can only be confirmed by actually running it 20 times in CI after it exists | Configure a dedicated CI job step running this spec with a repeat-count of 20 (e.g. Playwright's `--repeat-each=20`) and a zero-tolerance pass gate; track pass/skip/flake history in CI going forward per benefit-metric.md Metric 5. This is a CI-configuration and ongoing-monitoring concern, not a coding-agent-testable unit at DoR time |

---

## Test Data Strategy

**Source:** Seeded staging database (bri-s2.4's 2+ synthetic tenants) + S3.1's mock LLM gateway fixtures
**PCI/sensitivity in scope:** No
**Availability:** Available now — depends on bri-s2.4 (seed script) and bri-s3.1 (mock gateway), both within this feature
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Two synthetic tenants (A, B), each with at least one journey, product, and standard | bri-s2.4 seed data | None | |
| AC2 | Tenant B has ≥1 row in each list-backed resource type (journeys, products) so a leak would be detectable | bri-s2.4 seed data | None | |
| AC3 | A tenant B resource ID that tenant A's session will attempt to mutate | bri-s2.4 seed data | None | |
| AC4 | N/A — CI configuration concern, not test data | N/A | None | |
| AC5 | S3.1 mock gateway fixtures | S3.1 fixtures | None | |

### PCI / sensitivity constraints

None — bri-s2.4's seed data is synthetic by construction (AC3 of that story).

### Gaps

None.

---

## Unit Tests

### `isSameTenant` / tenant-scoping utility returns correct boolean for matching and mismatched tenant IDs

- **Verifies:** AC1 (underlying utility that the route-level guard depends on).
- **Precondition:** Two distinct tenant IDs, one matching pair, one edge case (`null`/`undefined` tenant ID).
- **Action:** Call the tenant-scoping utility function directly with each pair.
- **Expected result:** Returns `true` only for a genuinely matching tenant ID pair; returns `false` (never throws or returns a truthy non-boolean) for a mismatch, and for `null`/`undefined` inputs — a permissive default here would be a security defect.
- **Edge case:** Yes — `null`/`undefined` tenant ID must resolve to `false`, not treated as "no restriction."

---

## Integration Tests

### `requireJourneyAccess`/`isSameTenant` guard blocks cross-tenant resource reads at the handler level

- **Verifies:** AC1.
- **Components involved:** Route handlers across `products`, `credits`, `standards`, `user_roles` (per ADR-025's stated scope), `requireJourneyAccess` middleware.
- **Precondition:** Tenant A's authenticated session; a known tenant B resource ID.
- **Action:** Call each route handler directly (no browser) requesting the tenant B resource by ID.
- **Expected result:** Every route returns 404, never 403 (per the existing FORBIDDEN-vs-NOT_FOUND policy from `wuce-multi-tenancy`) — consistent across all four resource types, not just journeys.

### List-endpoint queries are tenant-scoped, not just individual-resource lookups

- **Verifies:** AC2.
- **Components involved:** List/aggregate route handlers (journey list, product list), underlying query layer.
- **Precondition:** Tenant A's authenticated session; tenant B has ≥1 row in each list-backed resource.
- **Action:** Call the list endpoints directly as tenant A.
- **Expected result:** Response arrays contain zero tenant B rows — the query itself is scoped by `tenant_id`, not filtered client-side after the fact.

### Write/mutation guard rejects cross-tenant writes and leaves tenant B data unchanged

- **Verifies:** AC3.
- **Components involved:** Write/mutation route handlers, `requireJourneyAccess` guard, journey store adapter.
- **Precondition:** Tenant A's authenticated session; a known tenant B resource ID and its current field values recorded before the attempt.
- **Action:** Call a mutation route directly as tenant A, targeting the tenant B resource.
- **Expected result:** Request is rejected (404, consistent with the read-path policy); a direct read of the tenant B resource afterward shows its fields unchanged from the pre-attempt values.

---

## E2E (Playwright — `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js`, tagged `@mocked` `@multi-tenant`)

- **AC1:** Given two synthetic tenants exist, When tenant A's authenticated session attempts to read any tenant B resource by ID (journey, product, standard) via the API, Then the response is a 404.
- **AC2:** Given tenant A's session requests aggregate list endpoints, When the response is inspected, Then it contains zero tenant B resources.
- **AC3:** Given tenant A attempts a write/mutation against a tenant B resource, When the request is made, Then it is rejected and a follow-up read confirms no tenant B data was modified.
- **AC4:** Not a per-run spec assertion — enforced via CI job configuration running this spec 20 consecutive times with a zero-skip/zero-flake pass gate (see Coverage gaps).
- **AC5:** Given the spec is tagged `@mocked` and `@multi-tenant`, When it runs on every PR, Then it uses S3.1's mock gateway and completes deterministically (zero real network calls, asserted via the same call-count spy pattern used in S3.1's and S3.2's specs).

---

## NFR Tests

### This spec blocks merges on failure, not treated as routine CI noise

- **NFR addressed:** Security
- **Measurement method:** CI configuration marks this spec's tag as a required, blocking status check on every PR — a failure here must be root-caused before any unrelated PR can merge, per benefit-metric.md Metric 5's zero-tolerance framing.
- **Pass threshold:** Spec configured as a required check; no PR merges past a red result for this spec without an explicit override decision.
- **Tool:** CI pipeline configuration (branch protection / required status checks).

### CI history reviewed on any anomaly

- **NFR addressed:** Audit
- **Measurement method:** CI history for this spec's pass/skip/flake rate is reviewed whenever an anomaly occurs (not on a fixed schedule), per benefit-metric.md Metric 5.
- **Pass threshold:** No formal automated threshold — this is a process/monitoring NFR, not a per-run assertion.
- **Tool:** CI dashboard / test-history review (manual, anomaly-triggered).

### Accessibility

Not applicable — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Cross-tenant isolation for the future `TENANT_ORG_ALLOWLIST`-based org-tenancy model — not built yet, out of scope per the story.
- Isolation/permission within a shared tenant — S3.3's responsibility.
- Filesystem-level or database-level penetration testing beyond the application-layer guard — matches ADR-025's stated scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's "zero skip/flake over 20 consecutive runs" cannot be asserted pre-implementation | It is an empirical, repeated-execution outcome, not a single testable statement | Dedicated CI job configured to run the spec 20 times with a zero-tolerance gate once implemented; tracked as an ongoing CI-history concern per Metric 5, revisited on any anomaly |
| This is the single most security-critical spec in the beta-readiness effort (per the story's own NFR framing) | A false sense of coverage here is higher-cost than in any other Epic 3 story | Any failure treated as high-priority and root-caused before merge, not deferred — enforced via the required-check NFR test above |
