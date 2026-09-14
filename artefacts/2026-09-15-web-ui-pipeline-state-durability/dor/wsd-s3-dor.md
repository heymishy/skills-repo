# Definition of Ready Checklist

## Definition of Ready: Snapshot pipeline-state writer context at first-known-good (wsd-s3)

**Story reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s3.md
**Test plan reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s3-test-plan.md
**Track:** Short-track (bug found during `wsd-s2`'s own live production verification)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: the operator relying on wsd-s2's writer |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | AC1/AC2 via regression re-run (T1-T7); AC3 via live verification (T8) |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Both wsd feature metrics, directly completing wsd-s2's unmet portion |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips review |
| H8 | Test plan has no uncovered ACs | ✅ | All 3 ACs covered |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ N/A | Pure refactor, no new architecture surface |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — `pipeline-state-github-writer.js`'s existing contract is unchanged |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track, no discovery stage |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | AC3 is not automatable, live-verification-only | ✅ Acknowledged | Same pattern already used for `asf-s1`'s own live verification this session — accepted as the correct verification method for a production-session-timing bug, not a gap. | Claude Sonnet 5 (orchestrating agent) |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Snapshot pipeline-state writer context at first-known-good
       -- artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s3.md
Test plan: artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s3-test-plan.md

Goal:
In src/web-ui/routes/journey.js's handlePostGateConfirm, introduce a
_pipelineStateContext = { token, owner, repo } object captured immediately
after _dasOwnerRepo resolves (same point commitArtefact already reads these
values from). Use this same snapshot for both the commitArtefact call and
the later _pipelineStateWriter call, instead of the latter re-reading
req.session.accessToken / _dasOwnerRepo fresh.

Constraints:
- Zero change to pipeline-state-github-writer.js itself.
- Zero change to the {token, owner, repo} shape the writer expects.
- Re-run T1-T7 (the existing regression suite) -- all must pass unchanged.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) -- route
  through the normal worktree -> PR -> merge path, open a draft PR, then
  mark it ready immediately per established practice.
- After merge and production deploy, live-verify AC3 directly (T8) --
  drive a fresh feature through a real stage completion in the production
  web UI and confirm a new pipeline-state.json commit lands on
  origin/master.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — found and fixed within the same live-verification session that discovered it, per the operator's own in-conversation direction to fix now.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation, "Fix now (short-track)")

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
