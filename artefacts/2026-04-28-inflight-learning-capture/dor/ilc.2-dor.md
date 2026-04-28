# Definition of Ready: Weave agent self-recording instruction into `copilot-instructions.md` and key SKILL.md files

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.2.md
**Test plan reference:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.2-test-plan.md
**Verification script:** artefacts/2026-04-28-inflight-learning-capture/verification-scripts/ilc.2-verification.md
**Contract:** artefacts/2026-04-28-inflight-learning-capture/dor/ilc.2-dor-contract.md
**Assessed by:** Copilot / operator
**Date:** 2026-04-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a **platform operator**" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ | AC4 has manual scenario (Untestable-by-nature gap — acknowledged); all other ACs have unit tests |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 explicit exclusions listed |
| H5 | Benefit linkage field references a named metric | ✅ | M2 (In-session agent capture rate) and MM1 (Agent vs operator capture ratio) |
| H6 | Complexity is rated | ✅ | Rating: 2 — Some ambiguity |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH — review run 1 PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC4 gap typed Untestable-by-nature, acknowledged; 0 UNCERTAIN gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: ilc.1. No pipeline-state.schema.json fields declared — instruction-text story, schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011 + grouping pattern referenced; no pipeline-state.json schema changes |
| H-E2E | CSS-layout-dependent AC check | ✅ | No CSS-layout-dependent ACs — not applicable |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-04-28-inflight-learning-capture/nfr-profile.md confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No compliance frameworks in scope — not applicable |
| H-NFR3 | Data classification field not blank | ✅ | "Public" — specified in NFR profile |
| H-NFR-profile | Story NFRs populated and NFR profile present | ✅ | NFRs declared (instruction hygiene, no new deps, wording precision); profile confirmed |

**Result: 13/13 hard blocks passed ✅**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ Stable | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM in review | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Edge cases may be missed; agent verifies against slightly wrong criteria | Operator, 2026-04-28 |
| W5 | No UNCERTAIN gaps in test plan | ✅ | AC4 gap is Untestable-by-nature, not UNCERTAIN | — |

**Standards injection:** No domain tags on story — standards injection not applicable.

---

## Oversight

**Level: Low** — instruction-text-only story, Complexity 2, no regulated data. No sign-off required beyond this DoR.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Weave agent self-recording instruction into copilot-instructions.md and key SKILL.md files
Story artefact: artefacts/2026-04-28-inflight-learning-capture/stories/ilc.2.md
Test plan: artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.2-test-plan.md
Verification script: artefacts/2026-04-28-inflight-learning-capture/verification-scripts/ilc.2-verification.md
Contract: artefacts/2026-04-28-inflight-learning-capture/dor/ilc.2-dor-contract.md

Prerequisite: ilc.1 must be merged before this story is implemented. This story's
instruction text references workspace/capture-log.md and the 5-field schema defined
in ilc.1.

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

What to build:
1. Add a self-recording instruction block to copilot-instructions.md (≤60 words,
   imperative language) directing the agent to:
   - Write to workspace/capture-log.md when a non-trivial event occurs during a
     pipeline session (decision, validated/invalidated assumption, pattern, gap)
   - Use source: agent-auto for these entries
   - Use the same 5-field schema defined in ilc.1
   - NOT write for routine, well-understood steps with no signal-worthy events
   - Use imperative wording: "Write to workspace/capture-log.md" — not "consider
     writing" or "you may want to"
2. Add a capture-reminder callout (≤30 words each) to each of these 8 SKILL.md files:
   - .github/skills/checkpoint/SKILL.md
   - .github/skills/definition/SKILL.md
   - .github/skills/review/SKILL.md
   - .github/skills/test-plan/SKILL.md
   - .github/skills/definition-of-ready/SKILL.md
   - .github/skills/tdd/SKILL.md
   - .github/skills/systematic-debugging/SKILL.md
   - .github/skills/implementation-review/SKILL.md
   Each callout must: reference workspace/capture-log.md, specify when to write
   (at the skill's signal point — decision, pattern, gap, etc.), and mention the
   6 signal types (or link to the main instruction in copilot-instructions.md).

NFR constraints (enforced by tests):
- Self-recording instruction in copilot-instructions.md: ≤60 words
- Each SKILL.md reminder callout: ≤30 words
- Wording must be imperative — direct commands, not suggestions

Constraints:
- Touch only: copilot-instructions.md and the 8 named SKILL.md files above
- Do NOT touch: any file under artefacts/, .gitignore, package.json,
  pipeline-state.json, workspace/state.json, or any SKILL.md not in the named 8
- No new npm dependencies
- Architecture standards: read .github/architecture-guardrails.md before implementing.
  ADR-011 compliance is satisfied by this story artefact existing before you merge.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the specific blocker and stop — do not improvise a workaround
```
