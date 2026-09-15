# Definition of Ready Checklist

## Definition of Ready: Centralize per-skill model routing (psrc-s1)

**Story reference:** artefacts/2026-09-15-per-skill-model-routing-config/stories/psrc-s1-centralize-per-skill-model-routing.md
**Test plan reference:** artefacts/2026-09-15-per-skill-model-routing-config/test-plans/psrc-s1-test-plan.md
**Track:** Short-track
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: an operator changing per-skill model routing |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | AC1-AC5 each have a dedicated new behavioural test |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track fix, no formal benefit-metric artefact |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips review |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered; T6 is a regression sanity pass |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | New module under `src/web-ui/config/`, replacing duplicated inline logic — architecture surface is the routing mechanism itself, addressed via the mandatory `decisions.md` entry (below) |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | Not an injectable-adapter pattern — a pure function reading env vars, same shape as the existing `posthog-config.js`/`repo-list.js` convention in this codebase |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track, no discovery stage |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | This is an architectural decision (new routing mechanism + precedence order) requiring a `decisions.md` entry per CLAUDE.md's mandate | ✅ Acknowledged | `decisions.md` entry added alongside this story, recording the mechanism, precedence order, and the preserved safety invariant | Claude Sonnet 5 (orchestrating agent) |
| W2 | This fix touches `src/`, a governed path | ✅ Acknowledged | Routed through the normal worktree → PR → merge path, same as `rms-s1` earlier this session | Claude Sonnet 5 (orchestrating agent) — operator: heymishy, 2026-09-15 (in-conversation) |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Centralize per-skill model routing into one config module with scoped override support
       -- artefacts/2026-09-15-per-skill-model-routing-config/stories/psrc-s1-centralize-per-skill-model-routing.md
Test plan: artefacts/2026-09-15-per-skill-model-routing-config/test-plans/psrc-s1-test-plan.md

Goal:
1. New src/web-ui/config/model-routing.js:
   - DEFAULT_SONNET_SKILLS = ['discovery', 'ideate']
   - HAIKU_BLOCKED_SKILLS = ['discovery'] (safety invariant, unconditional)
   - getModelForSkill(skillName, envVars) -- envVars injectable (default
     process.env), same testability convention as posthog-config.js.
     Precedence: per-skill override
     (envVars['WUCE_MODEL_OVERRIDE_' + skillName.toUpperCase().replace(/-/g,'_')])
     -> envVars.WUCE_FAST_MODEL -> module default. A resolved override that
     is a Haiku model AND the skill is in HAIKU_BLOCKED_SKILLS is refused,
     falling back to the Sonnet default -- mirrors the existing
     WUCE_FAST_MODEL guard in skills.js exactly.
2. src/web-ui/routes/skills.js: replace getModelForSkill() (line ~710) and
   the streaming turn handler's inline _SONNET_SKILLS block (line ~5059)
   with calls into the new module. Remove the now-dead local _SONNET_SKILLS
   var and _isHaikuModel/HAIKU_BLOCKED_SKILLS duplication if fully
   subsumed by the new module (keep HAIKU_BLOCKED_SKILLS exported from the
   new module as the single source of truth; update any other reference).

Constraints:
- New tests/check-psrc-s1-model-routing-config.js per the test plan.
- Full regression suite must pass unchanged.
- This is a governed src/ change -- worktree -> PR -> merge -> deploy,
  same as rms-s1.
- decisions.md entry required (architectural choice) -- add to
  artefacts/2026-09-15-per-skill-model-routing-config/decisions.md.
- Do not touch scripts/run-model-sweep.js's MODEL_ROUTING table or
  htmlSubmitTurn's non-streaming path -- explicitly out of scope.
```

Oversight level: Low

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No further sign-off — found and approved for the governed PR path within the same session, per the operator's own explicit in-conversation direction ("Should we not change the mechanism... default being applied but allowing a per skill stage override config with appropriate mechanism").
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
