## Test Plan: Automated cross-tenant repo isolation E2E spec

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.3.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-4-product-crud-and-isolation.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All 4 write paths, 2 tenants, no cross-repo leakage | — | — | 1 test | — | — | 🔴 |
| AC2 | Adversarial request (manipulated product ID) rejected | — | — | 1 test | — | — | 🔴 |
| AC3 | Spec runs in CI, zero-tolerance gate | — | — | (CI config) | — | — | 🔴 |

---

## Coverage gaps

None — this story's ACs are inherently E2E by design (it IS the E2E spec), matching `bri-s3.4`'s precedent. No CSS-layout-dependent content triggers the Step 3a gate (no drag-drop, no coordinate/position assertions) — this is a data-isolation proof, not a visual one, so it correctly belongs in Playwright for real browser/session behaviour, not because of layout dependence.

---

## Test Data Strategy

**Source:** Mixed — two real (test) tenants each with a real product and a real connected repo, following `bri-s3.4`'s existing E2E fixture pattern (`newTenantSession`-style helpers). Uses `prc-s3.1`/`bri-s3.1`'s mock LLM gateway where a skill-turn is needed, per this repo's `@mocked` tag convention, so the spec makes zero real LLM calls.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — reuses existing E2E fixture infrastructure (`tests/e2e/`, ADR-018).
**Owner:** Self-contained (test fixtures create and tear down their own tenants/products/repos).

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two tenants, two products, two connected test repos | E2E fixture (created/torn down per run) | None | Real GitHub repos needed — likely disposable repos under a test GitHub org/account, provisioned as part of E2E setup |
| AC2 | A crafted request with a manipulated product ID belonging to a different tenant | E2E fixture | None | |
| AC3 | CI workflow configuration | N/A | None | |

### PCI / sensitivity constraints

None.

### Gaps

⚠️ **TEST DATA GAP:** This spec needs real, disposable GitHub repos for its two test tenants — not yet provisioned. This is the same category of manual external-account dependency already tracked under the operator's infra-provisioning work (Fly/Neon/Upstash/PostHog) from earlier in this session's work — add a GitHub test-org/repos line item there, or resolve separately before `/definition-of-ready` for this specific story.

---

## Unit Tests

None — by design, this story is exclusively E2E.

---

## Integration Tests

None — by design, this story is exclusively E2E; the integration-level coverage for each individual write path already exists in `prc-s1.3`, `prc-s2.3`, `prc-s2.4`, and `prc-s3.1`'s own test plans. This spec proves they compose correctly across 2 real tenants, which integration-level mocking cannot prove.

---

## E2E Tests (Playwright, tests/e2e/)

### Two tenants' sign-off, annotation, artefact-write, and standards-edit actions never cross repos

- **Verifies:** AC1
- **Test file:** `tests/e2e/prc-s4.3-cross-tenant-repo-isolation-journey.spec.js`
- **Precondition:** Tenant A (product A → repo A) and Tenant B (product B → repo B), both real, both freshly provisioned for this test run
- **Action:** As Tenant A: sign off, annotate, run a skill-turn artefact write, and edit a standard, all within Product A. Repeat as Tenant B within Product B.
- **Expected result:** Repo A's commit history contains only Tenant A's 4 actions. Repo B's commit history contains only Tenant B's 4 actions. Zero cross-contamination in either direction — asserted by checking each repo's commit list directly via the GitHub API after the run.
- **Tag:** `@mocked @multi-tenant` (per `bri-s3.1`'s mock-gateway convention for any skill-turn step, matching `bri-s3.4`'s own tagging pattern)

### Manipulated product ID targeting another tenant's repo is rejected before any write

- **Verifies:** AC2
- **Test file:** Same spec file, second test case
- **Precondition:** Tenant A authenticated; a request crafted with Tenant B's product ID in place of Tenant A's own
- **Action:** Submit a sign-off (or any write-path) request as Tenant A, with Tenant B's product ID substituted in
- **Expected result:** Request rejected (403/404) before any Contents API call is made; Repo B's commit history is confirmed unchanged after the attempt — this is the adversarial case, not just a UI-level "you can't select another tenant's product" check

---

## NFR Tests

### CI gate is zero-tolerance

- **NFR addressed:** Security
- **Measurement method:** Confirm the CI workflow configuration adds this spec to the required-checks list, matching `bri-s3.4`'s existing "Cross-tenant isolation spec — 20x repeat, zero-tolerance" CI job pattern
- **Pass threshold:** Spec is a required, blocking CI check — not advisory
- **Tool:** CI workflow YAML inspection (not a runtime test)

---

## Out of Scope for This Test Plan

- Load/performance testing of concurrent cross-tenant writes — this spec proves correctness, not throughput, per the story's own Out of Scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real disposable GitHub repos for 2 test tenants not yet provisioned | Same category as the operator's already-tracked infra-provisioning work | Resolve as part of that work, or as a standalone dependency before `/definition-of-ready` for this story specifically |
