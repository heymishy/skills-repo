# Definition of Done: Persist a feature-to-module join for taxonomy-sourced features

**PR:** https://github.com/heymishy/skills-repo/pull/544 | **Merged:** 2026-07-22
**Story:** artefacts/2026-07-22-taxonomy-module-classification/stories/tmc-s1-persist-feature-module-classification.md
**Test plan:** artefacts/2026-07-22-taxonomy-module-classification/test-plans/tmc-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-22-taxonomy-module-classification/dor/tmc-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (persistence across re-sync) | ✅ | "a feature module assignment survives a second syncProductRollup run" | automated test (`check-tmc-s1-...js`) | None |
| AC2 (single-query scale) | ✅ | "getFeatureModuleAssignments issues exactly one query for 300 slugs" | automated test | None |
| AC3 (bulk assign, one round trip) | ✅ | Tested at 2 and 250 slugs, both exactly 1 query | automated test | None |
| AC4 (multi-tenant isolation) | ✅ | Cross-tenant read + bulk-assign tests, both directions | automated test, mirrors `bri-s3.4`'s established pattern | None |
| AC5 (module-grouped rendering + zero-regression fallback) | ✅ | Real `handleGetProductView` render tests: partial classification, zero-module fallback (byte-identical to pre-existing Epics render), and the revised `modules.length > 0` gate | automated test | None — gate condition was revised post-implementation (see Scope Deviations below); AC5's wording was updated to match before merge, so no deviation from the merged story text |
| AC6 (module deletion reassigns, single write path) | ✅ | Assignment rows survive deletion with `module_id: null`; also verified for rows written via `reassignEpic` (AC6/AC8 integration test) | automated test | None |
| AC7 (CSRF-protected mutation) | ✅ | Missing/mismatched token → 403, zero writes; valid token → 200 (control case) | automated test | None |
| AC8 (unified mechanism, journeys + taxonomy share one table) | ✅ | `reassignEpic` rewritten to write through `feature_module_assignments`; backfill migration verified via code review (chained after table creation, `ON CONFLICT DO NOTHING`) | automated tests (unit) + code review of the migration itself (no live-DB integration test for the migration — see Test Plan Coverage gap below) | None |
| AC9 (orphan cleanup on sync) | ✅ | Deletes an assignment absent from both taxonomy and journeys; does NOT delete one present in journeys only; no-ops with zero extra queries when nothing is assigned | automated test | None |

**A deviation is any difference between implemented behaviour and the AC** — even if minor. None recorded: AC8/AC9 were added to the story *before* implementation of the revision (not discovered as gaps after the fact and left unreconciled), so the merged code matches the merged story text exactly.

---

## Scope Deviations

One deliberate, reviewed design revision occurred **during** this story's own delivery (not a violation of the story's Out of Scope section): the original implementation (first commit on the branch) shipped with `journeys.module_id` and `feature_module_assignments` as two separate mechanisms, and a render gate (`hasAnyFeatureModuleAssignments`) that didn't match a4's own existing convention. A post-implementation design-quality review (operator-requested, before merge) surfaced this, and the story's own ACs (AC5, and new AC8/AC9) were revised to reflect the corrected design *before* the PR was merged — see `decisions.md`'s REVISION entry for the full rationale. This is recorded here for traceability, not flagged as a scope violation, since the final merged code matches the final merged story text with zero gap.

No behaviour outside the story's Out of Scope section was implemented (dropping the `journeys.module_id` column, pagination at 1000+ scale, auto-classification, and retroactive `skills-framework` data-seeding all remain unimplemented, exactly as scoped).

---

## Test Plan Coverage

**Tests from plan implemented:** 29 / 29 (7 original ACs' worth of tests from the test plan, plus 10 additional tests added during the AC8/AC9 revision — all committed before merge, none deferred)
**Tests passing in CI:** 29 / 29, independently re-run against merged `master` post-merge (not just the pre-merge branch state)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| tests/check-tmc-s1-persist-feature-module-classification.js (29 tests) | ✅ | ✅ | Re-run on master post-merge, all 29 green |
| tests/check-a1-modules-taxonomy-crud.js (26 tests) | ✅ | ✅ | Regression suite — 2 tests updated to model the unified `feature_module_assignments` table instead of the retired `journeys.module_id` write path |
| tests/check-a2-reassign-epics-between-modules.js (11 tests) | ✅ | ✅ | Regression suite — fully rewritten fake pool to model `reassignEpic`'s new write path; all original AC1-AC4 behaviour re-verified against the new mechanism |
| tests/check-a4-module-grouped-rendering.js (11 tests) | ✅ | ✅ | Regression suite — 1 integration test's fake pool updated to supply `feature_module_assignments` data instead of a `module_id` column on the journeys row |
| Full 359-file suite | ✅ | ✅ (322/359, 37 pre-existing baseline failures) | Run twice (once pre-revision, once post-revision), identical 37-file failing list both times — confirmed zero regressions from this story |

**Gaps (tests not implemented):**
- No live-Postgres integration test exercises the actual backfill migration SQL (`INSERT ... SELECT ... FROM journeys ... ON CONFLICT DO NOTHING`) against a real database — verified by code review and by the migration's structural similarity to this repo's own already-proven chained-migration pattern (a1's `product_modules`/`journeys.module_id`), but not by a dedicated automated test. **Risk:** low — the query is a straightforward idempotent INSERT-SELECT with no novel SQL construct, and `server.js`'s existing `.catch()` logs (rather than crashes) on migration failure, matching every other migration in the file. **Accepted as a known gap, not escalated to RISK-ACCEPT** since a staging smoke test (below) covers the live-database path this story's own unit/integration tests cannot.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — 1 query per assignment-map fetch, regardless of feature count | ✅ | Tested at 300 synthetic slugs, exactly 1 query |
| Performance — bulk-assign 1 query regardless of batch size | ✅ | Tested at 2 and 250 slugs, exactly 1 query each |
| Scale — correct behaviour at 100s of features per product | ✅ | 300-slug and 250-slug test fixtures |
| Multi-tenancy — zero cross-tenant read/write leakage | ✅ | Dedicated isolation tests, both read and write paths |
| Security — CSRF guard on the new mutating route | ✅ | Missing/mismatched-token rejection tests + control case |
| Security — XSS prevention (escaping) | ✅ | Inherited from a1/a4's existing `_escapeHtml` convention; no new unescaped render path introduced |
| Accessibility — bulk-assign UI keyboard/screen-reader operable | ⚠️ | Not independently re-verified this session (no browser session available) — relies on the bulk-assign UI reusing a1's already-verified form/checkbox rendering pattern. **Recommend a manual accessibility spot-check on staging as part of the post-merge smoke test.** |

---

## Metric Signal

No metrics apply — this is a short-track story (per CLAUDE.md, short-track skips `/benefit-metric`); the parent feature's `metrics` array is empty. Benefit linkage was stated directly in the story ("Usability of the Modules primitive shipped in Epic A") rather than as a tracked metric.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | No formal metric tracked for this short-track story |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Marked "with deviations" not because any AC failed, but to keep two genuine, low-risk gaps visible for /trace: (1) the backfill migration has no live-Postgres integration test, verified by review only; (2) the bulk-assign UI's accessibility was not independently re-verified this session. Both are judged low-risk and non-blocking, not reasons to withhold completion.

**Follow-up actions:**
1. Post-merge staging smoke test: confirm the backfill migration ran cleanly on `wuce-staging` boot (check server logs for `[tmc-s1] journeys.module_id backfilled into feature_module_assignments`), and manually verify the bulk-assign UI is keyboard-operable. Owner: Hamish King (Founder/Operator).
2. Retroactively classify `skills-framework`'s real ~115 features into the 9 seeded modules using the now-shipped bulk-assign mechanism (explicitly out of this story's code scope, but the natural next operator action). Owner: Hamish King.
3. Consider a future, separate story to drop the now-inert `journeys.module_id` column once the unified mechanism has run in production without issue for a reasonable period (explicitly deferred in this story's Out of Scope).

---

## DoD Observations

1. **A post-implementation design review, done before merge, caught a real architectural flaw (two parallel assignment mechanisms) that the original review/DoR pass did not catch.** The initial review (`review-1.md`) scored AC quality/completeness 5/5 and found 0 HIGH/MEDIUM findings — correctly, given what was in front of it — but neither the review nor the DoR contract's "Assumptions" section prompted a check of `journeys`' own existing schema for a pre-existing `feature_slug` column that made the new table's key redundant with data already available. **`/improve` candidate:** the DoR contract template's "Assumptions" section could explicitly prompt "does an existing table/column already provide this identity?" when a story proposes a new table — this is a recurring pattern in this repo's own governed process (a2's `decisions.md` ARCH entry and a4's Task 0 notes had both already flagged the *taxonomy*-side gap, but neither had cross-checked `journeys`' own schema for the same reason).
2. **This is the second story this session (after `stis-s1`'s cross-story test-isolation fix) where a repo-wide convention already established elsewhere (a4's `modules.length === 0` render gate) was not consulted before inventing a new, subtly different one for a new but adjacent code path.** Worth a standing reminder in `CLAUDE.md` or `architecture-guardrails.md`: when adding a new UI section next to an existing one solving a structurally similar problem, check the existing section's gating/rendering convention first.
3. No cross-story runtime failures discovered. No NFR gaps beyond the accessibility spot-check noted above.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Persist a feature-to-module join for taxonomy-sourced features" (tmc-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
