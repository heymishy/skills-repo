# Test Plan — sdg.4: Reference content injection into /ideate system prompt

**Story:** artefacts/2026-06-04-strategy-data-grounding/definition.md (Story sdg.4)
**Feature:** 2026-06-21-strategy-and-data-hub
**Review:** artefacts/2026-06-21-strategy-and-data-hub/review.md — PASS (2026-06-21; 1 MEDIUM finding on AC5 — accepted)
**Date:** 2026-06-26
**Test runner:** `node tests/check-sdg4-ideate-injection.js`

---

## Test Data Strategy

**Strategy:** Synthetic — tests call `buildSystemPrompt()` directly with crafted `referenceFiles` inputs. Sample reference file content (short, deterministic strings) is used to assert injection formatting. Token budget tests use known character counts with the 4-chars-per-token heuristic.

**Data owner:** Self-contained — no external API calls in unit tests. Model behaviour (AC5) cannot be tested automatically.

**PCI/sensitivity:** None.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — Reference section added after SKILL.md content in correct format | T1, T2 | Unit | None |
| AC2 — Token budget warning logged if > 12,000 tokens | T3 | Unit | None |
| AC3 — Largest file truncated with `[TRUNCATED]` marker when budget exceeded | T4, T5 | Unit | None |
| AC4 — System prompt returned as single string (no multi-part assembly) | T6 | Unit | None |
| AC5 — Model grounds ≥ 2 of 5 questions in strategy | — | Probabilistic | Accepted — see gap table |
| AC6 — No reference files → no section, no error | T7, T8 | Unit | None |
| NFR-TOKEN — 4-chars-per-token heuristic used for budget estimation | T3 | Unit | None |

---

## Unit Tests

Test file: `tests/check-sdg4-ideate-injection.js`

All tests must **FAIL** before implementation (the `buildSystemPrompt` function does not accept `referenceFiles` parameter yet).

**T1 — `build-system-prompt-adds-reference-section-after-skill-content`** (AC1)
- Action: call `buildSystemPrompt('ideate', repoPath, config, { priorArtefacts: [], referenceFiles: [{ path: 'tmp/strategy.md', content: '# Strategy\n\nLine 1.' }] })`
- Expected: returned string contains `## Strategic context and reference material` section; that section appears AFTER the main SKILL.md content (index of `## Strategic context` > index of first SKILL.md heading)
- Currently: FAIL — `buildSystemPrompt` does not accept `referenceFiles` parameter

**T2 — `reference-section-contains-file-content-verbatim`** (AC1)
- Action: call `buildSystemPrompt` with one reference file containing `# Strategy\n\nLine 1.`
- Expected: returned prompt contains the literal text `# Strategy\n\nLine 1.` within the strategic context section
- Currently: FAIL

**T3 — `token-budget-warning-logged-when-budget-exceeded`** (AC2, NFR-TOKEN)
- Action: call `buildSystemPrompt` with a reference file whose content is 40,000 characters (estimated ~10,000 tokens), plus a mock SKILL.md of 8,000 chars (~2,000 tokens) — total ~12,000+ tokens
- Expected: warning logged matching `/\[WARN\].*System prompt exceeds.*12.?000/i`; function still returns a string (no throw)
- Currently: FAIL

**T4 — `oversized-file-truncated-with-marker`** (AC3)
- Action: call `buildSystemPrompt` with a reference file large enough to exceed the 12,000-token budget after SKILL.md baseline
- Expected: returned prompt contains `[TRUNCATED — remaining content exceeds token budget]` within the strategic context section; content before the marker is present and unmodified
- Currently: FAIL

**T5 — `truncation-warning-logged`** (AC3)
- Action: same setup as T4
- Expected: warning logged matching `/\[WARN\].*truncated.*token budget/i`
- Currently: FAIL

**T6 — `build-system-prompt-returns-single-string`** (AC4)
- Action: call `buildSystemPrompt('ideate', repoPath, config, { priorArtefacts: [], referenceFiles: [{ path: 'tmp/a.md', content: 'content' }] })`
- Expected: return value is a `string` (typeof result === 'string'); not an array, not a Buffer, not an object
- Currently: FAIL

**T7 — `no-reference-files-omits-strategic-context-section`** (AC6)
- Action: call `buildSystemPrompt('ideate', repoPath, config, { priorArtefacts: [] })` (no `referenceFiles` key)
- Expected: returned string does NOT contain `## Strategic context and reference material`; no empty section heading present
- Currently: FAIL

**T8 — `empty-reference-files-array-omits-section`** (AC6)
- Action: call `buildSystemPrompt('ideate', repoPath, config, { priorArtefacts: [], referenceFiles: [] })`
- Expected: same as T7 — section omitted; no error thrown
- Currently: FAIL

---

## Gap Table

| Gap | AC | Accepted? | Mitigation |
|-----|-----|-----------|------------|
| AC5 — model grounds ≥ 2/5 questions in strategy | AC5 | ✅ Accepted (MEDIUM finding in review) | Cannot be automatically tested without a real model call. Verified via manual smoke: run /ideate with a strategy file; inspect Q1–Q5; confirm ≥ 2 explicitly reference strategy content. Document outcome in DoD metric signal for M1 (Strategy content utility). |
| System prompt size in real /ideate session (actual token count vs heuristic) | AC2 | ✅ Accepted | Heuristic is sufficient for soft budget. Token over-runs manifest as model context warnings, not crashes. |

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (must fail before impl) | 8 |
| **Total** | **8** |
| AC5 (probabilistic model behaviour) | 0 automated — manual smoke only |
