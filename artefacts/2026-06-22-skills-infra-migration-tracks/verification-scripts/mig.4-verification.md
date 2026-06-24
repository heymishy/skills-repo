# AC Verification Script: mig.4 — Extend chain-hash trace to emit on migration-review sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.4.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.4-test-plan.md
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

### Scenario 1: Migration-review sign-off emits trace record with path and SHA-256 hash

**Covers:** AC1

**Steps:**
1. Open `src/journey.js` (or the equivalent trace module)
2. Search for a migration-review sign-off hook — look for `migration-review`, `migrationReview`, or `migration_review`
3. Confirm the emitted record includes the artefact path field (linked to `migrationReviewPath`)
4. Confirm the record includes a SHA-256 hash field
5. Confirm the hash is computed from a disk read (`fs.readFileSync` or equivalent) — not from an in-memory string

**Expected outcome:**
> A migration-review sign-off hook exists in the trace module. The emitted record contains the artefact path and a SHA-256 hash. The hash is computed from the artefact file on disk at sign-off time, consistent with the ougl disk-canonicity rule.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: `/trace` output includes migration-review artefact entry alongside code story DoR artefact

**Covers:** AC2

**Steps:**
1. Trigger a trace run (or inspect the trace output format) for a synthetic feature with both a code DoR gate-confirm event and a migration-review sign-off event
2. Confirm the trace output contains two distinct entries: one for the code DoR, one for the migration-review sign-off
3. Confirm the migration-review entry has a distinct event type (e.g. `migration-review-sign-off`) different from the DoR entry type

**Expected outcome:**
> Both entries are present. Neither is missing. The migration-review entry has its own event type label. The DoR entry is unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: No migration trace entries when `hasMigrationTrack` false or absent; existing events unchanged

**Covers:** AC3

**Steps:**
1. Run trace (or read trace logic) for a feature with `hasMigrationTrack: false`
2. Confirm no migration-review entry appears in the output
3. Repeat with a feature with no `hasMigrationTrack` field at all
4. Confirm existing code story trace events are present and identical to their pre-mig.4 form

**Expected outcome:**
> Zero migration-review trace entries for features without the flag. All existing code story trace events are intact and unmodified. Zero regression.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Trace record contains path and hash only — no migration SQL content

**Covers:** AC1, Security NFR

**Steps:**
1. Trigger a trace emission for a migration-review sign-off with a stub artefact file containing SQL text
2. Read the written trace record from disk
3. Confirm the record contains the artefact path and a SHA-256 hash string
4. Confirm no field contains raw SQL, forward migration commands, or rollback migration commands

**Expected outcome:**
> The trace record has exactly two migration-specific fields: path and hash. No SQL content, no migration commands, no credentials are stored in the record.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — sign-off emits trace with path + SHA-256 hash from disk | | |
| Scenario 2 — trace includes migration-review + DoR entries, distinct event types | | |
| Scenario 3 — no migration entries when flag absent; existing events unchanged | | |
| Scenario 4 — trace record contains path/hash only, no SQL content | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
