# Contract Proposal - The local Playwright suite becomes a trustworthy, measured, non-blocking signal

**What will be built:**
- `src/web-ui/adapters/fake-test-db.js`: handlers for the `customer_journeys` and `customer_journey_stages` query shapes in `routes/journeys.js`, and for `github_first_login`.
- `src/web-ui/server.js`: in the existing `!process.env.DATABASE_URL` test branch, wire the first-login flags adapter to the fake database (its own task).
- `playwright.config.js`: pass the stub secret through to the webServer environment.
- `.github/workflows/e2e.yml` (the `e2e` job only): per-run stub secret, 30-minute limit, JSON report upload, report summary step, coverage collection with a pinned `c8`.
- `.github/context.yml`: `audit.e2e_tests: true`.
- `scripts/summarise-playwright-report.js` (new) and the four new tests named in the test plan.
- Spec fixes: port and `nav` text in `artefact-read`, `feature-navigation`, `wuce20`, `wuce23`, `wuce24`, `wuce25`; the focus-walk identity check in `csd-s2`; a shared fixture that connects a repository to a product (in `tests/e2e/fixtures/`) used by `frsr-s1` and tried on `pnfc-s1`, `ep3-s1`, `reference-upload`, `dsda-s1`.
- `artefacts/2026-11-17-local-playwright-suite-trust/decisions.md` with the evidence of two CI runs.

**What will NOT be built:**
- No production behaviour change, no change to real Postgres code paths, no new npm dependency (`c8` runs through `npx` in the job only), no change to Scenario A or B jobs, required checks or the ruleset, no quarantine or retirement of specs, no fix for the kanban, model-session or pod groups.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 plus the 8 specs in CI | unit + e2e |
| AC2 | T2 plus `bri-s3.6` AC1 | unit + boot probe + e2e |
| AC3 | T3 plus `b1`, `dsh-s4` in CI | unit + e2e |
| AC4 | T4 plus the 9 tests in CI | unit + e2e |
| AC5 | `frsr-s1` in CI plus a recorded outcome for four specs | e2e |
| AC6 | T3, T5, CI job summary | unit + CI |
| AC7 | T3, CI job summary | unit + CI |
| AC8 | two CI runs on one commit, recorded | live |

**Assumptions:** the fake database matches queries by SQL text (as the other handlers in the file do); the workflow's `e2e` job already runs `npm run test:e2e` with `NODE_ENV=test`; `E2E_STAGING_AUTH_STUB_SECRET` is the variable the fixture and the server's bypass already read; `c8` can read the V8 coverage directory the server writes on exit (the server is stopped by Playwright with a signal, so the exit path may need a flush; checked first).

`schemaDepends: []`. **Estimated touch points:** Files: about 20 (fake database, server wiring, config, one workflow, `context.yml`, one script, four tests, about 10 specs and one fixture). Services: GitHub Actions. APIs: none.

**Exclusion list check (B1/D1):** the excluded items (production code paths, ruleset, Scenario jobs, quarantine) have no test assertion against them.
