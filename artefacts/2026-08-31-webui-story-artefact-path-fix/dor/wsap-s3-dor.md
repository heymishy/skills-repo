# Definition of Ready Checklist

## Definition of Ready: Multi-story commit gating and review cadence (wsap-s3)

**Story reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s3-multi-story-commit-and-review-cadence.md
**Test plan reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s3-test-plan.md
**Track:** Short-track (two bugs found via a live, operator-requested end-to-end web-UI verification)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: an operator running a multi-story feature through the web UI |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | AC1/AC2 new behavioural tests; AC3 regression (corrected + re-run); AC4 live verification |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track bug fix, no formal benefit-metric artefact for this feature folder (consistent with wsap-s1/wsap-s2) |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips review |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ N/A | Two targeted fixes to existing routing/gating logic, no new architecture surface |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track, no discovery stage |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | AC4 is not automatable, live-verification-only | ✅ Acknowledged | Same live-verification pattern used repeatedly this session; a real, already-in-progress feature (`new-feature-2b74a292`) and a fresh verification feature are both available to verify against directly. | Claude Sonnet 5 (orchestrating agent) |
| W2 | Fix 2 (review cadence) is a genuine behavioural change to the outer loop's per-story sequence, not a pure bug fix in the narrowest sense | ✅ Acknowledged | The change aligns the implementation with CLAUDE.md's own already-documented pipeline table (review's entry condition is "stories exist", not "per story" — only test-plan's row says "(per story)") rather than introducing new, undocumented behaviour. Operator explicitly requested this fix after directly identifying the divergence in conversation. | Claude Sonnet 5 (orchestrating agent) — operator: heymishy, 2026-09-15 (in-conversation) |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Multi-story commit gating and review cadence
       -- artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s3-multi-story-commit-and-review-cadence.md
Test plan: artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s3-test-plan.md

Goal:
1. src/web-ui/routes/skills.js: change _existingStageEntry's match from
   skillName alone to (skillName, artefactPath), since artefactPath is
   already story-scoped for test-plan/definition-of-ready.
2. src/web-ui/routes/journey.js: remove 'review' from PER_STORY_SEQ
   (becomes ['test-plan', 'definition-of-ready']); the definition-of-ready
   "more stories" branch starts a test-plan session directly for the next
   story instead of calling _startReviewSessionForJourney again. Review's
   two remaining entry points (auto-start-after-definition, manual
   /stories submit) are unchanged.

Constraints:
- New tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js per
  the test plan, driving the real production entry points.
- Correct tests/check-ougl7-dor-and-journey-complete.js's T7.3 to assert
  the new redirect target (test-plan, not review).
- Re-run the full regression suite named in the test plan -- all must
  pass unchanged (except the deliberately-corrected T7.3).
- This is a governed src/ change (CLAUDE.md Artefact-first rule) -- route
  through the normal worktree -> PR -> merge path, open a draft PR, then
  mark it ready immediately per established practice.
- After merge and production deploy, live-verify AC4 directly.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — found and fixed within the same live-verification session that discovered both bugs, per the operator's own explicit in-conversation direction ("Fix it with short track, but also the earlier stage ordering inconsistencies we highlighted").
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
