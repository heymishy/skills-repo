# Contract Proposal - Scenario A and B end-to-end tests on the PR's own build

**What will be built:**
- `.github/workflows/e2e.yml`: the `scenario-a-staging-e2e` and `scenario-b-staging-e2e` jobs boot the PR's server in the runner (Postgres service container, `MOCK_LLM_GATEWAY=true`, generated stub secret, local base URL), run the unchanged spec lists, drop the staging secrets, the `deploy-group` concurrency and the mock-gateway and tenant-purge steps that exist only for shared staging, and upload the server log with the traces on failure; Scenario B drops `needs: scenario-a-staging-e2e`. Display names unchanged.
- `.github/workflows/staging-deploy.yml`: `promote-to-prod` `needs: [smoke-test, post-deploy-e2e-confirm]`; header comment updated.
- `scripts/check-no-prod-deploy-on-push.js` and `tests/check-bri-s2.6-smoke-test-promote-gate.js`: updated only if they assert the old single `needs: smoke-test`.
- `tests/check-sep-s1-scenarios-on-pr-build.js` (new, T1 to T4).
- `artefacts/2026-11-17-scenario-e2e-on-pr-build/decisions.md` records every spec or setup change the first CI runs force, and why.

**What will NOT be built:**
- No change to application source under `src/`; no change to the required status check names or the ruleset; no edit to a spec except for a staging-only value, each recorded; no change to `context.yml` flags; no new npm dependency; no change to `post-deploy-e2e-confirm` itself.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit (workflow text) |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4 and the two guard tests | unit |
| AC5 | this PR's CI, three reruns | CI evidence |
| AC6 | a deliberate break pushed and reverted on this PR | CI evidence |
| AC7 | verification script on the next real deploy | live |

**Assumptions:** the display names are the required status checks (read from the repo ruleset on 2026-11-17: `Run assurance gate`, `Scenario A E2E (staging)`, `Scenario B E2E (staging)`); the specs reach the app only through `E2E_STAGING_BASE_URL`, `E2E_STAGING_AUTH_STUB_SECRET` and `E2E_STAGING_ADMIN_PASSWORD` (a1 header: "overridable via E2E_STAGING_BASE_URL for local verification against a production-mode server"); the server starts with only `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `SESSION_SECRET` (read from `config/validate-env.js`). Exclusion list has zero test assertions against it (B1/D1): only the workflow files, the two guards and the new test are asserted.

`schemaDepends: []`. **Estimated touch points:** Files: `.github/workflows/e2e.yml`, `.github/workflows/staging-deploy.yml`, the two guards if needed, `tests/check-sep-s1-scenarios-on-pr-build.js` (new), `decisions.md`. Services: GitHub Actions only. APIs: none changed.
