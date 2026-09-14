# Definition of Done: Feature-creation via a product's "New feature" panel should build a human-readable featureSlug from the operator's given name

**PR:** https://github.com/heymishy/skills-repo/pull/879 | **Merged:** 2026-09-14T01:18:15Z
**Merge commit:** a9ecfcae7aaeead27de0e05978d7c7b58bb6d678
**Story:** artefacts/2026-09-14-feature-slug-respects-display-name/stories/fsdn-s1-slugify-display-name-on-product-feature-create.md
**Test plan:** artefacts/2026-09-14-feature-slug-respects-display-name/test-plans/fsdn-s1-test-plan.md
**DoR:** artefacts/2026-09-14-feature-slug-respects-display-name/dor/fsdn-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A non-blank `displayName` ("Multi-User Role Sessions") produces `featureSlug = <today>-multi-user-role-sessions` — test 1, re-run fresh against merged master | Automated behavioural test (`unit`) | None |
| AC2 | ✅ | Omitted or blank/whitespace-only `displayName` keeps `featureSlug = 'new-feature-' + journeyId.slice(0, 8)` exactly as before — tests 2/3 | Automated regression test (`unit`) | None |
| AC3 | ✅ | A `displayName` of `"!!!"` (slugifies to empty) falls back to `new-feature-<hash>`, not a malformed slug — test 4 | Automated behavioural test (`unit`) | None |
| AC4 | ✅ | Mixed-case/punctuation/whitespace normalizes identically to the real `_slugify` used by the already-proven `handlePostJourney` path — test 5 | Automated regression test (`unit`) | None |
| AC5 | ✅ | `products.js` has no local slugify function and reuses `journey.js`'s exported `_slugify` — tests 6/7 | Automated source-inspection test (`unit`) | None |

**All 5 ACs satisfied.** 7/7 new tests re-run fresh against merged master (commit `a9ecfcae`), 0 failures.

**Verification strength:** 7 unit, 0 integration-real-code, 0 live-verified, 0 production-observed. This story's core claim — "a feature created via the product page's 'New feature' panel with a name typed in gets a human-readable slug in the live app" — has not yet been checked against the real production app (production requires a separate manual deploy approval, per `bri-s2.6`). Recorded as a Follow-up Action below.

---

## Scope Deviations

None. The merged diff (`src/web-ui/routes/journey.js` — one export line, `src/web-ui/routes/products.js` — the slug-construction logic, `tests/check-fsdn-s1-feature-slug-display-name.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. `fdn-s1`'s no-name-given fallback behaviour was left untouched exactly as scoped.

---

## Test Plan Coverage

**Tests passing:** 7/7 new, re-run fresh 2026-09-14 against merged master (commit `a9ecfcae`) — `tests/check-fsdn-s1-feature-slug-display-name.js`.

**Regression coverage:** `check-fdn-s1-feature-display-name.js` (15/15) plus `check-rcfc-s1-products-csrf.js`, `check-product-feature-cap-bypass.js`, `check-pnfc-s1-product-feature-choice.js`, `check-jrf-s2-register-product-feature-journeys.js`, `check-das-s2-require-connected-repo.js` — all re-run clean before merge.

**Gaps:** None against the story's own ACs.

**Full regression suite (post-merge, fresh on master, alongside `lasr-s1`):** 654 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | `_slugify` is a synchronous string transform, already proven cheap in the existing `/journey` path |
| Security | ✅ N/A | No new external input surface — `displayName` was already read/trimmed before this story |
| Availability | ✅ N/A | Pure string-construction change with a safe fallback for the degenerate case (AC3) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly closes a gap the operator found first-hand this session: a real "Multi-User Role Sessions" discovery session was labelled `new-feature-2b74a292` throughout production logs and its artefact folder path.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — not yet live-verified against the real production app.** This fix will auto-deploy to `wuce-staging` but production (`skills-framework.fly.dev`) still requires manual deploy approval. Once approved, the next time a feature is created via the "New feature" panel with a name typed in, confirm the resulting artefact folder is `artefacts/<date>-<slugified-name>/`, not `artefacts/new-feature-<hash>/`.
2. **This fix does not retroactively rename `new-feature-2b74a292`** (the operator's real, already-created "Multi-User Role Sessions" session from earlier this session) — per the story's own Out of Scope, no migration/backfill was in scope. That folder remains hash-named; only future feature creations via this path get the improved slug.
