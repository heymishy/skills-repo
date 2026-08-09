## Test Plan: Wire the agent-driven mode into CI against real staging

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s4-agent-driven-ci-wiring.md
**Epic reference:** artefacts/2026-08-09-rubber-duck-review-capture/epics/epic-1-rubber-duck-review-capture-mvp.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New CI job runs the mechanism against a curated real-staging scenario set | — | 1 test (workflow-structure) | — | 1 scenario (real CI run) | External-dependency | 🟡 |
| AC2 | Reuses existing e2e-test-admin identity/secrets pattern, no new mechanism | 1 test | — | — | — | — | 🟢 |
| AC3 | Invokes mgar-s1's force-on step before real LLM calls | 1 test | — | — | — | — | 🟢 |
| AC4 | Findings written to an operator-reviewed location, not auto-actioned | 1 test | — | — | — | — | 🟢 |
| AC5 | Opt-in flag gates the job; skips cleanly when unset | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in an automated unit/integration test | Handling |
|-----|----|----------|--------------------------|---------|
| The job's actual behaviour once it runs against real, live wuce-staging | AC1 | External-dependency | A workflow-structure test can confirm the YAML is wired correctly (job exists, correct triggers, correct steps in order) but cannot itself execute a real GitHub Actions run against a real deployed app | Manual scenario — after merge, trigger a real CI run (or wait for the next natural one) and confirm the job actually executes end to end, following the exact same pattern this session already used to verify `mgar-s1`'s AC5 via PR #693's real CI run |

---

## Test Data Strategy

**Source:** Fixtures — the workflow YAML itself is the primary artefact under test; structural/regex-based assertions against `.github/workflows/e2e.yml`, following the exact same pattern this repo already uses for `scenario-a-staging-e2e`/`scenario-b-staging-e2e` (`check-a5-ci-gate-config.js`/`check-b2-ci-gate-config.js`/`check-cif-s1.js`/`check-cif-s2.js`, referenced in `mgar-s1`'s own DoD).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — the workflow file structure can be asserted against without needing a real CI run for most ACs.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The workflow YAML's own job/step structure | `.github/workflows/e2e.yml` (real file, post-implementation) | None | Regex/string assertions, same convention as existing CI-gate-config tests |
| AC2 | Confirmation the job references the same `E2E_STAGING_*` secrets and `e2e-test-admin` identity pattern | Same file | None (secret *names*, never values, are asserted) | |
| AC3 | Confirmation the job calls `ensure-mock-gateway-on-ci.js` (or equivalent) before the review step | Same file | None | |
| AC4 | Confirmation the job writes findings somewhere reviewable (job summary, artifact upload, or an explicit "requires manual capture-log step" note) — and does not call any story/PR-creation API | Same file | None | |
| AC5 | Confirmation the opt-in flag check step exists and gates the rest of the job | Same file | None | Mirrors the exact structure of the existing `scenario-a-staging-e2e` flag check |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the AC1 real-CI-run manual step already noted above.

---

## Unit Tests

### workflowYaml_reusesE2eTestAdminSecretsPattern_noNewCredentialMechanism

- **Verifies:** AC2
- **Precondition:** `.github/workflows/e2e.yml` after this story's implementation
- **Action:** Parse the new job's `env:` block for the review step
- **Expected result:** References the same `E2E_STAGING_BASE_URL`, `E2E_STAGING_AUTH_STUB_SECRET`, `E2E_STAGING_ADMIN_PASSWORD` secret names already used by `scenario-a-staging-e2e`/`scenario-b-staging-e2e` — no new secret name introduced for authentication
- **Edge case:** No

### workflowYaml_invokesMockGatewayForceOnStep_beforeReviewStep

- **Verifies:** AC3
- **Precondition:** Same file
- **Action:** Parse job step order
- **Expected result:** A step running `ensure-mock-gateway-on-ci.js` (or equivalent) appears before the step that runs the agent-driven review — matching the exact ordering already confirmed in `mgar-s1`'s own DoD for the two existing staging jobs
- **Edge case:** No

### workflowYaml_findingsOutputLocation_isReviewableNotAutoActioned

- **Verifies:** AC4
- **Precondition:** Same file
- **Action:** Inspect the job's output-handling step(s)
- **Expected result:** Findings are written to a job summary, uploaded as an artifact, or explicitly deferred to a manual `capture-log.md` step — and no step in the job calls any story-creation, PR-creation, or auto-remediation API
- **Edge case:** No

### workflowYaml_optInFlagGatesJob_skipsCleanlyWhenUnset

- **Verifies:** AC5
- **Precondition:** Same file
- **Action:** Parse the job's opt-in flag check step and its conditional gating of subsequent steps
- **Expected result:** Matches the established `audit.staging_e2e_scenario_a`-style pattern exactly — when the flag is unset, subsequent steps are skipped with a clear log message, not silently or with an error
- **Edge case:** No

---

## Integration Tests

### workflowYaml_newJobStructure_matchesEstablishedTwoJobPattern

- **Verifies:** AC1
- **Components involved:** The new CI job's overall shape vs. `scenario-a-staging-e2e`/`scenario-b-staging-e2e`'s established shape
- **Precondition:** `.github/workflows/e2e.yml` after implementation
- **Action:** Compare job structure: `timeout-minutes`, `concurrency: deploy-group`, checkout/setup-node/install steps, opt-in flag check, force-on step, review step, cleanup step
- **Expected result:** The new job follows the same overall shape as the two existing staging jobs — no structural deviation introduced without reason
- **Expected result:** —

---

## NFR Tests

### jobTimeBudget_matchesEstablishedPrecedent

- **NFR addressed:** Performance
- **Measurement method:** Parse the job's `timeout-minutes` value
- **Pass threshold:** Matches `scenario-a-staging-e2e`'s existing `timeout-minutes: 10` (or is explicitly justified if different)
- **Tool:** YAML parse + assertion, same convention as existing CI-gate-config tests

### noNewCredentialMechanism_confirmedByAC2

- **NFR addressed:** Security
- **Measurement method:** See `workflowYaml_reusesE2eTestAdminSecretsPattern_noNewCredentialMechanism` above — this NFR is fully covered by AC2's own test, not duplicated here
- **Pass threshold:** N/A — see AC2
- **Tool:** N/A — see AC2

---

## Out of Scope for This Test Plan

- Expanding the curated scenario set beyond the initial small list
- Automatic story/PR creation from findings — explicitly excluded by AC4
- The human-narrated mode (Stories 1-2)
- Re-testing the agent-driven mechanism's own detection quality — Story 3's own test plan owns that; this story only tests the CI wiring around it

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's real-CI-run behaviour cannot be verified before a real workflow execution | GitHub Actions runs cannot be simulated locally with full fidelity | Manual post-merge verification, following the exact precedent already established for `mgar-s1`'s AC5 (confirmed via PR #693's real CI run, `gh run view`) |
