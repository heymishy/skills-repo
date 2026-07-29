## Test Plan: Sequence Scenario B after Scenario A so they never simultaneously race for the shared concurrency slot

**Story reference:** artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s2-sequence-scenario-b-after-scenario-a.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | scenario-b-staging-e2e declares needs: scenario-a-staging-e2e | 1 | — | — | — | — | 🟢 |
| AC2 | Both jobs' concurrency: deploy-group unchanged | 1 | — | — | — | — | 🟢 |
| AC3 | No other job gains a new needs: edge | 1 | — | — | — | — | 🟢 |
| AC4 | Both files remain valid YAML | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

**One genuine, permanent gap, already documented in cif-s1's own test plan and reaffirmed here:** the actual GitHub-side concurrency-queue behaviour (does sequencing via `needs:` genuinely prevent the cancellation observed on PR #633?) cannot be proven by a static test — it is governed by GitHub Actions' own server-side implementation. This test plan verifies the YAML declares the correct dependency (static analysis); the real-world confirmation is the direct evidence already gathered on PR #633 itself (re-running the cancelled Scenario B job in isolation passed cleanly, confirming the mechanism) plus continued absence of the cancellation pattern on future PRs.

---

## Test Data Strategy

**Source:** The real workflow file (`.github/workflows/e2e.yml`) — static text/YAML analysis, no synthetic data needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1-AC4 | The real, current content of `e2e.yml` and `staging-deploy.yml` | Repo files | None | |

### Gaps

None beyond the one documented above.

---

## Unit Tests

### U1 — scenario-b-staging-e2e declares needs: scenario-a-staging-e2e (AC1)

- **Verifies:** AC1
- **Precondition:** `.github/workflows/e2e.yml` as shipped by this story
- **Action:** Parse the YAML, locate `jobs.scenario-b-staging-e2e`
- **Expected result:** Declares `needs: scenario-a-staging-e2e`
- **Edge case:** No

### U2 — Both jobs retain their existing concurrency: deploy-group (AC2)

- **Verifies:** AC2
- **Precondition:** `e2e.yml` as shipped
- **Action:** Parse `jobs.scenario-a-staging-e2e` and `jobs.scenario-b-staging-e2e`, extract `concurrency:` value from each
- **Expected result:** Both still declare `concurrency: deploy-group`, matching `staging-deploy.yml`'s `deploy-staging` group name (reuses cif-s1's own U1 assertion)
- **Edge case:** No

### U3 — No other job gains a new needs: edge (AC3)

- **Verifies:** AC3
- **Precondition:** Both workflow files as shipped
- **Action:** Parse `jobs.e2e` (`e2e.yml`) and `jobs.smoke-test`, `jobs.promote-to-prod`, `jobs.deploy-staging` (`staging-deploy.yml`)
- **Expected result:** None of these four jobs' `needs:` fields changed from their pre-story values (`e2e`: none; `smoke-test`: `deploy-staging`; `promote-to-prod`: `smoke-test`; `deploy-staging`: none)
- **Edge case:** Yes — the "don't accidentally re-sequence something else" check

### U4 — Both workflow files remain valid YAML (AC4)

- **Verifies:** AC4
- **Precondition:** Both workflow files as shipped
- **Action:** Parse both files, confirm a valid `jobs:` block with no conflict markers
- **Expected result:** No parse error for either file
- **Edge case:** No

---

## Integration Tests

None beyond the unit tests above — the real proof of value is already the direct evidence from PR #633 (see Coverage gaps).

---

## NFR Tests

None — no new NFRs beyond what's already covered by the story's own NFR section.

---

## Out of Scope for This Test Plan

- Proving the GitHub-side concurrency-queue behaviour genuinely changes as a result of this fix (see Coverage gaps) — not testable locally; confirmed by the PR #633 evidence already gathered and by continued absence of the cancellation pattern going forward.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot test actual cross-job concurrency-queue behaviour locally | GitHub Actions' concurrency-group implementation runs server-side, not reproducible in a local test run | Static YAML verification (this test plan) plus the direct PR #633 evidence already gathered (isolated re-run of the previously-cancelled job passed cleanly) and ongoing observation on future PRs |
