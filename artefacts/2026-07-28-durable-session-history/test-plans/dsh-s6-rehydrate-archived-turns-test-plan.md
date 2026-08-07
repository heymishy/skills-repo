# Test Plan: Transparently rehydrate an archived stage's turns on read

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s6-rehydrate-archived-turns.md
**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Test plan author:** Copilot
**Date:** 2026-07-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Falls back to archive table when hot table has nothing | 1 | — | — | — | — | 🟢 |
| AC2 | Hot-table hit never queries archive (no wasted query) | 1 | — | — | — | — | 🟢 |
| AC3 | Neither table has data → null, unchanged | 1 | — | — | — | — | 🟢 |
| AC4 | Rendered page identical for archived vs. hot stage | — | — | 1 | — | — | 🟢 |
| AC5 | Cross-tenant archive read returns null | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fake db doubles matching dsh-s1/dsh-s2/dsh-s5's own conventions, with rows placed in a fake "archive" table specifically. The E2E scenario uses the same local-only `NODE_ENV=test`-gated seed endpoint introduced in dsh-s3 (`/test/seed-durable-stage`), extended with an `archived: true` flag to seed the fixture data via the archive-tier path instead of the hot-tier path.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1 | A fake db with the row present only in the "archive" table | Inline fixture | None | |
| AC2 | A fake db with the row present in the "hot" table; a spy/counter on archive-table queries | Inline fixture | None | |
| AC3 | A fake db with the row in neither table | Inline fixture | None | |
| AC4 (E2E) | `/test/seed-durable-stage?archived=true` | New endpoint flag (extends dsh-s3's) | None | Local ephemeral webServer only |
| AC5 | A fake db with the row in "archive," requested by a different tenant's session | Inline fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Falls back to the archive table when the hot table has nothing

- **Verifies:** AC1
- **Precondition:** No row for `(journeyId, skillName)` in the hot table; a matching row exists in the archive table
- **Action:** Call the (now-extended) read function
- **Expected result:** Returns the archived turns in the same shape as a hot-table read — no special-casing required by the caller
- **Edge case:** No

### A hot-table hit never triggers an archive-table query

- **Verifies:** AC2
- **Precondition:** A row exists in the hot table for the requested stage
- **Action:** Call the read function; track whether the archive-table query fixture was invoked
- **Expected result:** Returns the hot-table row; the archive-table query is never issued
- **Edge case:** Yes — the "don't waste a query on the common case" check

### Neither table has data → still returns null, unchanged from dsh-s2

- **Verifies:** AC3
- **Precondition:** No row in either table
- **Action:** Call the read function
- **Expected result:** Returns `null`; behaviour identical to dsh-s2's own AC3 (no regression from adding the archive fallback)
- **Edge case:** No

### Cross-tenant archive read returns null, same guard as hot-table reads

- **Verifies:** AC5
- **Precondition:** An archived row exists for tenant A; the calling session belongs to tenant B
- **Action:** Call the read function as tenant B
- **Expected result:** Returns `null` — archiving does not weaken the tenant guard
- **Edge case:** Yes — security-relevant edge case, mirrors dsh-s2's AC4

---

## Integration Tests

None beyond the unit tests above — the archive-fallback seam is fully exercised by AC1/AC2's unit tests using the same fake-db doubles already established.

---

## E2E Tests (Playwright, local ephemeral webServer)

### AC4: an archived stage renders identically to a hot-table stage — archiving is invisible

- **Verifies:** AC4
- **Spec file:** `tests/e2e/dsh-s6-archived-stage-transparent-render.spec.js`
- **Fixture:** `withAuth`, same as dsh-s3
- **Setup:** `POST /test/seed-durable-stage` with an `archived: true` flag — seeds the fixture data via the archive-tier path specifically, so the rendered page can only succeed if the fallback-read + transparent-rendering behaviour actually works end-to-end
- **Action:** `page.goto()` the seeded stage's `/journey/:id/stage/:name` URL (dsh-s3's route — this story requires zero changes to that route)
- **Expected result:** The rendered page is visually and structurally identical to dsh-s3's own AC1 E2E scenario — same chat-left/artefact-right layout, same content rendering — with no indication anywhere in the page that the data came from archive storage
- **Why E2E, not just unit:** AC4 is specifically a claim about the *rendered experience* being indistinguishable, which is best confirmed by actually rendering the page, not just asserting the read function's return value

---

## NFR Tests

### An archive-tier read completes within budget

- **NFR addressed:** Performance
- **Measurement method:** Time the archive-tier fallback read (AC1's scenario) against the fake db
- **Pass threshold:** Under ~500ms (per the story's own NFR — archive reads are allowed to be slower than hot reads)
- **Tool:** Node `process.hrtime`

---

## Out of Scope for This Test Plan

- Re-testing dsh-s3's own rendering logic beyond confirming parity — this test plan assumes dsh-s3's rendering is already correct (per its own test plan) and only confirms the archive-tier data source produces the same result.
- Any "promotion" of archived rows back to hot storage — explicitly out of scope per the story itself.

---

## Test Gaps and Risks

None.
