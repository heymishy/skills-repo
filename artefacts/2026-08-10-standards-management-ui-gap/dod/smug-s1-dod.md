# Definition of Done: Standards management has a fully-built backend but no way to reach it by clicking anything

**PR:** #710 (merge, `a9f372f3`, 2026-08-10) | **Merged:** 2026-08-10 — subsequently superseded by `wugs-s11` (PR #733, `7122c385`, 2026-08-13), which removed this story's routes and tab entirely
**Story:** artefacts/2026-08-10-standards-management-ui-gap/stories/smug-s1-standards-tab-and-query-fix.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (Standards tab/link present alongside Kanban/Roadmap) | Yes, at merge | `productPageNav_includesStandardsLinkAlongsideKanbanRoadmap` in `tests/check-smug-s1-standards-tab-and-query-fix.js` (added in `a9f372f3`, PR #710) | Unit/integration test, confirmed present in git history | Route/tab since removed by `wugs-s11` — see Outcome |
| AC2 (lists own + org-promoted standards with visibility) | Yes, at merge | `handleGetProductStandardsTab_rendersTabAndList` in the same file — asserts both "Own Standard" and "Promoted Standard" render with distinct "Product"/"Org-promoted" labels | Integration test | Same as AC1 |
| AC3 (opted-out standards excluded from render) | Yes, at merge | Same test as AC2 — asserts `Opted-Out Standard` is absent from rendered body | Integration test | Same as AC1 |
| AC4 (Promote to org calls real endpoint, updates in place) | Yes, at merge | `handlePutStandardPromote_updatesVisibilityInPlace` — asserts `UPDATE standards SET visibility` called with the right id and response reflects `visibility: 'org'` | Integration test | Same as AC1 |
| AC5 (Opt out calls real endpoint, standard disappears) | Yes, at merge | `handlePostStandardOptout_removesFromList` — asserts the opt-out `INSERT` fires with correct ids, then confirms `std-promoted` absent from a subsequent `fetchStandardsForProduct` call | Integration test | Same as AC1 |
| AC6 (`standardsList` query matches `setStandardsAdapter` semantics — includes promoted, excludes opted-out) | Yes, at merge | `standardsList_includesOrgPromoted_excludesOptedOut` (via `fetchStandardsForProduct`) and a second check confirming the JSON route (`standardsList`) matches the same semantics | Unit test, both against a shared fixture | None — this was the story's core correctness fix |

All six original tests are confirmed present and mapped correctly by reading the test file's content at commit `a9f372f3` (git history), since the file itself has since been deleted along with the feature it tested (see Outcome). No AC lacks test evidence at merge time.

## Scope Deviations

None. The story's own "Out of Scope" section named three items — standards-creation UI, changes to the promote/opt-out handler contracts, and modification of `psh-s10`'s prompt-injection mechanism — all three were left untouched, consistent with the story text. This is accepted scope discipline, not a gap.

## Test Plan Coverage

At merge (PR #710): `tests/check-smug-s1-standards-tab-and-query-fix.js` contained 6 named checks covering AC1–AC6 exactly as specified in the test plan (`artefacts/2026-08-10-standards-management-ui-gap/test-plans/smug-s1-test-plan.md`), matching its 1-test-per-AC unit/integration coverage table with no declared gaps.

Post-removal (this session, 2026-08-17): `tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js` was freshly re-run and returned **6 passed, 0 failed**, confirming: the `/standards-tab`, promote, and opt-out routes are fully deregistered from `server.js`; `handleGetProductStandardsTab`/`_renderStandardsTab` are fully removed from `products.js`; the "Standards" nav link now points at the new repo-backed guardrails view exactly once; and a repo-wide grep found zero live references to the removed `standards.js` exports outside of expected, explicitly-allowlisted residue (this test file's own literal-string assertions, a DB-fixture comment, and a documentation comment in `server.js`).

## NFR Status

| NFR | Status |
|-----|--------|
| Correctness (backend reachable via UI) | Met at merge; now moot — the UI surface this NFR targeted was deliberately replaced, not regressed |
| Consistency (`standardsList` matching `setStandardsAdapter`'s promoted/opted-out semantics) | Met at merge (AC6, confirmed byte-identical slug-set output per the test plan's stated pass threshold); the underlying `standards.js` query logic this fixed was superseded along with the rest of the feature by `wugs-s11` |

## Metric Signal

No benefit-metric artefact exists for this story — it is explicitly short-track (`Benefit-metric reference: None` in the story text), with benefit stated directly as closing a reachability gap on already-shipped backend work (`psh-s8`/`psh-s9`/`psh-s10`). No quantitative metric signal is available or expected.

## Outcome

**SUPERSEDED**
This story's delivered feature — the DB-backed Standards tab and its promote/opt-out UI — was entirely and deliberately removed three days later by `wugs-s11` (part of the already-DoD-complete `2026-08-11-web-ui-guardrails-standards-surface` epic), which replaced it with a new repo-backed Standards/guardrails view. `tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js` confirms the old routes, handlers, and nav link are fully gone and not duplicated. This is expected product evolution, not a regression or defect — the story is not "live in production" today, but it was correctly built, tested, and shipped at the time, and its removal was an intentional, tested replacement rather than a rollback.
**Follow-up actions:** None. `wugs-s11` already carries its own DoD-complete status for the replacement feature.

## DoD Observations

This story's Standards tab was live in production for roughly three days (2026-08-10 to 2026-08-13) before being superseded by `wugs-s11`'s repo-backed guardrails view — short production longevity, but by design as part of a fast-moving epic, not a failure of this story's own delivery.
