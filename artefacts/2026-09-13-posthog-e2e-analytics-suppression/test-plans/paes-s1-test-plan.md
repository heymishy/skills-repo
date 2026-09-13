# Test Plan: Suppress PostHog analytics capture for E2E/synthetic test traffic (paes-s1)

**Story:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s1-suppress-e2e-test-analytics.md
**Track:** Short-track

---

## Test Cases

Extends the existing established harness in `tests/check-pla-s1-posthog-module.js` (`installHttpsMock()` / `freshPosthog()` pattern) with a new test group for E2E-identity suppression, following this repo's convention of adding to the existing module test file rather than duplicating its mock infrastructure in a new sibling file.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | `capture('e2e-test-abc', 'event', {})` makes zero HTTP calls |
| T2 | AC1 | Behavioural | `capture('E2E-TEST-ABC', 'event', {})` (case-insensitive) makes zero HTTP calls |
| T3 | AC2 | Behavioural | `capture('real-user-1', 'event', {}, { company: 'e2e-test-tenant' })` makes zero HTTP calls despite a real-looking `distinctId` |
| T4 | AC3 | Behavioural | `identify('e2e-test-abc', {})` makes zero HTTP calls |
| T5 | AC3 | Behavioural | `captureException(new Error('x'), 'e2e-test-abc')` makes zero HTTP calls |
| T6 | AC4 | Behavioural | `groupIdentify('tenant', 'e2e-test-tenant')` makes zero HTTP calls |
| T7 | AC5 | Non-regression | All existing tests in `check-pla-s1-posthog-module.js` (groups A-G, N1-N2) re-run unmodified and still pass |
| T8 | AC6 | Behavioural | With `POSTHOG_KEY` unset AND an `e2e-test-`-prefixed identity, `capture(...)` still no-ops via the pre-existing unset-key path (no throw, no HTTP call) |

## Regression coverage

- `tests/check-pla-s1-posthog-module.js` full existing suite re-run unmodified — this story is additive (a new guard at the top of 4 functions), not a rewrite of existing capture/identify/groupIdentify/captureException logic.

## Out of Scope (per story)

- `posthog-config.js` / `posthog-flags.js` (feature-flag evaluation pathway).
- Retroactive purge of already-captured E2E events.
- Changes to the `e2e-test-` naming convention itself.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
