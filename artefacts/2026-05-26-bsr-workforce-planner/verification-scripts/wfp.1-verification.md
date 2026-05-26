# AC Verification Script: Ingest workforce roster from per-group xlsx files

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.1.md
**Technical test plan:** artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.1-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

Before running this script, you need:
1. The `workforce-intake` skill installed and runnable (e.g. `node src/workforce/intake.js` or via the `workforce-intake` CLI entrypoint).
2. A sample xlsx file for a product group — or a prepared JSON equivalent if the CLI accepts JSON for testing.
3. A `workforce/schema-map/[group].json` config file mapping your xlsx column names to the standard field names.
4. A clean `workforce/` directory (or a disposable copy) so output files do not conflict with existing data.

---

## Scenario 1 — AC1: Standard schema output for a product group file

**What to do:**
1. Prepare a `workforce/schema-map/platform.json` config: `{ "Employee Name": "name", "Team": "team", "Role": "role" }`.
2. Prepare (or obtain) a small xlsx file for the "Platform" group with 3 person rows.
3. Run: `workforce-intake --group platform --file path/to/platform.xlsx`

**What to look for:**
- A file `workforce/platform.json` is created.
- Open it and confirm it is valid JSON.
- Each person record has all 10 standard fields: `name`, `team`, `squad`, `productGroup`, `role`, `title`, `employmentType`, `startDate`, `endDate`, `skills`.
- Fields not present in the xlsx are `null` — not missing and not empty string.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 2 — AC3: Column name mapping applied correctly

**What to do:**
1. In the xlsx, the person's name is in a column called "Employee Name" (not "name").
2. The schema-map contains `{ "Employee Name": "name" }`.
3. Run the intake as in Scenario 1.

**What to look for:**
- The `name` field in the output JSON is populated from the "Employee Name" column.
- It does NOT appear as null (which would indicate the mapping was not applied).

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 3 — AC4: Null endDate for permanent employees

**What to do:**
1. Prepare a person row in the xlsx that has no value in any end-date column.
2. Run `workforce-intake` on that file.

**What to look for:**
- The person's record in the output JSON has `"endDate": null`.
- It is NOT an empty string `""`.
- It is NOT omitted from the record.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 4 — AC2: roster.json created with merged data and productGroup field

**What to do:**
1. Run `workforce-intake --group platform --file platform.xlsx`
2. Run `workforce-intake --group data --file data.xlsx`
3. Run `workforce-intake --all` (or equivalent to trigger the merge step)

**What to look for:**
- `workforce/roster.json` is created.
- It contains records from both groups.
- Every record in roster.json has a `productGroup` field set to the group name it came from.
- If the same person name appears in both groups under the same productGroup, only one record appears (last-write wins). If they appear in different groups, both records are present.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 5 — AC5: cost-model.json seeded with unique roles

**What to do:**
1. Delete `workforce/cost-model.json` if it exists.
2. Run `workforce-intake --group platform --file platform.xlsx` (make sure the file has at least 2 distinct role values).

**What to look for:**
- `workforce/cost-model.json` is created.
- It contains one entry per unique role found in the ingested data.
- Each entry looks like: `{ "role": "Engineer", "quarterlyRateNZD": null, "annualRateNZD": null }`.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 6 — AC5: cost-model.json NOT overwritten if it already exists

**What to do:**
1. Create `workforce/cost-model.json` with a populated rate (e.g. `quarterlyRateNZD: 25000`).
2. Run `workforce-intake --group platform --file platform.xlsx`.

**What to look for:**
- `workforce/cost-model.json` is unchanged — the populated rate is still there.
- No new entries were inserted; no existing entries were reset to null.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 7 — AC6: Blank-name rows silently skipped

**What to do:**
1. Add 1 blank row (no name value) in the middle of the xlsx file.
2. Run `workforce-intake` on the file.

**What to look for:**
- No error or warning is shown.
- The output JSON has the correct number of records (total minus blank rows).
- No record in the output JSON has `"name": null` or `"name": ""`.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 8 — NFR-SEC: No person data written to stdout

**What to do:**
1. Run `workforce-intake --group platform --file platform.xlsx` and capture stdout.

**What to look for:**
- Stdout contains only a count summary (e.g. "Ingested 5 records").
- No person names, roles, teams, or any field values from the roster appear in stdout.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 9 — NFR-PERF: 200-row file ingests in under 10 seconds

**What to do:**
1. Prepare (or generate) a 200-row xlsx file.
2. Time the invocation: `time workforce-intake --group platform --file large-file.xlsx` (or equivalent).

**What to look for:**
- Total wall time is under 10 seconds.

**Pass / Fail:** _____ | Notes: _____________

---

## Scenario 10 — NFR-INT: Interrupted write does not leave a truncated file

**What to do:**
This scenario is best verified via the automated test (N2 in the test plan). If running manually:
1. Before running intake, write a valid `workforce/platform.json`.
2. Simulate failure by removing write permissions on the output directory mid-run (or by reviewing the implementation to confirm temp-file + rename pattern is used).

**What to look for:**
- If the write fails, the previously existing file is still intact and valid JSON.
- No partial/truncated file is left at the output path.

**Pass / Fail:** _____ | Notes: _____________

---

**Verification complete:** All 10 scenarios reviewed
**Overall outcome:** [ ] PASS — all scenarios pass  [ ] FAIL — findings recorded above
