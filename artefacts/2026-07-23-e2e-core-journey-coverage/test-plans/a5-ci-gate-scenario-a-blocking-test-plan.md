## Test Plan: Wire Scenario A as a CI-blocking gate

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a5-ci-gate-scenario-a-blocking.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A broken PR is blocked from merging | — | 1 test | — | 1 scenario | External-dependency | 🟡 |
| AC2 | A clean PR passes and isn't blocked | — | 1 test | — | 1 scenario | External-dependency | 🟡 |
| AC3 | Existing 29 specs remain non-blocking | — | 1 test | — | — | — | 🟢 |
| AC4 | Gate enablement is config-driven via `context.yml` | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|---------|
| Whether GitHub branch protection actually blocks a merge on a real failing status check can only be fully proven by a real PR against the live repository's branch protection rules, not a unit/integration test in the codebase | AC1, AC2 | External-dependency | Branch protection enforcement is a GitHub platform behaviour, external to this repo's own test suite | Integration test statically asserts the workflow YAML and required-status-checks configuration are correct (job present, no `continue-on-error`, listed as required); a manual scenario during DoD/smoke test rehearses an actual red and green PR to confirm real blocking behaviour once |

---

## Test Data Strategy

**Source:** Fixtures (repo config files: `.github/workflows/e2e.yml`, `.github/context.yml`, GitHub branch protection API response)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The new CI job's workflow YAML config | Fixtures (repo file) | None | |
| AC2 | Same | Fixtures | None | |
| AC3 | The existing 29-spec job's workflow YAML config | Fixtures | None | Regression check — must remain unchanged |
| AC4 | `.github/context.yml` | Fixtures | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the External-dependency gap already recorded above.

---

## Unit Tests

None.

---

## Integration Tests

### New Scenario A CI job has no `continue-on-error` and is a required status check

- **Verifies:** AC1, AC2
- **Components involved:** `.github/workflows/e2e.yml`, GitHub branch protection settings (via `gh api repos/:owner/:repo/branches/master/protection`)
- **Precondition:** The new Scenario A job is added to the workflow
- **Action:** A Node script parses the workflow YAML for the new job and asserts no `continue-on-error: true` is set; separately queries the GitHub API for the branch protection rule's required status checks list
- **Expected result:** The new job has no `continue-on-error`, and its check name appears in the required status checks list — the structural precondition for AC1 (blocks on failure) and AC2 (passes cleanly, doesn't block) to be true

### Existing 29 local-mocked specs remain non-blocking

- **Verifies:** AC3
- **Components involved:** `.github/workflows/e2e.yml`'s pre-existing job
- **Precondition:** This story's change is additive only
- **Action:** A Node script diffs the pre-existing job's configuration (specifically its `continue-on-error` and required-status-check membership) against its state before this story
- **Expected result:** No change — the pre-existing job's non-blocking configuration is untouched

### Gate enablement is config-driven via `context.yml`

- **Verifies:** AC4
- **Components involved:** `.github/context.yml`, the workflow YAML's conditional gate on that config
- **Precondition:** The new job reads an explicit flag from `context.yml`
- **Action:** A Node script confirms the workflow YAML reads a `context.yml` field (not a hardcoded `true`/`false`) to decide whether the new job runs
- **Expected result:** The flag is present in `context.yml` and the workflow YAML references it, not a literal value

---

## E2E Tests

None — this story's behaviour is about CI/workflow configuration, not application behaviour in a browser.

---

## NFR Tests

### Scenario A CI job runtime stays under 5 minutes

- **NFR addressed:** Performance
- **Measurement method:** Read the actual CI job duration from a real GitHub Actions run once implemented (`gh run view` or the Actions UI)
- **Pass threshold:** < 5 minutes
- **Tool:** Manual/GitHub Actions UI — not a pre-implementation test since it requires a real run to measure

### None — confirmed for Security/Accessibility/Audit beyond what's already handled by A1's secrets-management NFR and this repo's existing CI observability conventions.

---

## Out of Scope for This Test Plan

- Adding Scenario B to this gate — that is B2
- Flipping the existing 29 specs to blocking — explicitly out of scope

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real branch-protection blocking behaviour can't be proven by a pre-implementation test | GitHub's merge-blocking enforcement is external platform behaviour | Integration tests assert the structural precondition (required check + no continue-on-error); a one-time manual red/green PR rehearsal at DoD confirms real behaviour |
