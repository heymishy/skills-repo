# Contract Proposal — Persist the two seeded deferred-item records that ddft-s1 promised but never shipped

**What will be built:**
- A new tracked data file `workspace/incidents.json` containing exactly two `deferred-item` records. They are built with `createDeferredItemRecord` and persisted with `appendIncidentRecord` from `scripts/lib/incident-store.js`, run once from a throwaway script outside the repo, so both records pass `validateRecord` exactly as any future record will.
  - Record A: the unfixed `tfhc-s1` integrity failure. `source: "risk-accept"`, `linkedFeature: "2026-10-30-test-fixture-hardening-continuation"`, `linkedStory: "tfhc-s1"`, summary stating the real C3 failure, and a `revisitCondition`.
  - Record B: the C1-versus-Option-C contradiction. `source: "backlog-thread"`, summary naming `.github/architecture-guardrails.md` constraint C1 and `skills/bootstrap/SKILL.md` Option C, `revisitCondition: "deferred to a broader product/ refresh later"`.
- A new read-only test `tests/check-dsrf-s1-seeded-records.js` (picked up automatically by `scripts/run-all-tests.js`'s `tests/check-*.js` glob) implementing UT1 to UT5, IT1, IT2, NFR-SEC1 and NFR-CORR1 from the test plan.

**What will NOT be built:**
- No change to `scripts/lib/incident-store.js` or any other module under `scripts/` or `src/`.
- No fix to the `tfhc-s1` failure or to the C1/Option C contradiction, and no change to the C3 check.
- No `draftTriageSummary` wiring and no Jaccard threshold tuning.
- No `type: "incident"` record, and no extra records beyond the two named.
- No edit to itar-s1's or ddft-s1's DoD artefacts (logged separately).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1 (file exists, parses as an array), UT2 (`git ls-files --error-unmatch`) | Unit against the real file |
| AC2 | UT3 | Unit against the real file |
| AC3 | UT4 | Unit against the real file |
| AC4 | UT5 (negative control over in-memory arrays) and IT1 (`validateRecord` on every real record) | Unit and integration-real-code |
| AC5 | IT2 (`loadRecords` and `loadIncidentRecords` on the real file) | Integration-real-code |

**Assumptions:**
- `workspace/incidents.json` is not matched by `.gitignore` (confirmed with `git check-ignore`, which returned no match). `workspace/capture-log.md` is ignored, so each record's summary must be self-contained rather than pointing a reader at that file.
- The C3 numbers in Record A (`testPlan.passing` 4, `totalTests` 5, `prStatus: merged`) are re-confirmed against the live `node scripts/check-pipeline-state-integrity.js` output at build time, not copied from memory.
- The CI test chain runs from a git checkout, so UT2 can call `git`. If it cannot, UT2 reports a clear skip message rather than passing.

`schemaDepends: []` — the story consumes the record shape of the merged `incident-store.js` but reads no `pipeline-state.json` field. H8-ext (cross-story schema dependency check): no field declarations required.

**Estimated touch points:**
Files: `workspace/incidents.json` (new), `tests/check-dsrf-s1-seeded-records.js` (new)
Services: None
APIs: None
