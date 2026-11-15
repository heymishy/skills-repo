# Verification script: ppp-s1 (decisions cache and parallel reads)

Run these after the story's PR is merged and promoted. Steps 1 to 7 are covered by `node tests/check-ppp-s1-decisions-cache.js`; step 8 needs the operator.

1. T1: repeat view makes no decisions requests (expect pass).
2. T2: stale entry served at once with one refresh per slug.
3. T3: not-found cached.
4. T4a and T4b: failures not cached, stale kept.
5. T5: entry cap.
6. T6: handler reads in parallel; T9: handler uses the cache.
7. T7: at most 16 in flight; T8a and T8b: token not stored, slug validation kept.
8. **Live (operator approval needed each time; read-only):** on skills-framework.fly.dev signed in, time `GET /products/<skills-framework id>` three times in a row from the signed-in tab. Record time to first byte and size. Expect: the first load after a deploy may be slow (report it); the second and third under 3 s. Baseline before this story: 16.3 s and 15.7 s, 2,972 KB. Compare also with `/dashboard` (0.5 s) as the healthy reference.
