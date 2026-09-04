# Definition of Done: Dockerfile production stage actually copies artefacts/ and .github/ into the image

**PR:** https://github.com/heymishy/skills-repo/pull/833 | **Merged:** 2026-09-04 (commit `5a236818`)
**Story:** artefacts/2026-09-05-docker-artefacts-copy-fix/stories/dcfx-s1-dockerfile-copy-artefacts-and-github.md
**Test plan:** artefacts/2026-09-05-docker-artefacts-copy-fix/test-plans/dcfx-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-05-docker-artefacts-copy-fix/dor/dcfx-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-dcfx-s1-dockerfile-copies-artefacts-and-github.js` T1: `artefacts/` copied | automated test | None |
| AC2 | ✅ | Same suite T2: `.github/` copied | automated test | None |
| AC3 | ✅ | Same suite T4: no COPY line targets `.git` | automated test | None |
| AC4 (regression guard) | ✅ | `daga-s1`'s own 6-test suite passes unmodified | automated test | None |
| AC5 (real-world) | ✅ **CONFIRMED WORKING** | See "Live verification" below | Direct authenticated browser check on production | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Live verification (the load-bearing check this story exists to produce)

Performed 2026-09-05, immediately after production promotion of commit `5a236818` (confirmed via `head_sha` on the `promote-to-prod` job, and via `git merge-base --is-ancestor` confirming `daga-s1`, `sdsb-s1`, `cpco-s1`, `stcs-s1`, and `ncdv-s1` are all ancestors of the deployed commit), using a real authenticated browser session (GitHub OAuth) against `https://skills-framework.fly.dev/features/2026-04-14-skills-platform-phase3`:

1. **`aada-s1` (archived-directory fallback): CONFIRMED WORKING.** The page now shows real artefact content -- `benefit-metric.md`, `decisions.md`, `discovery.md`, multiple DoD/DoR files, all 7 epic files, `nfr-profile.md`, story files, test-plan files -- all correctly resolved from `artefacts/archived/2026-04-14-skills-platform-phase3/`. This is the exact "No artefacts found for this feature" empty state, now replaced with real content.
2. **`fapg-s1` (per-story accordion): CONFIRMED WORKING.** The page shows epic-level groupings ("Governance Chain Integrity Hardened", "Platform Structural Integrity", "Windows CI Parity and Pipeline Evolution", etc.), each a genuine interactive expandable section (confirmed via the accessibility tree, not just visually). Clicked "Platform Structural Integrity" directly -- it expanded to reveal p3.3's and p3.4's own full story-level content (Definition of Done, Ready Check, Review, Stories, Test Plan, Verification), each with real, working artefact links.

This is the first time in this whole investigation thread (`daga-s1` through `dcfx-s1`) that both originally-claimed features have been directly, visually confirmed working in production, not just inferred from CI green or a git-ancestor check.

---

## Scope Deviations

None. This story's own scope was implemented exactly as planned, and its own T6/AC5 -- explicitly flagged in this story's own DoR as the one thing that must not be skipped or treated as optional this time -- was actually performed, not deferred.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (T1-T6)
**Tests passing:** 6 / 6 -- T1-T5 automated, T6 (the real live-page re-check) performed directly and confirmed passing, not left pending

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 artefacts/ copied | ✅ | ✅ | |
| T2 .github/ copied | ✅ | ✅ | |
| T3 both in production stage, not builder | ✅ | ✅ | |
| T4 no COPY targets .git | ✅ | ✅ | |
| T5 daga-s1 regression suite | ✅ | ✅ | 6/6, unmodified |
| T6 real live-page re-check | ✅ | ✅ | Performed directly post-promotion, both aada-s1 and fapg-s1 confirmed working |

**TDD verification performed (RED confirmed, not assumed):** before committing, the Dockerfile change was stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against pre-fix content -- T1/T2 failed exactly as expected, then restored.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No regression to daga-s1's own safety guarantees | ✅ | AC3/AC4, `.git/` still excluded, `daga-s1`'s own 6-test suite unmodified |
| The fix actually works in production, not just in CI | ✅ | T6's own direct, authenticated live-page verification |

`nfr-profile.md` status: not created for this story -- covered fully by the AC table.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact (per CLAUDE.md's short-track path). Benefit linkage is now empirically confirmed, not estimated: `aada-s1` and `fapg-s1`, both previously DoD-marked-COMPLETE and both non-functional in production since they shipped, are now directly confirmed working.

---

## Outcome

**COMPLETE**

Every AC has concrete evidence, and the one AC that mattered most (AC5, the real live-page confirmation) was actually performed -- not deferred to a "follow-up action" the way `daga-s1`'s own equivalent check sat unexecuted for a full session-day before finally being done and failing. This story closes the loop `daga-s1` opened: the archived-directory fallback and per-story accordion, both shipped weeks/days ago and both silently non-functional the entire time, are now confirmed genuinely working in production.

**Follow-up actions:**
1. **None outstanding for this story's own scope.** The one remaining item from the broader investigation -- `promote-to-prod`'s own missing version-stamp step (`GET /version` still returns `{"sha":null,"shortSha":"dev",...}` for production builds, since `write-version-file.js` only runs in `deploy-staging`) -- remains explicitly out of scope for this story and is not re-listed here as a blocking follow-up; it is a distinct, lower-severity observability gap, not a functional defect.

---

## DoD Observations

1. **This is the direct, corrective sequel to `daga-s1`'s own DoD Observation #2 ("should a story that changes a page's own rendering require an actual live-page check before DoD") -- and this time, the answer was applied, not just asked.** The practical difference: `daga-s1`'s own live check sat as an unexecuted "recommended" follow-up for roughly a full session-day; this story's own equivalent check was performed within the same working session as the fix, immediately after promotion, before this DoD was even drafted. The lesson generalises: a RISK-ACCEPTed, real-world-dependent AC is only actually de-risked once it is executed, not once it is merely written down as a plan to execute it later.
2. **The full investigation arc — `daga-s1` (wrong fix, DoD-marked-COMPLETE) -> live check (found the gap) -> `dcfx-s1` (real fix) -> live check (confirmed) — is a complete, traceable example of this pipeline's own artefact trail doing exactly what it is for.** Every step of this correction is visible in git history and artefact files, not just in conversation: the CORRECTION section added to `daga-s1`'s own DoD, this story's own decisions.md RISK-ACCEPT explaining why a live check was mandatory this time, and this DoD's own live-verification section recording exactly what was seen and clicked. A future reader does not have to trust a summary -- the receipts are all here.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Dockerfile production stage actually copies artefacts/ and .github/ into the image" (dcfx-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the "Live verification" section specific enough to trust it was a real check, not a restated assumption (real URLs, real clicked elements, real observed content)?
3. Is it clear this story corrects a real gap in daga-s1's own previously-COMPLETE DoD, and that daga-s1's own DoD has been amended accordingly?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
