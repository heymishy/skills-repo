## Contract Proposal — Deferred-item record mechanism (generalized schema)

**What will be built:**
`scripts/lib/incident-store.js` (established by `itar-s1`) is extended, not replaced: a `type` field is added to the record shape (defaulting all existing/future incident records to `"incident"`), plus deferred-item-specific fields `source`, `revisitCondition`, `linkedFeature`, `linkedStory`. The same `workspace/incidents.json` file is reused in place — no new storage mechanism, no file rename. Two real records are seeded directly into `workspace/incidents.json`: `tfhc-s1` (`type: "deferred-item"`, `source: "risk-accept"`) and the C1-vs-Option-C fork-distribution contradiction (`type: "deferred-item"`, `source: "backlog-thread"`).

**What will NOT be built:**
Fixing `tfhc-s1` itself, or resolving the C1-vs-Option-C contradiction — only correctly registering and surfacing both is in scope. Backfilling any other historical `decisions.md`/`capture-log.md` entry beyond these 2 seeded cases is also out of scope.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on the record shape validator confirming `type` defaults to `"incident"` for pre-existing shape, plus an integration test writing a full `deferred-item` record with all 4 new fields | unit + integration |
| AC2 | Integration test asserting `tfhc-s1` is written with `type: "deferred-item"`, `source: "risk-accept"`, and a non-blank `revisitCondition` | integration |
| AC3 | Integration test asserting the C1-vs-Option-C record is written with `type: "deferred-item"`, `source: "backlog-thread"`, matching the real logged deferral text | integration |
| AC4 | Integration test reading both records back and asserting `type === "deferred-item"` for both (not accidentally `"incident"`) | integration |

**Assumptions:**
`itar-s1`'s `scripts/lib/incident-store.js` and `workspace/incidents.json` exist and are stable before this story starts (confirmed: `itar-s1`'s own DoR has signed off — see `artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s1-incident-record-mechanism-dor.md`). No real incident records exist yet in `workspace/incidents.json` at the time this story ships, so the `type` default-to-`"incident"` behaviour is validated by test fixtures, not live data.

**Estimated touch points:**
Files: `scripts/lib/incident-store.js` (extended), `workspace/incidents.json` (schema + 2 seeded records).
Services: none.
APIs: none.
