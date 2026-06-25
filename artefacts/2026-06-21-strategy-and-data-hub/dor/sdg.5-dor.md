# Definition of Ready — sdg.5

**Story:** sdg.5 — Reference content injection into /discovery system prompt
**Feature:** 2026-06-21-strategy-and-data-hub
**Status:** SIGNED OFF
**Date:** 2026-06-26
**Oversight level:** Low

---

## Contract Proposal

**What will be built:**
Extension of the `buildSystemPrompt('discovery', ...)` call to accept `referenceFiles` using the same mechanism implemented in sdg.4 for /ideate. An instruction is added to `skills/discovery/SKILL.md` directing the model to include `[Grounded in: <filename>]` callout markers in each artefact section that cites reference content. The callout format is literal — `[Grounded in: <filename>]` — with no variations. The artefact save path is verified to preserve these markers verbatim. Sessions without reference files produce baseline discovery artefacts with no markers and no error.

**What will NOT be built:**
- Automatic relevance ranking of reference files
- Modification of operator problem statement based on reference content
- Feedback loops suggesting reference file updates
- Storing reference content alongside the discovery artefact

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `buildSystemPrompt('discovery', ...)` with referenceFiles injects same section as sdg.4 | Unit (T1, T2) |
| AC2 | Model grounds scope against strategy | Manual smoke (see gap) |
| AC3 | `skills/discovery/SKILL.md` contains callout marker instruction with literal `[Grounded in:` | Unit (T3) |
| AC4 | Callout markers preserved verbatim in saved artefact file | Unit (T4) |
| AC5 | Multiple files appear independently in injected section | Unit (T5) |
| AC6 | No referenceFiles → baseline discovery, no markers, no error | Unit (T6, T7) |

**Assumptions:**
- `buildSystemPrompt()` already accepts `referenceFiles` after sdg.4 is implemented; sdg.5 adds the /discovery call site and the SKILL.md instruction, not a new injection mechanism
- The callout marker instruction text in `skills/discovery/SKILL.md` is sufficient to guide the model; no additional prompting is needed

**Estimated touch points:**
- Files: `skills/discovery/SKILL.md` (callout instruction addition), `src/web-ui/routes/skills.js` (pass `session.referenceFiles` at /discovery session start)
- Dependencies: sdg.3 (file reading), sdg.4 (injection mechanism)

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story is in As / Want / So format | ✅ PASS — "As the /discovery skill, I want to automatically inject reference files into my system prompt, So that the model grounds discovery scope against organisational strategy and data." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS — 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS — test plan (`artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.5-test-plan.md`) covers ACs 1, 3, 4, 5, 6 with 7 tests; AC2 gap is accepted |
| H4 | Out-of-scope section is populated | ✅ PASS — 4 out-of-scope items explicitly listed |
| H5 | Benefit linkage references a named metric | ✅ PASS — References M1 (Strategy content utility) |
| H6 | Complexity is rated | ✅ PASS — Complexity: 1 (call-site wiring + SKILL.md instruction addition; injection mechanism shared from sdg.4) |
| H7 | No unresolved HIGH findings from review | ✅ PASS — Review PASS; MEDIUM on AC2 (probabilistic model behaviour) is accepted |
| H8 | Test plan has no uncovered ACs without acknowledgement | ✅ PASS — AC2 gap explicitly accepted in test plan gap table |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS — Constraints: "Same injection mechanism as sdg.4; literal callout format; callout markers preserved verbatim; ADR-023 handoff schema respected." |
| H-GOVCHANGE | SKILL.md change requires artefact-first rule check | ✅ PASS — this story IS the artefact-first chain for the `skills/discovery/SKILL.md` modification; story → test-plan → DoR all exist before the change |

---

## Open Findings from Review (MEDIUM — non-blocking)

**M-01 (MEDIUM):** AC2 (model explicitly grounds scope against strategy) is probabilistic.
**Resolution:** Accepted. Manual smoke at DoD: run /discovery with strategy file; verify at least one scope section references strategy content. Callout markers (AC3) serve as the primary automated signal.

---

## Coding Agent Instructions

1. In `routes/skills.js`, at the /discovery session start point, pass `session.referenceFiles` when calling `buildSystemPrompt('discovery', ...)`; the same way as sdg.4 wired it for /ideate
2. Add the following instruction to `skills/discovery/SKILL.md` in the output-generation section (where the model is instructed on what to include in each section): "When a section of your output cites or is grounded in uploaded reference content, include the marker `[Grounded in: <filename>]` at the end of that section. Use the exact filename from the reference material. Do not use this marker if no reference files were uploaded."
3. Verify the artefact save path does not strip or escape bracket sequences — if it does, fix it (T4 covers this)
4. Platform change policy applies to `skills/discovery/SKILL.md` — this change must go via PR with review before merge
5. Run `node tests/check-sdg5-discovery-injection.js` — all 7 tests must pass before opening PR

---

## PROCEED ✅

All hard blocks pass. MEDIUM finding accepted. Oversight: Low — coding agent implements; human reviews before merge.
