# Definition of Done: Restore same-tenant journey access under POLICY.TENANT

**PR:** https://github.com/heymishy/skills-repo/pull/754 | **Merged:** 2026-08-22
**Story:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/stories/jatg-s1-restore-same-tenant-journey-access.md`
**Test plan:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/test-plans/jatg-s1-test-plan.md`
**DoR artefact:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/dor/jatg-s1-dor.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

All evidence below re-verified fresh against merge commit `78b43479` on `master` (independently confirmed via `gh pr view 754` — state `MERGED`, `mergedAt: 2026-08-22T06:18:38Z` — not taken on the operator's "Merged" statement alone, per this repo's own established convention).

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Same-tenant non-owner (`journey.tenantId === session.tenantId`) now grants access under `POLICY.TENANT` | `tests/check-jatg-s1-tenant-access-grant.js` + direct `node -e` reproduction, re-run fresh on master | None |
| AC2 | ✅ | Different-tenant non-owner still denied, `asHttpResponse` → 404 | Same test file + direct reproduction | None |
| AC3 | ✅ | Same-tenant non-owner still denied under `POLICY.OWNER` — the two owner-only routes (`handlePostJourneyRecommit`, `handlePostJourneyStageCommit`) are unaffected | Same test file + direct reproduction | None |
| AC4 | ✅ | Full suite fresh on master: 533 files run, 3 failed — the 3 known pre-existing/unrelated entries only (`check-pipeline-state-integrity.js`, `check-p3.5-validate-trace.js`, `check-p4-enf-decision.js`). All 11 real `POLICY.TENANT` call sites regression-checked via their own dependent test suites (`p0.2`, `p1.1`, `p1.2`, `s3.4`, `kcrs-s1`) — all pass | `node scripts/run-all-tests.js`, re-run fresh post-merge | Required completing 3 incomplete pre-existing test fixtures and fixing 1 separate, pre-existing policy-constant bug — not in the original file map. See Scope Deviations |
| AC5 | ✅ | `tests/check-wsm2-collaborative-sessions.js` — 22/22 passing, re-run fresh on master (was 17/22 before the fix) | Automated test, re-verified post-merge | Required adding explicit `tenantId` to `wsm2`'s own T2/T4 fixtures (they never modeled tenant identity at all) — see Scope Deviations |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

The implementation went substantially beyond the story's own file map (`src/web-ui/middleware/journey-access.js` + one new test file). Fully investigated and documented in `decisions.md` at the time — not discovered post-hoc:

1. **The story's own suggested fix was tried first and rejected.** Reusing `isSameTenant()`'s existing "either side missing tenantId → true" passthrough (as the story's own root-cause section suggested) broke an existing, currently-passing test (`check-p0.1-journey-access.js` Test 4). Switched to an explicit, positively-verified tenant-match design instead.
2. **That switch then surfaced 6 newly-failing files on a full-suite run**, each individually investigated (per explicit operator direction to investigate fully before choosing a fix) rather than resolved by guesswork:
   - `check-p0.2-journey-guard-wiring.js` (+ subprocess-callers `p1.1`/`p1.2`): passed unmodified under the strict design — was never actually in conflict.
   - `check-s3.4-item-detail-view.js`, `check-kcrs-s1-kanban-card-resume-session.js`: both already declared "another tenant" via `journey.tenantId`, but their attacker-session fixtures never set `session.tenantId` — an incomplete fixture, completed with the missing value.
   - `check-wsm2-collaborative-sessions.js` (this story's own bug report): same incomplete-fixture pattern, completed with explicit matching `tenantId`.
   - `check-dsh-s2-shared-durable-read.js`: a genuinely separate, pre-existing bug — `session-turns-pg.js`'s `getTurnsForStage()` (reads conversation content, more sensitive than journey metadata) was calling `requireJourneyAccess(..., POLICY.TENANT)`, but its own test explicitly wants owner-only access for content reads. Fixed to `POLICY.OWNER` at that one call site — exposed, not caused, by this story's fix to the dead-code branch.

None of the story's or feature's declared **out-of-scope** items were touched: `requireGrantAccess`/the `agency-client-organisations` relationship-grant extension was not modified; no production database audit was performed.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 9 / 9 (plus 22/22 `wsm2`, 16/16 `p0.1`, 13/13 `p0.2`, 8/8 `s3.4`, 7/7 `kcrs-s1`, 9/9 `dsh-s2` — all pre-existing, all unaffected or corrected; full suite confirmed at the pre-existing 3-failure baseline, down from 4 since `wsm2` itself is now fixed)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: same-tenant non-owner granted | ✅ | ✅ | |
| AC2: different-tenant non-owner denied (404) | ✅ | ✅ | |
| AC3: same-tenant non-owner denied under OWNER | ✅ | ✅ | |
| AC4: owner still granted (both policies) | ✅ | ✅ | |
| AC4: unowned journey still grants | ✅ | ✅ | |
| AC4: null journey → NOT_FOUND | ✅ | ✅ | |
| AC4: missing session → UNAUTHENTICATED | ✅ | ✅ | |
| AC4: neither side has tenantId → denied | ✅ | ✅ | |
| AC4/AC5: full-suite + wsm2 regression check | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security | ✅ | This IS the security fix. AC2 (cross-tenant denial) and AC3 (owner-only routes unweakened) are the regression guards against over-correction, both unit-tested and re-verified fresh against merged master |
| Performance/Accessibility/Audit | N/A | Story declared "None identified" — confirmed still accurate; no NFR-relevant behaviour beyond the access-control logic itself shipped |

---

## Metric Signal

No metrics reference this story — short-track bug fix, no feature-level benefit-metric artefact (`metrics: []` on the feature's pipeline-state.json entry). Not applicable.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 5 ACs satisfied. Deviations here are additive (a more thorough, better-investigated fix than originally scoped, not a shortfall) and fully documented in `decisions.md` at the time they were made — not reconstructed after the fact.

**Follow-up actions:**
- None required to close this story. This closes the last of the three findings from the 2026-08-21/22 test-cleanup pass that had a ready-to-implement story — only **F15** (`csdg-s1`) remains open, pending the operator's check of the live Fly config for `COPILOT_SKILLS_DIRS`.

---

## DoD Observations

1. **A single shared access-control function serving multiple call sites with genuinely different security requirements is a latent risk.** `session-turns-pg.js`'s `getTurnsForStage()` had been silently relying on `requireJourneyAccess`'s pre-existing bug (the dead `POLICY.TENANT` branch) to achieve its own intended owner-only behaviour — its own test passed for the wrong reason (an unrelated bug elsewhere, not the policy constant it was actually using). Flagging as an `/improve` candidate: when a shared authorization function has multiple call sites, an audit of "does this call site's own test suite reflect its author's actual intended semantics, or does it happen to pass due to a bug elsewhere" is worth doing whenever the shared function's behaviour changes — not just checking that tests still pass, but understanding *why* they pass.
2. **Full-suite regression checks are only as good as the investigation behind a fix, not just the fix passing its own new tests.** This story's own new test file (8/8) and its own AC5 target (`wsm2`, 22/22) both passed under an *incorrect* first design (the `isSameTenant()`-based one) that would have quietly broken 6 other files' real, deliberate security assertions had the full-suite check been skipped or the newly-failing files not been individually read rather than pattern-matched against.
3. This story closes **F14** in `workspace/dod-backlog-findings.md`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Restore same-tenant journey access under POLICY.TENANT" (jatg-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
