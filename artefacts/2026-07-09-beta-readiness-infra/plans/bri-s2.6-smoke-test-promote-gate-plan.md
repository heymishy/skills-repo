# Add staging smoke test + manual promote gate to prod — Implementation Plan

<!--
  Produced by /implementation-plan. Consumed by /tdd.
  Save to: artefacts/2026-07-09-beta-readiness-infra/plans/bri-s2.6-smoke-test-promote-gate-plan.md
-->

> **For agent execution:** Use /tdd per task (single session; no subagents available in this environment).

**Goal:** Make every test in `artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.6-smoke-test-promote-gate-test-plan.md` pass — add a `smoke-test` job to `.github/workflows/staging-deploy.yml` that runs the currently-available `@mocked`-tagged Playwright suite against the staging URL after the seed step, and a `promote-to-prod` job gated behind a `needs:` dependency on the smoke-test job succeeding plus a GitHub Actions `environment:` requiring Hamish's reviewer approval, with a rollback runbook documenting concrete recovery commands.
**Branch:** `feature/bri-s2.6`
**Worktree:** `.worktrees/bri-s2.6`
**Test command:** `node tests/check-bri-s2.6-smoke-test-promote-gate.js` (per-file); `node scripts/run-all-tests.js` (full suite, delta-check only — see decisions.md 2026-07-11/07-12 RISK-ACCEPT baseline entries)

**Repo-fact corrections applied (verified directly against `origin/master`, not the operator's stale local `master`):**
- `origin/master` already has bri-s2.5's `.github/workflows/staging-deploy.yml` (job id `deploy-staging`), `scripts/check-no-prod-deploy-on-push.js` (exports `findProdDeployViolations`, `ALLOWLISTED_JOB_IDS: ['promote-to-prod']`, `PROD_APP_NAMES: ['wuce-prod', 'skills-framework']`), and Epic 3's `@mocked`-tagged Playwright specs (`tests/e2e/bri-s3.2/.4/.5/.6-*.spec.js`) — despite `pipeline-state.json` still showing several of these stories as `dor-signed-off`/`pr: draft` (the documented epic-nested bookkeeping timing bug; state reconciliation is a separate follow-up, not this task).
- The real production Fly app name is `skills-framework` (`fly.toml`'s `app = 'skills-framework'`), not `wuce-prod` — `wuce-prod` is the story/ACs' placeholder vocabulary. `scripts/check-no-prod-deploy-on-push.js` already accounts for both names. The promote job below deploys with `--app skills-framework --config fly.toml`.
- `playwright.config.js`'s `use.baseURL` reads `process.env.E2E_BASE_URL` (defaulting to `http://localhost:3999`); this is the existing, already-used convention (see `tests/e2e/bri-s3.4-*.spec.js` line 46) for pointing specs at a different origin. The smoke-test job sets `E2E_BASE_URL` to the staging URL (`https://wuce-staging.fly.dev`) rather than inventing a new `PLAYWRIGHT_BASE_URL` variable name, so it actually works with this repo's real config. `webServer` still boots a local server on 3999 in parallel (a pre-existing `playwright.config.js` limitation, not in this story's scope) — harmless but wasteful; noted as a decision, not fixed here.
- `job id convention: promote-to-prod` was already fixed by bri-s2.5's comments/allowlist before this story began — reused verbatim, not re-decided.

---

## File map

```
Create:
  tests/check-bri-s2.6-smoke-test-promote-gate.js  — T1-T8, NFR1, NFR2 (all 10 automated tests from the test plan)
  docs/rollback-runbook.md                          — AC4 concrete rollback commands

Modify:
  .github/workflows/staging-deploy.yml              — add smoke-test job (needs: deploy-staging) and
                                                        promote-to-prod job (needs: smoke-test, environment gate)
```

---

## Task 1: Write the failing test file (T1–T8, NFR1, NFR2)

**Files:**
- Create: `tests/check-bri-s2.6-smoke-test-promote-gate.js`

- [ ] **Step 1: Write the test file** — text/regex-based YAML assertions, no js-yaml dependency, reusing `findProdDeployViolations`/`ALLOWLISTED_JOB_IDS`/`PROD_APP_NAMES` from `scripts/check-no-prod-deploy-on-push.js` (established by bri-s2.5), consistent with this repo's no-external-deps convention.

- [ ] **Step 2: Run test — must fail (red)**

```bash
node tests/check-bri-s2.6-smoke-test-promote-gate.js
```

Expected: T1-T6, NFR1, NFR2 fail (no `smoke-test`/`promote-to-prod` jobs exist yet in `staging-deploy.yml`); T7-T8 fail (`docs/rollback-runbook.md` does not exist yet).

- [ ] **Step 3: Commit**

```bash
git add tests/check-bri-s2.6-smoke-test-promote-gate.js
git commit -m "test: add failing AC verification tests for bri-s2.6 smoke-test + promote gate (T1-T8, NFR1-2)"
```

---

## Task 2: Add smoke-test and promote-to-prod jobs to staging-deploy.yml

**Files:**
- Modify: `.github/workflows/staging-deploy.yml`

- [ ] **Step 1: Add the `smoke-test` job** — `needs: deploy-staging`, runs `npx playwright test --grep "@mocked"` with `E2E_BASE_URL` pointed at `https://wuce-staging.fly.dev`, `timeout-minutes: 10` (NFR1), no `continue-on-error`.

- [ ] **Step 2: Add the `promote-to-prod` job** — `needs: smoke-test`, `environment: production` (GitHub Actions environment gate — reviewer assignment is a repo Settings concern, see test plan Coverage gaps), no `if:` override, deploy step `flyctl deploy --remote-only --config fly.toml --app skills-framework`.

- [ ] **Step 3: Run test file — T1-T6, NFR1, NFR2 should now pass**

```bash
node tests/check-bri-s2.6-smoke-test-promote-gate.js
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/staging-deploy.yml
git commit -m "feat: add smoke-test + promote-to-prod gate jobs to staging-deploy.yml"
```

---

## Task 3: Write the rollback runbook (AC4)

**Files:**
- Create: `docs/rollback-runbook.md`

- [ ] **Step 1: Write the runbook** — concrete, copy-pasteable `fly releases --app skills-framework` and `fly releases rollback <version> --app skills-framework` (plus a `fly deploy --image ...` alternative), not narrative description.

- [ ] **Step 2: Run test file — T7, T8 should now pass; all 10 tests green**

```bash
node tests/check-bri-s2.6-smoke-test-promote-gate.js
```

- [ ] **Step 3: Commit**

```bash
git add docs/rollback-runbook.md
git commit -m "docs: add production rollback runbook (bri-s2.6 AC4)"
```

---

## Task 4: Full-suite delta check (no new regressions)

**Files:** None (verification only)

- [ ] **Step 1: Run the new test file standalone** — expect `10 passed, 0 failed`
- [ ] **Step 2: Run the full dynamic test suite and diff against the documented baseline** via `node scripts/run-all-tests.js`, confirming the failed-file list matches the known baseline (69-73 pre-existing, per decisions.md) with no new regressions attributable to this story's files.
- [ ] **Step 3: No commit needed** — proceed to /verify-completion.
