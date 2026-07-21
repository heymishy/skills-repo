## Test Plan: NFR-security review and hardening pass for Admin User Impersonation

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d4-nfr-security-review-and-hardening.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

<!-- This story is itself a review/verification activity over D1–D3's real implementation.
     Its "tests" are structured checklists run against real code, not new automated tests
     with their own independent pass/fail — several of these ARE the automated tests from
     D1/D2/D3's own plans, re-run and cross-checked exhaustively rather than sampled. -->

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Every admin-gated surface checked for effective-role visibility | — | 1 | — | 1 | — | 🔴 |
| AC2 | No residual admin/target state survives swap or exit | — | 1 | — | — | — | 🔴 |
| AC3 | Concurrent-request state consistency during swap | — | 1 | — | — | — | 🔴 |
| AC4 | Audit log matches confirmed decision exactly | — | 1 | — | 1 | — | 🟡 |
| AC5 | Any gap found is fixed before sign-off | — | — | — | 1 | — | 🔴 |

## Coverage gaps

None as formal gaps — but every criterion in this plan is inherently high-risk by design, since this story's entire purpose is closing the highest-risk item in the whole feature.

## Test Data Strategy

**Source:** Real code review + the actual implemented D1/D2/D3 code (once it exists) + a repo-wide grep enumerating every `requireAdmin`-gated route as the exhaustive checklist for AC1.
**PCI/sensitivity in scope:** No
**Availability:** Depends entirely on D1–D3 being implemented first — this plan cannot run meaningfully before then.
**Owner:** Hamish King (Founder/Operator) — this is a human-led review, not an automatable test suite alone.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Complete list of every `requireAdmin`-gated route in the real codebase | `grep -rn "requireAdmin" src/web-ui/` | None | Must be exhaustive, not sampled |
| AC2, AC3 | Real session-swap implementation code | D1's shipped code | None | |
| AC4 | Real audit-log implementation | D3's shipped code | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — this plan's entire content depends on D1–D3 existing first, which is already named as this story's Dependency, not a hidden gap.

---

## Integration Tests

### Every requireAdmin-gated route is confirmed to check effective role during impersonation
- **Verifies:** AC1
- **Components involved:** every route currently gated by `requireAdmin` (enumerated via grep), the effective-role check from D2
- **Precondition:** A complete, named list of routes (produced as part of this test's own execution, not assumed in advance)
- **Action:** For each route, trace whether its role check reads the impersonated session's effective role or the real admin's underlying role
- **Expected result:** 100% read effective role; each route explicitly listed as checked in the resulting artefact, not asserted in aggregate

### No residual state survives a full impersonate-then-exit cycle
- **Verifies:** AC2
- **Components involved:** D1's session-swap code, D2's exit code
- **Precondition:** A real (not mocked) impersonation start followed by exit, inspecting actual session store contents at each step
- **Action:** Diff the session object before start, during impersonation, and after exit
- **Expected result:** Post-exit session is byte-for-byte identical to pre-start session (aside from legitimate timestamp fields) — no target-user key remains

### Concurrent requests during the swap window do not observe mixed state
- **Verifies:** AC3
- **Components involved:** D1's session-swap code
- **Precondition:** Two requests fired in immediate succession around the moment of a session swap
- **Action:** Inspect what each request's session context actually was
- **Expected result:** Neither request observes a session with the real admin's `tenantId` paired with the target's `role`, or any other inconsistent combination

### Audit log implementation matches the confirmed /clarify decision exactly
- **Verifies:** AC4
- **Components involved:** D3's audit-table schema and access-control code
- **Precondition:** The decisions.md entry confirming admin-visible-only, indefinite retention, no notification
- **Action:** Confirm the actual implementation grants read access to exactly "any admin" (not a narrower or broader set), retains rows indefinitely (no TTL/cleanup job), and sends no notification to the target
- **Expected result:** Matches exactly; any divergence is a finding requiring fix under AC5

---

## NFR Tests

None beyond what's already listed as ACs above — this story's entire content IS its own NFR verification; there is no separate NFR layer on top of a review story.

---

## Out of Scope for This Test Plan

- Adding new hardening beyond what discovery committed to (e.g. session time-limiting) — confirmed out of scope at the story level.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| This entire plan depends on D1–D3 being fully implemented first | Cannot review code that doesn't exist yet | Explicitly named as this story's Dependency; this plan is written now (TDD-style, as a checklist) so it's ready to execute the moment D1–D3 land |
