## Test Plan: Degrade gracefully when the PostHog flags adapter is unwired, instead of 500ing every gated page

**Story reference:** artefacts/2026-07-30-posthog-flag-graceful-degradation/stories/pfgd-s1-posthog-flag-graceful-degradation.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | isEnabledOrDefault resolves false, never throws, when unwired | 1 | `tests/check-posthog-flags-graceful-degradation.js` AC1 | 🟢 |
| AC2 | isEnabled() itself still throws the exact D37 message | 2 | Same file (new AC2) + existing `check-bri-s1.1-isenabled-helper.js` A3 (unchanged) | 🟢 |
| AC3 | isEnabledOrDefault returns the real result when wired+healthy | 2 | Same file, AC3/AC4 | 🟢 |
| AC4 | isEnabledOrDefault degrades to false on adapter throw (not unwired) | 1 | Same file, AC5 | 🟢 |
| AC5 | All 5 call sites degrade to their own existing disabled-flag path | — | Existing tests: `check-psh-s6-product-kanban.js`, `check-psh-s7-org-kanban.js`, `check-d1-start-impersonation-session.js`, `check-d4-nfr-security-review-and-hardening.js` (all already assert the "flag off" branch) | 🟢 |
| AC6 | No regressions | — | Full `run-all-tests.js` suite vs. `tests/known-baseline-failures.json` | 🟢 |

## Coverage gaps

None. This is a fully unit-testable change (no live staging/production dependency) — unlike most of this session's earlier fixes, this fix's correctness does not depend on observing a real deployed environment, since it's pure control-flow logic around an already-mockable adapter interface.

## Test Data Strategy

New test file (`check-posthog-flags-graceful-degradation.js`) reuses the exact same `freshFlags()` module-reload pattern already established in `check-bri-s1.1-isenabled-helper.js`.

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real production confirmation still pending | The operator is setting `POSTHOG_KEY_PROD` in parallel; once set, the adapter should wire successfully and none of these degraded paths should trigger in normal operation | Observe production logs after the secret is set — `[posthog-config] PostHog flags client wired to the production project` should appear with no further `Adapter not wired` errors; if this fix's degraded paths are ever hit again in the future (e.g. a real PostHog outage), that is the intended, correct behaviour, not a new bug |
