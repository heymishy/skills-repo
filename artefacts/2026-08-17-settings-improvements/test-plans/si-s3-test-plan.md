## Test Plan: Confirm the Stripe billing portal satisfies the "manage my plan" ask

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s3-confirm-billing-portal-sufficient.md
**Epic reference:** artefacts/2026-08-17-settings-improvements/epics/settings-improvements.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `bpe-s1`/`bse-s1` regression suites still pass, no regression from si-s1/si-s2 | — | Re-run existing suites | — | — | — | 🟢 |
| AC2 | Live: no-billing-account error banner still renders correctly on staging | — | — | — | 1 scenario | External-dependency | 🟡 |
| AC3 | Live: valid Stripe customer reaches the real portal successfully | — | — | — | 1 scenario | External-dependency | 🔴 |
| AC4 | DoD records the verified outcome (portal sufficient vs. genuine gap) | — | — | — | Procedural — done at DoD time, not a test scenario | Untestable-by-nature | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| No-billing-account error path, live on staging | AC2 | External-dependency | Requires a real staging deployment and a real authenticated account with no Stripe customer ID — `bpe-s1`/`bse-s1`'s own existing automated tests already cover the logic in isolation; this AC re-confirms it live, which by definition can't be a unit/integration test | Manual scenario — see AC verification script |
| Valid-Stripe-customer success path, live on staging | AC3 | External-dependency | Requires a real staging account with a real configured Stripe test-mode customer ID — no such fixture exists in the automated test suite, and this is genuinely the first time this specific path has ever been checked (bpe-s1/bse-s1 only tested error paths) | Manual scenario — see AC verification script. **RISK-ACCEPT logged** (`decisions.md`, 2026-08-17): fixture existence is not yet confirmed; a DoR PROCEED-BLOCKED condition is attached to AC3 in the story itself, per PAT-06 |

---

## Test Data Strategy

**Source:** Mixed — AC1 reuses existing automated fixtures (fake pool, per `bpe-s1`/`bse-s1`'s own test plans); AC2/AC3 require live staging accounts
**PCI/sensitivity in scope:** No — no card data is entered or observed by this story; verification only confirms the redirect/portal-reachability behaviour
**Availability:** AC1 available now. AC2 available now (an account with no billing setup is the default/easy state). AC3 **not yet confirmed available** — see gap table and RISK-ACCEPT
**Owner:** AC1 self-contained (existing suites). AC2/AC3 owner: Hamish King (staging account access)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | None — re-runs existing `bpe-s1`/`bse-s1` test files unmodified | Existing fake-pool fixtures already in those test files | None | |
| AC2 | A staging account authenticated with no Stripe customer ID configured | Any fresh/default staging account | None | Default state — no special setup needed |
| AC3 | A staging account authenticated WITH a valid Stripe test-mode customer ID configured | **Not yet confirmed to exist** | None | See RISK-ACCEPT in `decisions.md` and the PROCEED-BLOCKED condition on the story's AC3 |

### PCI / sensitivity constraints

None — Stripe test-mode only, no real card data involved at any point.

### Gaps

AC3's fixture (a staging account with a configured Stripe test-mode customer ID) is not yet confirmed to exist. Logged as RISK-ACCEPT in `artefacts/2026-08-17-settings-improvements/decisions.md` (2026-08-17); resolution deferred to `/definition-of-ready`, where the story cannot proceed until this is confirmed or provisioned (PROCEED-BLOCKED condition already added to the story).

---

## Unit Tests

None — this story has no new code paths of its own; it verifies existing, already-merged code.

---

## Integration Tests

### bpeS1BseS1RegressionSuitesStillPassAfterSiS1SiS2

- **Verifies:** AC1
- **Components involved:** `bpe-s1`'s and `bse-s1`'s existing test files (`tests/check-bpe-s1-*.js`, `tests/check-bse-s1-*.js`), unmodified
- **Precondition:** si-s1 and si-s2 implemented and merged
- **Action:** Re-run both existing test files as-is (no new test file needed — this is a regression re-run, not new coverage)
- **Expected result:** All previously-passing assertions in both files still pass, confirming si-s1/si-s2's changes to `settings.js` did not break the Billing tab's existing error-banner rendering

---

## NFR Tests

None — confirmed with story owner. This story verifies existing behaviour; it introduces no new NFR surface of its own.

---

## Out of Scope for This Test Plan

- Automated E2E browser test of AC2/AC3 — no E2E framework (Playwright/Cypress/Selenium) is confirmed configured for live-staging billing-portal checks in this session; handled as manual scenarios per Step 3a's option 2 (manual-only, since AC2/AC3 are also gated by real external Stripe state, not purely a tooling gap).
- Any new automated coverage of the Stripe portal's own internal behaviour — that's Stripe's own product, not this codebase's to test.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3's success-path fixture (staging account with configured Stripe customer ID) not yet confirmed | Requires operator knowledge of staging environment state, not determinable from this session | RISK-ACCEPT logged in `decisions.md`; PROCEED-BLOCKED condition added directly to the story's AC3, per PAT-06 — story cannot pass `/definition-of-ready` until resolved |
