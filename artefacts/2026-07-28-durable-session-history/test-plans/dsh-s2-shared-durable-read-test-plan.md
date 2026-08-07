# Test Plan: A single, tenant-scoped read path for a completed stage's turns

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s2-shared-durable-read.md
**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Test plan author:** Copilot
**Date:** 2026-07-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Returns Postgres turns when memory is empty | 1 | — | — | — | — | 🟢 |
| AC2 | Returns in-memory turns (freshest) when both exist | 1 | — | — | — | — | 🟢 |
| AC3 | Returns null when no row exists, no throw | 1 | — | — | — | — | 🟢 |
| AC4 | Cross-tenant request returns null | 1 | — | — | — | — | 🟢 |
| AC5 | Non-existent journeyId returns null, no throw | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — a fake db double (as dsh-s1) plus fake in-memory session-store entries constructed directly in test setup.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1-AC5 | A journey fixture with a known `tenantId`/`ownerId`, a fake db, and optionally a fake in-memory session entry | Inline fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Returns Postgres turns when the stage's session is no longer in memory

- **Verifies:** AC1
- **Precondition:** A `session_turns` row exists for `(journeyId, skillName)`; no matching in-memory session
- **Action:** Call the read function as the journey's tenant owner
- **Expected result:** Returns the turns array exactly as stored in the fake db
- **Edge case:** No

### Prefers in-memory turns over Postgres when both exist

- **Verifies:** AC2
- **Precondition:** Both a `session_turns` row AND a live in-memory session exist for the same `(journeyId, skillName)`, with deliberately different turn content between the two
- **Action:** Call the read function
- **Expected result:** Returns the in-memory turns, not the Postgres copy
- **Edge case:** Yes — same-stage-different-sources race scenario

### Returns null (not a throw) when no row exists yet

- **Verifies:** AC3
- **Precondition:** No `session_turns` row and no in-memory session exist for the given `(journeyId, skillName)`
- **Action:** Call the read function
- **Expected result:** Returns `null`; no exception thrown
- **Edge case:** No

### Cross-tenant request returns null, never another tenant's turns

- **Verifies:** AC4
- **Precondition:** A `session_turns` row exists for tenant A's journey; the calling session belongs to tenant B (not the owner, not the same tenant)
- **Action:** Call the read function as tenant B's session
- **Expected result:** Returns `null` — the caller's later 404 mapping is verified separately in dsh-s3/dsh-s4's own tests, since this function's own contract is only "return null," not "produce an HTTP response"
- **Edge case:** Yes — security-relevant edge case

### Non-existent journeyId returns null without an unhandled exception

- **Verifies:** AC5
- **Precondition:** The given `journeyId` does not resolve to any journey at all
- **Action:** Call the read function
- **Expected result:** Returns `null`; no unhandled exception
- **Edge case:** Yes

---

## Integration Tests

None beyond the unit tests above — this story's only real "seam" (memory vs. Postgres tiering) is already exercised directly by AC1/AC2's unit tests using the same fake-db/fake-memory doubles dsh-s1 established; no additional integration-level test adds coverage beyond what AC1/AC2 already prove.

---

## NFR Tests

### A Postgres-tier read returns within budget

- **NFR addressed:** Performance
- **Measurement method:** Time a single Postgres-tier read (AC1's scenario) against the fake db
- **Pass threshold:** Under ~200ms (fake-db timing is a proxy; the real budget is confirmed against a real Postgres connection as part of dsh-s1's own AC5 integration test, which this function reuses)
- **Tool:** Node `process.hrtime`

### Tenant-isolation guard cannot be bypassed by omission

- **NFR addressed:** Security
- **Measurement method:** Confirm AC4's cross-tenant test covers both "different tenantId" and "no ownerId match" cases explicitly — not just one
- **Pass threshold:** Both sub-cases pass
- **Tool:** Node `assert`

---

## Out of Scope for This Test Plan

- Archive-tier fallback reads — dsh-s6 extends this function; covered by dsh-s6's own test plan.
- Any HTTP-layer 404 mapping — that's the caller's (dsh-s3/dsh-s4's) responsibility, tested there.
- Any Playwright/E2E coverage — this story has no distinct browser-rendering behaviour of its own.

---

## Test Gaps and Risks

None.
