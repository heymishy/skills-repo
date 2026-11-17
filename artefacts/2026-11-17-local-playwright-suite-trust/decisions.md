# Decisions: the local Playwright suite becomes a trustworthy signal (lpw-s1)

**2026-11-17 | FINDING | The failures are mostly test-environment drift, not product defects**
**Evidence:** `artefacts/2026-11-17-testing-cicd-audit/spikes/playwright-local-suite-triage.md`. All 90 failures from the one-off run are grouped; the three suspected product defects (feature creation answering 409, first sign-in landing on the dashboard, a diagram focus trap) were checked and are test-side: an intentional "connect a repo" gate (das-s2), a fake database with no first-login table, and a focus-walk heuristic that compares tag, id and class.

**2026-11-17 | DECISION | Fix the shared causes first, then measure twice, and only then choose the required core**
**Context:** the operator wants a required core cherry-picked across specs by capability, with every capability and the product code coverage preserved.
**Decision:** this story fixes the shared test-environment causes, switches the job on non-blocking, and records two runs and a coverage baseline; the capability matrix, the required set and the quarantine list are the second story (`lpw-s2`).
**Rationale:** selecting tests from a suite where a third of the failures are drift would bake the drift into the selection. A baseline also makes "no loss of coverage" checkable.

**2026-11-17 | FINDING | The triage was wrong in two places, and the journey group had three causes, not one (found while building)**
**Evidence:** local runs with `NODE_ENV=test` against the eight journey-seeding specs.
- The eight specs failed first on a stale token source: they read their CSRF token from `/`, which now redirects to `/dashboard`, which embeds none, so `POST /journeys` answered 403 and the setup crashed on a missing `Location` header. The missing fake-database tables were the second cause (found only after the first was fixed), and `POST /journeys` now seeds five default stages (jae-s1), which broke the exact stage counts (8 where 3 were expected), the third cause. After all three fixes 15 of the 17 tests pass locally; `ep1-s3-stage-panel-focus-management` (the panel never gets its `--open` class) and `jcx-s6` AC1 (the grid header class appears twice, 6 where 3 are expected) are new, unexplained product-side differences, recorded and not fixed here.
- The triage said the fake database lacked first-login support. It does not: the test server already wires a first-login adapter (server.js, bri-s3.6). `bri-s3.6` AC1 passes alone and fails when run after `bri-s3.2` to `bri-s3.5` (reproduced locally), because the test server sets `TENANT_ORG_ALLOWLIST: 'e2e-shared-org'` for every spec, so a later identity lands in a tenant that already has an admin. State shared between specs, not a missing table.
- The `429 Too many attempts` came from the shared staging server, not the local one. `b1` and `dsh-s4` (and `a1` to `a4`) import `fixtures/staging-auth.js`, whose base URL defaults to `https://wuce-staging.fly.dev`; the local server already lifts its own signup limiter (`E2E_RATE_LIMIT_BYPASS`, read in `routes/auth-email.js`). So the one-off trial run, and any run with the local suite switched on, sent test traffic to shared staging from a pull request job. Fix: exclude the six staging-targeted specs (exactly the Scenario A and B specs) from the local suite; the earlier plan of a per-run stub secret for the local job was dropped as unnecessary.
- Feature creation: the "connect a repo" gate is passed with the existing `/test/seed-product-repo` endpoint. `pnfc-s1` then passes all 4 tests. `frsr-s1` passes the gate and fails later: the product page's feature list comes from a repository rollup (`product_rollups`) the fake database does not provide. `reference-upload` (7 tests) and `dsda-s1` land on the skill chat page where the specs expect the reference modal and the story list: the flow they test has changed. `ep3-s1` times out waiting for a skill session. Recorded; not fixed here.

**2026-11-17 | DECISION | Drop T2, keep the rest, and say so in the story**
The first-login test would have asserted something already true. AC2 now records the real cause; the order dependence belongs with the shared-state group in `lpw-s2` (specs that depend on what ran before them).

**2026-11-17 | DECISION | Non-blocking, same job name**
Making the job required is the operator's ruleset change and belongs to `lpw-s2`, after the suite is stable. The job keeps its name so nothing in the ruleset changes.

**2026-11-17 | DECISION | Coverage with `c8` through `npx`, pinned, job-only**
No dependency is added to `package.json`; if the server cannot flush V8 coverage on exit under Playwright's signal-based shutdown, fall back to route coverage only and record that.
