## Test Plan: Free node positioning persisted across reloads

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Drag a node, position saved, persists across reload | — | — | 1 test | — | — | 🟡 |
| AC2 | `NULL` position falls back to `ic-s1`'s auto-layout | 1 test | — | — | — | — | 🟢 |
| AC3 | Cross-tenant stage id → 404, no mutation | — | 1 test | — | — | — | 🟢 |
| AC4 | Migration is idempotent, no backfill needed | — | 1 test | — | — | — | 🟢 |
| AC5 | Dragging one stage doesn't affect another's position | 1 test | — | — | — | — | 🟢 |
| AC6 | Save failure shows a visible error toast | 1 test | — | — | — | — | 🟢 |

AC1 is 🟡 (not 🔴) — it's a real, written E2E test, not a gap; it inherits this feature's pre-existing `fake-test-db.js` local-execution limitation (see Coverage gaps), the same way `ep1-s4-stage-reorder.spec.js` already does. It runs in any environment with a real `DATABASE_URL`.

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----|---------------------------|---------|
| Real drag gesture + CSS layout cannot be simulated in jsdom | AC1 | CSS-layout-dependent | `getBoundingClientRect` returns 0 in jsdom; drag-drop target resolution depends on real rendered position | E2E test — `tests/e2e/ic-s2-canvas-drag-position.spec.js` (Playwright). Locally SKIPS without `DATABASE_URL` set — this is the same pre-existing gap already affecting `ep1-s4-stage-reorder.spec.js` and `ep1-s3-stage-panel-focus-management.spec.js` for this exact feature area (`fake-test-db.js` has no `customer_journeys`/`customer_journey_stages` backing), not a new gap this story introduces. |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup. Unit/integration tests use self-contained mock pools; the E2E spec seeds a real journey/stages via the same `seedJourneyWithStages` helper `ep1-s4-stage-reorder.spec.js` already established.
**PCI/sensitivity in scope:** No
**Availability:** Available now (E2E spec requires `DATABASE_URL` to actually execute — see Coverage gaps; this is a pre-existing environment dependency, not a new one)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A real journey + stage, seeded in a real (or Playwright-test) Postgres instance | `seedJourneyWithStages` helper (reused from `ep1-s4`) | None | |
| AC2 | A stage with `position_x`/`position_y` both `NULL` | Synthetic mock pool | None | |
| AC3 | A stage belonging to a different tenant than the session | Synthetic mock pool | None | Mirrors `ep5-s2`'s own adversarial test convention exactly |
| AC4 | The migration script run twice against a test DB | Real migration script, DB-gated like `ep5-s1` | None | |
| AC5 | Two stages on the same journey | Synthetic mock pool | None | |
| AC6 | A mocked failing `fetch` for the position-save request | Synthetic (mocked network failure) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the E2E local-execution gap already noted above.

---

## Unit Tests

### falls back to auto-layout when position is NULL

- **Verifies:** AC2
- **Precondition:** Mock pool returns a stage with `position_x: null, position_y: null`
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** The node's rendered initial coordinates match `ic-s1`'s own deterministic left-to-right auto-layout formula exactly — not `(0, 0)`, not an error
- **Edge case:** Yes — this is the NULL-position edge case by definition

### dragging one stage's position does not affect another's

- **Verifies:** AC5
- **Precondition:** Two stages on the same journey, both with distinct existing positions
- **Action:** Call the position-update handler for stage A with new coordinates
- **Expected result:** Stage A's position updates in the mock pool's state; stage B's position (set or `NULL`) is byte-for-byte unchanged
- **Edge case:** No

### save failure shows a visible error toast

- **Verifies:** AC6
- **Precondition:** The position-save `fetch` call is mocked to reject (simulated network failure)
- **Action:** Trigger the client-side save handler
- **Expected result:** A toast/error element appears in the DOM with text matching this app's own established failure-toast convention (`ep1-s4`'s "Stage order not saved — please try again" pattern, adapted for position-save) — not a silent failure
- **Edge case:** Yes — this is the failure-path test, the "normal" case is covered by the E2E spec (AC1)

---

## Integration Tests

### cross-tenant stage id returns 404 and makes no mutation

- **Verifies:** AC3
- **Components involved:** The new position-update route in `journeys.js`
- **Precondition:** A stage id belonging to tenant B, request authenticated as tenant A
- **Action:** Call the handler directly with the cross-tenant stage id and new coordinates
- **Expected result:** Response status 404 (not 403); zero `UPDATE` calls recorded against the mock pool — both asserted together, matching `ep5-s2`'s own "404 alone doesn't prove no side effect" discipline
- **Edge case:** No

### migration is idempotent

- **Verifies:** AC4
- **Components involved:** `scripts/migrate-schema-journeys.js` (the real migration file, extended with the new columns)
- **Precondition:** A test database that already has `customer_journey_stages` without the new columns
- **Action:** Run the migration script twice in succession
- **Expected result:** Both runs complete without error; the second run makes no further schema change (idempotent `ADD COLUMN IF NOT EXISTS`); every pre-existing row's `position_x`/`position_y` is `NULL` with no backfill attempted
- **Edge case:** No — matches `ep5-s1`'s own established `DATABASE_URL`-gated migration test pattern (SKIPs cleanly, not FAILs, when unset)

---

## NFR Tests

### Performance — no automated threshold test

- **NFR addressed:** Performance
- **Measurement method:** Manual observation — fire-and-forget save with no blocking spinner on the happy path
- **Pass threshold:** N/A
- **Tool:** Manual (see verification script)

### Security — covered by AC3's own test

- **NFR addressed:** Security
- **Measurement method:** AC3's integration test directly confirms the ownership-check-before-mutation / 404-not-403 pattern
- **Pass threshold:** N/A
- **Tool:** Integration test above

### Accessibility — N/A for this story

See `ic-s4-test-plan.md` for the keyboard-equivalent interaction's own tests.

### Audit — None, confirmed with story owner

Position is a presentation-layer detail, not an auditable business event.

---

## Out of Scope for This Test Plan

- Canvas pan/zoom — `ic-s3-test-plan.md`
- Keyboard-accessible movement — `ic-s4-test-plan.md` (reuses this story's own persistence route, tested separately there)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's real drag gesture cannot run locally without `DATABASE_URL` | Pre-existing `fake-test-db.js` limitation, inherited from `ep1-s3`/`ep1-s4`, not new to this story | E2E spec is written and real — runs in any environment with a real Postgres instance (CI, staging). Pre-merge verification falls back to the manual scenario in the verification script, matching this feature's own established precedent. |
