# Story sdg.5 — Reference content injection into /discovery system prompt

**User story:**
As the /discovery skill,
I want to automatically inject reference files into my system prompt,
So that the model grounds discovery scope against organisational strategy and data.

## Acceptance criteria

**AC1 — Reference content injected into /discovery system prompt**
Given a /discovery session starts (after /ideate completes) with `referenceFiles` in journey context,
When `buildSystemPrompt('discovery', repoPath, webUiConfig, {priorArtefacts, referenceFiles})` is called,
Then reference content is injected using the same format as sdg.4:
```
## Strategic context and reference material
[content of first reference file]
[content of second reference file, if present]
```

**AC2 — Model grounds scope against strategy**
Given the discovery problem statement has been provided by the operator,
When the model generates discovery scope boundaries and acceptance criteria,
Then the model explicitly grounds them against reference content where available.

**AC3 — Callout markers in artefact output**
Given reference files are injected and used by the model,
When the model generates discovery artefact sections (problem statement, scope, personas, out-of-scope),
Then each section that cites strategy or data includes an explicit callout marker: `[Grounded in: <filename>]`.

**AC4 — Callout markers preserved in saved artefact**
Given a /discovery session completes with callout markers in the model output,
When the artefact is saved to `artefacts/[feature-slug]/discovery.md`,
Then all `[Grounded in: ...]` markers are preserved in the saved markdown file verbatim.

**AC5 — Multiple reference files cited appropriately**
Given 2–3 reference files are injected,
When the model generates discovery scope,
Then it cites the most relevant file(s) by content pattern (no semantic ranking — simple pattern matching in system prompt instruction).
Files can be cited multiple times in different sections.

**AC6 — No reference files → baseline discovery**
Given a /discovery session starts WITHOUT referenceFiles,
When the model generates discovery artefacts,
Then callout markers do not appear (baseline /discovery SKILL.md instructions intact),
And artefacts are generated without strategy grounding (no error, baseline behaviour).

## Out of scope
- Automatic relevance ranking of reference files via semantic search or vector DB
- Modification of the operator's problem statement or scope based on reference content
- Feedback loops or suggestions that reference files are incomplete or should be updated
- Storing or versioning reference content alongside the discovery artefact (files remain separate)

## Dependencies
sdg.3 (reference file content must be readable and validated), sdg.4 (reference injection pattern established in /ideate)

## NFR / Constraints
- **System prompt:** Reference content injected into /discovery system prompt using same mechanism as /ideate
- **Token budget:** Same soft limit (12,000 tokens) and truncation rules as sdg.4
- **Callout format:** Markers are literal `[Grounded in: <filename>]` — no variations or alternative formats
- **Citation consistency:** If a file is cited in /discovery, the same file reference is available to downstream skills
