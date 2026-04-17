# DoR Contract: Add instrumentation instruction to `copilot-instructions.md`

**Story:** spc.3-agent-instruction-integration
**Feature:** 2026-04-18-skill-performance-capture
**Approved:** 2026-04-18

**⚠️ PLATFORM CHANGE POLICY:** Changes to `.github/copilot-instructions.md` must be made via a PR. Direct commits to master are a pipeline violation. (RISK-ACCEPT 1-M6)

---

## What will be built

A new section `## Skill Performance Capture (instrumentation)` in `.github/copilot-instructions.md` (via PR). The section instructs: (a) read context.yml at session start, (b) check instrumentation.enabled, (c) append capture block to named artefact types when enabled, (d) appendix constraint, (e) 5 artefact types named + gate exclusion. Credential warning for fidelity_self_report included.

## What will NOT be built

- No SKILL.md modifications
- No automatic operator review section population
- No retroactive block appending

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read .github/copilot-instructions.md; assert section heading + 3 instructions | Unit (file inspection) |
| AC2 | Run skill with instrumentation.enabled:true; inspect output artefact for capture block | Manual (live session 🔴) |
| AC3 | Run skill with instrumentation.enabled:false; inspect output artefact — no block | Manual (live session 🔴) |
| AC4 | Read file; assert appendix constraint text present | Unit (file inspection) |
| AC5 | Read file; assert 5 artefact types + DoR/DoD exclusion | Unit (file inspection) |

## Assumptions

- Field names match spc.1/spc.2 exactly: experiment_id, model_label, cost_tier, skill_name, artefact_path, run_timestamp
- AC2 and AC3 are acknowledged manual gaps
- Change goes in as new section; does not conflict with existing sections

## schemaDepends

`schemaDepends: []` — upstream dependencies are on context.yml fields (spc.1) and template fields (spc.2), not pipeline-state.json fields.

## Estimated touch points

Files: `.github/copilot-instructions.md` (additive section — via PR only). Services: none. APIs: none.

## 🔴 Manual verification gaps

- AC2: live session required (instrumentation enabled)
- AC3: live session required (instrumentation disabled)
- See spc.3-verification.md Scenarios 4 and 5 for procedure
