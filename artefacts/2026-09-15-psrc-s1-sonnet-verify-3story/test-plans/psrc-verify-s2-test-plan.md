## Test Plan: Deploy WUCE_MODEL_OVERRIDE Fly secrets for all 5 governance-critical skills, on both environments

**Story reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s2.md

---

## AC Coverage

| AC | Description | Manual | Gap type | Risk |
|----|-------------|--------|----------|------|
| AC1 | 5 secrets set on wuce-staging | 1 scenario | — | 🟢 |
| AC2 | 5 secrets set on production | 1 scenario | — | 🟢 |
| AC3 | Real resolved model is Sonnet on both | 1 scenario | — | 🟢 |
| AC4 | discovery/ideate unaffected | 1 scenario | — | 🟢 |

## Coverage gaps

None. This story is pure deployment/config — no code ships, so there is nothing to unit-test; verification is `fly secrets list` output plus a live PostHog `$ai_generation` check, both directly observable.

## Test Data Strategy

**Source:** Real Fly CLI commands against `wuce-staging` and `skills-framework` (production); real PostHog `$ai_generation` events from a live session against each.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained (operator-run).

## Manual Scenarios

### Scenario 1 — Secrets set on wuce-staging

**Verifies:** AC1
**Steps:** `fly secrets set WUCE_MODEL_OVERRIDE_DESIGN=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_DEFINITION=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_REVIEW=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-sonnet-4-6 WUCE_MODEL_OVERRIDE_DEFINITION_OF_READY=claude-sonnet-4-6 -a wuce-staging`.
**Expected:** `fly secrets list -a wuce-staging` shows all 5.

### Scenario 2 — Secrets set on production

**Verifies:** AC2
**Steps:** Same command with `-a skills-framework`.
**Expected:** `fly secrets list -a skills-framework` shows all 5.

### Scenario 3 — Real resolved model confirmed

**Verifies:** AC3
**Steps:** Run any of the 5 skills for real against each environment; pull the resulting `$ai_generation` PostHog event.
**Expected:** `$ai_model` is a Sonnet model id, not `claude-haiku-4-5`, on both environments.

### Scenario 4 — discovery/ideate unaffected

**Verifies:** AC4
**Steps:** Run `discovery` or `ideate` for real against either environment after the secrets are set.
**Expected:** Still resolves to Sonnet as before (unchanged) — confirmed via the same `$ai_generation` event check.

## Out of Scope for This Test Plan

- The verification that Sonnet fixes the underlying bug (`psrc-verify-s1`'s job — this story assumes that already passed).
- The drift guard (`psrc-verify-s3`'s job).

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
