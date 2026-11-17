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

**2026-11-17 | EVIDENCE | AC8: two CI runs on one commit (`9666e2743`, pull request #1138); full detail in `evidence/ci-runs-1-and-2.md`**
- Run 1: 208 passed, 58 failed, 25 skipped of 291, 15.2 minutes. Run 2: 207 passed, 59 failed, 25 skipped, 14.9 minutes. The trial before this story was 186 passed, 90 failed, 32 skipped of 308 (the six staging-targeted specs, 17 tests, are now excluded).
- The same 58 tests failed in both runs (deterministic) across 29 spec files. One test differed: `spdr-s2-metric1-timing` (a timing regression guard) passed then failed, so it is flaky. 59 of 89 spec files had no failing or flaky test.
- Scenario A and Scenario B passed in both attempts; the new job summary, JSON report and coverage artifact were all produced on Linux (so the SIGTERM flush works in CI even though it cannot on Windows).
- Server coverage baseline from the browser suite alone: lines 63.3%, functions 40.9%, statements 63.3%, branches 57.8% of `src/web-ui` (170 files). `lpw-s2` must not drop below this when it chooses the required core.
- What the 58 remaining failures are: the groups the triage listed and this story deliberately did not fix (kanban board, model sessions, pods, the changed feature flows, `iwu2-right-panel-layout`, order-dependent `bri-s3.6`, and the singles); the list is in the evidence file.

**2026-11-17 | DECISION | Drop T2, keep the rest, and say so in the story**
The first-login test would have asserted something already true. AC2 now records the real cause; the order dependence belongs with the shared-state group in `lpw-s2` (specs that depend on what ran before them).

**2026-11-17 | DECISION | Non-blocking, same job name**
Making the job required is the operator's ruleset change and belongs to `lpw-s2`, after the suite is stable. The job keeps its name so nothing in the ruleset changes.

**2026-11-17 | DECISION | Coverage with `c8` through `npx`, pinned, job-only**
No dependency is added to `package.json`; if the server cannot flush V8 coverage on exit under Playwright's signal-based shutdown, fall back to route coverage only and record that.

**2026-11-17 | DECISION (lpw-s2) | The core is chosen by a stated rule from a per-spec measurement, not by hand**
**Context:** the operator wants a required core cherry-picked across specs by capability with no loss of capability or product coverage.
**Decision:** each local spec ran alone on a fresh server and its executed `src/web-ui` statements were recorded (`evidence/per-spec-coverage.md`). `scripts/select-core-specs.js` picks, first, the best passing spec for every capability, then more passing specs by new statements added until the next adds under 0.1 percentage point; specs that failed in the measurement or in either `lpw-s1` run are never chosen. Result: 27 spec files, 110 tests, 99.3% of the statements every passing spec reaches together (`evidence/core-coverage.md`).
**Rationale:** the browser specs differ little in server code (booting the server alone executes about 32% of the statements), so capability first and small unique gains second is the only stable way to pick; and the numbers make "no loss" checkable.

**2026-11-17 | DECISION (lpw-s2) | Journeys are not folded into Scenario A or B**
**Context:** the operator asked whether the cherry-pick consolidates scenarios into Scenario A and B.
**Decision:** no. Scenario A and B run a stub-authenticated, staging-style harness (six specs); the local specs use the mocked test server and its fake database. The matrix records, for each capability, which core, Scenario or quarantined spec protects it; a capability with none is a named gap.
**Rationale:** folding would mean rewriting specs for a different harness for no coverage gain; the measurement already shows the core covers the capabilities.

**2026-11-17 | FINDING (lpw-s2) | The first measurement was invalid, and the first core included four specs it should not have**
Both are recorded in `evidence/per-spec-coverage.md` and `evidence/core-runs.md`. The first measurement lost every spec after `design-definition-canvas-render` (a hung server on port 3999); the first core run failed on four specs the matrix builder failed to exclude (a CRLF pattern defect). Neither reached master.

**2026-11-17 | FINDING (lpw-s2) | The kanban and pod failures are stale specs, not one fixable environment cause**
**Evidence:** the kanban specs (`bmau-s1`, `psh-s6`, `s1.1`, `s1.2`, `s3.1`, `s3.2`) look for cards by `data-journey-id`, which the board no longer renders (`kanban-view.js` builds feature-rollup cards). The pod specs (`ep1-s1`, `ep1-s2`, `ep1-s3-feature-pod-inheritance`, `ep4-s1`) search the hardcoded roster ("Hamish"), but the roster now comes from `GET /api/team/members` (rtri-s2). Model-session specs (`ep3-s1`, `rdac-s1`, `design-definition-canvas-render`, `ep2-s1-presence-sidebar`) wait on a real model turn.
**Decision:** quarantine with reason, owner and a review date of 2026-12-15; none fixed in this story. They need rewriting against current product behaviour, which is a story of their own per group.
**Gaps this leaves (no passing core spec):** pods, reference-and-stories, kanban-interaction, feature-creation.

**2026-11-17 | RETIRE CANDIDATES (for the operator to decide; nothing deleted)** `reference-upload` (7 tests) and `dsda-s1-default-all-stories`: they test a chat flow that has changed. `iwu2-right-panel-layout` (7 tests): its elements are not in the page it opens.

**2026-11-17 | RECOMMENDATION (lpw-s2) | The largest single loss is `ep2-s2-stage-visibility`**
It holds 1119 statements no other spec executes. It passes alone and failed in the core run with a browser crash ("page closed"), so it is quarantined as order- or environment-dependent. Isolating that cause is the highest-value follow-up for coverage.

**2026-11-17 | NOTE (lpw-s2) | The core job is a separate workflow, and not yet required**
`tests/check-b2-ci-gate-config.js` pins the exact job list of `e2e.yml`, so `Core browser tests` lives in `.github/workflows/core-browser-tests.yml`. It blocks (no `continue-on-error`) but is not in the ruleset; adding it is the operator's change after it has been green on real pull requests.
