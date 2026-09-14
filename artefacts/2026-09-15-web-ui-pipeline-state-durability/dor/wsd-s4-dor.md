# Definition of Ready Checklist

## Definition of Ready: Resolve pipeline-state writer owner/repo fresh and unconditionally (wsd-s4)

**Story reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s4.md
**Test plan reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s4-test-plan.md
**Track:** Short-track (bug found during `wsd-s3`'s own live production re-verification)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: the operator relying on wsd-s2's writer |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | AC1/AC2 via regression re-run; AC3 via a new behavioural test (T8); AC4 via live verification (T9) |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Directly completes wsd-s2/wsd-s3's unmet benefit (see story) |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips review |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ N/A | Pure refactor of an existing call site, no new architecture surface |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track, no discovery stage |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | AC4 is not automatable, live-verification-only | ✅ Acknowledged | Same pattern already used twice this session (wsd-s2, wsd-s3) for the same live-verification purpose. | Claude Sonnet 5 (orchestrating agent) |
| W2 | This is the SECOND attempted fix for the same underlying gap (wsd-s3 was insufficient) | ✅ Acknowledged | Root cause is now fully isolated (traced to dcuf-s1's own already-documented code movement) and covered by a new behavioural test (T8) that reproduces the exact real-world two-step flow — a materially stronger verification bar than wsd-s3's had. | Claude Sonnet 5 (orchestrating agent) |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Resolve pipeline-state writer owner/repo fresh and unconditionally
       -- artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s4.md
Test plan: artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s4-test-plan.md

Goal:
In src/web-ui/routes/journey.js's handlePostGateConfirm, at the pipeline-
state-writer call site, resolve owner/repo via a fresh, unconditional call
to ownerRepoForFeature(journey.featureSlug, req.session.accessToken) --
independent of _dasOwnerRepo (revert wsd-s3's snapshot reuse; _dasOwnerRepo
stays local to the largely-dead artefact-commit block above it, per
dcuf-s1's own documented reality that block rarely runs for real usage).

Constraints:
- Zero change to pipeline-state-github-writer.js itself.
- New test file tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js
  per the test plan, driving the REAL two-step flow (handlePostTurnStreamHtml
  then handlePostGateConfirm), not a hand-built _stageDone-unset session.
- Re-run T1-T7 (existing regression suite) -- all must pass unchanged.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) -- route
  through the normal worktree -> PR -> merge path, open a draft PR, then
  mark it ready immediately per established practice.
- After merge and production deploy, live-verify AC4 directly (T9).
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — found and fixed within the same live-verification session that discovered wsd-s3's own insufficiency, per the operator's own earlier in-conversation direction to fix now.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation, original "Fix now (short-track)" direction)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
