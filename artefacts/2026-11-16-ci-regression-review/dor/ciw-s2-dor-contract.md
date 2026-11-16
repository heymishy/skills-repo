# Contract Proposal - Deprecate the Fleet Aggregation and GitHub Pages workflows so they stop running

**What will be built:**
- `.github/workflows/fleet-aggregation.yml`: `push` and `schedule` triggers removed, `workflow_dispatch` kept, a DEPRECATED comment block at the top; jobs, steps and secret references unchanged.
- `.github/workflows/pages.yml`: `push` trigger removed, `workflow_dispatch` kept, a DEPRECATED comment block at the top (Pages not enabled; what enabling would publish); jobs and steps unchanged.
- `dashboards/README.md`: a DEPRECATED banner as the first lines; the rest unchanged.
- `tests/check-ciw-s2-deprecated-workflows.js` (new, T1 to T4).
- `tests/check-dviz2-pages-workflow.js`: T3 and T4 changed to assert the retired state (no `push` trigger, manual trigger present, DEPRECATED header); every other assertion unchanged.

**What will NOT be built:**
- No deletion of any workflow, script, data or `dashboards/` file; no change to repository settings (Pages stays off); no change to `check-fleet-aggregation.js`, the dashboard tests, `scripts/validate-squad-file.js` or the fleet aggregator; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit (file text) |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4 | unit |
| AC5 | full suite | integration |
| AC6 | Scenario 6 | live |

**Assumptions:** `check-fleet-aggregation.js` tests aggregation logic and does not read the workflow triggers (confirmed by searching it for `schedule`, `cron`, `on:` and `push` as workflow keys); the dashboard tests read `dashboards/` content, not `pages.yml` (only `check-dviz2-pages-workflow.js` reads it, confirmed by searching `tests/` for `pages.yml`).

`schemaDepends: []`. **Estimated touch points:** Files: the two workflows, `dashboards/README.md`, one new test, one edited test. Services: none. APIs: none.
