## Test Plan: Seed a new journey with a default starting-skeleton template

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s1.md
**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-guided-creation.md
**Review reference:** artefacts/2026-10-14-journey-authoring-experience/review/jae-review-2.md (PASS, run 2)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-14
**Test runner:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s own `"test"` script — this repo's standard, no framework-specific runner)

---

## Note on E2E detection (Step 3a)

No AC in this story describes drag-and-drop, pointer/click coordinates, `getBoundingClientRect`/layout-derived values, or on-screen position — every AC is a DB-state or DOM-presence check (checkbox renders, correct rows inserted, tenant isolation). No AC is flagged CSS-layout-dependent; no E2E test is required for this story.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | "+ New journey" modal renders the checkbox, checked by default | 1 test | — | — | — | — | 🟢 |
| AC2 | Checked submission seeds exactly 5 stages, name/position only | — | 1 test | — | — | — | 🟢 |
| AC3 | Unchecked submission seeds zero stages | — | 1 test | — | — | — | 🟢 |
| AC4 | Seeded stages always carry the journey's own tenant_id (cross-tenant check) | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

No gaps.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; mock pool matching `handlePostJourneys`'s own existing INSERT shape.
**PCI/sensitivity in scope:** No
**Availability:** Available now — self-contained, no external data needed.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Rendered "+ New journey" modal markup | Static markup read, no DB needed | None | |
| AC2, AC3 | A mock pool capturing every INSERT call's own parameters | Synthetic mock pool | None | |
| AC4 | Two tenants' worth of mock session/journey data | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1: "+ New journey" modal includes the default-checked skeleton checkbox

- **Verifies:** AC1
- **Precondition:** Render the journey-list page's own "+ New journey" modal markup
- **Action:** Inspect the rendered HTML
- **Expected result:** A checkbox labeled "Start with a default stage outline" is present, with the `checked` attribute set
- **Edge case:** No

---

## Integration Tests

### AC2: `seedDefaultStages !== false` seeds exactly 5 stages, name/position only

- **Verifies:** AC2
- **Precondition:** Real `handlePostJourneys`, mock pool capturing every INSERT call
- **Action:** Call `handlePostJourneys` with `seedDefaultStages: true` (and separately, with the field omitted entirely, to confirm the default-true behavior)
- **Expected result:** Exactly 6 INSERT calls total (1 journey + 5 stages); the 5 stage INSERTs carry names `Evaluate`, `Discover`, `Purchase`, `Onboard`, `Retain` in that order with `position` 0-4; every other stage column (`description`, `customer_actions`, etc.) is omitted/null in the INSERT
- **Edge case:** Yes — `seedDefaultStages` field entirely absent from the request body must default to seeding (true), not silently skip it

### AC3: `seedDefaultStages: false` seeds zero stages

- **Verifies:** AC3
- **Precondition:** Same as AC2
- **Action:** Call `handlePostJourneys` with `seedDefaultStages: false`
- **Expected result:** Exactly 1 INSERT call (the journey itself) — zero stage INSERTs

### AC4: Seeded stages always carry the journey's own tenant_id

- **Verifies:** AC4
- **Precondition:** Mock pool capturing every stage INSERT's own tenant_id parameter; a session with a known `tenantId`
- **Action:** Call `handlePostJourneys` with `seedDefaultStages: true` under tenant `t1`
- **Expected result:** All 5 seeded stage INSERT calls carry `tenant_id = 't1'` — matching the journey's own tenant_id exactly, confirmed by direct parameter inspection, not assumed

---

## NFR Tests

### Performance — template-seeding latency

- **NFR addressed:** Performance
- **Measurement method:** Manual observation during `/verify-completion`
- **Pass threshold:** No perceptible delay vs. creating a journey with the checkbox unchecked
- **Tool:** Manual, live Chrome

---

## Gap table

No gaps.
