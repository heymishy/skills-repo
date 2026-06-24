## Test Plan: inf.4 — Add H-INF hard block to `/definition-of-ready` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.4.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-inf4-h-inf-gate.js`
**Test runner:** `node tests/check-inf4-h-inf-gate.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | H-INF appears in DoR checklist when `hasInfraTrack: true` | 2 tests | — | — | — | — | 🟢 |
| AC2 | H-INF shows FAIL when `infraPlanPath` absent or artefact lacks PASS status | 2 tests | — | — | — | — | 🟢 |
| AC3 | H-INF shows PASS when `infraPlanPath` points to artefact with PASS status | 2 tests | — | — | — | — | 🟢 |
| AC4 | H-INF does not appear when `hasInfraTrack` is false/absent; existing H1-H9 unaffected | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read the DoR SKILL.md content for H-INF presence; tests also exercise the DoR SKILL.md's H-INF logic via synthetic story entries and stub artefacts
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Story entry with `hasInfraTrack: true` | Synthetic | None | |
| AC2 | Story with `hasInfraTrack: true` but no `infraPlanPath`, or path pointing to non-PASS artefact | Synthetic + stub file | None | |
| AC3 | Story with `hasInfraTrack: true` + `infraPlanPath` pointing to a stub artefact containing "status PASS" | Synthetic + stub file in temp dir | None | |
| AC4 | Story with `hasInfraTrack: false` or absent | Synthetic | None | |

---

## Unit Tests

### dor-skill-contains-h-inf-block
- **Verifies:** AC1
- **Action:** Read `.github/skills/definition-of-ready/SKILL.md`; assert it contains "H-INF" as a named hard-block check
- **Expected result:** "H-INF" found in DoR SKILL.md
- **Edge case:** No

### h-inf-block-references-hasInfraTrack-field
- **Verifies:** AC1
- **Action:** Assert DoR SKILL.md H-INF block references the `hasInfraTrack` field as the trigger condition
- **Expected result:** `hasInfraTrack` mentioned in H-INF context
- **Edge case:** No

### h-inf-fails-when-infraPlanPath-absent
- **Verifies:** AC2
- **Action:** Run DoR checklist evaluation (or read H-INF logic) with a story entry where `hasInfraTrack: true` but `infraPlanPath` is not set; assert H-INF result is FAIL
- **Expected result:** H-INF = FAIL
- **Edge case:** No

### h-inf-fails-when-artefact-does-not-contain-pass
- **Verifies:** AC2
- **Action:** Write a stub file at a temp path containing text but NOT "status PASS"; set `infraPlanPath` to this path; evaluate H-INF; assert FAIL
- **Expected result:** H-INF = FAIL — artefact exists but does not have PASS status
- **Edge case:** No

### h-inf-passes-when-artefact-contains-status-pass
- **Verifies:** AC3
- **Action:** Write a stub file at a temp path containing "status PASS"; set `infraPlanPath` to this path; evaluate H-INF; assert PASS
- **Expected result:** H-INF = PASS
- **Edge case:** No

### h-inf-references-artefact-path-in-pass-output
- **Verifies:** AC3, Audit NFR
- **Action:** When H-INF evaluates as PASS, assert the output names the artefact path that was checked
- **Expected result:** Path appears in H-INF output
- **Edge case:** No

### h-inf-absent-when-hasInfraTrack-false
- **Verifies:** AC4
- **Action:** Evaluate DoR checklist for a story with `hasInfraTrack: false`; assert H-INF does not appear in output
- **Expected result:** H-INF not in checklist
- **Edge case:** No

### h-inf-absent-when-hasInfraTrack-missing
- **Verifies:** AC4
- **Action:** Evaluate DoR checklist for a story with no `hasInfraTrack` field at all; assert H-INF absent
- **Expected result:** H-INF not in checklist — existing H1-H9 blocks unaffected
- **Edge case:** No

---

## Integration Tests

None — all AC logic is in the DoR SKILL.md text and the DoR evaluation logic.

---

## NFR Tests

### h-inf-finding-text-names-expected-artefact-path
- **NFR addressed:** Audit — H-INF finding text must name the expected artefact path
- **Measurement method:** When H-INF fires as FAIL (artefact absent), assert the output includes the `infraPlanPath` value (or explains where the artefact is expected) so the operator knows exactly what is missing
- **Pass threshold:** artefact path or path description present in FAIL output
- **Tool:** String assertion on DoR evaluation output

---

## Out of Scope for This Test Plan

- H-MIG gate — tested in mig.3
- Automatic setting of `hasInfraTrack` — out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
