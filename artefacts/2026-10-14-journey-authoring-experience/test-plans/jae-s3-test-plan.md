## Test Plan: Extend the discovery-artefact-scan suggestion pattern to stage-level fields

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s3.md
**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-guided-creation.md
**Review reference:** artefacts/2026-10-14-journey-authoring-experience/review/jae-review-2.md (PASS, run 2)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-14
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on E2E detection (Step 3a)

No AC describes drag-and-drop, pointer coordinates, or on-screen position — every AC is a DOM-presence/absence check or a data-query/tenant-scoping check. No AC is flagged CSS-layout-dependent; no E2E test is required.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Suggestion button appears for an empty field when a linked feature has a readable Problem Statement | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Clicking a suggestion fills the field; still requires blur to autosave | 1 test | — | — | — | — | 🟢 |
| AC3 | No suggestion when no `product_id` or no linked feature with a readable discovery.md | 1 test | — | — | — | — | 🟢 |
| AC4 | No suggestion offered for a field that already has a real value | 1 test | — | — | — | — | 🟢 |
| AC5 | Cross-tenant scenario returns the same tenant-scoped result as `getPersonaSuggestions` | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

No gaps.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; real `fs.readFileSync` against real temp `discovery.md` fixtures (mirroring `jcx-s4`'s own established pattern for `extractWhoItAffects`/`scanForPersonas`), mocked DB layer for the `journeys`-table feature-slug lookup.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2, AC4 | A real temp `discovery.md` fixture with a non-empty "Problem Statement" section | Real `fs` temp fixture (same convention as `jcx-s4`) | None | |
| AC3 | A journey with no `product_id`, and separately one with a `product_id` but no matching feature_slug/discovery.md | Mock pool + real `fs` (absent file) | None | |
| AC5 | Two tenants' mock pool data, mirroring `jcx-s4`'s own existing cross-tenant persona-suggestion test | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): `extractProblemStatement` extracts the raw text under "## Problem Statement"

- **Verifies:** AC1
- **Precondition:** A real discovery.md string with a populated "## Problem Statement" section followed by another "## " heading
- **Action:** Call `extractProblemStatement(content)` directly
- **Expected result:** Returns the exact raw text between the heading and the next `## `, trimmed — mirroring `extractWhoItAffects`'s own exact behaviour, confirmed by a direct comparison of the two functions' output shape against equivalent fixture input
- **Edge case:** Yes — a discovery.md with no "## Problem Statement" section at all returns `null`, not an error or empty string

### AC2 (unit): clicking a suggestion fills the field without saving it

- **Verifies:** AC2
- **Precondition:** Rendered stage panel with a suggestion button present for `customer_actions`, mocked `fetch`
- **Action:** Click the suggestion button
- **Expected result:** The `customer_actions` textarea's own `value` is set to the exact suggestion text; no PATCH request has been sent yet (confirmed via the `fetch` mock's own call count, still 0 for this field) — only blurring the field afterward triggers the save
- **Edge case:** No

### AC3 (unit): no suggestion button when no product_id or no linked readable discovery.md

- **Verifies:** AC3
- **Precondition:** Two scenarios in one test: (a) a journey with `product_id: null`, (b) a journey with a real `product_id` but a feature_slug whose discovery.md path does not exist
- **Action:** Call `getFieldSuggestions` for both scenarios
- **Expected result:** Both return `[]` — no thrown error, no suggestion buttons rendered in the panel for either case
- **Edge case:** Yes — this IS the edge case being verified (two distinct "no match" paths, both must degrade gracefully)

### AC4 (unit): no suggestion for a field that already has a real value

- **Verifies:** AC4
- **Precondition:** A stage with `customer_actions` already set to a real, non-empty string; a suggestion is otherwise available for that field
- **Action:** Render the panel
- **Expected result:** No suggestion button appears for `customer_actions` — confirmed the suppression is conditioned on the field's own current value, not just on suggestion availability
- **Edge case:** No

---

## Integration Tests

### AC1 (integration): `getFieldSuggestions` reaches the real discovery.md fixture through the full product→feature_slug→file-read path

- **Verifies:** AC1
- **Precondition:** Mock pool returning one `feature_slug` for the journey's own `product_id`; a REAL temp `artefacts/[slug]/discovery.md` file written to disk with a populated "## Problem Statement" section (mirroring `jcx-s4`'s own established fixture convention, not a mocked file read)
- **Action:** Call `getFieldSuggestions(pool, productId, repoRoot)`
- **Expected result:** Returns `[{featureSlug, problemText}]` with `problemText` matching the real file's own content exactly — confirms the full path works end to end, not just the extraction function in isolation

### AC5: cross-tenant scenario matches `getPersonaSuggestions`'s own established result shape

- **Verifies:** AC5
- **Precondition:** Mock pool with a `product_id` belonging to a different tenant than the requesting session — mirroring `jcx-s4`'s own existing cross-tenant persona-suggestion test fixture exactly
- **Action:** Call `getFieldSuggestions` and, in the same test, `getPersonaSuggestions`, with identical mock inputs
- **Expected result:** Both return the same result for the equivalent cross-tenant scenario (empty, or whatever `getPersonaSuggestions`'s own established behaviour already is) — a direct comparison, not an assumption that "it reuses the same shape so it must behave the same"

---

## NFR Tests

### Security — AC5 is the NFR test; no separate test needed

- **NFR addressed:** Security (multi-tenancy)
- **Measurement method:** AC5's own integration test
- **Pass threshold:** Matches `getPersonaSuggestions`'s own already-established cross-tenant behaviour exactly
- **Tool:** Mock pool, direct comparison

---

## Gap table

No gaps.
