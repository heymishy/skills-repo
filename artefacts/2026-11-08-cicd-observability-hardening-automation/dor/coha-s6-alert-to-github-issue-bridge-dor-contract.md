# DoR Contract Proposal: Alert-to-GitHub-issue bridge for new production error issues

**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Date:** 2026-11-13
**Status:** APPROVED by Hamish King, Platform Owner, 2026-11-13
**schemaDepends:** [prStatus, dodStatus] (both present in `.github/pipeline-state.schema.json`; the upstream story coha-s5 is `prStatus: merged`, `dodStatus: complete`)

**What will be built:**
- A route handler `handlePostErrorBridge(req, res, deps)` in `src/web-ui/routes/error-bridge.js`, registered in `server.js` beside `/webhook/stripe` at the path `/webhook/error-alert`, with no session, its own shared-secret check (`crypto.timingSafeEqual`), exempt from the CSRF guard as the Stripe route is, a 16 KB body cap read before parsing, and the status codes the ACs name.
- A store module `src/web-ui/modules/error-bridge-store.js` holding the `production_error_issues` logic (insert `pending` with claim time, mark `created`, conditional takeover after 2 minutes, lookup), and the boot migration `CREATE TABLE IF NOT EXISTS production_error_issues` added to `server.js` beside `credit_audit_log`, using the already-wired `_creditsPool`.
- An injectable GitHub adapter `src/web-ui/modules/error-bridge-github.js` with `createIssue`, `findIssueByMarker` and `setGithubIssueAdapter(fn)`; the default stub throws `Adapter not wired: error-bridge-github. Call setGithubIssueAdapter() with a real implementation before use.`
- The production wiring as its own task, separate from the handler task: `server.js` wires the real adapter (Bearer token from the environment, API base overridable for tests, bounded timeout) to the real implementation.
- Configuration by environment variables read at startup: `ERROR_BRIDGE_SECRET`, `ERROR_BRIDGE_GITHUB_TOKEN`, `ERROR_BRIDGE_REPO` (owner and name). The first two are Fly secrets set by the operator; none is ever logged.
- `tests/check-coha-s6-error-bridge.js` (U1 to U24, I1, I2, N1 to N4, and the gated P1 to P7) and `tests/fixtures/coha-s6-bridge-payload.json` copied from the reference fixture. The implementation plan decides whether the file joins `SEQUENTIAL_EXCLUSIVE_LIST` in `scripts/run-all-tests.js` by running the full suite on 2 CPUs.
- Operator-run, after merge: one PostHog error-tracking alert with a `template-webhook` destination (the disabled draft `01a1d3ce-ad2c-0000-64b2-d32e9b55609b` is repointed or replaced), headers set explicitly, the secret header through the secret-headers input; one live test run (AC6) with fresh approval; the AC9 check at the first real production error.

**What will NOT be built:**
Any use of PostHog's GitHub App or its native GitHub destination; incident records or the workflow (coha-s7); any change to `src/web-ui/modules/error-capture.js`, `posthog-config.js`, `posthog-server.js` or `routes/billing.js` (the Stripe route is copied as a pattern, not edited); comment, close or reopen of issues; occurrence counts in issues; Teams notification.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 valid production body opens one labelled issue with fixed fields | U1 to U4 through the real handler with a fake adapter; I1 over real HTTP with a local fake GitHub API | unit, integration-real-code |
| AC2 no second issue on duplicate, simultaneous, restart, stuck pending | U5 to U9 with a fake pool; P1 to P4 against a real Postgres (local container, gated) | unit, integration-real-code |
| AC3 401, 405, 413 unparsed, 400 | U10 to U16 and I1 | unit, integration-real-code |
| AC4 staging or missing environment ignored with distinct logs | U17 to U19 and I1 | unit, integration-real-code |
| AC5 GitHub failure gives 503 and is retry-safe | U20 to U22, I2, P5 | unit, integration-real-code |
| AC6 live destination test run reaches the deployed bridge with the secret header | Verification script scenario 6, after deploy to staging, one approved run | live-verified |
| AC7 real startup path wired correctly | P6 and P7 (child process `server.js`, real Postgres, fake GitHub API) | integration-real-code |
| AC8 unwired adapter fails safely | U23 and U24 | unit |
| AC9 first real production error opens one issue and fills every field | Verification script scenario 9 | production-observed, deferred |

**Assumptions:**
1. A real Postgres is available locally at `/verify-completion` through Docker (evidence for AC2, AC5, AC7); if Docker is unavailable that is a stated blocker, not a pass.
2. `exception_timestamp`, `$exception_values[1]` and `environment` are set on a real `$error_tracking_issue_created` event as on the sample; only AC9 shows it.
3. An issues-only token may not be allowed to create a missing label; the operator creates `production-error` first (it did not exist on 2026-11-13).
4. The shared secret and the token are set as Fly secrets by the operator and never printed to the agent.
5. PostHog's retry behaviour on a 503 is undocumented; the 2-minute claim window is a chosen value.

**Estimated touch points:**
Files: `src/web-ui/server.js` (route, migration, wiring), `src/web-ui/routes/error-bridge.js` (new), `src/web-ui/modules/error-bridge-store.js` (new), `src/web-ui/modules/error-bridge-github.js` (new), `tests/check-coha-s6-error-bridge.js` (new), `tests/fixtures/coha-s6-bridge-payload.json` (new), possibly `scripts/run-all-tests.js`; artefacts and bookkeeping. Services: Fly secrets on staging then production, one PostHog alert, the repo's `production-error` label. APIs: GitHub Issues API (create issue, search issues), PostHog `error-tracking-alerts-*` and `cdp-functions-invocations-create`.
