## Test Plan: Send the environment-specific fingerprint as a string

**Story reference:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s2-string-fingerprint.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node assert scripts. File changed: `tests/check-coha-s5-error-capture.js` (currently 88 tests).

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | String `environment|code|route`, two separators | 2 (pes_UT1, pes_UT5) | - | - | - | - | 🟢 |
| AC2 | Environments differ | 1 (pes_UT2) | - | - | - | - | 🟢 |
| AC3 | No canary; incoming ignored; unknown environment | 2 (pes_UT3, pes_UT4) | 1 (pes_IT1) | - | - | - | 🟢 |
| AC4 | Live staging acceptance and new issue id | - | - | - | 1 | Live-only | 🟡 |
| AC5 | Live production alert | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps
AC4 and AC5 need the deployed apps and real PostHog (verification scenarios 4 and 5). AC4 is the real proof of the wire type; the unit tests cannot establish what PostHog accepts. Not an accepted risk: required before the story is complete (AC5 may lag as `production-observed`, like coha-s6 AC9).

## Test Data Strategy
**Source:** Synthetic (existing `sdkEvent`, `seed`, `spawnChild`, `sinkLib` helpers). **Mock-shape verification:** the type assertion is the guard; the real shape check is AC4 against PostHog itself. **PCI/sensitivity:** No. **Owner:** self-contained.

## Unit Tests (edits and additions in `tests/check-coha-s5-error-capture.js`)

- **pes_UT1 (edited):** production fingerprint equals the string `production|tenant_admin_bootstrap_failed|/auth/:p` and `typeof` is `string`; staging starts with `staging|`. Fails today (array).
- **pes_UT2 (edited):** staging and production strings differ; the part after the first `|` is identical.
- **pes_UT3 (edited):** for incoming fingerprints `['hex-c']`, `'hex-c'`, `42`, `null` and canaries in message, route and code, the output is exactly `production|unhandled_exception|/:p/:p/:p` and the serialised output holds no canary.
- **pes_UT4 (edited):** environments `'prod uction'`, 200-char, `undefined`, `42`, `'Production'`, a tenant-looking string all give a string starting `unknown|`; `staging` and `production` pass through.
- **pes_UT5 (new):** the fingerprint contains exactly two `|` for a spread of allow-listed codes and routes (including `/:p/:p/:p/...` and `/process`), so the separator cannot be confused with content.

## Integration Tests
- **pes_IT1 (edited):** the sink event's `$exception_fingerprint` equals `[p.environment, p.code, p.route].join('|')` and is a string; one event; no canary.

## NFR Tests
- **NFR-SEC1:** pes_UT3's canary scan over the whole output. Performance and cost: none, confirmed.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| PostHog may reject a string for a further reason | Only the one type error is evidenced | AC4 live check; INCOMPLETE with the exact message if so |

**Total automated tests:** 1 new (UT5) and 5 edited; expected count after the change 89.