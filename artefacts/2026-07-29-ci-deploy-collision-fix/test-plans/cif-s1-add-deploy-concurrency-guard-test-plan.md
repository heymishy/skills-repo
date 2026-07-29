## Test Plan: Prevent a staging redeploy from racing a PR's real-staging E2E job

**Story reference:** artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s1-add-deploy-concurrency-guard.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Scenario A job has concurrency: deploy-group | 1 | — | — | — | — | 🟢 |
| AC2 | Scenario B job has concurrency: deploy-group | 1 | — | — | — | — | 🟢 |
| AC3 | Other jobs unchanged (no new concurrency) | 1 | — | — | — | — | 🟢 |
| AC4 | Both files remain valid YAML | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

**One genuine, permanent gap, documented rather than silently accepted:** there is no way to write an automated test that proves two GitHub Actions workflow runs actually queue against each other in practice — that behaviour is governed by GitHub's own concurrency-group implementation, not by anything in this repo. This test plan verifies the workflow YAML declares the correct configuration (static analysis), matching the same class of governance check this repo already uses for other CI-wiring assertions (e.g. `check-bri-s2.5`'s "--app wuce-staging" text check). The actual mutual-exclusion behaviour is implicitly confirmed by observing no further collision-pattern failures across future PRs — a real-world signal, not a test-suite one.

---

## Test Data Strategy

**Source:** The real workflow files themselves (`.github/workflows/e2e.yml`, `.github/workflows/staging-deploy.yml`) — static text/YAML analysis, no synthetic data needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1-AC4 | The real, current content of both workflow files | Repo files | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the one documented above.

---

## Unit Tests

### U1 — Scenario A and Scenario B jobs both declare concurrency: deploy-group (AC1, AC2)

- **Verifies:** AC1, AC2
- **Precondition:** `.github/workflows/e2e.yml` as shipped by this story
- **Action:** Parse the YAML, locate `jobs.scenario-a-staging-e2e` and `jobs.scenario-b-staging-e2e`
- **Expected result:** Both jobs have `concurrency: deploy-group` (or the equivalent object form `concurrency: { group: deploy-group }`), matching `staging-deploy.yml`'s `deploy-staging` job's own group name exactly (string equality, not just "some concurrency value")
- **Edge case:** No

### U2 — No new concurrency declarations on unrelated jobs (AC3)

- **Verifies:** AC3
- **Precondition:** Both workflow files as shipped
- **Action:** Parse the YAML, check `jobs.smoke-test`, `jobs.promote-to-prod` (`staging-deploy.yml`) and `jobs.e2e` (`e2e.yml`)
- **Expected result:** None of these three jobs have a `concurrency` key
- **Edge case:** Yes — the "don't over-apply the fix" check

### U3 — Both workflow files remain valid YAML (AC4)

- **Verifies:** AC4
- **Precondition:** Both workflow files as shipped
- **Action:** Parse both files with a YAML parser
- **Expected result:** No parse error for either file
- **Edge case:** No

---

## Integration Tests

None beyond the unit tests above — there is no live integration seam to test locally; the real proof is GitHub's own concurrency-group behaviour in production (see Coverage gaps).

---

## NFR Tests

None — no new NFRs beyond what's already covered by the story's own NFR section.

---

## Out of Scope for This Test Plan

- Proving the actual runtime mutual-exclusion behaviour (see Coverage gaps) — not testable locally, governed by GitHub Actions' own implementation.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot test actual cross-workflow queueing behaviour locally | GitHub Actions' concurrency-group implementation runs server-side, not reproducible in a local test run | Static YAML verification (this test plan) plus real-world observation on the next several PRs that touch Scenario A/B — if the collision pattern recurs after this ships, that's a signal the configuration is wrong, not that testing was skipped |
