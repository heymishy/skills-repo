## Test Plan: Stop the deploy-group concurrency lock from silently cancelling E2E coverage

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
**Epic reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/epics/test-infra-fast-follow-batch.md
**Test plan author:** Copilot
**Date:** 2026-11-01

**Test runner confirmed from `package.json`:** `"test": "node scripts/run-all-tests.js"` — plain Node. If the implementation adds a new recovery script, it follows the same convention (its own decision-logic unit-tested via a `check-*.js` file).

**Test data strategy:** Synthetic — the recovery-decision logic (if it's extracted into its own testable function) is tested with synthetic cancellation-annotation strings, not real GitHub Actions API calls. No PCI/sensitive data.

**E2E / browser-layout scan:** N/A — pure CI workflow/GitHub Actions concern, no UI.

---

## Honest scoping note

This story's fix lives in GitHub Actions workflow YAML and/or a new recovery script — the actual trigger (a real concurrency-group eviction) can only be produced by two real, closely-timed GitHub Actions runs, which cannot be simulated locally or in a pre-merge unit test. What CAN be unit-tested is: (a) the workflow YAML's own concurrency-key scoping (a direct, static check), and (b) the recovery mechanism's own decision logic in isolation (given a cancellation signal, does it correctly decide to rerun) — if that logic is written as a separately-callable function rather than inlined into workflow YAML steps. The real end-to-end proof (AC1, AC3) requires observing real GitHub Actions runs, and AC4 explicitly requires 2 *subsequent* PRs after this one merges — which may not exist yet at this story's own `/definition-of-done` time.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Older push's E2E job doesn't end up silently skipped | — | — | — | 1 scenario | External-dependency | 🔴 |
| AC2 | Concurrency key stays scoped to the shared resource, not narrowed per-ref | 1 test | — | — | — | — | 🟢 |
| AC3 | A cancellation that still occurs auto-recovers | — | 1 test (decision logic only) | — | 1 scenario | External-dependency | 🟡 |
| AC4 | Zero unresolved cancellations across 2+ subsequent PRs | — | — | — | 1 scenario | External-dependency | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in CI | Handling |
|-----|----|----------|--------------------------|---------|
| Real concurrency-eviction trigger (AC1) | AC1 | External-dependency | Requires two real, closely-timed GitHub Actions runs against the real `deploy-group` — not reproducible locally or in a pre-merge unit test. | Manual — observed directly on this story's own PR if two pushes happen to land close together during its own development (the same pattern that already happened 3+ times this session), or on the first subsequent PR after merge. |
| Real end-to-end recovery (AC3, the trigger half) | AC3 | External-dependency | Same reason as AC1 — the recovery mechanism's own decision logic is unit-tested in isolation (see Unit Tests below), but firing it from a *real* cancelled run can't be forced pre-merge. | Manual — same as AC1. |
| 2+ subsequent PRs showing zero unresolved cancellations (AC4) | AC4 | External-dependency | By definition requires PRs that come *after* this one merges — may not exist yet at this story's own DoD time. | Recorded as `not-yet-measured` at this story's own DoD if no qualifying subsequent PR exists yet, with a follow-up action to re-check once 2 more PRs have landed — same handling this repo already uses for forward-looking metrics (e.g. the parent epic's own m7). |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC2 | The updated workflow YAML's own concurrency key | `.github/workflows/e2e.yml`, `staging-deploy.yml` | None | Direct file read |
| AC3 | A synthetic cancellation-annotation string matching the real GitHub pattern ("Canceling since a higher priority waiting request for deploy-group exists") | Synthetic, modeled on the real annotation text already captured in `decisions.md` elsewhere in this repo | None | Tests the decision function only, not a real API call |

### PCI / sensitivity constraints

None.

### Gaps

None for the testable portion. AC1/AC3's real-trigger half and AC4 are genuine real-world observation gaps, handled above.

---

## Unit Tests

### Concurrency key remains scoped to the shared resource, not narrowed to per-ref

- **Verifies:** AC2
- **Precondition:** The updated `.github/workflows/e2e.yml` and `.github/workflows/staging-deploy.yml`.
- **Action:** Read both files' `concurrency:` value for the relevant jobs.
- **Expected result:** The concurrency key is still the bare string `deploy-group` (or an equivalent that resolves identically for every PR/ref) — NOT a templated expression incorporating `github.ref`, `github.head_ref`, or any per-branch/per-PR variable.
- **Edge case:** No.

### Recovery decision logic correctly identifies a deploy-group eviction vs. a genuine failure

- **Verifies:** AC3 (decision-logic half only — see Coverage gaps for the real-trigger half)
- **Precondition:** The recovery mechanism's cancellation-detection logic is implemented as a separately-callable function (e.g. `isDeployGroupEviction(annotationText)`), not inlined into a workflow step with no testable seam.
- **Action:** Call the function with (a) the real annotation text pattern ("Canceling since a higher priority waiting request for deploy-group exists") and (b) a genuine failure message (e.g. "Process completed with exit code 1").
- **Expected result:** Returns `true` for (a), `false` for (b) — the mechanism never attempts to "rerun" a run that actually failed for a real reason.
- **Edge case:** Yes — (b) is the edge case proving the mechanism doesn't mask real failures as recoverable cancellations.

---

## Integration Tests

None beyond the decision-logic unit test above — the real integration point (a workflow trigger firing on a real cancelled run) is the External-dependency gap named above.

---

## NFR Tests

### Security — least-privilege CI permissions

- **NFR addressed:** Security
- **Measurement method:** Code review of the new/modified workflow's `permissions:` block at `/definition-of-ready` and `/review`.
- **Pass threshold:** The workflow only requests the specific permission scope needed to call the rerun mechanism (e.g. `actions: write` if using the GitHub Actions rerun API) — not broad `write-all` or unrelated scopes.
- **Tool:** Manual code review — no automated scanner configured for this in this repo.

### Performance — N/A

Not applicable per the story's own NFR section.

### Accessibility — N/A

No UI.

### Audit — N/A

No audit-relevant surface beyond the existing CI job history itself.

---

## Out of Scope for This Test Plan

- Any load-testing or stress-testing of the GitHub Actions concurrency mechanism itself — it's a GitHub platform behaviour, not this repo's own code to test.
- Ephemeral staging environments — out of scope per the story itself.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's and AC3's real-trigger half | Requires two real, closely-timed GitHub Actions runs | Manual observation on this story's own PR or the first subsequent PR |
| AC4's 2+ subsequent-PR observation | By definition requires PRs that don't exist yet at DoD time | Recorded as `not-yet-measured` with a named follow-up re-check, same handling as other forward-looking metrics in this repo |
