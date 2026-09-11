# Verify Completion: Backfill rpc-s1's missing accessibility test and jrf-s1's narrower-than-required regression pass (vcb-s1)

**Story:** artefacts/2026-08-18-verification-coverage-backfill/stories/vcb-s1-backfill-rpc-s1-and-jrf-s1-verification-gaps.md

---

## AC verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | New `NFR-Accessibility` test in `tests/check-rpc-s1-connect-repo.js` (7/7 total, was 6/6) — asserts `rpc-connect-owner`/`rpc-connect-repo`/`rpc-create-name` each carry a real, non-empty `aria-label` |
| AC2 | ✅ | New `IT6` in `tests/check-jrf-s1-new-feature-redirect.js` (6/6 total, was 5/5) — spawns all 9 test files that exercise the real production `handlePostProductFeature` handler; all 9 independently confirmed passing (see below) |
| AC3 | ✅ | Both files pass in full; the 9 files `IT6` spawns also independently re-run clean |

## Independent confirmation of the 9 files IT6 spawns

- `check-das-s2-require-connected-repo.js`: 7/7
- `check-fdn-s1-feature-display-name.js`: 15/15
- `check-jrf-s2-register-product-feature-journeys.js`: 6/6
- `check-npwe-s1-skills-nav-wiring.js`: 20/20
- `check-pan-s1-product-aware-navigation.js`: 29/29
- `check-pnfc-s1-product-feature-choice.js`: 5/5
- `check-product-feature-cap-bypass.js`: 5/5
- `check-psh-s4-navigation.js`: 6/6
- `check-rcfc-s1-products-csrf.js`: 4/4

## Full suite

`NODE_ENV=test npm test`: 638 files run, 3 failed — `tests/check-bjs-s1-billing-journey-staging-safe.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-s6.1-cache-scope-session-threading.js`. Identical to the 3 pre-existing failures confirmed on the `ibg-s1` branch earlier this same session (`check-p3.5-validate-trace.js` is in `tests/known-baseline-failures.json`; the other 2 are confirmed baseline drift, unrelated by domain to this story's test-file-only diff). **0 new failures.**

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
