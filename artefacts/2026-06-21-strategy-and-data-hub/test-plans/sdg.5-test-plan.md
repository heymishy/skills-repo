# Test Plan — sdg.5: Reference content injection into /discovery system prompt

**Story:** artefacts/2026-06-04-strategy-data-grounding/definition.md (Story sdg.5)
**Feature:** 2026-06-21-strategy-and-data-hub
**Review:** artefacts/2026-06-21-strategy-and-data-hub/review.md — PASS (2026-06-21; 1 MEDIUM finding on AC2 — accepted)
**Date:** 2026-06-26
**Test runner:** `node tests/check-sdg5-discovery-injection.js`

---

## Test Data Strategy

**Strategy:** Synthetic — tests call `buildSystemPrompt('discovery', ...)` with crafted `referenceFiles` and assert on the returned string. Callout marker tests use synthetic artefact text with known `[Grounded in: <filename>]` patterns. No real model calls are made in automated tests.

**Data owner:** Self-contained.

**PCI/sensitivity:** None.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — Reference section injected into /discovery system prompt in same format as sdg.4 | T1, T2 | Unit | None |
| AC2 — Model grounds scope against strategy | — | Probabilistic | Accepted — see gap table |
| AC3 — Callout markers `[Grounded in: <filename>]` in grounded sections | T3 | Unit (instruction text) | None |
| AC4 — Callout markers preserved verbatim in saved artefact | T4 | Unit (write-then-read) | None |
| AC5 — Multiple reference files cited appropriately | T5 | Unit | None |
| AC6 — No reference files → baseline discovery, no markers, no error | T6, T7 | Unit | None |
| NFR-CALLOUT — Callout format is literal `[Grounded in: <filename>]`; no variations | T3 | Unit | None |

---

## Unit Tests

Test file: `tests/check-sdg5-discovery-injection.js`

All tests must **FAIL** before implementation.

**T1 — `build-system-prompt-discovery-adds-reference-section`** (AC1)
- Action: call `buildSystemPrompt('discovery', repoPath, config, { priorArtefacts: [], referenceFiles: [{ path: 'tmp/strategy.md', content: '# Strategy\n\nContent.' }] })`
- Expected: returned string contains `## Strategic context and reference material`; section appears after main SKILL.md content
- Currently: FAIL — same as sdg.4: `buildSystemPrompt` does not accept `referenceFiles` for 'discovery' skill

**T2 — `discovery-reference-section-format-matches-ideate`** (AC1)
- Action: call `buildSystemPrompt('discovery', ...)` and `buildSystemPrompt('ideate', ...)` with identical `referenceFiles` input
- Expected: the strategic context section text is identical between both returned prompts (same heading, same content, same separator); the injection mechanism is shared, not duplicated
- Currently: FAIL

**T3 — `discovery-skill-md-instructs-callout-marker-format`** (AC3, NFR-CALLOUT)
- Action: read `skills/discovery/SKILL.md` from disk; search for callout marker instruction
- Expected: file contains the literal string `[Grounded in:` within the instruction text (the model is instructed to use this exact format)
- Currently: FAIL — no callout instruction exists in discovery SKILL.md

**T4 — `callout-markers-preserved-in-saved-artefact`** (AC4)
- Action: simulate the artefact save path with synthetic artefact text containing `[Grounded in: strategy.md]`; write to a temp file; read back from disk
- Expected: temp file content contains `[Grounded in: strategy.md]` verbatim (no escaping, no stripping, no modification)
- Currently: FAIL — artefact save path may strip markdown bracketed content depending on implementation

**T5 — `multiple-reference-files-appear-in-injected-section`** (AC5)
- Action: call `buildSystemPrompt('discovery', repoPath, config, { priorArtefacts: [], referenceFiles: [{ path: 'tmp/strategy.md', content: '# Strategy' }, { path: 'tmp/data.md', content: '# Data' }] })`
- Expected: both `# Strategy` and `# Data` content blocks appear in the returned string within the strategic context section, separated by blank line(s)
- Currently: FAIL

**T6 — `no-reference-files-omits-section-from-discovery-prompt`** (AC6)
- Action: call `buildSystemPrompt('discovery', repoPath, config, { priorArtefacts: [] })`
- Expected: returned string does NOT contain `## Strategic context and reference material`; no error thrown
- Currently: FAIL

**T7 — `no-reference-files-callout-markers-absent-from-baseline`** (AC6)
- Action: read `skills/discovery/SKILL.md`; assert that outside the reference injection section, no hardcoded `[Grounded in:` markers exist
- Expected: pattern `\[Grounded in:` absent from baseline SKILL.md content (markers should only appear when the model generates them in response to injected reference content)
- Currently: PASS (no such markers exist yet) — regression guard to ensure the baseline is not polluted by implementation

---

## Gap Table

| Gap | AC | Accepted? | Mitigation |
|-----|-----|-----------|------------|
| AC2 — model explicitly grounds scope against strategy | AC2 | ✅ Accepted (MEDIUM finding in review) | Cannot be automatically tested. Manual smoke: run /discovery with a strategy file; verify generated scope sections reference strategy content. Document in DoD. |
| Callout markers appear in correct sections (problem statement, scope, personas, out-of-scope) | AC3 | ✅ Accepted | T3 verifies the instruction is present in SKILL.md; which sections receive markers depends on model output. E2E manual smoke covers this. |

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (must fail before impl) | 6 |
| Unit (regression guard — passes before and after) | 1 |
| **Total** | **7** |
| AC2 (probabilistic model behaviour) | 0 automated — manual smoke only |
