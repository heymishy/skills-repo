## Test Plan: inf.5 — Extend chain-hash trace to emit on infra-plan sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.5.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-inf5-trace-extension.js`
**Test runner:** `node tests/check-inf5-trace-extension.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Infra-plan sign-off emits trace record with artefact path and SHA-256 hash | 3 tests | — | — | — | — | 🟢 |
| AC2 | `/trace` includes infra-plan artefact entry alongside code story DoR artefact | 2 tests | — | — | — | — | 🟢 |
| AC3 | No infra trace entries appear when `hasInfraTrack` is false/absent; existing events unchanged | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests inspect source modules (`src/journey.js`, `src/enforcement/gate-map.js`) for infra-plan trace hook; tests also exercise trace logic with stub artefact files
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Stub infra-plan artefact file on disk; sign-off event trigger | Synthetic + temp file | None | SHA-256 computed from disk content |
| AC2 | Feature with both code DoR and infra-plan events | Synthetic | None | |
| AC3 | Feature with `hasInfraTrack: false` or absent | Synthetic | None | |

---

## Unit Tests

### trace-module-registers-infra-plan-event
- **Verifies:** AC1
- **Action:** Read `src/journey.js` (or equivalent trace module); assert it contains a handler or hook for an infra-plan sign-off event — look for `infra-plan`, `infraPlan`, or `infra_plan` identifiers
- **Expected result:** Infra-plan event registration found in trace module
- **Edge case:** No

### trace-emits-artefact-path-on-infra-plan-sign-off
- **Verifies:** AC1
- **Action:** Assert the trace record written on infra-plan sign-off includes the `infraPlanPath` value (or equivalent artefact path field)
- **Expected result:** Artefact path present in emitted trace record
- **Edge case:** No

### trace-emits-sha256-hash-from-disk-content
- **Verifies:** AC1, Audit NFR
- **Action:** Assert the trace module computes the SHA-256 hash by reading the artefact file from disk (using `fs.readFileSync` or equivalent) — not from an in-memory string; inspect the source for hash computation pattern
- **Expected result:** Hash computed from disk read, not in-memory content
- **Edge case:** No

### trace-output-includes-infra-plan-entry-alongside-dor
- **Verifies:** AC2
- **Action:** Run trace logic (or read trace output format) for a synthetic feature with both code DoR and infra-plan events; assert both entries appear in the trace output
- **Expected result:** Both infra-plan trace entry and DoR trace entry present; neither absent
- **Edge case:** No

### trace-infra-plan-entry-has-correct-event-type
- **Verifies:** AC2
- **Action:** Assert the infra-plan trace entry has a distinct event type (e.g. `infra-plan-sign-off` or equivalent) that is different from the code DoR entry event type
- **Expected result:** Distinct event type in infra-plan entry
- **Edge case:** No

### trace-no-infra-entries-when-hasInfraTrack-false
- **Verifies:** AC3
- **Action:** Run trace logic for a feature with `hasInfraTrack: false`; assert no infra-plan trace entry appears in the output
- **Expected result:** Zero infra-plan entries in trace output
- **Edge case:** No

### trace-no-infra-entries-when-hasInfraTrack-absent
- **Verifies:** AC3
- **Action:** Run trace logic for a feature with no `hasInfraTrack` field; assert existing code story trace events are present and unmodified; assert no infra-plan entry appears
- **Expected result:** Existing trace events intact; no infra-plan entry — zero regression
- **Edge case:** No

---

## Integration Tests

None — trace logic is in source modules; unit tests cover the module-level behaviour.

---

## NFR Tests

### trace-record-contains-no-artefact-content
- **NFR addressed:** Security — trace record stores path and hash only, never artefact content
- **Measurement method:** Inspect the trace record structure written to disk; confirm no field contains the raw artefact text — only path and hash fields
- **Pass threshold:** Zero raw content fields in trace record; path + hash only
- **Tool:** String assertion on written trace record

---

## Out of Scope for This Test Plan

- Migration trace extension — tested in mig.4
- Retroactive backfill of pre-existing infra-plan artefacts — out of scope per story
- `/trace` SKILL.md content checks — covered by trace skill's own test suite

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
