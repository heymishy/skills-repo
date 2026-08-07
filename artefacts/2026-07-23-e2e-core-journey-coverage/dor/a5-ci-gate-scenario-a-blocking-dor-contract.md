## Contract Proposal — Wire Scenario A as a CI-blocking gate

**What will be built:**
- A new job in `.github/workflows/e2e.yml` running A1-A4's combined spec files against real `wuce-staging`, gated on a new flag in `.github/context.yml` (e.g. `audit.staging_e2e_scenario_a: true`), with no `continue-on-error`.
- A branch protection update (via `gh api` or the GitHub UI) adding this job's check name to the required status checks list for `master`.
- Two Node scripts (non-Playwright) asserting the structural preconditions: no `continue-on-error` on the new job, and the pre-existing 29-spec job's config is unchanged.

**What will NOT be built:**
- Any change to the existing 29-spec job's blocking behaviour — additive only.
- Adding Scenario B to this gate — that is B2.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Manual: open a deliberately-broken throwaway PR, confirm it's blocked (one-time rehearsal at DoD) + Integration: static config assertion | Integration + Manual |
| AC2 | Manual: open a clean throwaway PR, confirm it passes (one-time rehearsal at DoD) + Integration: static config assertion | Integration + Manual |
| AC3 | Integration: diff the pre-existing job's config before/after this story | Integration |
| AC4 | Integration: assert the workflow YAML reads a `context.yml` field, not a hardcoded value | Integration |

**Assumptions:**
- The operator has (or will grant) permission to modify branch protection rules on `master` via `gh api` or the repository settings UI.
- A1-A4's spec files exist and pass locally before this story's CI wiring is implemented (sequencing dependency, not a blocking story-dependency).

**Estimated touch points:**
Files: `.github/workflows/e2e.yml`, `.github/context.yml`, `tests/check-a5-ci-gate-config.js`
Services: GitHub Actions, GitHub branch protection API
APIs: `gh api repos/:owner/:repo/branches/master/protection`
