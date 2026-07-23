## Test Plan: Serialize the "Scenario A E2E (staging)" CI job's real-staging Playwright specs to eliminate CPU-contention-induced Stripe Checkout flake

**Story reference:** artefacts/2026-07-23-a2-stripe-ci-checkout-flake/stories/a2ccf-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `--workers=1` flag present on the scenario-a-staging-e2e job's run: line | — | — | — | 1 | — | 🟢 |
| AC2 | playwright.config.js unchanged / no global workers setting | — | — | — | 1 | — | 🟢 |
| AC3 | Local run of the fixed command: a2's 3 tests pass | — | — | 1 | — | — | 🟢 |
| AC4 | Real CI run of the fixed workflow: a2's 3 tests pass | — | — | 1 | — | Environment-dependent | 🟡 |
| AC5 | Full npm test: no new regressions | — | 1 | — | — | — | 🟢 |
| AC6 | Upload-artifact step's if: condition includes always() | — | — | — | 1 | — | 🟢 |

---

## Test Data Strategy

**Source:** No new fixtures. AC3/AC4 reuse the exact same real-staging E2E specs and fixtures (`tests/e2e/fixtures/staging-auth.js`) already established by a1-a4; AC1/AC2/AC6 are direct static reads of the changed workflow YAML and unchanged config file.
**PCI/sensitivity in scope:** No.
**Availability:** AC1, AC2, AC5, AC6 available now, fully deterministic, no staging dependency. AC3 requires real `wuce-staging` reachability from this session's environment (already confirmed reachable, `curl` returned HTTP 200). AC4 requires a real GitHub Actions run to complete on the fix branch's PR — reported honestly as not-yet-observed if it cannot complete within this session, not fabricated as passing.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `.github/workflows/e2e.yml` file content | Repo file | None | Static grep/read check |
| AC2 | `playwright.config.js` file content | Repo file | None | Static grep/read check; diff against pre-fix version |
| AC3 | Real staging tenant signups (email/password, `e2e-test-` tagged) | Real `wuce-staging` | None | Uses existing `signUpEmail`/`loginEmail` fixtures |
| AC4 | Real GitHub Actions run of the fix branch's own PR | Real CI | None | The only verification that actually matters for a CI-environment-specific defect |
| AC5 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |
| AC6 | `.github/workflows/e2e.yml` file content (the upload step's `if:` line) | Repo file | None | Static read check |

### PCI / sensitivity constraints

None.

### Gaps

AC4 depends on a live GitHub Actions run completing within this session and on real `wuce-staging`/Stripe's real test-mode API being reachable and behaving consistently with the earlier failing run. If the real CI run cannot be observed to pass for any reason (including a genuinely unresolvable third-party constraint, e.g. Stripe itself blocking GitHub Actions' IP ranges), this is reported honestly as a real, unresolved finding — not papered over by weakening AC3's local pass into a substitute for AC4.

---

## Unit Tests

None — this fix is CI/workflow configuration only; there is no unit-testable application code path affected. AC1/AC2/AC6 are covered as direct static file-content checks (see "Manual" column above), not framework-driven unit tests, consistent with this story's CI-infrastructure-only scope.

---

## Integration Tests

### IT1 — full existing regression suite (AC5)
- **Verifies:** AC5
- **Action:** Run `npm test`.
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`. This fix touches only `.github/workflows/e2e.yml` (not exercised by `npm test`), so this is expected to be an unchanged-baseline confirmation, run to honestly rule out any accidental collateral effect.

---

## E2E / Manual Tests

### E2E1 — local reproduction: default (unspecified) worker count vs. `--workers=1` (root-cause confirmation, precedes the fix)
- **Verifies:** the story's root-cause claim, ahead of AC3/AC4
- **Action:** Run the exact 4-spec command against real `wuce-staging`, once with Playwright's default worker count and once with `--workers=1` explicitly.
- **Expected result:** the default-worker run reproduces `a2` failures consistent with (or at minimum, not contradicting) the CI failure signature; the `--workers=1` run passes `a2`'s 3 tests cleanly. (Performed and recorded in decisions.md before this test plan was finalized, per this story's short-track TDD-adjacent discipline for a CI-config fix — there is no application "RED" state to capture since no application code changes; the "RED" here is the reproducible CI-environment flake itself.)

### E2E2 — local run of the fixed command (AC3)
- **Verifies:** AC3
- **Action:** Run `npx playwright test tests/e2e/a1-staging-auth-stub.spec.js tests/e2e/a2-stripe-test-mode-plan-selection.spec.js tests/e2e/a3-product-feature-ideate-canvas.spec.js tests/e2e/a4-ideate-session-resume.spec.js --workers=1` against real `wuce-staging`.
- **Expected result:** `a2`'s 3 tests (AC1, AC2, AC3) all pass. Any unrelated `a1`/`a3`/`a4` skip/fail (credits-upsert gap, local per-IP rate-limit exhaustion from this session's own repeated runs) reported honestly, not silently absorbed into this story's own pass/fail claim.

### E2E3 — real CI run of the fixed workflow (AC4)
- **Verifies:** AC4
- **Action:** Push the fix branch, open a draft PR, wait for the "Scenario A E2E (staging)" check to complete, then inspect its log directly (`gh run view --job <id> --log-failed` or the full log if the job passes).
- **Expected result:** `a2`'s 3 tests are not among any failures in the real CI run. This is the only verification that actually matters for a defect this story has determined to be CI-environment-specific — a local pass (E2E2) alone does not prove the fix, since the original defect never reproduced locally under normal (non-forced) conditions either.

### M1 — static checks (AC1, AC2, AC6)
- **Verifies:** AC1, AC2, AC6
- **Action:** Read `.github/workflows/e2e.yml` and `playwright.config.js` directly.
- **Expected result:** `--workers=1` present on exactly the `scenario-a-staging-e2e` job's `run:` line for the 4-spec command; no other `run:` line (including the non-blocking `e2e` job's) is changed; `playwright.config.js` has no new `workers` field; the "Upload Playwright traces and screenshots on failure" step under `scenario-a-staging-e2e` has `always() &&` prepended to its `if:` condition.

---

## NFR Tests

None beyond IT1 (no new NFR-specific behaviour — this is a CI job concurrency-configuration change only).

---

## Out of Scope for This Test Plan

- Re-verifying a1/a3/a4's own already-known-open findings (credits-upsert gap, a4 NFR-Security staging-freshness question) — both pre-existing and unrelated to this fix.
- Any test of `a2-stripe-test-mode-plan-selection.spec.js`'s own assertion logic — unchanged by this story.
- Fully isolating the exact concurrency-coupled mechanism (CPU contention vs. any other factor uniquely present under 2-worker execution) beyond what Architecture Constraints in the story already documents — the fix (serialize this job) is identical regardless.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| E2E3/AC4 depends on a live GitHub Actions run completing within this session | CI queue time, GitHub Actions availability, and real Stripe/staging reachability are not guaranteed at test-plan-authoring time | Contingency requires explicit "not yet observed" reporting rather than a fabricated pass; E2E2/AC3 provides a same-command local signal (imperfect proxy — the original defect never reproduced locally under default conditions either — but still evidence of no regression from the fix itself) |
| No CI-run trace/screenshot was recoverable from the original failing run (upload step skipped due to the AC6 defect) | Discovered mid-investigation, itself the subject of AC6 | AC6's fix ensures any future failure of this job produces real diagnostic artifacts; this session's root-cause conclusion instead relies on log-signature analysis plus a controlled local `--workers=1` vs. default comparison |
