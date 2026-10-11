## Test Plan: Authorization and tenant-scoping verification across the placeholder-trigger and mapping-conversion surface

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s5.md
**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Cross-tenant placeholder-creation → 404, zero writes | — | 1 test | — | — | — | 🟢 |
| AC2 | Cross-tenant trigger → 404, no folder/state created | — | 1 test | — | — | — | 🟢 |
| AC3 | Viewer-role session → 403, real server dispatch | — | 1 test | — | — | — | 🟢 |
| AC4 | Cross-tenant mapping-conversion → 404, no partial conversion | — | 1 test | — | — | — | 🟢 |
| AC5 | Full suite doesn't regress | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC5 is verified by the full suite run itself at merge (`npm test`), not a dedicated new test — noted in `/review`'s own LOW finding 1-L1 as a DoD-level check, kept as-is per the operator's own `/review` resolution (only the 3 MEDIUM findings were revised, not this LOW one).

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; AC3 reuses the real `server.js` router dispatch + seeded multi-user-role session pattern already established by `check-vrne-s4-edge-case-gate.js` and `ic-s2`'s own position-route regression test.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2, AC4 | A cross-tenant stage id | Synthetic mock pool | None | |
| AC3 | A real seeded viewer-role session, via `/test/seed-multi-user-roles` | Real `server.js` router, real session seeding | None | Reuses `check-ic-s2-position-persistence.js`'s own established real-dispatch harness verbatim |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story is purely integration-level verification of already-built routes (`jcx-s1`/`jcx-s2`); there is no new unit-level logic of its own to test in isolation.

---

## Integration Tests

### AC1: cross-tenant placeholder-feature creation is denied, zero writes

- **Verifies:** AC1
- **Precondition:** A stage belonging to tenant A; request made with a tenant B session
- **Action:** Call the placeholder-creation handler
- **Expected result:** 404 (not 403); zero `INSERT` calls recorded against the mock pool

### AC2: cross-tenant trigger is denied, no folder or state created

- **Verifies:** AC2
- **Precondition:** Same cross-tenant setup as AC1
- **Action:** Call the trigger handler
- **Expected result:** 404; no `artefacts/[feature-slug]/` folder created on disk; no new entry in `pipeline-state.json`

### AC3: viewer-role session is denied with a real server dispatch

- **Verifies:** AC3
- **Precondition:** A real seeded viewer-role session via `/test/seed-multi-user-roles` (reusing `check-vrne-s4-edge-case-gate.js`'s own harness, with a distinct hex-only session id per the established gotcha from this session's own `workspace/learnings.md`)
- **Action:** Dispatch a real request through `server.js`'s own router to the placeholder-creation and trigger routes
- **Expected result:** 403 for both — confirms `requireNonViewer` is actually wired in `server.js`'s own route chain, not just assumed from the handler alone (the exact class of gap `ic-s2`'s own DoD found and fixed)

### AC4: cross-tenant mapping-conversion is denied, no partial conversion

- **Verifies:** AC4
- **Precondition:** A placeholder mapping belonging to tenant A; conversion check triggered with a tenant B session context
- **Action:** Call the conversion-check handler
- **Expected result:** 404; `mapping_state` remains unchanged (still `placeholder`)

---

## NFR Tests

None — Security is this story's entire purpose, already covered by AC1–AC4 above; no separate NFR test needed beyond the ACs themselves.

---

## Gap table

No gaps.
