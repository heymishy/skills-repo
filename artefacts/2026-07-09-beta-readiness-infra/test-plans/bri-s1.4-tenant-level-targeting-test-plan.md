## Test Plan: Wire tenant-level flag targeting via PostHog group analytics

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.4-tenant-level-targeting.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Two users in the same tenant receive identical `isEnabled()` results | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Flag targeted at a specific tenant: that tenant's user gets `true`, other tenants get `false` | — | 1 test | — | — | — | 🟢 |
| AC3 | First-time group registration does not error; app does not crash if registration is delayed/fails (falls back to safe default) | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Solo-tenant customer uses the same per-tenant mechanism without special-casing | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are covered against a mocked PostHog adapter — no live PostHog Group Analytics call is required to verify this story's logic.

---

## Test Data Strategy

**Source:** Mocked (PostHog adapter's `groupIdentify`/`evaluateFlag` mocked; no real PostHog Group Analytics call)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two fake user sessions, both `tenantId: 'acme'` | Synthetic | None | |
| AC2 | Mock adapter returning `true` only when `context.tenantId === 'tenant-x'` | Synthetic | None | |
| AC3 | Mock `groupIdentify` that rejects on first call (simulating "group type not yet defined") | Synthetic | None | |
| AC4 | A single fake tenant with exactly one user (`tenantId: 'solo-tenant-1'`) | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### isEnabled returns identical results for two different sessions sharing the same tenantId

- **Verifies:** AC1
- **Precondition:** Mock adapter's `evaluateFlag` is deterministic per `context.tenantId` (returns the same value for the same tenant, regardless of other context fields like `userId`).
- **Action:** Call `isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-1' })` and `isEnabled('wizard-ui', { tenantId: 'acme', userId: 'user-2' })`.
- **Expected result:** Both calls resolve to the identical boolean value.
- **Edge case:** No.

### Group registration failure on first call does not throw and falls back to the safe default

- **Verifies:** AC3
- **Precondition:** Mock adapter's `groupIdentify` (or equivalent group-registration call) rejects on its first invocation, simulating "the `tenant` group type is not yet defined."
- **Action:** Call the tenant-group-identification path (e.g. `identifyTenantGroup('acme')` invoked ahead of `isEnabled()`, per S1.4's wiring into S1.3's bootstrap) followed by `isEnabled('wizard-ui', { tenantId: 'acme' })`.
- **Expected result:** Neither call throws an unhandled error; `isEnabled()` still resolves, falling back to `false` (S1.1 AC4's safe default) if the group state could not be confirmed.
- **Edge case:** Yes — this is the exact "does not crash if group registration is delayed or fails" case in AC3.

### tenantId used for group targeting is read only from req.session.tenantId, never from request body/query

- **Verifies:** Security NFR
- **Precondition:** A fake `req` object where `req.session.tenantId = 'acme'` but `req.body.tenantId = 'attacker-tenant'` and `req.query.tenantId = 'attacker-tenant'`.
- **Action:** Call the code path that derives the tenant context for `isEnabled()`/group identification from `req`.
- **Expected result:** The resolved tenant context used is `'acme'` (from session) — the request-body/query value is never used, consistent with the existing ADR-025 tenant-isolation guard.
- **Edge case:** Yes — this is a security-relevant injection attempt, not a happy-path case.

### Solo-tenant context flows through the identical isEnabled() call signature as a multi-user tenant

- **Verifies:** AC4
- **Precondition:** A fake session representing a solo-tenant customer (`tenantId: 'solo-tenant-1'`, exactly one user).
- **Action:** Call `isEnabled('wizard-ui', { tenantId: 'solo-tenant-1' })` using the same call path as the multi-user tests above — no separate solo-tenant branch or parameter.
- **Expected result:** The call succeeds and resolves using the same code path (asserted by, e.g., confirming no solo-tenant-specific parameter or conditional exists — this can be asserted by re-using the exact same helper function reference and context shape used in the AC1 tests, with only the `tenantId` value differing).
- **Edge case:** Yes — proves no special-casing was introduced for the "one person = one tenant" case.

---

## Integration Tests

### A tenant-targeted flag returns true only for the targeted tenant, false for all others

- **Verifies:** AC2
- **Components involved:** `isEnabled()` (S1.1), the group-identification wiring (this story), mocked PostHog adapter.
- **Precondition:** Mock adapter's `evaluateFlag` configured to return `true` only when the group key passed matches `'tenant-x'`, `false` for any other tenant.
- **Action:** Call `isEnabled('some-flag', { tenantId: 'tenant-x' })` and `isEnabled('some-flag', { tenantId: 'tenant-y' })`.
- **Expected result:** The first call resolves `true`, the second resolves `false` — proving the group key drives the evaluation result, not a per-user identity.

### First-time group registration during session bootstrap does not block or crash the request

- **Verifies:** AC3
- **Components involved:** Session-bootstrap flow (S1.3), tenant-group-identification call, mocked adapter.
- **Precondition:** Mock adapter's group-identification call is delayed (simulating first-time group-type registration latency) on the first call for a given tenant.
- **Action:** Run the full session-bootstrap path for a new tenant's first session.
- **Expected result:** Session start completes (does not hang), and the resulting flag state is the safe default if group identification had not completed in time.

---

## NFR Tests

### Group identification adds no more than 100ms to session bootstrap

- **NFR addressed:** Performance
- **Measurement method:** Mock the group-identification call with a fixed simulated latency (e.g. 30ms); measure wall-clock time for the group-identification step in isolation using `Date.now()`/`process.hrtime()`.
- **Pass threshold:** Group-identification step completes within 100ms of the simulated adapter latency, and the combined session-bootstrap total (per S1.3's NFR) remains within the overall 200ms budget.
- **Tool:** Hand-rolled Node.js timing assertion in `tests/check-bri-s1.4-tenant-level-targeting.js`.

### tenantId for group targeting is always sourced from session, never client-supplied data

- **NFR addressed:** Security
- **Measurement method:** Same as the "tenantId used for group targeting" unit test above — a fake request with conflicting session vs. body/query `tenantId` values, asserting only the session value is used.
- **Pass threshold:** Zero cases where a client-supplied `tenantId` (body or query) is used in place of `req.session.tenantId`.
- **Tool:** Hand-rolled Node.js assertion.

### Accessibility

- **NFR addressed:** Accessibility — **Not applicable**, per story text. No test written.

### Audit

- **NFR addressed:** Audit — **None identified beyond S1.1**, per story text. No test written.

---

## Out of Scope for This Test Plan

- Per-team-member overrides within a tenant — explicitly out of scope in the story; no test exercises any per-user override mechanism because none is being built.
- Retroactive re-targeting of flags previously evaluated at the user level — explicitly out of scope; no migration test is included.
- Real PostHog Group Analytics billing/limits behaviour (the 5-group-type limit, actual usage-based cost) — not testable pre-implementation without a live PostHog project; this is an operational/billing concern tracked in `decisions.md`, not a functional AC.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real PostHog Group Analytics registration behaviour and billing limits under live conditions | Requires a live PostHog project with Group Analytics enabled; not available pre-implementation | Manual smoke check once the real PostHog client is wired (S1.1's D37 wiring task) and Group Analytics is enabled per `decisions.md`'s validated ASSUMPTION entry |
