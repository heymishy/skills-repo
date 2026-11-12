# Contract Proposal — Wire triage drafting to incident creation, so a created incident gets a triage summary

**What will be built:**
- A new module `src/modules/incident-recorder.js` exporting `recordIncident(input, filePath, options)` and `DEFAULT_INCIDENTS_FILE` (`<repo>/workspace/incidents.json`). It builds a record with `createIncidentRecord`, stores it with `appendIncidentRecord`, then calls `draftTriageSummary` (the optional `options.draft` defaults to the real function and exists so a test can make drafting fail), and returns the stored record re-read from disk. If drafting throws, the already-stored record is left as it is and the error is rethrown.
- A new command `scripts/create-incident.js` taking `--trigger`, `--summary`, `--tags a,b,c` and optional `--file`. It calls `recordIncident`, prints the new record id and triage summary, and exits 0. On missing input or a tag-length error it prints a clear message to stderr, writes nothing and exits 1.
- A small edit to `src/modules/triage-drafter.js`: candidate records for matching are filtered to type `incident` (a record with no `type` counts as `incident`). The scoring, threshold and summary wording are unchanged.
- A new test `tests/check-iwf-s1-incident-recording.js` implementing UT1 to UT6, IT1 to IT4 and NFR-CORR1 from the test plan.

**What will NOT be built:**
- No change to `INCIDENT_JACCARD_THRESHOLD` or the scoring algorithm, and no change to the summary wording.
- No change to `scripts/lib/incident-store.js` or `src/modules/drift-comparator.js`.
- No automated alert-to-record creation, no web UI, no handoff flow, no Teams work.
- No real incident record written to `workspace/incidents.json` by the build or by any test.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1, UT2 against a seeded temp file | Unit with real modules |
| AC2 | IT1, IT2, IT3 run the real command as a child process; UT6 reads the default-path constant | Integration-real-code |
| AC3 | UT3, UT4 | Unit with real modules |
| AC4 | UT5 with a throwing `draft` option | Unit |
| AC5 | IT4 runs the real command twice; NFR-CORR1 hashes the real data file before and after | Integration-real-code |

`schemaDepends: []` — the story reads no `pipeline-state.json` field. H8-ext (cross-story schema dependency check): no field declarations required.

**Assumptions:**
- `createIncidentRecord` throws `IncidentTagFieldTooLongError` on over-long tags before anything is written, so the tag-length failure in AC2 needs no pre-check beyond catching that error.
- The `triage-drafter.js` test file `tests/check-itar-s2-triage-drafting.js` (15 tests) still passes after the type filter, because its fixtures are all untyped or `incident`. The build re-runs it.
- Running the command as a child process works in CI (plain `node`, no extra environment).

**Estimated touch points:**
Files: `src/modules/incident-recorder.js` (new), `scripts/create-incident.js` (new), `src/modules/triage-drafter.js` (one filter), `tests/check-iwf-s1-incident-recording.js` (new)
Services: None
APIs: None
