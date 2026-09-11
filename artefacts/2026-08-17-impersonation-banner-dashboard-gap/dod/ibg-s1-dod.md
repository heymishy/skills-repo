# Definition of Done: Thread impersonation state into the /dashboard route's renderShell call (ibg-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/861 | **Merged:** 2026-09-11 (merge commit `ab78a10b8b77bda6f51ccfd1cdb0dd67803d1bad`)
**Story:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md
**Test plan:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/test-plans/ibg-s1-test-plan.md
**DoR:** artefacts/2026-08-17-impersonation-banner-dashboard-gap/dor/ibg-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent), independently re-verified live against real `wuce-staging.fly.dev` post-merge
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | **Live, post-merge:** started a real impersonation session (`e2e-bob`, `e2e-shared-org`) via `/admin/impersonate` against `wuce-staging.fly.dev`, then confirmed the banner renders on both `/dashboard` and `/dashboard?view=board` — `getComputedStyle`-verified real background colour (`rgb(69, 26, 3)`), real banner text ("Viewing as e2e-bob (tenant: e2e-shared-org)"), real exit button. Plus 14/14 automated tests re-run on merged master. | Live browser verification (network/DOM/`getComputedStyle`) + automated tests, both post-merge | None |
| AC2 | ✅ | Automated tests T3/T4 confirm no banner and unchanged content when not impersonating, re-run fresh on merged master: 14/14 passing | Automated test, re-run post-merge | None |
| AC3 | ✅ | **Live, post-merge:** clicked the real exit-impersonation button on `wuce-staging.fly.dev` — session correctly reverted to the real admin identity, banner disappeared on the next render (confirmed via `/dashboard` reload showing no banner) | Live browser verification | None |
| AC4 | ✅ | `check-d2-banner-exit-permission-visibility.js` 24/24 re-run fresh on merged master | Automated test, re-run post-merge | None |

**Full re-run on merged master:** `tests/check-ibg-s1-dashboard-impersonation-banner.js` — 14/14 passing.

---

## Scope Deviations

None. Confirmed via `gh pr view 861 --json files`: the merged diff touches exactly `src/web-ui/routes/products.js` (the two `renderShell` call sites named in the story) plus the new test file and artefacts/pipeline-state.json bookkeeping — `dashboard.js`'s already-correct `handleDashboard` untouched, matching the story's own Out of Scope declaration.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5
**Tests passing on merged master:** 14/14

**Gaps:** None. The one genuine gap the original DoR anticipated (browser-level rendering, not just markup presence) is now closed with real live evidence, not just automated markup assertions — see AC1/AC3 above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Story states none identified — reads existing session state, no new I/O |
| Security | ✅ | Closes a real accountability gap (an admin impersonating a user could previously land on `/dashboard`, the app's most-visited page, and forget they were impersonating) |
| Accessibility | ✅ N/A | Reuses the existing, already-accessible banner markup unchanged |
| Audit | ✅ N/A | The underlying impersonation audit log (`d3`) is unaffected — confirmed live: this session's own real audit ID (`119dc5ed-d7b3-4526-87ad-04540ec3282b`) was recorded normally by the existing audit mechanism during this DoD's own live verification |

---

## Metric Signal

No formal benefit-metric artefact exists for this story — short-track bug fix, per the story's own Benefit Linkage section. The stated benefit (restoring `d2`'s own AC1 guarantee — "a persistent banner appears... when any page in the app renders") is now directly confirmed live on `/dashboard`, the one page that previously violated it.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps. This is the strongest evidence class this session's DoD-triage sweep produced for a UI fix: not just markup-presence tests, but a real, live, `getComputedStyle`-verified impersonation session started and exited against the actual deployed staging environment, post-merge.

**Follow-up actions:** None required for this story's own scope. The story's own Out of Scope names a broader audit (which of the ~11 other route files correctly thread `impersonation`) as separate, larger work, not bundled here.

---

## DoD Observations

1. This story is the one genuinely observable UI change among this wave's 4 merged PRs, and the operator's "All merged" follow-up gave a natural opportunity to close the loop with real, live, post-deploy verification rather than resting on pre-merge CI alone — consistent with this session's established default of validating live after every merge, not just trusting green CI.
2. Same `pipeline-state.json` `stage`/`prStatus` silent-revert issue found and corrected as `vcb-s1`'s own DoD Observation #1 documents (a `git merge origin/master` performed late in this branch's life, after the branch-complete `gate-advance`, silently reverted those two fields via a line-based JSON merge). Corrected here identically, on master, post-merge.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Thread impersonation state into the /dashboard route's renderShell call" (ibg-s1).
Check:
1. Is the live post-merge verification (real impersonation session on wuce-staging) clearly distinguished from the pre-merge automated tests, with concrete evidence (background colour, banner text, audit ID)?
2. Was the impersonation session properly exited, not left dangling?
3. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
```
