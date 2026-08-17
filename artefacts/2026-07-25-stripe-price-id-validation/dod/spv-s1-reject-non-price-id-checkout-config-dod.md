# Definition of Done: Fail fast with a clear log when a plan's Stripe price ID env var is misconfigured

**PR:** #595 -- "spv-s1: reject a non-price-shaped Stripe price ID config with a clear log" (commit `f4930070`) | **Merged:** 2026-07-25 (per `git show -s --format=%ci f4930070`; note the task brief that seeded this DoD pass cited PR #697, which git history shows actually belongs to a different story, `bsc-s1` -- PR #595 is confirmed correct from `git log --all --grep="spv-s1"`)
**Story:** `artefacts/2026-07-25-stripe-price-id-validation/stories/spv-s1-reject-non-price-id-checkout-config.md`
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 -- non-`price_`-shaped, non-placeholder value → 500 "Billing not configured", no Stripe call | Yes | `checkout-product-id-instead-of-price-id-returns-500-no-stripe-call` (real-incident shape, `prod_UucwFl0LpPlOod`) and `checkout-arbitrary-non-price-shaped-value-returns-500-no-stripe-call` (`some-typo-value`) in `tests/check-lab-s3.2-stripe-checkout.js` | Automated test, freshly re-run | None |
| AC2 -- specific `console.error` log line naming the env var | Yes | `checkout-misconfigured-price-id-logs-specific-env-var-name` -- asserts the captured `console.error` output contains `STRIPE_PRICE_ID_STARTER`. Implementation at `src/web-ui/routes/billing.js:165` logs `'[billing] ' + priceEnvKey + ' is not a valid Stripe Price ID (expected a value starting with "price_" ...)'` | Automated test, freshly re-run | None |
| AC3 -- valid `price_...` value leaves happy path unchanged | Yes | `checkout-valid-price-id-unchanged-happy-path` -- asserts `302` and exactly one Stripe call | Automated test, freshly re-run | None |
| AC4 -- existing missing-env-var / placeholder-sentinel checks unaffected | Yes | Pre-existing `checkout-missing-price-id-returns-500` and `checkout-placeholder-price-id-returns-500` checks in the same file (lines ~180-208) still pass unmodified, confirming the new prefix check was added as a third condition in the same chain rather than replacing the first two | Automated test (regression), freshly re-run | None |

## Scope Deviations

None. The story's own Out of Scope section explicitly excludes (1) validating the price ID against Stripe's API, (2) any change to `authGuard`'s generic error handling, and (3) fixing the actual misconfigured Fly secret -- none of these were attempted, matching the story's stated boundaries.

## Test Plan Coverage

`check-lab-s3.2-stripe-checkout.js`: 18 passed, 0 failed (freshly re-run 2026-08-17). This story's tests are embedded in that shared file (not a standalone file) and are explicitly labelled `spv-s1` in comments, covering AC1/AC2/AC3 directly and AC4 via unmodified pre-existing checks in the same suite.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Security | Met | Client-facing response stays the generic `"Billing not configured"` string (`billing.js:167`); the specific env var name and diagnosis are logged server-side only via `console.error`, matching the story's stated precedent of never surfacing config detail in the response body |
| Performance | Met | The added check is a single regex prefix test (`/^price_/`) against an already-in-memory string -- no new network or API round-trip introduced |
| Observability | Met | This was the story's core purpose; AC2's test confirms the env var name is now present in server logs, removing the need for a live log-tail to diagnose this failure shape |

## Metric Signal

No benefit-metric artefact is referenced by this story or present in the feature folder (`artefacts/2026-07-25-stripe-price-id-validation/` contains only `dor/`, `stories/`, and `test-plans/`) -- this was a short-track bug fix, which does not require one.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Implementation and tests align cleanly with all four ACs; the fix has been live since 2026-07-25 with no reported recurrence of the original incident. One citation correction made during this DoD pass: the seed brief's PR number (#697) was incorrect per git history (that PR belongs to `bsc-s1`) -- the actual merging PR is #595, confirmed via `git log --all --grep="spv-s1"`.
