## Definition of Ready: sedf-s1 — Fix the post-deploy CI race between smoke-test and post-deploy-e2e-confirm

**Story:** artefacts/2026-08-10-post-deploy-e2e-race/stories/sedf-s1-fix-post-deploy-e2e-race.md
**Test plan:** artefacts/2026-08-10-post-deploy-e2e-race/test-plans/sedf-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- Modified: `.github/workflows/staging-deploy.yml` — `post-deploy-e2e-confirm`'s `needs:` and new job-level `if:`.
- Modified: `tests/check-pmec-s1-post-merge-e2e-confirmation.js` — U1's regex widened to accept the array `needs:` form.

**Files explicitly out of scope (must not be touched):**
- `.github/workflows/e2e.yml` — pre-merge PR-gate Scenario A/B jobs, unaffected.
- `promote-to-prod`'s own `needs:`/gating in `staging-deploy.yml` — unchanged.
- Any of the 3 flaky test files themselves (`a1-staging-auth-stub.spec.js`, `a3-product-feature-ideate-canvas.spec.js`, `bri-s3.2-signup-onboarding-journey.spec.js`) — not touched; this story fixes the race condition that caused their flakiness, not the tests themselves.

### Architecture Constraints

No new architectural decision — a `needs:`/`if:` sequencing change within an existing, already-governed CI workflow. No ADR required.

### Human oversight

**Low** — CI workflow YAML plus one existing test's regex widened; zero application code changes, zero production behaviour change.

### Coding Agent Instructions

1. `.github/workflows/staging-deploy.yml` — already updated: `post-deploy-e2e-confirm`'s `needs:` changed from `deploy-staging` to `[deploy-staging, smoke-test]`, with `if: ${{ always() && needs.deploy-staging.result == 'success' }}` added to preserve "always attempts after a successful deploy" semantics.
2. `tests/check-pmec-s1-post-merge-e2e-confirmation.js` — already updated: U1 now accepts either the single-value or array `needs:` form, still requiring `deploy-staging` be present.
3. Re-run `check-bri-s2.5-ci-pipeline-staging-deploy.js`, `check-bri-s2.6-smoke-test-promote-gate.js`, `check-pmec-s1-post-merge-e2e-confirmation.js` — zero regression required.
4. Post-merge: confirm the next staging-deploy run's job timestamps (`gh run view <id> --json jobs`) show `post-deploy-e2e-confirm` starting only after `smoke-test` completes, not concurrently.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — CI YAML change only)

**PROCEED: Yes**
