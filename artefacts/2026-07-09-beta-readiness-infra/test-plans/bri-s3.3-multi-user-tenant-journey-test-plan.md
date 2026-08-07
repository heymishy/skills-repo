## Test Plan: Multi-user within one tenant journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## Declared gap notice (read first, updated 2026-07-16)

The original blocker (waiting on `2026-07-09-team-identity-roles`, "TIR" — Unified Per-User Identity and Role-Based Access Model for Multi-Tenant Teams — to deliver its role model/schema) is resolved: TIR is `/definition-of-done` complete (all 9 stories, tir-s1 through tir-s9, merged). A subsequent DoR re-run (2026-07-13) found a second, independent blocker — the login-time role-resolution wiring could not distinguish between two people sharing one `tenantId` — which is now also resolved by `tir-s9` (merged), confirmed by direct code reading of `src/web-ui/server.js` and `src/web-ui/routes/auth.js` on 2026-07-16 (see `dor/bri-s3.3-multi-user-tenant-journey-dor.md`'s second re-run for full analysis).

**Scope note carried into AC1-AC3 (read before implementing):** the only production mechanism through which two distinct people can share one `tenantId` today is GitHub-org-allowlist mode (`TENANT_ORG_ALLOWLIST`, both people authenticating via GitHub OAuth as members of the same allowlisted org). This spec's AC1-AC3 test blocks MUST use that mechanism — two real GitHub OAuth logins against the same allowlisted org, each with their own `team_memberships` row and a distinct role. A person added to a shared tenant via a *different* provider (Google or email/password) remains a known, separate, deferred gap (see tir-s9's decisions.md Out of Scope entry) and is explicitly NOT part of this spec's AC1-AC3 coverage.

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
| AC1 | Admin succeeds / engineer denied on role-gated feature | — | — | 1 | — | — | 🟡 (via GitHub-org-allowlist mode, see scope note) |
| AC2 | Concurrent access by two people in same tenant does not corrupt state | — | — | 1 | — | — | 🟡 (via GitHub-org-allowlist mode, see scope note) |
| AC3 | Viewer-role write attempt is denied | — | — | 1 | — | — | 🟡 (via GitHub-org-allowlist mode, see scope note) |
| AC4 | Spec tagged `@mocked`/`@multi-tenant`, uses S3.1 gateway, zero real LLM calls | — | — | 1 | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Resolved (was: role model did not exist) | AC1 | — | N/A — TIR (`2026-07-09-team-identity-roles`) shipped the role model, DoD-complete | No longer a gap. AC1 exercises GitHub-org-allowlist mode per the scope note above. |
| Resolved (was: person↔team schema did not exist) | AC2 | — | N/A — TIR shipped the schema, DoD-complete | No longer a gap. |
| Resolved (was: viewer role did not exist) | AC3 | — | N/A — TIR shipped the 4-role model including viewer, DoD-complete | No longer a gap. |
| Google/email-added teammate cannot reach a shared tenant | Out of scope for this story | External-dependency | tir-s9 explicitly deferred this as a distinct bug shape (silent role loss, not role collision) — tracked as a candidate follow-up story in TIR's own `decisions.md`, not this story's concern | Not tested here — AC1-AC3 use GitHub-org-allowlist mode only, per the scope note. |

---

## Test Data Strategy

**Source:** Two real GitHub OAuth accounts, both members of the same `TENANT_ORG_ALLOWLIST`-matched org, each seeded with its own `team_memberships` row (person_id, tenant_id, role) via TIR's schema — plus S3.1's mock LLM gateway fixtures
**PCI/sensitivity in scope:** No
**Availability:** Available now — TIR is DoD-complete and the login wiring fix (tir-s9) is merged
**Owner:** bri-s3.3 coding agent

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Two person records in one GitHub-org tenant with `admin` and `engineer` roles | TIR schema, seeded via test fixtures | None | Available |
| AC2 | Two person records with concurrent sessions against the same tenant resource | TIR schema, seeded via test fixtures | None | Available |
| AC3 | A person record with `viewer` role in the same tenant | TIR schema, seeded via test fixtures | None | Available |
| AC4 | S3.1 mock gateway fixtures | S3.1 fixtures | None | Exercised inside the same spec file as AC1–3 |

### PCI / sensitivity constraints

None.

### Gaps

None remaining for AC1-AC4. The Google/email-added-teammate gap (see Coverage gaps table) is out of scope for this story, not a gap in this test plan.

---

## Unit Tests

None — this story's logic is entirely exercised through real login sessions and role-gated routes; there is no unit-level logic independent of the E2E path.

---

## Integration Tests

None required beyond the E2E specs below. TIR's own test suite (`tests/check-tir-s9-per-person-identitykey-login-fix.js`) already covers the non-browser-level role-resolution logic this story's E2E specs exercise end-to-end.

---

## E2E (Playwright — `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, tagged `@mocked` `@multi-tenant`)

- **AC1:** Given two people in the same GitHub-org-allowlisted tenant with `admin` and `engineer` roles (real OAuth logins, per the scope note), When each accesses a role-gated feature (e.g. the admin/credits panel), Then the admin succeeds and the engineer is denied.
- **AC2:** Given two people in the same tenant access the same shared resource concurrently, When their sessions overlap, Then neither session's actions corrupt or overwrite the other's unrelated action.
- **AC3:** Given a viewer-role team member (same tenant, same mechanism), When they attempt any write action, Then it is denied.
- **AC4:** Given the spec is tagged `@mocked` and `@multi-tenant`, When it runs in CI, Then it uses S3.1's mock gateway and completes without real LLM calls.

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
- A Google/email-authenticated person added as a teammate to a GitHub-org-shared tenant — a distinct, deferred TIR gap (see Coverage gaps table), not this story's concern.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1-AC3 exercise only the GitHub-org-allowlist shared-tenant path | It is the only production mechanism today through which two distinct people share one `tenantId` | Documented explicitly in the scope note above; the Google/email-added-teammate path is a known, separately-tracked TIR gap, not silently ignored |
| Complexity was rated 3 (raised from 2 at /review) and Scope stability Unstable, per the original story | Written before TIR's final schema was confirmed | Both re-verified against TIR's actual shipped code on 2026-07-16 (post tir-s9) — schema and wiring are now stable and confirmed correct for this story's scope |
