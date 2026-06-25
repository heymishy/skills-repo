# Definition of Ready — sdg.4

**Story:** sdg.4 — Reference content injection into /ideate system prompt
**Feature:** 2026-06-21-strategy-and-data-hub
**Status:** SIGNED OFF
**Date:** 2026-06-26
**Oversight level:** Low

---

## Contract Proposal

**What will be built:**
An extension to the `buildSystemPrompt()` function that accepts an optional `referenceFiles` parameter (array of `{path, content}` objects from sdg.3). When `referenceFiles` is present and non-empty, a `## Strategic context and reference material` section is appended after the main SKILL.md content. Token budget is estimated with the 4-chars-per-token heuristic; if the total exceeds 12,000 tokens, the largest reference file is truncated with a `[TRUNCATED — remaining content exceeds token budget]` marker and a `[WARN]` is logged. When `referenceFiles` is absent or empty, the section is omitted entirely and existing behaviour is unchanged.

**What will NOT be built:**
- Forcing the model to use reference content (instruction-based only; model decides)
- Semantic relevance matching or content ranking
- Multi-turn reference content changes mid-session
- Summarization beyond truncation-to-fit

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `buildSystemPrompt('ideate', ...)` with referenceFiles returns string with section after SKILL.md content | Unit (T1, T2) |
| AC2 | Token budget warning logged when > 12,000 tokens | Unit (T3) |
| AC3 | Largest file truncated with `[TRUNCATED]` marker; warning logged | Unit (T4, T5) |
| AC4 | Return value is a single string (not array or object) | Unit (T6) |
| AC5 | Model grounds ≥ 2/5 questions in strategy | Manual smoke (see gap) |
| AC6 | No referenceFiles → section omitted, no error | Unit (T7, T8) |

**Assumptions:**
- `buildSystemPrompt()` is the canonical assembly point for all skill system prompts; the parameter is added to the existing signature
- Existing callers that do not pass `referenceFiles` continue to work without modification (backward-compatible parameter addition)

**Estimated touch points:**
- Files: `src/web-ui/modules/system-prompt-builder.js` (or wherever `buildSystemPrompt` lives — confirm at implementation time), `src/web-ui/routes/skills.js` (pass `referenceFiles` from session at the /ideate session start point)

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story is in As / Want / So format | ✅ PASS — "As the /ideate skill, I want to automatically inject uploaded reference files into my system prompt, So that the model has organisational strategy context when framing opportunity questions." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS — 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS — test plan (`artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.4-test-plan.md`) covers ACs 1–4 and 6 with 8 unit tests; AC5 gap is accepted |
| H4 | Out-of-scope section is populated | ✅ PASS — 4 out-of-scope items explicitly listed |
| H5 | Benefit linkage references a named metric | ✅ PASS — References M1 (Strategy content utility) and M2 (Operator adoption) |
| H6 | Complexity is rated | ✅ PASS — Complexity: 1 (well understood; adding a parameter to an existing function; token math is deterministic) |
| H7 | No unresolved HIGH findings from review | ✅ PASS — Review PASS; MEDIUM finding on AC5 (probabilistic model behaviour) is accepted and recorded in gap table |
| H8 | Test plan has no uncovered ACs without acknowledgement | ✅ PASS — AC5 gap is explicitly accepted in test plan gap table; all other ACs fully covered |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS — Constraints: "buildSystemPrompt signature extension; 4-chars-per-token heuristic; truncation preserves semantic completeness; graceful degradation on missing files." |

---

## Open Findings from Review (MEDIUM — non-blocking)

**M-01 (MEDIUM):** AC5 (model acknowledges strategy in ≥ 2/5 questions) is probabilistic and cannot be automatically tested.
**Resolution:** Accepted by design. Manual smoke verification at DoD time: run /ideate with a strategy file; inspect model's Q1–Q5. If fewer than 2 questions acknowledge strategy, refine the instruction text in the system prompt section and re-test.

---

## Coding Agent Instructions

1. Locate `buildSystemPrompt()` in the codebase (`grep -n "buildSystemPrompt" src/` to find it); add `referenceFiles = []` as an optional parameter
2. If `referenceFiles.length > 0`: append `\n\n## Strategic context and reference material\n\n` followed by each file's content separated by `\n\n` to the returned prompt string
3. Estimate total tokens: `Math.ceil((skillContent.length + referenceContent.length + priorContent.length) / 4)`. If > 12,000: log `[WARN] System prompt exceeds soft token budget (actual: N/12000)`; truncate the largest reference file at `Math.floor(remainingChars)` chars and append `\n\n[TRUNCATED — remaining content exceeds token budget]`; log `[WARN] Reference file truncated to fit token budget`
4. If `referenceFiles` is absent or empty: return prompt unchanged (no section added, no error)
5. Wire the call site in `routes/skills.js` for the /ideate session: pass `session.referenceFiles` (populated by sdg.2) when calling `buildSystemPrompt`
6. Run `node tests/check-sdg4-ideate-injection.js` — all 8 tests must pass before opening PR

---

## PROCEED ✅

All hard blocks pass. MEDIUM finding accepted. Oversight: Low — coding agent implements; human reviews before merge.
