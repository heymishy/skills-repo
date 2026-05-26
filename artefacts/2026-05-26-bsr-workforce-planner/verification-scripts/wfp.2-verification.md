# AC Verification Script: Update individual roster records without full re-ingestion

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.2.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.2-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script:
1. `workforce-intake` (wfp.1) must be DoD-complete — you need existing `workforce/platform.json` and `workforce/roster.json` files.
2. Create a test copy of those files in a safe directory to avoid modifying real data during verification.
3. The `workforce-update` CLI must be runnable (e.g. `node src/workforce/update.js` or via the `workforce-update` CLI entrypoint).

---

## Scenario 1 — AC1: Add a new person record

**What to do:**
Run: `workforce-update --action add --group platform --record '{"name":"Jordan Tane","team":"Infra","squad":"Ops","productGroup":"Platform","role":"Engineer","title":"SWE","employmentType":"permanent","startDate":"2026-06-01","endDate":null,"skills":["node","terraform"]}'`

**What to look for:**
- `workforce/platform.json` now contains Jordan Tane's record at the end of the array.
- `workforce/roster.json` also contains Jordan Tane's record with `productGroup: "Platform"`.
- Both files are valid JSON (e.g. open in VS Code or `node -e "JSON.parse(require('fs').readFileSync('workforce/roster.json','utf8'))"`).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC2: Edit a field on an existing record

**What to do:**
1. Pick a person already in the roster (e.g. "Alex Rahi").
2. Run: `workforce-update --action edit --group platform --name "Alex Rahi" --fields '{"endDate":"2026-09-30"}'`

**What to look for:**
- Alex Rahi's record in `workforce/platform.json` now has `endDate: "2026-09-30"`.
- Alex Rahi's record in `workforce/roster.json` also has `endDate: "2026-09-30"`.
- All other fields on Alex's record are unchanged.
- All other records in both files are unchanged.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC3: Retire a person with an explicit end date

**What to do:**
Run: `workforce-update --action retire --group platform --name "Alex Rahi" --endDate 2026-08-31`

**What to look for:**
- Alex Rahi's record in both files has `endDate: "2026-08-31"` and `retired: true`.
- Alex's record is NOT deleted from either file — it is still there, just marked retired.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC3: Retire without --endDate is rejected

**What to do:**
Run: `workforce-update --action retire --group platform --name "Alex Rahi"` (omit `--endDate`).

**What to look for:**
- The command exits with a non-zero exit code.
- The error message contains `"--endDate is required for retire action"`.
- Neither `workforce/platform.json` nor `workforce/roster.json` is modified.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC4: Unmatched name gives an error and modifies nothing

**What to do:**
Run: `workforce-update --action edit --group platform --name "Nobody Fake" --fields '{"role":"Manager"}'`

**What to look for:**
- The command exits with a non-zero exit code.
- The error message names the unmatched person ("Nobody Fake").
- Neither `workforce/platform.json` nor `workforce/roster.json` has been modified (verify by checking timestamps or content).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC5: Duplicate add is rejected

**What to do:**
1. Pick a person already in the roster (e.g. "Alex Rahi", productGroup "Platform").
2. Run `--action add` with the same `name` and `productGroup` value.

**What to look for:**
- The command exits with a non-zero exit code.
- A conflict message is printed (e.g. "already exists", "conflict").
- The file is NOT modified — no duplicate record added.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — NFR-SEC: Confirmation message does not leak PII

**What to do:**
Run any successful edit or add command and capture stdout.

**What to look for:**
- Stdout contains a confirmation (e.g. "Record updated: Alex Rahi").
- Stdout does NOT contain other field values such as the person's role, endDate, squad, skills, etc.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 8 — NFR-INT: Atomic write (no partial files on failure)

**What to do:**
This is primarily verified by the automated test (N1 in the test plan). For a manual check:
1. Review the implementation to confirm it writes to a temp file and renames over the target.
2. If the implementation is in code review, check for `fs.writeFileSync` on a `.tmp` path followed by `fs.renameSync`.

**What to look for:**
- No direct-write pattern without temp file.
- Both group file and roster file are updated together — you cannot see a state where one is updated and the other is not.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 8 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
