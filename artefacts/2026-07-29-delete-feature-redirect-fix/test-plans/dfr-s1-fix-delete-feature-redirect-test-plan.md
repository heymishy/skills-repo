## Test Plan: Fix "Delete feature" to redirect back to the owning product, not the generic journeys list

**Story reference:** artefacts/2026-07-29-delete-feature-redirect-fix/stories/dfr-s1-fix-delete-feature-redirect.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Delete success handler redirects to /products/:productId | 1 | — | — | — | — | 🟢 |
| AC2 | listJourneys() rehydrates productId from Postgres | 1 | 1 (real Postgres) | — | — | — | 🟢 |
| AC3 | Falls back to /journey when productId is genuinely absent | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC is a rendering/data-mapping check, testable via unit tests against fake fixtures. AC2's integration-level confirmation reuses the same real-Postgres round-trip pattern already established by `journey-store-pg.js`'s own existing tests, gated on `DATABASE_URL` being available (skips with a clear reason otherwise).

---

## Test Data Strategy

**Source:** Synthetic — a journey fixture with a known `productId`, matching this repo's existing `routes/features.js` test conventions (`check-frsr-s1-feature-row-session-resume.js`, `check-p0.2-journey-guard-wiring.js`).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey fixture with `productId` set, rendered via `handleGetFeatureArtefacts` | Inline fixture | None | |
| AC2 (unit) | A raw Postgres row shape (`{product_id: 'p1', ...}`) fed through `listJourneys()`'s mapping logic | Inline fixture | None | |
| AC2 (integration) | A real journey row written with a real `product_id`, read back via `listJourneys()` against real Postgres | Real staging/local Postgres, `DATABASE_URL` gated | None | Skips with a clear reason if `DATABASE_URL` is unset |
| AC3 | A journey fixture with `productId` absent/null | Inline fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### U1 — Delete success handler redirects to /products/:productId (AC1)

- **Verifies:** AC1
- **Precondition:** A feature's artefact-index page for a journey with `productId: 'product-abc'`
- **Action:** Render `/features/:slug`, inspect the delete button's client-side success handler script
- **Expected result:** The handler's redirect target is `/products/product-abc`, not `/journey`
- **Edge case:** No

### U2 — listJourneys() maps product_id back onto the returned object (AC2)

- **Verifies:** AC2
- **Precondition:** A raw Postgres row with `product_id: 'product-xyz'`
- **Action:** Call `listJourneys()`'s row-mapping logic directly (or the full function against a fake db double)
- **Expected result:** The returned journey object has `productId: 'product-xyz'`
- **Edge case:** No

### U3 — Falls back to /journey when productId is genuinely absent (AC3)

- **Verifies:** AC3
- **Precondition:** A feature's artefact-index page for a journey with no `productId` field at all
- **Action:** Render `/features/:slug`, inspect the delete button's client-side success handler script
- **Expected result:** The handler's redirect target is `/journey`, exactly as it is today — never `/products/undefined` or a broken link
- **Edge case:** Yes

---

## Integration Tests

### I1 — Real Postgres round-trip: product_id survives a save/list cycle (AC2)

- **Verifies:** AC2
- **Components involved:** `journey-store-pg.js`'s `saveJourney` and `listJourneys`
- **Precondition:** `DATABASE_URL` set (skip with a clear reason otherwise)
- **Action:** Save a real journey row with a real `product_id`, then call `listJourneys()` against the same real database
- **Expected result:** The returned row's `productId` matches what was saved — proving the fix survives an actual Postgres round-trip, not just the in-memory mapping logic

---

## NFR Tests

None — no new NFRs beyond what's already covered by the story's own NFR section (none identified beyond existing conventions).

---

## Out of Scope for This Test Plan

- Any Playwright/E2E coverage — this is a server-rendered redirect target and a data-mapping fix, fully covered by unit + integration tests; no distinct browser-rendering behaviour to confirm.
- Backfilling existing in-memory journeys from prior server sessions — explicitly out of scope per the story itself.

---

## Test Gaps and Risks

None.
