## Test Plan: Start an impersonation session (search, reason-gated, session swap)

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d1-start-impersonation-session.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Search returns filtered users | 1 | — | — | — | — | 🟢 |
| AC2 | Reason mandatory to start | 1 | 1 | — | — | — | 🟢 |
| AC3 | Session swap + atomic audit write | — | 1 | — | — | — | 🔴 |
| AC4 | Failed audit write blocks session start | — | 1 | — | — | — | 🔴 |
| AC5 | No nested impersonation | — | 1 | — | — | — | 🟡 |
| AC6 | D37 wiring: two sessions produce two distinct audit rows | — | 1 | — | — | — | 🟢 |

## Coverage gaps

None as ACs — but AC3/AC4 are flagged 🔴 High risk because the actual session-swap mechanism is not yet designed (per the story's own Architecture Constraints). These tests are written against the *specification* of atomicity now; they must be revisited once the real mechanism is implemented, since the concrete implementation may reveal additional edge cases the current AC wording doesn't yet anticipate.

## Test Data Strategy

**Source:** Mixed — synthetic user/tenant fixtures for search; a mocked session store and mocked audit-table `pool.query` for the swap/audit tests.
**PCI/sensitivity in scope:** No — no payment data involved. Data classification per the NFR profile: Confidential (real admin/user identity pairs).
**Availability:** Available now for AC1/AC2; AC3/AC4/AC5 depend on the session-swap mechanism existing, which is this story's own first implementation task — tests can be *written* now (TDD, failing) but cannot be *run* meaningfully until that mechanism exists.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture user/tenant list | Synthetic | None | |
| AC2–AC5 | Mocked session object, mocked audit-table pool | Synthetic | Login/tenant identity pairs (test fixtures only, not real people) | |

### PCI / sensitivity constraints

None (PCI). Confidential data classification applies per NFR profile — test fixtures use clearly fake names, never real user data, even in a test environment.

### Gaps

None as a formal gap, but see the AC3/AC4 risk note above.

---

## Unit Tests

### Search filters users by login or tenant substring match
- **Verifies:** AC1
- **Precondition:** Fixture list of 5 users across 3 tenants
- **Action:** Search for a substring matching 2 of them
- **Expected result:** Returns exactly those 2

### Start-session request without a reason is rejected before any state change
- **Verifies:** AC2
- **Precondition:** A valid target user, empty reason string
- **Action:** Call the start-session function
- **Expected result:** Throws/returns a validation error; no session mutation attempted

---

## Integration Tests

### Session swap and audit write happen as a single atomic operation
- **Verifies:** AC3
- **Components involved:** session-swap function, mocked audit-table `pool.query`
- **Precondition:** Valid admin session, valid target, valid reason
- **Action:** Start impersonation
- **Expected result:** Exactly one audit row is inserted AND the effective session reflects the target — both effects visible after one call, not two separable steps

### A failing audit write prevents the session swap entirely
- **Verifies:** AC4
- **Components involved:** Same as above, with the mocked `pool.query` rejecting the audit INSERT
- **Precondition:** Same as above but audit-write mock throws
- **Action:** Attempt to start impersonation
- **Expected result:** The effective session is NOT changed — it still reflects the real admin, not the target; no partial state

### A second impersonation attempt while already impersonating is rejected
- **Verifies:** AC5
- **Components involved:** session-swap function
- **Precondition:** An admin session already impersonating user X
- **Action:** Attempt to start a second impersonation of user Y
- **Expected result:** Rejected; the session still reflects user X, not Y — no nested/overwritten impersonation context

### setImpersonationAuditAdapter wiring produces two genuinely distinct, retrievable audit rows
- **Verifies:** AC6 (D37 wiring test — behavioural correctness, not just that a function reference was assigned)
- **Components involved:** `setImpersonationAuditAdapter`, a real (not mocked) Postgres-backed implementation wired in `server.js`
- **Precondition:** Two separate impersonation sessions started (session 1: admin→user X; session 2: admin→user Y)
- **Action:** Query the audit table for both sessions independently
- **Expected result:** Two distinct rows returned, each with the correct target identity — session 1's row names X, session 2's row names Y, proving the wiring is real and functioning, not merely present

---

## NFR Tests

### Session start completes within budget
- **NFR addressed:** Performance
- **Measurement method:** Time the full start-session call under normal conditions
- **Pass threshold:** Under 1 second
- **Tool:** Manual timing script

### Canonical session field is used throughout
- **NFR addressed:** Security
- **Measurement method:** Repo-wide grep for `req.session.token` (the banned legacy field) in any file touched by this story
- **Pass threshold:** Zero matches — `req.session.accessToken` only
- **Tool:** `grep -rn "req\.session\.token[^A]" src/web-ui/` (this repo's own established DoR check, per CLAUDE.md)

---

## Out of Scope for This Test Plan

- The persistent banner and permission-scoped visibility — D2's test plan.
- Audit log *viewing* — D3's test plan.
- The full NFR-security review — D4 is itself the dedicated review pass; this plan's own tests are necessary but not sufficient for that sign-off.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3/AC4's concrete session-swap mechanics are unverified against real code | The mechanism doesn't exist yet — this story's own first task is to design it | Tests are written now (TDD, currently failing) against the AC-level specification; they must be re-examined once the real mechanism lands, and D4's dedicated review re-checks this area specifically |
