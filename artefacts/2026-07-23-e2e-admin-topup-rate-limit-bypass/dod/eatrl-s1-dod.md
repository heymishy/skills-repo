# Definition of Done: Wire the existing staging rate-limit bypass header into admin-credits-topup.js's login/signup calls (eatrl-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/573 | **Merged:** 2026-07-23 (merge commit `21a1e3a5d845312d879a5009c9cd98da7dc50d4c`)
**Story:** artefacts/2026-07-23-e2e-admin-topup-rate-limit-bypass/stories/eatrl-s1.md
**Test plan:** artefacts/2026-07-23-e2e-admin-topup-rate-limit-bypass/test-plans/eatrl-s1-test-plan.md
**DoR:** artefacts/2026-07-23-e2e-admin-topup-rate-limit-bypass/dor/eatrl-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent) — retroactive DoD, written 2026-09-12, ~7 weeks post-merge
**Date:** 2026-09-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `admin-credits-topup.js`'s `_adminLogin()`/`_adminSignupOnce()` both set `headers[RATE_LIMIT_BYPASS_HEADER] = STUB_SECRET` when `hasStubSecret()` is true, mirroring `signUpEmail()`'s pattern exactly — confirmed still present in current code (lines 72, 100, 115) | Code inspection (local) | None |
| AC2 | ✅ | Real CI (PR #573, run 30044703495): `scenario-b-staging-e2e` 4/4 passed, 0 skipped; `scenario-a-staging-e2e` 7 passed/3 skipped (a2's own intentional manual-only skips)/1 failed — a3's AC3 (the specific test that skipped in PR #572) now passes cleanly. Zero rate-limit-caused skips observed on a3, a4, or b1 across both jobs. | Real CI run, per test plan's own documented contingency (`E2E_STAGING_AUTH_STUB_SECRET` unavailable locally) | None |
| AC3 | ✅ | Local `npm test`: 36 failing files, all a subset of `tests/known-baseline-failures.json`'s 68 entries, zero new regressions | Automated full-suite run | None |
| AC4 | ✅ | Real CI jobs report honest, real pass/skip/fail counts — including an honestly-reported, separate, out-of-scope failure (a4's session-resume defect, not a skip) rather than suppressing it | Real CI run | None |

---

## Scope Deviations

None. Diff confirmed via `gh pr view 573 --json files`: `tests/e2e/fixtures/admin-credits-topup.js`, `tests/e2e/fixtures/staging-auth.js` (both fixture-only, per Architecture Constraints), `decisions.md`, `workspace/capture-log.md`, and `pipeline-state.json` bookkeeping. No change to `auth-email.js`'s rate-limiter logic, matching the story's own Out of Scope section exactly.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4 (AC1-AC4)
**Tests passing:** AC1/AC3 verified locally at merge time (code inspection + 36/36-subset-of-baseline full suite); AC2/AC4 verified via real CI per the test plan's own documented contingency (local secret unavailable) — both real CI jobs green for this story's own scope.

**Gaps:** None against the story's own scope.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | One additional header on two existing requests, no new round-trips |
| Security | ✅ | Reuses the existing, already-reviewed, triple-gated staging-only bypass mechanism unmodified — does not weaken or touch `auth-email.js`'s rate-limiter logic |
| Accessibility | ✅ N/A | Test-fixture-only change |
| Audit | ✅ N/A | No production code path touched |

---

## Metric Signal

No formal benefit-metric artefact — short-track story, per its own Benefit Linkage section. The stated benefit (restoring reliable CI signal for `catc-s1`/`bssm-s1`'s already-shipped fixes) is directly confirmed: zero rate-limit-caused skips observed on a3/a4/b1 across two real CI jobs post-fix.

---

## Outcome

**COMPLETE**

This story's own fix worked exactly as intended — no deviations, no scope gaps. Two separate, genuinely out-of-scope findings were surfaced during its own verification and correctly NOT fixed here (see Follow-up actions), consistent with the story's own Out of Scope boundary.

**Follow-up actions:**
1. `a4`'s SSE-mid-stream session-resume turn-history restoration defect (resumed chat log shows stale/duplicated canvas-mapping content instead of the actual restored turn history) — a genuine, separate, pre-existing bug, not caused by this story. Recorded in `decisions.md` (2026-07-24). Owner: not yet assigned.
2. `tests/check-p4-enf-second-line.js`'s CI-runner-only full-suite flake (passes standalone 22/22, fails only in the full aggregate suite on CI) — matches this repo's already-documented resource-contention flake pattern. Recommend adding to `tests/known-baseline-failures.json` in a future baseline-refresh pass. Owner: not yet assigned.

---

## DoD Observations

1. **This story's own bookkeeping regressed after merge — a real process gap, not a code defect.** The PR's own final commit correctly advanced `pipeline-state.json` to `stage=branch-complete, prStatus=draft, health=amber` (using `bin/skills advance`, since `gate-advance`'s validator did not yet support the `branch-complete` gate at the time). Something after that — most plausibly a later PR's merge-conflict resolution on the same file picking the wrong side, the exact `pipeline-state.json`-conflict pattern this repo has documented multiple times — clobbered those fields back to `stage=definition-of-ready, prStatus=none`, and the mandatory `prStatus=merged` + DoD write that should have followed the PR's actual GitHub merge (2026-07-23) never happened. Found 2026-09-12 when the operator noted "no PRs I can see" while reviewing a health-audit report that had described `eatrl-s1` as having an "open draft PR" — prompting a direct `gh pr view` check that revealed the PR was merged 7 weeks earlier. **This is the same class of gap** that this session's own broader amber/red audit already found for `bri-s1.4`, `wusl-s1`, and `csd-s2` (a real fix landing but the originating story's own bookkeeping never catching up) — except here the corruption went one step further, reverting past "merged" all the way to pre-branch-complete, which is why the standard "0 merged-without-DoD" pipeline-state scan didn't catch it: the scan trusted `prStatus`, which was itself wrong. **Candidate for `/improve`:** cross-referencing `prUrl`/`prStatus` fields against a live `gh pr list --state merged` fetch periodically (not just at explicit merge time) would catch this class of drift without relying on the field's own self-consistency.
2. Both out-of-scope findings from the original verification pass remain genuinely unaddressed as of this DoD (confirmed no other story references or fixes either `check-p4-enf-second-line.js`'s baseline status or a4's session-resume defect) — recorded as real, still-open Follow-up actions above rather than assumed resolved.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire the existing staging rate-limit bypass header into admin-credits-topup.js's login/signup calls" (eatrl-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Are the two out-of-scope findings (a4 session-resume defect, check-p4-enf-second-line.js flake) correctly left open rather than silently treated as resolved?
4. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
5. Is the DoD Observation about post-merge bookkeeping regression an accurate, non-speculative account of what happened?
Report findings as HIGH / MEDIUM / LOW.
```
