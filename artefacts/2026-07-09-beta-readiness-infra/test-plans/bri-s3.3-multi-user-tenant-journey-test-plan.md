## Test Plan: Multi-user within one tenant journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## Declared gap notice (read first)

This story has a confirmed, currently-unresolved cross-feature dependency on `2026-07-09-team-identity-roles` (per this feature's `decisions.md`, RISK-ACCEPT/PROCEED-BLOCKED entry, 2026-07-09). That feature has not yet delivered the per-person role model (admin/engineer/product/viewer) or the many-to-many person↔team schema this spec needs to exercise real role behaviour. This test plan is written now, describing the E2E assertions that will exist, but the underlying Playwright spec **cannot be implemented and run to a passing state** until `2026-07-09-team-identity-roles` reaches at least definition-of-ready. This is a legitimate declared gap (type: External-dependency), not a defect in this test plan.

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
| AC1 | Admin succeeds / engineer denied on role-gated feature | — | — | 1 (blocked) | — | External-dependency | 🔴 |
| AC2 | Concurrent access by two people in same tenant does not corrupt state | — | — | 1 (blocked) | — | External-dependency | 🔴 |
| AC3 | Viewer-role write attempt is denied | — | — | 1 (blocked) | — | External-dependency | 🔴 |
| AC4 | Spec tagged `@mocked`/`@multi-tenant`, uses S3.1 gateway, zero real LLM calls | — | — | 1 | — | — | 🟡 (file cannot fully pass until AC1–3 clear, see note) |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Per-person role model (admin/engineer/product/viewer) does not yet exist | AC1 | External-dependency | Role differentiation cannot be exercised against a schema that has not been built by `2026-07-09-team-identity-roles` | Spec written and committed now (test blocks describe intended assertions); marked skipped/pending until the upstream feature reaches definition-of-ready, per the formal RISK-ACCEPT/PROCEED-BLOCKED gate in this feature's `decisions.md` (2026-07-09) |
| Many-to-many person↔team schema does not yet exist | AC2 | External-dependency | "Two people in the same tenant" as distinct identities depends on the person↔team schema `2026-07-09-team-identity-roles` is building | Same handling as above — tracked against the same RISK-ACCEPT gate |
| Viewer role does not yet exist | AC3 | External-dependency | Same root cause — no role model to assert a read-only boundary against | Same handling as above |

---

## Test Data Strategy

**Source:** Seeded staging database (bri-s2.4's synthetic tenants) + S3.1's mock LLM gateway fixtures — **plus** a role/person schema not yet delivered by `2026-07-09-team-identity-roles`
**PCI/sensitivity in scope:** No
**Availability:** Dependency — see gap note below
**Owner:** TBD — depends on `2026-07-09-team-identity-roles` reaching definition-of-ready

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Two person records in one tenant with `admin` and `engineer` roles | `2026-07-09-team-identity-roles` schema (not yet available) | None | Blocked — see gap note |
| AC2 | Two person records with concurrent sessions against the same tenant resource | `2026-07-09-team-identity-roles` schema (not yet available) | None | Blocked — see gap note |
| AC3 | A person record with `viewer` role | `2026-07-09-team-identity-roles` schema (not yet available) | None | Blocked — see gap note |
| AC4 | S3.1 mock gateway fixtures | S3.1 fixtures | None | Not blocked on its own, but exercised inside the same spec file as AC1–3 |

### PCI / sensitivity constraints

None.

### Gaps

Role/person schema not yet available — owner is `2026-07-09-team-identity-roles`, resolution action is that feature reaching definition-of-ready (tracked in this feature's `decisions.md`).

---

## Unit Tests

None — cannot be written until `2026-07-09-team-identity-roles` delivers its role model/schema (see Coverage gaps). There is no non-browser-level logic in this story that exists independently of that schema.

---

## Integration Tests

None — for the same reason as Unit Tests above. Once the role schema exists, this test plan should be revisited to add a direct (non-browser) role-check integration test analogous to S3.4's `isSameTenant` guard tests, before the E2E spec is finalised.

---

## E2E (Playwright — `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, tagged `@mocked` `@multi-tenant`)

- **AC1 (blocked):** Given two people in the same tenant with `admin` and `engineer` roles, When each accesses a role-gated feature (e.g. the admin/credits panel), Then the admin succeeds and the engineer is denied. *Written now; cannot execute to a passing state until the role model exists.*
- **AC2 (blocked):** Given two people in the same tenant access the same shared resource concurrently, When their sessions overlap, Then neither session's actions corrupt or overwrite the other's unrelated action. *Written now; cannot execute to a passing state until the person↔team schema exists.*
- **AC3 (blocked):** Given a viewer-role team member, When they attempt any write action, Then it is denied. *Written now; cannot execute to a passing state until the viewer role exists.*
- **AC4:** Given the spec is tagged `@mocked` and `@multi-tenant`, When it runs in CI, Then it uses S3.1's mock gateway and completes without real LLM calls. *Not blocked in isolation, but this test block lives in the same spec file as AC1–3 and the file as a whole cannot reach a fully-passing CI run until those clear.*

---

## NFR Tests

### Role-boundary regression guard

- **NFR addressed:** Security
- **Measurement method:** Once implemented, this spec is the primary regression guard against a role-boundary regression (e.g. a future change accidentally granting engineer access to admin-only routes) — any failure here is treated as high-priority, not routine flake, per the story's NFR statement.
- **Pass threshold:** N/A until the spec can execute — tracked as a future gate, not a current pass/fail measurement.
- **Tool:** Playwright (pending upstream dependency).

### `@mocked` suite runtime contribution

- **NFR addressed:** Performance
- **Measurement method:** Contributes to the shared under-10-minute `@mocked` suite budget (Metric 6) once runnable.
- **Pass threshold:** N/A per-spec.
- **Tool:** CI suite timer (existing).

### Accessibility

Not applicable beyond the app's existing bar — confirmed with story owner.

### Audit

None beyond standard CI logging — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Cross-tenant isolation (a different person in a different tenant) — S3.4's responsibility.
- Real-time collaborative editing conflict resolution — AC2 is about safety (no corruption), not live collaboration.
- Resolving the `2026-07-09-team-identity-roles` dependency itself — that is tracked in that feature's own pipeline, not this test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Entire AC1–AC3 coverage blocked on `2026-07-09-team-identity-roles`'s role model and person↔team schema | External-dependency — that feature has not yet reached definition-of-ready | Formal RISK-ACCEPT/PROCEED-BLOCKED gate recorded in this feature's `decisions.md` (2026-07-09). Spec is written and committed now so the dependency is visible early rather than silently missing from Epic 3's story count. Revisit trigger: when `2026-07-09-team-identity-roles` reaches definition-of-ready, re-verify these ACs against that feature's final role list/schema before this story proceeds past implementation |
| Complexity rated 3 (raised from 2 at /review) and Scope stability rated Unstable, per the story itself | The role schema `2026-07-09-team-identity-roles` delivers could still change before that feature reaches DoR | This test plan will need a second pass once the schema is confirmed — do not treat this version as final |
