# AC Verification Script: shr.2 — Support `ops/` path prefix for standalone infra changes

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.2.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.2-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have the repo root open in a terminal
2. Run `node scripts/check-pipeline-state-integrity.js` to confirm the current state is clean

**Reset between scenarios:** No shared state — each scenario is independent

---

## Scenarios

---

### Scenario 1: `ops/` prefixed slug is accepted as a valid feature identifier

**Covers:** AC1

**Steps:**
1. Open `.github/pipeline-state.json`
2. Temporarily add (or ask the implementer to demonstrate) a feature entry with slug `ops/2026-06-25-secrets-rotation`
3. Run `node scripts/check-pipeline-state-integrity.js`

**Expected outcome:**
> The script outputs a result line ending in `0 fail ✓`. No error message says "invalid feature slug" or similar for the `ops/2026-06-25-secrets-rotation` slug. The script treats it as a valid slug.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An artefact path under an `ops/` slug resolves safely within the repo

**Covers:** AC2

**Steps:**
1. In a terminal at the repo root, run:
   ```
   node -e "
   const path = require('path');
   const repoRoot = process.cwd();
   const artefactPath = 'artefacts/ops/2026-06-25-secrets-rotation/infra/standalone-infra-def.md';
   const resolved = path.resolve(repoRoot, artefactPath);
   const safe = resolved.startsWith(path.resolve(repoRoot) + path.sep);
   console.log('Resolved:', resolved);
   console.log('Safe:', safe);
   "
   ```

**Expected outcome:**
> The terminal prints `Safe: true`. The resolved path starts with the repo root directory path and does not jump outside it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A path-traversal attempt via `ops/` prefix is blocked

**Covers:** AC3

**Steps:**
1. Run:
   ```
   node -e "
   const path = require('path');
   const repoRoot = process.cwd();
   const slug = 'ops/../../etc/passwd';
   const artefactPath = 'artefacts/' + slug + '/infra/def.md';
   const resolved = path.resolve(repoRoot, artefactPath);
   const safe = resolved.startsWith(path.resolve(repoRoot) + path.sep);
   console.log('Resolved:', resolved);
   console.log('Safe:', safe);
   "
   ```

**Expected outcome:**
> The terminal prints `Safe: false` (the resolved path escapes the repo root, which confirms the guard must block it). The integrity check or path construction logic rejects this slug — run the integrity check with a state entry using this slug and confirm it produces an error rather than accepting the traversal path.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Standard slugs continue to work exactly as before

**Covers:** AC4

**Steps:**
1. Run `node scripts/check-pipeline-state-integrity.js` on the current `.github/pipeline-state.json` (which uses standard date-based slugs)

**Expected outcome:**
> The script passes with `0 fail ✓`. No existing features or stories produce new errors as a result of this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — ops/ slug accepted | | |
| Scenario 2 — path resolves within repoRoot | | |
| Scenario 3 — traversal attempt blocked | | |
| Scenario 4 — standard slugs unaffected | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
