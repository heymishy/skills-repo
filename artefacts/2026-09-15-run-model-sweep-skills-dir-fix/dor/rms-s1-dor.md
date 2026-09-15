# Definition of Ready Checklist

## Definition of Ready: Fix run-model-sweep.js's stale SKILLS_DIR path (rms-s1)

**Story reference:** artefacts/2026-09-15-run-model-sweep-skills-dir-fix/stories/rms-s1-fix-stale-skills-dir-path.md
**Test plan reference:** artefacts/2026-09-15-run-model-sweep-skills-dir-fix/test-plans/rms-s1-test-plan.md
**Track:** Short-track (tooling bug, found while trying to launch a real model-routing experiment)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: an operator running `scripts/run-model-sweep.js` |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | AC1/AC2/AC3 each have a dedicated new behavioural test |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track bug fix, no formal benefit-metric artefact |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips review |
| H8 | Test plan has no uncovered ACs | ✅ | All 3 ACs covered; T4 is a regression sanity pass |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ N/A | Single constant change in an existing, unwired standalone CLI script — no architecture surface |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track, no discovery stage |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | This fix touches `scripts/`, a governed path (CLAUDE.md Platform change policy) | ✅ Acknowledged | Routed through the normal worktree → PR → merge path per policy, not a direct-to-master bookkeeping commit. | Claude Sonnet 5 (orchestrating agent) — operator: heymishy, 2026-09-15 (in-conversation: "Proper fix via PR") |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix run-model-sweep.js's stale SKILLS_DIR path
       -- artefacts/2026-09-15-run-model-sweep-skills-dir-fix/stories/rms-s1-fix-stale-skills-dir-path.md
Test plan: artefacts/2026-09-15-run-model-sweep-skills-dir-fix/test-plans/rms-s1-test-plan.md

Goal:
1. scripts/run-model-sweep.js: change SKILLS_DIR from
   path.join(REPO_ROOT, '.github', 'skills') to
   path.join(REPO_ROOT, 'skills') -- matching the real, current skill
   location (same fix platform-init.js already received in PR #753 /
   pisd-s1).
2. Same file: update the stale "No skills with EVAL.md found under
   .github/skills/" log message (line ~1429) to reference SKILLS_DIR
   dynamically instead of a hardcoded stale path string, so this can't
   drift again silently.

Constraints:
- New tests/check-rms-s1-skills-dir-path.js per the test plan, driving
  the real CLI via child_process against the real repo tree (no mocks --
  this bug was invisible specifically because nothing exercised the real
  path).
- This is a governed scripts/ change (CLAUDE.md Platform change policy)
  -- route through the normal worktree -> PR -> merge path, open a draft
  PR, then mark it ready immediately per established practice.
- Do not touch the other 9 files referencing .github/skills -- confirmed
  those are legitimate consumer-repo install-target references (see
  platform-init.js's own pisd-s1 comment), not this bug.
```

Oversight level: Low

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No further sign-off — single-constant tooling fix, found and approved for the governed PR path within the same session, per the operator's own explicit in-conversation direction ("Proper fix via PR (Recommended)").
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
