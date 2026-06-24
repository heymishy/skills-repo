# AC Verification Script: inf.5 — Extend chain-hash trace to emit on infra-plan sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.5.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.5-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a terminal open at the repo root
2. Locate `src/journey.js` and `src/enforcement/gate-map.js` in a text editor

---

## Scenarios

---

### Scenario 1: Infra-plan sign-off emits a trace record with path and SHA-256 hash

**Covers:** AC1

**Steps:**
1. Open `src/journey.js` (or the equivalent trace module)
2. Search for an infra-plan sign-off hook — look for `infra-plan`, `infraPlan`, or `infra_plan`
3. Confirm the emitted record includes the artefact path field (linked to `infraPlanPath`)
4. Confirm the record includes a SHA-256 hash field
5. Confirm the hash is computed from a disk read (`fs.readFileSync` or equivalent) — not from an in-memory string

**Expected outcome:**
> An infra-plan sign-off hook exists in the trace module. The emitted record contains the artefact path and a SHA-256 hash. The hash is computed from the artefact file on disk at sign-off time, consistent with the existing trace pattern.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: `/trace` output includes infra-plan artefact entry alongside code story DoR artefact

**Covers:** AC2

**Steps:**
1. Trigger a trace run (or inspect the trace output format in the trace module) for a synthetic feature that has both a code DoR gate-confirm event and an infra-plan sign-off event
2. Confirm the trace output contains two distinct entries: one for the code DoR, one for the infra-plan sign-off
3. Confirm the infra-plan entry has a distinct event type (e.g. `infra-plan-sign-off`) that differs from the DoR entry type

**Expected outcome:**
> Both entries are present. Neither is missing. The infra-plan entry has its own event type label. The DoR entry is unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: No infra trace entries when `hasInfraTrack` is false or absent; existing events unchanged

**Covers:** AC3

**Steps:**
1. Run trace (or read trace logic) for a feature with `hasInfraTrack: false`
2. Confirm no infra-plan entry appears in the output
3. Repeat with a feature with no `hasInfraTrack` field at all
4. Confirm existing code story trace events are present and identical to their pre-inf.5 form

**Expected outcome:**
> Zero infra-plan trace entries for features without the flag. All existing code story trace events are intact and unmodified. Zero regression.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Trace record contains path and hash only — no raw artefact content

**Covers:** AC1, Security NFR

**Steps:**
1. Trigger a trace emission for an infra-plan sign-off with a stub artefact file
2. Read the written trace record from disk
3. Confirm the record contains the artefact path and a SHA-256 hash string
4. Confirm no field contains the raw artefact text content

**Expected outcome:**
> The trace record has exactly two infra-specific fields: path and hash. No artefact content, no plan detail, no credentials are stored in the record.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — sign-off emits trace with path + SHA-256 hash from disk | | |
| Scenario 2 — trace includes infra-plan + DoR entries, distinct event types | | |
| Scenario 3 — no infra entries when flag absent; existing events unchanged | | |
| Scenario 4 — trace record contains path/hash only, no raw content | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
