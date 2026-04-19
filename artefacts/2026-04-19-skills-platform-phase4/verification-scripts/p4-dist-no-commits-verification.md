# Verification Script: p4-dist-no-commits

**Story:** Install generates zero commits — CI-verifiable assertion
**Operator scenarios:** Run after implementation to confirm AC coverage.

---

## Scenario 1 — Init generates zero commits (AC1)

**Setup:** Fresh consumer repo with no sidecar. Record `BEFORE=$(git rev-list --count HEAD)`.
**Run:** `skills-repo init`
**Expected:** `AFTER=$(git rev-list --count HEAD)`. Assert `BEFORE -eq AFTER`. If different, CI should have printed "Distribution command generated unexpected commit(s): N commit(s) added".

---

## Scenario 2 — All four commands covered in assertion suite (AC2)

**Run:** `node -e "const { getCommandRegistry } = require('./src/distribution/ci-assert.js'); console.log(JSON.stringify(getCommandRegistry()));"`
**Expected:** Output includes entries for `init`, `fetch`, `pin`, and `verify`.

---

## Scenario 3 — Verify is read-only (AC3)

**Setup:** Consumer repo with valid sidecar and correct lockfile.
**Run:** `git status --porcelain > before.txt ; skills-repo verify ; git status --porcelain > after.txt ; diff before.txt after.txt`
**Expected:** `diff` output is empty. No staged, unstaged, or untracked git changes after verify.

---

## Scenario 4 — NFR: No sidecar contents in CI log

**Run:** `skills-repo init 2>&1 | grep -i '.skills-repo/'`
**Expected:** No output. Sidecar directory listing must not appear in init output.
