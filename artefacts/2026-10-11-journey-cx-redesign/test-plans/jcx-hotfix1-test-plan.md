# Test Plan (Short-track): Fix ambiguous column reference crashing the placeholder-feature trigger in production

**Story reference:** short-track bug fix (production incident, real 500 confirmed live on staging via Chrome)
**Date:** 2026-10-13

---

## Root cause

`handleTriggerPlaceholderFeature` (`src/web-ui/routes/journeys.js`) ran:
```sql
SELECT id, name, description, emotion, pain_points, opportunities, touchpoints
FROM customer_journey_stages cjs
JOIN customer_journeys cj ON cjs.journey_id = cj.id
WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3
```
Both `customer_journey_stages` and `customer_journeys` have their own `id` column. The unqualified `id` in the SELECT list is ambiguous once the two tables are joined — real Postgres rejects this with `error: column reference "id" is ambiguous`. This is a real SQL semantic error no mock-pool-based unit test can ever catch, since those tests pattern-match the query text via regex and return canned data without ever parsing or executing real SQL. Confirmed live on `wuce-staging.fly.dev`: clicking "Trigger" on a real placeholder returned HTTP 500 with "Internal Server Error", and `flyctl logs -a wuce-staging` showed the exact stack trace pointing at `journeys.js:529` inside `handleTriggerPlaceholderFeature`.

**Fix:** qualify every selected column with its owning table alias (`cjs.id`, `cjs.name`, etc.) — the same style already used correctly by `handlePostPlaceholderFeature`'s own near-identical ownership-check query a few lines above, which was never affected because it only selects `cjs.id` (already qualified) rather than a bare list of columns.

---

## Verification

| Check | Method | Result |
|-------|--------|--------|
| Existing `handlePostPlaceholderFeature`/`handleTriggerPlaceholderFeature` unit tests still pass | `node tests/check-jcx-s1-placeholder-feature.js` (mock-pool regex updated to match the qualified column list) | 9/9 pass |
| Full repo suite, no regressions | `npm test` | Run in progress at time of writing — see commit message for confirmed result |
| Real-world fix confirmed (the actual gap mock-pool tests cannot close) | Live Chrome check against `wuce-staging.fly.dev` after deploy: create a placeholder, click Trigger, confirm 200 + a real `discovery.md` seeded, not another 500 | Pending deploy |

**Known residual gap, logged not fixed here:** this repo's primary CI test gate (`Lint, typecheck, test, build`) never sets `DATABASE_URL`, so even the DATABASE_URL-gated "real Postgres" tests elsewhere in this repo (`check-ep5-s1-migration.js`, `check-ic-hotfix1-position-migration.js`) never actually execute in that gate — they self-skip. A SQL semantic error like this one can ship through CI cleanly today as long as the mock-pool regex happens to match. Worth a dedicated follow-up to wire a disposable Postgres into the primary CI job, not attempted as part of this hotfix (out of scope for a same-day production fix).
