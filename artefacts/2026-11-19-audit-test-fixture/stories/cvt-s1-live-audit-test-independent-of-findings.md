## Story: The live npm audit test checks the shape of the audit, not which packages happen to be vulnerable today

**Epic reference:** None - short-track (test repair)
**Discovery reference:** None - short-track skips discovery. Evidence: pull request 1159 failed `Lint, typecheck, test, build` on 2026-11-19 with `tests/check-coha-s3-vulnerability-ci-step.js` (case `fullAuditStepRunsAgainstRealRepoDependencyTree`) and `tests/check-bkn-s1-bookkeeping-push-noise.js` (T5, which re-runs the coha-s3 test). The live `npm audit` now reports 0 critical, 1 low and 2 moderate; the test required a critical `dompurify` finding. The same failure reproduces on master, so no pull request can pass the unit job until it is fixed.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci]

## User Story

As **the operator who merges pull requests**,
I want **the test that runs a real `npm audit` to pass whatever the registry currently reports**,
So that **a security advisory being fixed upstream cannot turn master red and block every pull request**.

## Benefit Linkage

**Metric moved:** unit job failures caused by something other than the pull request (today: any change in the live advisory database).
**How:** the case keeps proving what it was written to prove (the audit command runs against this repo's real dependency tree and returns a result the vulnerability check can read) and stops requiring one named package to be critical.

## Architecture Constraints

- Change confined to `tests/check-coha-s3-vulnerability-ci-step.js` (the one case) and one new test. No change to `scripts/check-vulnerability-findings.js`, the workflow, or any other test.
- The case still runs the real `npm audit --audit-level=high --json` in the repo root; it is not replaced by a fixture, because proving the real command and the real output shape is its purpose. The fixture-based cases above it already cover the finding logic.
- It still needs the registry: if the registry is unreachable the case fails, as before (that is the behaviour the sibling case "ciJobFailsEndToEnd_onSimulatedRegistryOutage" separately guards).

## Dependencies

- **Upstream:** none. **Downstream:** pull request 1159 (fhc-s1) and every later pull request.

## Acceptance Criteria

**AC1:** Given the real `npm audit` run, When its output is read, Then the case passes when the output parses, is not an audit-command error (`isAuditCommandError` is false), has a `vulnerabilities` object and a numeric `metadata.vulnerabilities.total`, and `filterNewHighOrCriticalFindings` accepts it and returns an array.
**AC2:** Given the case, When its source is read, Then it names no specific package as a required finding (no `vulnerabilities.dompurify` and no `'critical'` requirement in that case).
**AC3:** Given the audit output is a registry error or is not JSON, When the case runs, Then it still fails (the repaired case is not vacuous). Verified by running the same assertion against `{ error: {...} }` and against a non-object.
**AC4:** Given `tests/check-coha-s3-vulnerability-ci-step.js` and `tests/check-bkn-s1-bookkeeping-push-noise.js`, When each is run, Then each exits 0.

## Out of Scope

- Fixing or upgrading any vulnerable dependency, and the vulnerability-check script itself.
- Replacing the real `npm audit` with a recorded fixture.
- Other tests that depend on live external state (none found by this story; not searched for).

## NFRs

- **Reliability:** the case no longer changes result when the advisory database changes.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
