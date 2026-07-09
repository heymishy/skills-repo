# Test Plan: Add staging smoke test + manual promote gate to prod

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `@mocked` suite runs against staging after seed, reports clear pass/fail before promotion is offered | 2 tests (YAML structure) | — | — | 1 scenario | External-dependency (partial) | 🟡 |
| AC2 | Green suite still requires explicit manual "approve promote" action | 2 tests (YAML structure) | — | — | 1 scenario | External-dependency | 🟡 |
| AC3 | Red suite structurally blocks the promote option, not just a warning | 2 tests (YAML structure) | — | — | 1 scenario | — | 🟢 |
| AC4 | Documented rollback path exists, usable without reconstructing from memory | 2 tests (doc existence/content) | — | — | 1 scenario | Untestable-by-nature (partial) | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's Node suite | Handling |
|-----|----|----------|--------------------------------------------|---------|
| Real GitHub Actions "environment protection rule" reviewer configuration | AC2 | External-dependency | Reviewer/approver assignment for a GitHub Actions `environment` is a repo Settings configuration, not expressible in the workflow YAML itself — the YAML can reference an environment name, but who can approve it is set in GitHub's UI | Manual scenario — confirm in repo Settings → Environments that the environment requires Hamish's approval, see AC verification script Scenario 2 🟡 |
| Actual execution of a rollback against a real bad promotion | AC4 | Untestable-by-nature | Deliberately causing and then rolling back a bad production deploy, just to verify the runbook works, is not something to do as part of routine test verification — it risks the exact outcome this story exists to prevent | Manual scenario — a documented walkthrough/dry-run of the rollback command against a non-critical release, not a live incident rehearsal, see AC verification script Scenario 4 🟡 |

---

## Test Data Strategy

**Source:** Fixtures — this story's testable surface is GitHub Actions workflow YAML (the promote job's structure and its dependency on the smoke-test job) plus a runbook/documentation file (AC4). No real staging/prod deploys are exercised by the automated suite.
**PCI/sensitivity in scope:** No
**Availability:** Available now for fixture-based YAML structure tests. The real workflow file and runbook do not exist yet — tests fail until implementation lands (TDD red state).
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The workflow YAML's smoke-test job definition | Repo file, once created | None | Depends on bri-s3.1 (mock LLM gateway) existing for a real `@mocked` suite to run — per the epic's documented cross-epic dependency, this story's own DoD covers whatever `@mocked` coverage exists at the time, not a fixed "full regression" claim |
| AC2 | The promote job's trigger/`environment:` configuration | Repo file | None | The job definition itself is testable; the human-reviewer assignment behind it is not (see gap) |
| AC3 | The promote job's `needs:`/conditional dependency on the smoke-test job | Repo file | None | GitHub Actions natively skips a job if its `needs:` dependency failed — this is a structurally testable YAML property |
| AC4 | A runbook document (e.g. `docs/rollback-runbook.md`) | Repo file, once created | None | Existence + presence of a concrete `fly releases`/`fly deploy --image` rollback command is testable; actually executing a rollback is not (see gap) |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the two flagged above — both are genuine infrastructure/process limitations, not missing fixtures.

---

## Unit Tests

### T1 — A workflow job runs the `@mocked`-tagged Playwright suite against the staging URL

- **Verifies:** AC1
- **Precondition:** The relevant workflow YAML (staging pipeline, extending S2.5's, or a dedicated smoke-test workflow) is parsed
- **Action:** Find the job that runs after the seed step (S2.4/S2.5). Inspect its step for a Playwright invocation filtered to `@mocked` (e.g. `npx playwright test --grep @mocked`), targeting the staging base URL (e.g. via a `PLAYWRIGHT_BASE_URL` env var pointed at `wuce-staging`'s `*.fly.dev` URL)
- **Expected result:** Such a step exists, runs after the seed step, and targets staging — not localhost or prod
- **Edge case:** No
- **Fails before implementation:** Yes — this job does not exist yet

---

### T2 — The smoke-test job reports a clear pass/fail result before the promote job is offered

- **Verifies:** AC1
- **Precondition:** Same as T1
- **Action:** Confirm the smoke-test job's step does not use `continue-on-error: true`, and that the promote job (see T3/T4 below) is ordered/gated after it, not in parallel
- **Expected result:** The smoke-test job's own pass/fail status is real (not silently swallowed) and is available before the promote job can run
- **Edge case:** No
- **Fails before implementation:** Yes

---

### T3 — The promote job requires a manual trigger or environment approval, not an automatic condition

- **Verifies:** AC2
- **Precondition:** Workflow YAML parsed
- **Action:** Inspect the promote job's trigger. Confirm it is either (a) a separate `workflow_dispatch`-triggered workflow (requiring a human to click "Run workflow"), or (b) a job within the staging pipeline gated behind an `environment:` key naming a GitHub Actions environment (which requires reviewer approval, configured in repo Settings — see AC verification script Scenario 2 for the settings-side confirmation)
- **Expected result:** The promote job is not reachable purely by the automatic `push`-to-`main` trigger completing — some additional gate (dispatch or environment) sits in front of it
- **Edge case:** No
- **Fails before implementation:** Yes

---

### T4 — The promote job does not deploy on the same trigger as the staging deploy

- **Verifies:** AC2 (a promote job with no gate would be indistinguishable from an automatic deploy)
- **Precondition:** Same as T3
- **Action:** Confirm the promote job and the staging deploy job (S2.5) are distinct jobs, and that the promote job's step referencing `--app wuce-prod` only exists within this gated job, not the automatic staging deploy job (cross-checked with S2.5's own AC4 static-analysis test, which asserts the same property from the opposite direction)
- **Expected result:** `--app wuce-prod` appears only inside the gated promote job
- **Edge case:** No
- **Fails before implementation:** Yes

---

### T5 — The promote job declares a `needs:` dependency on the smoke-test job

- **Verifies:** AC3
- **Precondition:** Workflow YAML parsed
- **Action:** Inspect the promote job's `needs:` key
- **Expected result:** The promote job's `needs:` list includes the smoke-test job's id — GitHub Actions will not run (and, depending on UI, will not offer) the promote job if the smoke-test job did not succeed
- **Edge case:** No
- **Fails before implementation:** Yes

---

### T6 — The promote job has no `if:` override that would let it run despite a failed smoke-test job

- **Verifies:** AC3 (guards against a common anti-pattern: `if: always()` on a dependent job, which would let it run even after an upstream failure)
- **Precondition:** Same as T5
- **Action:** Inspect the promote job's `if:` condition, if present
- **Expected result:** No `if: always()` (or equivalent unconditional-run override) is present on the promote job — its default GitHub Actions behaviour (skip on failed dependency) is left intact
- **Edge case:** Yes — this is the specific way a red-suite-blocks-promote AC could be quietly defeated
- **Fails before implementation:** Yes

---

### T7 — A rollback runbook document exists

- **Verifies:** AC4
- **Precondition:** None
- **Action:** `fs.existsSync` check for a runbook file (e.g. `docs/rollback-runbook.md`, or wherever the implementation notes for this story point)
- **Expected result:** The file exists
- **Edge case:** No
- **Fails before implementation:** Yes — the file does not exist yet

---

### T8 — The rollback runbook contains a concrete, copy-pasteable rollback command

- **Verifies:** AC4
- **Precondition:** T7 passes
- **Action:** Read the runbook's content; search for a `fly releases --app` command (to identify the previous known-good release) and a `fly deploy --image` (or `fly releases rollback`) command referencing `wuce-prod`
- **Expected result:** Both commands are present as literal, runnable text — not a vague narrative description like "revert the deploy somehow"
- **Edge case:** No
- **Fails before implementation:** Yes

---

## Integration Tests

None beyond the YAML-structure unit tests above — there is no in-repo component seam to integrate; the real integration point (staging suite → promote gate → prod) is inherently a GitHub Actions runtime behaviour, covered by the manual scenarios.

---

## NFR Tests

### NFR1 — Performance (suite completes before promote is offered, within CI budget)

- **NFR addressed:** Performance — the full staging suite completing before the promote gate is offered should not force an unreasonable wait; coordinate with Metric 6's `@mocked` suite runtime target (under 10 minutes)
- **Measurement method:** Inspect the smoke-test job's `timeout-minutes:` key in the workflow YAML
- **Pass threshold:** `timeout-minutes` is set to a value at or below 10 (matching the epic's Metric 6 target), or is otherwise explicitly documented as coordinated with that target
- **Tool:** Node.js YAML parse
- **Note:** This is a configuration-level proxy. The actual measured runtime of the suite is only observable once bri-s3.1 and later Epic 3 stories land and the suite has real content to run — flagged as a partial gap, not fabricated as a full automated timing test.

---

### NFR2 — Security (manual promote requires Hamish's own GitHub authentication)

- **NFR addressed:** Security — the manual promote action requires Hamish's own GitHub authentication; no service account or automated credential can trigger promotion
- **Measurement method:** T3 above (workflow-level gate) plus the manual confirmation in AC verification script Scenario 2 that the GitHub Actions environment's required reviewers list names Hamish specifically, not a bot/service account
- **Pass threshold:** Workflow YAML shows a gate requiring human interaction (T3); repo Settings show a named human reviewer, not a service account (manual)
- **Tool:** Node.js YAML parse + manual repo Settings check

---

### NFR3 — Accessibility

- **NFR addressed:** Not applicable (per story)
- **Measurement method:** N/A
- **Pass threshold:** N/A
- **Tool:** N/A

---

### NFR4 — Audit (every promote action recorded)

- **NFR addressed:** Every promote action (who approved, when, which staging run it was based on) is recorded in GitHub Actions' own run history; sufficient for a solo operator, no separate system needed
- **Measurement method:** N/A — no custom logging to test; GitHub Actions' built-in run history satisfies this by default for any `workflow_dispatch` or `environment`-gated job
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Actually running the smoke-test suite's content — the suite's own coverage is Epic 3's scope (bri-s3.1 onward); this plan only tests the *gate mechanics* around whatever suite exists
- Real GitHub Actions environment-reviewer configuration — repo Settings, not testable from this repo's Node suite (see Coverage gaps)
- Executing a real rollback as part of verification — deliberately not exercised live (see Coverage gaps)
- Automated rollback on post-promote failure detection — explicitly out of scope per story
- A staging-of-staging rehearsal tier — explicitly out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's suite coverage depends on Epic 3 stories not yet complete | Per the epic's own documented cross-epic dependency, S2.6 cannot reach DoD strictly before bri-s3.1 lands | T1/T2 test the *gate mechanics* (does a job run `--grep @mocked` against staging, does it report pass/fail) independent of how many specs currently carry that tag — this test plan does not assume a fixed suite size |
| AC2's environment-reviewer assignment is a repo-Settings concern, not YAML | GitHub Actions environment protection rules (who can approve) are configured outside the workflow file | Manual scenario confirms the setting directly in GitHub's UI |
| AC4's rollback path is intentionally never live-tested | Deliberately causing a bad prod deploy to test the rollback runbook risks the exact failure this story exists to prevent | Manual scenario is a documented dry-run/walkthrough (read the runbook, confirm the commands are copy-pasteable and correct against `fly releases --app wuce-prod` output), not a live incident rehearsal |
| NFR1's runtime budget is a config-level proxy, not a measured runtime | The suite has minimal content until Epic 3 lands, so there's nothing to time yet | Revisit with a real timing check once bri-s3.1 through the later Epic 3 stories are complete and the `@mocked` suite has meaningful size |
