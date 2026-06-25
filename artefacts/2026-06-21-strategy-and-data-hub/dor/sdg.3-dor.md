# Definition of Ready — sdg.3

**Story:** sdg.3 — Reference file content reading and validation
**Feature:** 2026-06-21-strategy-and-data-hub
**Status:** SIGNED OFF
**Date:** 2026-06-26
**Oversight level:** Low

---

## Contract Proposal

**What will be built:**
A reference file content reading module (`src/web-ui/modules/reference-reader.js`) that reads uploaded markdown files from disk, validates their content (existence, UTF-8 encoding, character count ≤ 10,000), and returns structured `{fileName, content, charCount}` objects for injection into system prompts. Files that fail validation are skipped with a logged warning; other files in the batch continue. A `logTokenBudget()` helper logs the assembled token count across SKILL.md, reference files, and prior artefacts against the 12,000-token soft limit.

**What will NOT be built:**
- Automatic content normalization or format conversion (markdown injected as-is)
- Semantic analysis or pattern extraction from file content
- Content modification, filtering, or redaction
- Caching of file content across sessions (re-read on each session)
- Third-party file libraries (Node.js built-ins only)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `readReferenceFile()` returns `{fileName, content, charCount}` | Unit (T1, T2) |
| AC2 | Existence, encoding, size checks; null returned with warning | Unit (T3, T4, T5) |
| AC3 | Oversized file skipped (not truncated); warning logged | Unit (T6) |
| AC4 | `logTokenBudget()` logs `[INFO]` with component breakdown | Unit (T7) |
| AC5 | `readReferenceFiles()` processes batch; one failure does not stop others | Unit (T8) |
| AC6 | Invalid UTF-8 → warning with file path; file excluded from results | Unit (T4, T9) |

**Assumptions:**
- Node.js `fs.readFileSync(path, 'utf8')` throwing on invalid UTF-8 bytes is sufficient encoding detection; no explicit charset library needed
- Token heuristic of 4 characters per token is acceptable for the soft budget warning

**Estimated touch points:**
- Files: `src/web-ui/modules/reference-reader.js` (new), `src/web-ui/routes/skills.js` (call site for `buildSystemPrompt`)
- Dependencies on sdg.1 (files must exist on disk) and sdg.2 (file paths come from `session.referenceFiles`)

---

## Hard Block Checklist

| # | Check | Result |
|---|-------|--------|
| H1 | User story is in As / Want / So format | ✅ PASS — "As the skills pipeline, I want to read uploaded markdown files from disk and validate their content, So that the content can be injected into skill session system prompts safely." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS — 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS — test plan (`artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.3-test-plan.md`) covers all 6 ACs; 9 unit tests total |
| H4 | Out-of-scope section is populated | ✅ PASS — 4 out-of-scope items explicitly listed |
| H5 | Benefit linkage references a named metric | ✅ PASS — References M1 (Strategy content utility) from benefit-metric.md |
| H6 | Complexity is rated | ✅ PASS — Complexity: 1 (well understood; standard Node.js file I/O with try/catch; no ambiguity) |
| H7 | No unresolved HIGH findings from review | ✅ PASS — Review report shows PASS with no HIGH findings for sdg.3 |
| H8 | Test plan has no uncovered ACs (or gaps acknowledged) | ✅ PASS — All 6 ACs covered; 2 acknowledged gaps (encoding library, token accuracy) both accepted by design |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS — Constraints: "Use fs.readFileSync only; UTF-8; 10,000-char soft limit; 12,000-token soft limit; no third-party file libs." |

---

## Coding Agent Instructions

1. Create `src/web-ui/modules/reference-reader.js` exposing: `readReferenceFile(filePath)`, `readReferenceFiles(filePaths)`, `logTokenBudget({skillTokens, referenceTokens, priorTokens})`
2. `readReferenceFile` must use `fs.readFileSync(filePath, 'utf8')` inside a try/catch; catch block logs `[WARN] Reference file [path] is not valid UTF-8; skipping` on encoding errors, and `[WARN] Reference file [path] not found` on ENOENT
3. Character count check runs after successful read; if `content.length > 10000` log `[WARN] Reference file [path] exceeds 10,000 char limit; file will not be injected` and return `null`
4. `logTokenBudget` logs `[INFO] System prompt tokens: SKILL=[N] + reference=[N] + prior=[N] = [total]/12000` using the 4-chars-per-token heuristic
5. `readReferenceFiles` calls `readReferenceFile` per path; collects non-null results; never throws even if all files fail
6. Run `node tests/check-sdg3-file-content-reading.js` — all 9 tests must pass before opening PR

---

## PROCEED ✅

All hard blocks pass. Oversight: Low — coding agent implements; human reviews before merge.
