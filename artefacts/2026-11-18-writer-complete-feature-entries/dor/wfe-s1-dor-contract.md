# Contract Proposal - A feature the web app records in pipeline-state.json is complete enough to pass the repository's own checks

**What will be built:**
- `src/web-ui/adapters/pipeline-state-github-writer.js`: in `applyStateUpdate`, when the feature is created, set `name` (the update's string `name`, else the slug), `track: 'standard'`, `stage` (the update's `stage`, else `discovery`) and `health` (the update's `health`, else `green`) before the feature-level key loop runs, so the update's own values still win.
- `src/web-ui/adapters/pipeline-state-writer.js` (local-fs): the same defaults on its own feature creation.
- `tests/check-wfe-s1-complete-feature-entries.js` (T1a to T4) and a Definition of Done.

**What will NOT be built:**
- No change to story-level handling, conflict detection, the 409 retry, the PUT, the schema, the integrity script, or any route; no pre-push validation; no handling of uncommitted artefacts; no new npm dependency; no new injectable adapter.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1a, T1b, T1c (T1c written first, red) | unit with the writer's stubbed GitHub API |
| AC2 | T2 | unit |
| AC3 | T3a, T3b | integration with the real integrity script and schema |
| AC4 | T4 | unit in a temporary real git checkout |
| AC5 | the three existing suites unchanged | regression |

**Assumptions:** `check-wsd-s2-github-pipeline-state-writer.js` shows how to drive the github writer with a stubbed Contents API (read before writing the test); the integrity script accepts a path or reads `.github/pipeline-state.json` from the working directory (read before writing T3a).

`schemaDepends: []`. **Estimated touch points:** Files: about 4 (two writers, one test, artefacts). Services: none.

**Exclusion list check (B1/D1):** the excluded areas (routes, schema, integrity script, conflict handling) have no test assertion against them other than the unchanged regression suites.
