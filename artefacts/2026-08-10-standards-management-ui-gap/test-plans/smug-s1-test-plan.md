## Test Plan: Standards management has a fully-built backend but no way to reach it by clicking anything

**Story reference:** artefacts/2026-08-10-standards-management-ui-gap/stories/smug-s1-standards-tab-and-query-fix.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Standards tab present in product nav | 1 test | — | — | — | — | 🟢 |
| AC2 | Tab lists own + org-promoted standards with visibility | 1 test | — | — | — | — | 🟢 |
| AC3 | Opted-out standards excluded from the list | 1 test | — | — | — | — | 🟢 |
| AC4 | Promote-to-org button calls the real endpoint, updates in place | 1 test | — | — | — | — | 🟢 |
| AC5 | Opt-out button calls the real endpoint, removes from list | 1 test | — | — | — | — | 🟢 |
| AC6 | `standardsList` query matches `setStandardsAdapter`'s promoted/opted-out semantics | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Hand-authored fixtures matching `standards`/`standard_product_optouts` table shapes already used by `tests/check-b3-cleanup-script.js` and existing `standards.js` tests.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A product with `id` | Hand-authored | None | |
| AC2 | One own standard, one org-promoted standard from a different product | Hand-authored | None | |
| AC3 | An opt-out row for the promoted standard | Hand-authored | None | |
| AC4 | A standard owned by the product, not yet promoted | Hand-authored | None | |
| AC5 | An org-promoted standard | Hand-authored | None | |
| AC6 | Same seed as AC2/AC3, run through `standardsList` directly (no HTTP) | Hand-authored | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### standardsList_includesOrgPromoted_excludesOptedOut

- **Verifies:** AC6
- **Precondition:** Two products in the same org; product A owns a standard, product B's tenant promotes it to org visibility; the product under test has opted out of a different promoted standard.
- **Action:** Call `standardsList(productId, orgId)` directly.
- **Expected result:** Result includes the promoted-but-not-opted-out standard; excludes the opted-out one. Matches `setStandardsAdapter`'s equivalent query result for the same fixture, byte-for-byte on the returned slug set.
- **Edge case:** Yes — the exact defect being fixed.

## Integration/Route Tests

### handleGetProductStandardsTab_rendersTabAndList (AC1, AC2, AC3)

- **Verifies:** AC1, AC2, AC3
- **Precondition:** Product page route wired with a Standards tab; `standardsList` returns the fixture above.
- **Action:** GET the product view / Standards tab route.
- **Expected result:** Response HTML contains a Standards nav link; the own standard and the promoted standard both appear with distinct visibility labels; the opted-out standard does not appear.

### handlePutStandardPromote_updatesVisibilityInPlace (AC4)

- **Verifies:** AC4
- **Precondition:** A standard owned by the product, not yet promoted; a mock `PUT /standards/:id/promote` handler.
- **Action:** Simulate the "Promote to org" click (POST/PUT to the real route).
- **Expected result:** The route is called with the right standard id; response reflects `visibility: 'org'`.

### handlePostStandardOptout_removesFromList (AC5)

- **Verifies:** AC5
- **Precondition:** An org-promoted standard visible in the list.
- **Action:** Simulate the "Opt out" click.
- **Expected result:** `POST /standards/:id/optout` called with the right id; the standard is absent from a subsequent list render.

---

## NFR Tests

### consistencyWithPromptInjectionPath

- **NFR addressed:** Consistency (primary)
- **Measurement method:** `standardsList_includesOrgPromoted_excludesOptedOut` above, asserting byte-identical slug-set output against `setStandardsAdapter`'s query for the same fixture.
- **Pass threshold:** Identical result sets for every fixture scenario.
- **Tool:** Same unit test harness.

---

## Out of Scope for This Test Plan

- Standards creation UI — not in this story's scope.
- Live confirmation against real staging — building/testing this UI is the story's scope; a post-merge smoke check on `skills-framework`'s real product page is a natural follow-up, not a blocking test.

---

## Test Gaps and Risks

None identified as blocking.
