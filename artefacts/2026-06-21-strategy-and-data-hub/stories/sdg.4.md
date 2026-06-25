# Story sdg.4 — Reference content injection into /ideate system prompt

**User story:**
As the /ideate skill,
I want to automatically inject uploaded reference files into my system prompt,
So that the model has organisational strategy context when framing opportunity questions.

## Acceptance criteria

**AC1 — Reference content injected as new system prompt section**
Given a /ideate session starts with `referenceFiles` in the journey context,
When `buildSystemPrompt('ideate', repoPath, webUiConfig, {priorArtefacts, referenceFiles})` is called,
Then a new section is added to the system prompt after the main SKILL.md content:
```
## Strategic context and reference material
[content of first reference file]

[content of second reference file, if present]
```

**AC2 — Token budget validation**
Given reference content is injected,
When the system prompt is assembled,
Then the total token count is validated: SKILL.md tokens + reference content tokens + prior artefacts tokens ≤ 12,000 tokens (soft limit).
If total exceeds 12,000, a warning is logged: `[WARN] System prompt exceeds soft token budget (actual: N/12000)` but injection proceeds.

**AC3 — Large file truncation (if necessary)**
Given the reference content would cause token count to exceed 12,000,
When the largest reference file is identified,
Then that file is truncated to fit: `[content...]\n\n[TRUNCATED — remaining content exceeds token budget]`,
And a warning is logged: `[WARN] Reference file truncated to fit token budget`.

**AC4 — Model receives complete system prompt in one request**
Given the system prompt is assembled with reference content,
When the model's first turn is generated,
Then the complete system prompt (SKILL.md + reference section) is sent to GitHub Copilot Chat Completions API in a single HTTP request (no multi-part or streaming assembly).

**AC5 — Model acknowledges and grounds questions in strategy**
Given reference content is present in the system prompt,
When the model generates its opening questions (Q1–Q5 of /ideate),
Then at least 2 of the 5 questions explicitly reference or acknowledge strategy content.

**AC6 — No reference files present → no error**
Given a /ideate session starts WITHOUT referenceFiles in journey context,
When `buildSystemPrompt()` is called,
Then the strategic context section is omitted (no empty section, no error),
And the SKILL.md content is unchanged (baseline /ideate instructions intact).

## Out of scope
- Forcing the model to use reference content (instruction-based guidance only; model decides)
- Semantic relevance matching or content filtering (full files injected, no ranking)
- Multi-turn model interactions where reference content changes mid-session
- Summarization or compression of reference content beyond truncation-to-fit

## Dependencies
sdg.3 (reference file content must be readable and validated)

## NFR / Constraints
- **System prompt assembly:** `buildSystemPrompt()` function signature must accept `referenceFiles` parameter
- **Token counting:** Use existing token counter in codebase (if available) or a simple heuristic (est. 4 characters = 1 token)
- **Truncation:** Only truncate if necessary; preserve semantic completeness of truncated content
- **Error handling:** Missing or unreadable files do not cause system prompt assembly to fail (graceful degradation)
