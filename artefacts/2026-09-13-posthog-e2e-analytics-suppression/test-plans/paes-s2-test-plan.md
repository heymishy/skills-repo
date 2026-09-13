# Test Plan: Suppress PostHog feature-flag-evaluation analytics noise for E2E/synthetic test traffic (paes-s2)

**Story:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s2-suppress-feature-flag-eval-e2e-noise.md
**Track:** Short-track

---

## Test Cases

Extends the existing established harness in `tests/check-bri-s1.2-staging-prod-separation.js` (`freshConfig()` / `FakePostHogCtor` pattern) with a new test group for E2E-identity suppression on the feature-flag pathway.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | `evaluateFlag(key, {tenantId: 'e2e-test-abc'})` calls the fake client's `isFeatureEnabled` with `sendFeatureFlagEvents: false` |
| T2 | AC1 | Behavioural | `evaluateFlag(key, {tenantId: 'E2E-TEST-ABC'})` (case-insensitive) also sets `sendFeatureFlagEvents: false` |
| T3 | AC2 | Non-regression | `evaluateFlag(key, {tenantId: 'real-tenant'})` does NOT set `sendFeatureFlagEvents` at all (options object unchanged from pre-story shape) |
| T4 | AC2 | Non-regression | `evaluateFlag(key, {})` (no tenantId, falls back to `'anonymous'`) does NOT set `sendFeatureFlagEvents` |
| T5 | AC3 | Behavioural | `groupIdentify('tenant', 'e2e-test-tenant')` never calls the fake client's `groupIdentifyImmediate` |
| T6 | AC3 | Behavioural | `groupIdentify('tenant', 'e2e-test-tenant')` resolves without throwing |
| T7 | AC4 | Non-regression | `groupIdentify('tenant', 'real-tenant')` still calls `groupIdentifyImmediate` with the correct `groupType`/`groupKey` |
| T8 | AC5 | Behavioural | `posthog-server.js` exports `isE2ETestIdentity`; `posthog-config.js` imports it (no duplicate prefix-check literal in `posthog-config.js`'s own source) |
| T9 | AC1-AC4 | Non-regression | Full existing `check-bri-s1.2-staging-prod-separation.js` suite re-run unmodified — all pre-existing assertions still pass |

## Regression coverage

- `tests/check-bri-s1.2-staging-prod-separation.js` — full existing suite re-run unmodified.
- `tests/check-pla-s1-posthog-module.js` — re-run unmodified (confirms `isE2ETestIdentity`'s export does not change `posthog-server.js`'s own existing behaviour).

## Out of Scope (per story)

- `posthog-flags.js` changes.
- Retroactive purge of already-captured events.
- `e2e-test-` naming convention changes.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
