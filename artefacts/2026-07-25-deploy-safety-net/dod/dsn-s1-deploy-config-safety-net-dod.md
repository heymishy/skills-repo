# Definition of Done: A single deploy-to-staging entry point that can't silently use the wrong Fly config

**PR:** #600 (commit `89847972`) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-deploy-safety-net/stories/dsn-s1-deploy-config-safety-net.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|---------------------|-----------|
| AC1 -- hardcoded `flyctl deploy --remote-only --config fly.staging.toml --app wuce-staging`, not configurable via CLI/env | Yes | `scripts/deploy-staging.js` `DEPLOY_ARGS` constant (line 39); test `deployCommandUsesCorrectHardcodedFlags (AC1)` asserts the exact args array passed to the command runner | Unit test (injectable command runner, D37 pattern) | None |
| AC2 -- post-deploy check calls `flyctl config show --app wuce-staging` (JSON) and asserts `MOCK_LLM_GATEWAY: "true"` | Yes | test `postDeployCheckParsesConfigCorrectly (AC2)` asserts exactly 2 commands run, second is `['config', 'show', '--app', 'wuce-staging']`, and `result.ok === true` when the field is `"true"` | Unit test | Script omits a literal `--json` flag (comment explains `flyctl config show`'s default output is already JSON and `--json` errors) -- functionally equivalent to the AC's intent, not a gap |
| AC3 -- missing/wrong `MOCK_LLM_GATEWAY` prints a clear, actionable error and exits non-zero | Yes | tests `missingMockGatewayFlagFailsLoudly (AC3)` and `wrongMockGatewayValueFailsLoudly (AC3)` assert `result.ok === false` and the message names `MOCK_LLM_GATEWAY` plus the actual bad value; CLI entrypoint (`require.main === module` block) maps `result.ok === false` to `process.exit(1)` | Unit test + code inspection of exit-code wiring | None |
| AC4 -- correct config prints success confirmation and exits 0 | Yes | test `correctConfigSucceeds (AC4)` asserts `result.ok === true` and a "confirmed" message; CLI entrypoint maps `ok === true` to `process.exit(0)` | Unit test + code inspection | None |
| AC5 -- `staging-deploy.yml`'s `deploy-staging` job calls `node scripts/deploy-staging.js`, not a raw inline `flyctl deploy` | Yes | test `workflowCallsWrapperScript (AC5)`; confirmed directly in `.github/workflows/staging-deploy.yml` line 92: `run: node scripts/deploy-staging.js --app wuce-staging` | Unit test (regex over workflow YAML) + direct file read | The workflow keeps a redundant `--app wuce-staging` CLI arg after the script name; the script does not read `process.argv` (flags stay hardcoded per AC1), so this is inert and exists only so `bri-s2.5`'s separate static governance check (which greps the YAML text) keeps matching -- documented in the merge commit message, not a functional gap |
| AC6 -- `package.json` has `"deploy:staging": "node scripts/deploy-staging.js"` | Yes | test `packageJsonHasDeployScript (AC6)`; confirmed directly in `package.json` line 33 | Unit test + direct file read | None |

## Scope Deviations

None. The story's own Out of Scope list (no changes to `fly.toml`/`fly.staging.toml` content; no production-deploy changes; no auto-rollback) was honoured -- `fly.toml`/`fly.staging.toml` are untouched by this change, and the production deploy job (`.github/workflows/staging-deploy.yml` line 320, `flyctl deploy --config fly.toml --app skills-framework`) still runs its separate raw command, unaffected, exactly as the story specifies.

## Test Plan Coverage

`check-dsn-s1-deploy-config-safety-net.js`: 8 passed, 0 failed (freshly re-run 2026-08-17). All 8 tests map 1:1 to the six ACs (AC3 has three tests: missing flag, wrong value, and a bonus case for the deploy command itself failing).

## NFR Status

| NFR | Status |
|-----|--------|
| Reliability | Met -- the script converts the prior silent, multi-hour-undetected config regression into an immediate, loud, non-zero-exit failure with an actionable message (verified by AC3 tests). |
| Simplicity | Met -- no new dependencies; the script wraps two existing `flyctl` CLI invocations plus a JSON parse, using an injectable command-runner adapter for testability. |

## Metric Signal

No `benefit-metric` artefact is referenced by this story (it is a short-track infra reliability fix responding to a recurring incident found via capture-log review, not a standard-track feature with a defined benefit metric). The story's own success signal -- no further silent-config-drift incidents on `wuce-staging` -- is not independently re-verified as part of this retroactive DoD pass.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Implementation follows the D37 injectable-adapter rule correctly (stub command runner throws rather than silently no-opping). No incidents of this class have surfaced in `workspace/capture-log.md` since the 2026-07-25 merge, consistent with the fix working as intended, though this was not independently re-checked beyond the fresh test run cited above.
