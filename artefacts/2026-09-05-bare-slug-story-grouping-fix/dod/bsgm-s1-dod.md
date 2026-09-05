# Definition of Done: Group a story's own bare-slug definition file into its own accordion section

**PR:** https://github.com/heymishy/skills-repo/pull/838 | **Merged:** 2026-09-05 (commit `cdf2afdc8f0059c8008faa4cd9424d855a9c33db`)
**Story:** artefacts/2026-09-05-bare-slug-story-grouping-fix/stories/bsgm-s1-fix-bare-slug-story-file-grouping.md
**Test plan:** artefacts/2026-09-05-bare-slug-story-grouping-fix/test-plans/bsgm-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-05-bare-slug-story-grouping-fix/dor/bsgm-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-bsgm-s1-bare-slug-story-grouping.js` — bare `<slug>.md` groups into its own flat story and its own epic-nested story | automated unit | None |
| AC2 | ✅ | Same file — existing descriptive-suffix filename behaviour unchanged (regression guard) | automated unit | None |
| AC3 | ✅ | Same file — `p3.1`/`p3.1a` disambiguation preserved for both the new bare case and the pre-existing hyphenated case | automated unit | None |
| AC4 | ✅ | Live production DOM check via Chrome, post-deploy: `/features/2026-09-02-product-dashboard-triage` (the reported feature) and `/features/2026-06-22-wuce-multi-tenancy` (the original visual-seam page from the `fpux` epic) both show every bare-slug story file grouped inside its own `.sw-story-row`, zero entries left `OUTSIDE_ANY_ROW` | manual (live production verification) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by `/trace`.

---

## Scope Deviations

None. The fix is exactly the 1-line predicate extension proposed in the DoR contract, with no adjacent changes.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8 — confirmed via PR #838's own CI run and directly, locally, before merge. Full suite: 619 files, 2 pre-existing failures unrelated to this diff. Existing `check-fapg-s1-group-artefacts-by-story.js` regression suite (7/7) unaffected.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 bare `<slug>.md` → own flat story | ✅ | ✅ | `check-bsgm-s1-bare-slug-story-grouping.js` |
| AC1 bare `<slug>.md` → own epic-nested story | ✅ | ✅ | Same file |
| AC2 descriptive-suffix regression guard | ✅ | ✅ | Same file |
| AC3 `p3.1`/`p3.1a` disambiguation, new bare case | ✅ | ✅ | Same file |
| AC3 `p3.1`/`p3.1a` disambiguation, existing hyphenated case | ✅ | ✅ | Same file |

**TDD verification performed (RED confirmed, not assumed):** 6 of the 8 assertions were confirmed failing for the right reason before the fix (the 2 pre-existing hyphenated-case regression guards correctly already passed, since that behaviour was untouched); all 8 passing after.

**Coverage gap audit (Step 4):** AC4 is the story's own designated manual-verification AC (per the DoR contract's own RISK-ACCEPT — no new E2E tooling was scoped for a pure data-layer fix). It has now been executed directly against real production, not deferred: `layoutGapsAtMerge`: **false** — the gap was open at merge (deploy pipeline was still in flight) but is now closed as of this DoD, with concrete evidence recorded below.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no regression | ✅ (informal) | Predicate extension is a single additional `||` branch on an already-cheap string comparison inside an existing `Array.find`; no measurable cost, no automated test scoped |
| Security — none identified | ✅ N/A | Pure function, no I/O, no new input surface |
| Accessibility — not applicable | ✅ N/A | No markup or interaction change |
| Audit — not applicable | ✅ N/A | No new state-changing action introduced |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track story (per `CLAUDE.md`'s short-track convention). The story's own "Benefit linkage" section names the defect closed directly: repo-wide story-file mis-grouping affecting 37 features. First signal: confirmed closed in production 2026-09-06 via direct DOM verification on 2 of the 37 affected features (`2026-09-02-product-dashboard-triage`, `2026-06-22-wuce-multi-tenancy`) — 21 bare-slug story files checked across both pages, 0 orphaned.

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with concrete, automated (AC1–AC3) and direct live-production (AC4) evidence. No scope deviations. No test gaps.

**Follow-up actions:**
None outstanding for this story. Broader repo-wide spot-check beyond the 2 features verified here was not performed — the fix is a pure, generically-applicable predicate change verified by unit tests against synthetic fixtures covering the general case, so per-feature spot-checking beyond a confirming sample is not warranted.

---

## DoD Observations

1. **The deploy pipeline itself hung between merge and production, independent of code correctness.** The `Staging Deploy` workflow run for this merge (`cdf2afdc`) stuck in the `Staging smoke test (@mocked)` job for ~19 hours before `promote-to-prod` could even become available for approval — matching the previously-captured Fly auto-suspend silent-hang signature (`workspace/capture-log.md`, 2026-08-31). Cancelling and re-running the same workflow run against the same commit resolved it on the first retry (smoke test completed in ~3 minutes). This is the second time in this repo's history this hang pattern has blocked a merge from reaching production — worth escalating from "captured gap" to an actual mitigation (e.g. a job-level timeout on the smoke-test step so it fails loudly instead of hanging silently) rather than relying on manual retry each time.
2. **AC4's "manual, post-merge" verification is only meaningful if actually performed before DoD, not assumed from CI green.** This story's own short-track DoR explicitly scoped AC4 as manual specifically because a pure data-layer fix has no E2E tooling — but "manual" must still mean a real, evidenced check (here: direct DOM inspection via Chrome against real production), not a narrative assumption that "the code is right so it must be live."

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Group a story's own bare-slug definition file into its own accordion section" (bsgm-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the AC4 manual verification backed by an actual observation (not just "should work now")?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
