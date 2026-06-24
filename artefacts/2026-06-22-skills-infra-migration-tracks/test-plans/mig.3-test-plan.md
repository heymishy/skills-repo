## Test Plan: mig.3 — Add H-MIG hard block to `/definition-of-ready` SKILL.md for stories with a migration track

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.3.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-mig3-h-mig-gate.js`
**Test runner:** `node tests/check-mig3-h-mig-gate.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | H-MIG appears in DoR checklist when `hasMigrationTrack: true` | 2 tests | — | — | — | — | 🟢 |
| AC2 | H-MIG shows FAIL when `migrationReviewPath` absent or artefact lacks PASS | 2 tests | — | — | — | — | 🟢 |
| AC3 | H-MIG shows PASS when `migrationReviewPath` points to artefact with status PASS | 2 tests | — | — | — | — | 🟢 |
| AC4 | H-MIG absent when `hasMigrationTrack` false/absent; existing blocks unaffected | 2 tests | — | — | — | — | 🟢 |
| AC5 | H-MIG shows FAIL for breaking migration without CI-tier rollback execution evidence | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read DoR SKILL.md for H-MIG presence; tests exercise H-MIG logic via synthetic story entries and stub artefacts
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Story entry with `hasMigrationTrack: true` | Synthetic | None | |
| AC2 | Story with `hasMigrationTrack: true` but no `migrationReviewPath`, or path pointing to non-PASS artefact | Synthetic + stub file | None | |
| AC3 | Story with `hasMigrationTrack: true` + `migrationReviewPath` pointing to stub with "status PASS" | Synthetic + stub file in temp dir | None | |
| AC4 | Story with `hasMigrationTrack: false` or absent | Synthetic | None | |
| AC5 | Stub migration-review artefact with classification breaking but no CI rollback evidence | Synthetic + stub file | None | |

---

## Unit Tests

### dor-skill-contains-h-mig-block
- **Verifies:** AC1
- **Action:** Read `.github/skills/definition-of-ready/SKILL.md`; assert it contains "H-MIG" as a named hard-block check
- **Expected result:** "H-MIG" found in DoR SKILL.md
- **Edge case:** No

### h-mig-block-references-hasMigrationTrack-field
- **Verifies:** AC1
- **Action:** Assert DoR SKILL.md H-MIG block references the `hasMigrationTrack` field as the trigger condition
- **Expected result:** `hasMigrationTrack` mentioned in H-MIG context
- **Edge case:** No

### h-mig-fails-when-migrationReviewPath-absent
- **Verifies:** AC2
- **Action:** Evaluate H-MIG with a story where `hasMigrationTrack: true` but `migrationReviewPath` is not set; assert H-MIG result is FAIL
- **Expected result:** H-MIG = FAIL
- **Edge case:** No

### h-mig-fails-when-artefact-does-not-contain-pass
- **Verifies:** AC2
- **Action:** Write a stub file at a temp path containing text but NOT "status PASS"; set `migrationReviewPath` to this path; evaluate H-MIG; assert FAIL
- **Expected result:** H-MIG = FAIL — artefact exists but does not have PASS status
- **Edge case:** No

### h-mig-passes-when-artefact-contains-status-pass
- **Verifies:** AC3
- **Action:** Write a stub file at a temp path containing "status PASS"; set `migrationReviewPath` to this path; evaluate H-MIG; assert PASS
- **Expected result:** H-MIG = PASS
- **Edge case:** No

### h-mig-references-artefact-path-in-output
- **Verifies:** AC3, Audit NFR
- **Action:** When H-MIG evaluates, assert the output names the artefact path and lists which fields were checked
- **Expected result:** Path and field list appear in H-MIG output
- **Edge case:** No

### h-mig-absent-when-hasMigrationTrack-false
- **Verifies:** AC4
- **Action:** Evaluate DoR checklist for a story with `hasMigrationTrack: false`; assert H-MIG does not appear
- **Expected result:** H-MIG not in checklist
- **Edge case:** No

### h-mig-absent-when-hasMigrationTrack-missing
- **Verifies:** AC4
- **Action:** Evaluate DoR checklist for a story with no `hasMigrationTrack` field; assert H-MIG absent; assert H-INF and H1-H9 are present and unmodified
- **Expected result:** H-MIG not in checklist — existing blocks unaffected
- **Edge case:** No

### h-mig-fails-when-breaking-lacks-rollback-evidence
- **Verifies:** AC5
- **Action:** Write a stub migration-review artefact with "status PASS" and "classification: breaking" but no "CI-tier rollback execution evidence" field; evaluate H-MIG; assert FAIL
- **Expected result:** H-MIG = FAIL — breaking migration without rollback evidence fails the gate
- **Edge case:** No

---

## Integration Tests

None — all AC logic is in the DoR SKILL.md text and the DoR evaluation logic.

---

## NFR Tests

### h-mig-finding-text-names-artefact-path-and-fields
- **NFR addressed:** Audit — H-MIG finding text must name the expected artefact path and list missing fields so the operator knows exactly what is required
- **Measurement method:** When H-MIG fires as FAIL, assert the output includes the `migrationReviewPath` value (or explains where the artefact is expected) and names which field(s) are missing or incorrect
- **Pass threshold:** Path and field list present in FAIL output
- **Tool:** String assertion on DoR evaluation output

---

## Out of Scope for This Test Plan

- H-INF gate — tested in inf.4
- Automatic setting of `hasMigrationTrack` — out of scope per story
- Migration-review SKILL.md content — tested in mig.2

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
