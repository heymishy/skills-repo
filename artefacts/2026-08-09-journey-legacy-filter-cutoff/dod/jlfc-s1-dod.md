# Definition of Done: Time-bound the journey list's pre-tenancy migration-grace filter

**PR:** https://github.com/heymishy/skills-repo/pull/700 | **Merged:** 2026-08-09 (merge commit `1344596d762bafcc24e6604c96b92d6aaf3e6ca3`)
**Story:** artefacts/2026-08-09-journey-legacy-filter-cutoff/stories/jlfc-s1-journey-legacy-filter-cutoff.md
**Test plan:** artefacts/2026-08-09-journey-legacy-filter-cutoff/test-plans/jlfc-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-journey-legacy-filter-cutoff/dor/jlfc-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

AC1: post-cutoff tenant-less journey excluded, regardless of ownerId match. AC2: pre-cutoff tenant-less journey still included when owner matches (regression guard). AC3: tenant-less journey with no createdAt still included (edge case). AC4: real-tenant-match path unregressed. AC5: session-level no-tenantId backward compat unregressed. Full text: `artefacts/2026-08-09-journey-legacy-filter-cutoff/stories/jlfc-s1-journey-legacy-filter-cutoff.md`.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `handleGetJourney_postCutoffTenantLessJourney_excludedEvenWhenOwnerMatches` — a journey with `tenantId: null`, `createdAt` after 2026-06-29, owner matching the session, does not appear | automated test | None |
| AC2 | ✅ | `handleGetJourney_preCutoffTenantLessJourney_stillIncludedWhenOwnerMatches` — same shape but `createdAt` before the cutoff, still appears | automated test | None |
| AC3 | ✅ | `handleGetJourney_tenantLessJourneyWithNoCreatedAt_stillIncludedWhenOwnerMatches` — no `createdAt` field at all, still appears | automated test | None |
| AC4 | ✅ | Existing `tests/check-s0.3-journey-list-filter.js` AC1-AC3 re-run unmodified, 13/13 passing | automated test re-run | None |
| AC5 | ✅ | Same file's AC4 (no-tenantId session backward compat), included in the same 13/13 | automated test re-run | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — this story delivered exactly as scoped.

---

## Scope Deviations

None. Only `handleGetJourney`'s filter clause in `src/web-ui/routes/journey.js` was touched, exactly as the DoR scoped. `handlePostJourney`, `products.js`, and `tests/check-s0.3-journey-list-filter.js` were all left untouched as required.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 planned
**Tests passing:** 4 / 4 new, plus 13/13 in the pre-existing regression baseline

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| handleGetJourney_postCutoffTenantLessJourney_excludedEvenWhenOwnerMatches | ✅ | ✅ | |
| handleGetJourney_preCutoffTenantLessJourney_stillIncludedWhenOwnerMatches | ✅ | ✅ | |
| handleGetJourney_tenantLessJourneyWithNoCreatedAt_stillIncludedWhenOwnerMatches | ✅ | ✅ | |
| `check-s0.3-journey-list-filter.js` (unmodified regression baseline) | n/a (pre-existing) | ✅ 13/13 | |

**Additional regression verification:** `check-p2.2-tenant-isolation.js` (27/27), `check-p0.2-journey-guard-wiring.js` (13/13), `check-pan-s1-product-aware-navigation.js` (29/29), `check-wsm1-session-persistence.js` (23/23) — all re-run, zero regressions. `check-ougl3-journey-entry-and-start.js` has 4 pre-existing baseline failures (T3.3/T3.4/T3.6/T3.7, in `handlePostJourney`'s test-double wiring, unrelated to `handleGetJourney`) — confirmed identical before and after this change via `git stash` comparison.

**Gaps (tests not implemented):** None against the test plan. No live-database confirmation against the real ~1000 leaked journeys was performed as an automated test (would require waiting on their actual `createdAt` values); a manual live spot-check is recorded below instead.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Correctness / Security | ✅ | AC1's test directly proves a post-cutoff tenant-less journey is excluded regardless of `ownerId` match — the exact over-broad visibility rule this story closes |
| Performance | ✅ (negligible, as stated) | One additional `Date.parse` comparison per journey in an already-existing filter |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE** — PR #700 merged 2026-08-09.

**Follow-up actions:**
1. ✅ **Done 2026-08-09.** Manually deleted the two known leaked fixture journeys sitting on genuinely real products (`f3765c1a` on `skills-framework`, `f2aaa734` on `Women's mentorship`) via the existing `DELETE /api/journey/:journeyId` endpoint, confirmed removed from both product pages afterward. This was a data-cleanup action, not a code change, and was explicitly scoped separately from this story per the operator's own instruction.
2. **Not started, tracked as a separate future investigation**: why tenant-less journeys keep being created in the first place — the leading hypothesis is that automated test/CI activity against this shared staging environment authenticates as the real operator's own GitHub identity rather than an isolated test account. This story only narrowed which existing tenant-less journeys are treated as legitimate legacy data when *listing* — it does not stop new ones from being created under the operator's identity, so the "No product" bucket (and the sidebar's real Postgres count) can still grow again if that root cause isn't separately addressed.
3. **Not started**: bulk cleanup of the remaining ~1000 accumulated tenant-less journeys beyond the two removed in (1) — those two were the only ones confirmed to be sitting on named real products; the bulk of the 1000 are likely already correctly hidden from view by this fix (since most appear to postdate the 2026-06-29 cutoff) but still exist as rows in the underlying store.

---

## DoD Observations

1. **This story is a good example of a diagnosis correcting itself mid-investigation.** The original ask (task #122) was framed as "the No product sidebar link is dead" — a live re-test (properly authenticated, unlike the earlier check which coincided with one of this session's many staging logouts) showed the link works fine, and the real defect was a data-visibility bug one layer deeper. Worth remembering: a single failed live-browser check during a session with frequent unexplained logouts is not suffficient evidence on its own — a second, controlled re-check caught the misdiagnosis before a wrong fix was written.
2. **The historically-anchored cutoff (tied to commit `2c0fb7ca`) is a stronger fix than an arbitrary date would have been** — it's independently verifiable by anyone reading the commit history, not just an assertion in this story.
