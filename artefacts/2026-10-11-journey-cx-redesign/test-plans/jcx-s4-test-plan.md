## Test Plan: Persona card on the Customer experience tab, pre-populated from the product's own discovery artefacts

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s4.md
**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Suggestions offered from scanned discovery.md files | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | No features/no persona found → blank form, no error | 1 test | — | — | — | — | 🟢 |
| AC3 | Selecting/typing a persona saves to the 3 new columns | — | 1 test | — | — | — | 🟢 |
| AC4 | Re-opening editor shows the saved persona, not stale suggestions | — | 1 test | — | — | — | 🟢 |
| AC5 | Multiple distinct personas shown separately, not merged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — the scan itself (reading local `artefacts/` files) and the DB writes are both reliably testable without a real browser.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; the discovery-artefact scan reads real temp fixture files written to a scratch `artefacts/` path during test setup, not production discovery.md files.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC5 | 1-2 synthetic discovery.md fixture files with distinct "Who It Affects" text, a journey with a matching `product_id` | Synthetic fixture files + mock pool | None | |
| AC2 | A product with zero associated features, or features with no persona text | Synthetic fixture files (absent or empty) | None | |
| AC3, AC4 | A journey with/without a saved persona | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit half): the discovery-artefact scan extracts "Who It Affects" text correctly

- **Verifies:** AC1
- **Precondition:** A temp fixture `discovery.md` file with a populated "Who It Affects" section
- **Action:** Run the scan function directly against the fixture file
- **Expected result:** The function returns the raw text of that section, unmodified — not attempting structured name/role/goal extraction (per `jcx-s4`'s own revised AC1 and Out of Scope)
- **Edge case:** No

### AC2: no features or no persona text falls back to a blank form, no error

- **Verifies:** AC2
- **Precondition:** A product with zero associated `feature_slug`s (empty scan result)
- **Action:** Call the suggestion-building function
- **Expected result:** Returns an empty suggestions array, no thrown error
- **Edge case:** Yes — the "nothing found" case

### AC5: multiple distinct personas are kept separate, not merged

- **Verifies:** AC5
- **Precondition:** Two fixture discovery.md files under the same product, each with different "Who It Affects" text
- **Action:** Run the scan
- **Expected result:** Two distinct suggestion entries returned, not one merged/concatenated string

---

## Integration Tests

### AC1 (integration half): suggestions scoped correctly by product_id

- **Verifies:** AC1
- **Precondition:** Real mock pool; a journey with `product_id = P1`; the legacy `journeys` table has 2 `feature_slug`s under `product_id = P1` (with discovery.md fixtures) and 1 under a different `product_id = P2`
- **Action:** Call the suggestion-building handler for the `product_id = P1` journey
- **Expected result:** Only the 2 `P1`-scoped suggestions are returned — the `P2` one is excluded, confirming the scan is correctly scoped by product, not repo-wide

### AC3: saving a persona writes to the 3 new columns

- **Verifies:** AC3
- **Precondition:** A journey with no persona set
- **Action:** Call the save handler with `persona_name`/`persona_role`/`persona_goal`
- **Expected result:** `UPDATE customer_journeys SET persona_name = $1, persona_role = $2, persona_goal = $3` is called with the provided values; the persona card subsequently renders them

### AC4: re-opening the editor shows the saved persona, not the original suggestions

- **Verifies:** AC4
- **Precondition:** A journey with a persona already saved
- **Action:** Open the persona editor again
- **Expected result:** The editor's own fields are pre-filled with the saved `persona_name`/`persona_role`/`persona_goal` — not re-showing the original discovery-sourced suggestion list as if nothing were saved

---

## NFR Tests

### Security — scan reads only artefacts/ files, no cross-tenant DB exposure

- **NFR addressed:** Security
- **Measurement method:** Confirm the scan function never queries a tenant-scoped table — it reads only local `artefacts/[feature_slug]/discovery.md` files, the same mechanism `handleGetJourneyCanvas` already uses for `pipeline-state.json`
- **Pass threshold:** Zero new DB query patterns introduced by the scan itself
- **Tool:** Code-level assertion (the scan function's own implementation contains no `pool.query` call)

---

## Gap table

No gaps.
