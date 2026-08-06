## Test Plan: Require a connected repo before a new product can start its first journey

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
**Epic reference:** artefacts/2026-08-06-durable-artefact-storage/epics/das-e1-durable-artefact-storage.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Zero-journey, no-repo product → journey-start rejected with a clear message | 1 test | — | — | — | — | 🟢 |
| AC2 | After connecting a repo, retry succeeds with no further restriction | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Product with ≥1 existing journey, no repo → NOT blocked (regression guard) | 1 test | — | — | — | — | 🟢 |
| AC4 | Brand-new product WITH a repo already connected → no gate friction | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are server-side logic/text assertions; the blocking-message UI is plain semantic HTML reusing `mtrr-s2`'s already-accessible picker — no new CSS-layout-dependent surface, confirmed against this repo's layout-dependence trigger list (drag-drop, pointer coordinates, `getBoundingClientRect`, visual rendering) at DoR.

---

## Test Data Strategy

**Source:** Mocked Postgres pool (products/journeys tables)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture product, 0 journeys, `repo_owner`/`repo_name` both null | Synthetic | None | |
| AC2 | Same fixture, then updated with `repo_owner`/`repo_name` set (simulating a successful picker connection) | Synthetic | None | |
| AC3 | Fixture product with ≥1 existing journey row, `repo_owner`/`repo_name` both null | Synthetic | None | |
| AC4 | Fixture product, 0 journeys, `repo_owner`/`repo_name` already set | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### zeroJourneyNoRepoProduct_journeyStartRejected

- **Verifies:** AC1
- **Precondition:** Fixture product with 0 journeys and no connected repo
- **Action:** Attempt to start a journey for this product
- **Expected result:** The request is rejected with a message directing the operator to connect a repo via the picker before proceeding — not a silent failure or generic error
- **Edge case:** No

### afterConnectingRepo_retrySucceeds

- **Verifies:** AC2
- **Precondition:** Same fixture as above, initially blocked
- **Action:** Update the product's `repo_owner`/`repo_name` (simulating a successful picker connection), then retry starting a journey
- **Expected result:** The journey-start request now succeeds with no further restriction
- **Edge case:** No

### existingJourneyNoRepo_notBlocked

- **Verifies:** AC3 (regression guard — the exact boundary condition review caught and fixed)
- **Precondition:** Fixture product with 1 existing journey already recorded, no connected repo
- **Action:** Attempt to start a second journey for this product
- **Expected result:** The request is NOT blocked — proves the gate check is journey-count-based (journeys ≥ 1 → never blocked), not a creation-date comparison
- **Edge case:** Yes — this is the specific ambiguity fixed during review (1-M1)

### brandNewProductWithRepoAlreadyConnected_noGateFriction

- **Verifies:** AC4
- **Precondition:** Fixture product with 0 journeys but `repo_owner`/`repo_name` already set
- **Action:** Attempt to start the first journey
- **Expected result:** The request proceeds normally with no gate friction at all — the gate fires only for the actual gap case (no repo), never for an already-satisfied one
- **Edge case:** No

---

## Integration Tests

### pickerConnectThenJourneyStart_endToEnd

- **Verifies:** AC2
- **Components involved:** The gate check (journey-start handler), `mtrr-s2`'s repo-connection picker's existing write path (`PUT /products/:id`), journey-creation endpoint
- **Precondition:** Fixture product blocked at the gate
- **Action:** Submit a repo selection via the picker's existing endpoint, then call the real journey-start endpoint
- **Expected result:** The journey creates successfully, end-to-end through the real gate-check code path, not just via a direct function call

---

## NFR Tests

### gateCheckLatency_underFiftyMs

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing around the gate check (single existing-column read)
- **Pass threshold:** Added latency under ~50ms
- **Tool:** `Date.now()` timing wrapper + mocked pool call-count assertion (exactly 1 query)

### blockingMessage_semanticStructure

- **NFR addressed:** Accessibility
- **Measurement method:** Assert the rejection response's HTML has a proper heading and a descriptive link to the repo-connection picker (not a bare "error" with no actionable path) — reusing `mtrr-s2`'s already-accessible picker component for the actual connection step
- **Pass threshold:** Semantic heading + descriptive link present; no reliance on color alone
- **Tool:** HTML string assertion

---

## Out of Scope for This Test Plan

- Testing `mtrr-s2`'s picker UI itself (search/filter, fallback behavior) — already tested, this story only reuses it as the resolution path.
- Retroactive migration/blocking of existing repo-less products — explicitly out of scope per the story.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required.
