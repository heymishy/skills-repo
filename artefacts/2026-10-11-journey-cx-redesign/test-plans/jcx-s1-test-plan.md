## Test Plan: Add a placeholder feature to a journey stage, triggering a new seeded discovery

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Placeholder mapping row written with explicit state | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Trigger creates artefacts/ folder + seeds discovery.md Section 1 | — | 1 test | — | — | — | 🟢 |
| AC3 | Cross-tenant stage id → 404, zero mutation | — | 1 test | — | — | — | 🟢 |
| AC4 | Real + placeholder mappings coexist on one stage | 1 test | — | — | — | — | 🟢 |
| AC5 | Placeholder renders with `sw-mapping--placeholder` class + "Placeholder" label | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — every AC is unit/integration-testable. AC5's own class/label check is a DOM-attribute assertion, not CSS-layout-dependent (no position, no drag, no `getBoundingClientRect`), so it does not require a real browser.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC4, AC5 | A journey stage, real `feature_customer_journey_stage_mappings` schema (post-migration) | Synthetic mock pool / real disposable Postgres | None | |
| AC2 | A journey stage with name/description/emotion/pain_points/opportunities/touchpoints set | Synthetic mock pool | None | |
| AC3 | A cross-tenant stage id (belongs to a different tenant) | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC4: a placeholder and a real mapping coexist on the same stage

- **Verifies:** AC4
- **Precondition:** A stage with one real (non-placeholder) mapping already present
- **Action:** Add a placeholder mapping to the same stage
- **Expected result:** Both rows exist in the mock pool's own recorded state — the real mapping's own row is untouched, the new placeholder row is added alongside it, not replacing it
- **Edge case:** No

### AC5: a placeholder node renders with the distinct placeholder class and label

- **Verifies:** AC5
- **Precondition:** A stage with one placeholder mapping (`mapping_state = 'placeholder'`)
- **Action:** Render the Customer experience tab's own mapping list for that stage
- **Expected result:** The rendered HTML for that mapping contains `class="sw-mapping--placeholder"` and the literal text "Placeholder" — and does NOT share any class with the existing feature-not-found warning row (`sw-feature-mapping-warning`)
- **Edge case:** No

### AC1 (unit half): placeholder mapping creation produces the correct mock-pool call shape

- **Verifies:** AC1
- **Precondition:** A stage with no existing mappings
- **Action:** Call the placeholder-creation handler with a placeholder name (not a real `feature_slug`)
- **Expected result:** An `INSERT INTO feature_customer_journey_stage_mappings` call is made with `mapping_state = 'placeholder'` and `feature_slug` set to the provided name (per `jcx-s1`'s own Architecture Constraints documenting this dual-use)
- **Edge case:** No

---

## Integration Tests

### AC1 (integration half): placeholder mapping persists with the correct state against a real database

- **Verifies:** AC1
- **Precondition:** Real, disposable Postgres instance, migrated schema including the new `mapping_state` column
- **Action:** Call the real placeholder-creation handler against a real pool
- **Expected result:** A real row exists in `feature_customer_journey_stage_mappings` with `mapping_state = 'placeholder'`

### AC2: trigger creates a real artefacts/ folder and seeds discovery.md Section 1

- **Verifies:** AC2
- **Precondition:** A stage with a placeholder mapping, real context (name, description, emotion, pain_points, opportunities, touchpoints) populated
- **Action:** Call the real trigger handler
- **Expected result:** A new directory exists at `artefacts/[feature-slug]/` on disk, containing a `discovery.md` whose Problem Statement section (Section 1) contains the stage's own name, emotion, pain points, opportunities, and touchpoints text — and no other discovery.md section (e.g. "Who It Affects") is pre-populated, matching the `/clarify`-confirmed Option A scope

### AC3: cross-tenant stage id returns 404 and makes zero mutation

- **Verifies:** AC3
- **Precondition:** A stage belonging to tenant A; request made with a tenant B session
- **Action:** Call the placeholder-creation and trigger handlers against the cross-tenant stage id
- **Expected result:** Both return 404 (not 403); zero `INSERT` calls recorded against the mock pool; zero `artefacts/` folders created

---

## NFR Tests

### Security — path traversal guard on the trigger's feature-folder creation

- **NFR addressed:** Security
- **Measurement method:** Call the trigger handler with a crafted placeholder name containing `../` path-traversal sequences
- **Pass threshold:** The handler rejects the request with 400, and no file is written outside `artefacts/` — matches the `ougl` path-traversal guard convention (`path.resolve` + `startsWith(repoRoot)`)
- **Tool:** Unit test, real `fs` calls against a temp directory

### Accessibility — placeholder/trigger affordances meet WCAG 2.1 AA

- **NFR addressed:** Accessibility
- **Measurement method:** Manual live-browser check during `/verify-completion` (matching `ic-s4`'s own established convention — keyboard operability and focus state are not reliably jsdom-testable)
- **Pass threshold:** Both affordances are keyboard-operable with a visible focus state
- **Tool:** Manual, live Chrome

---

## Gap table

No gaps — every AC has at least one unit or integration test. The two NFRs are either unit-testable (path traversal) or require the same manual live-browser convention already established for this feature's own accessibility NFRs elsewhere (`ic-s4` precedent).
