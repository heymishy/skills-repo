# Spike Outcome: Option B Architecture Validation

**Opened:** 2026-05-06 | **Scope:** Thorough | **Steps taken:** 3
**Done condition met:** Yes — all three sub-questions answered with code evidence
**Artefact path:** `artefacts/2026-05-06-web-ui-guided-outer-loop/spikes/arch-option-b-validation-outcome.md`

---

## Outcome: PROCEED

### What was found

**Step 1 — Option A structural compatibility assessment:**

The existing mfc.1 session model (in `src/web-ui/routes/skills.js`, `registerHtmlSession` + `buildSystemPrompt` + `htmlSubmitTurn`) is structurally incompatible with Option A without significant refactoring. Three blockers were found:

1. `buildSystemPrompt` is called once at session creation and stored as `session.systemPrompt`. There is no mechanism to mutate the system prompt between turns. To run multiple skills in one session under Option A, the system prompt would need to swap SKILL.md content mid-conversation — a non-standard LLM API pattern that existing providers (OpenAI, Anthropic via `skill-turn-executor`) do not support at the turn level.

2. `session.done = true` is set when the first `---ARTEFACT-START---` signal is detected in any turn response. After /discovery emits its artefact, the session is marked done. Reusing the session for /benefit-metric would require unsetting `done` and resetting `artefactContent` / `artefactPath` — the current data model does not support per-stage state reset.

3. System prompt size: copilot-instructions.md (~600 lines) + 7 SKILL.md files (~200 lines each = 1,400 lines) + product context (~80 lines) = ~2,100 lines / ~28k tokens for the system prompt alone, before any conversation history. A full outer loop conversation (7 stages × 15 turns × ~500 tokens) adds ~52k tokens of history. Combined: ~80k tokens, approaching the 128k Copilot model context limit with no buffer for artefact output.

**Step 2 — Option B handoff schema assessment:**

Three handoff schema options were evaluated:

- **Full prior session turns** (all Q&A from all prior sessions): ~52k tokens of multi-persona dialogue prepended to the new session. The model receives turns from a session it did not participate in, creating context confusion. Token cost is unbounded across outer loop stages. Ruled out.
- **Model-synthesised summary** (model emits a handoff summary at stage transition): adds a model call per stage boundary, introduces summary fidelity risk (key decisions can be omitted), adds latency and token cost. Marginal benefit over artefact content injection given that artefacts are already well-structured. Ruled out for MVP.
- **Artefact content only** (inject prior-stage artefact files as `--- PRIOR ARTEFACT ---` sections in the system prompt): maps directly to `buildSystemPrompt`'s existing reference materials injection pattern (step 4 in the function). The discovery.md IS the complete, structured output of /discovery — it contains the problem statement, MVP scope, assumptions, risks, and constraints that /benefit-metric needs. Token budget: largest injection is discovery.md + benefit-metric.md + 1 story artefact ≈ 3 files × ~200 lines ≈ 8k tokens, well within per-session context budget.

The handoff schema extension requires: adding a `priorArtefacts` parameter to `buildSystemPrompt`, which injects named artefact files as additional system prompt sections between the product context step and the WEB UI PROTOCOL section.

**Step 3 — Save-and-continue gate canonicity:**

At gate confirmation, two scenarios arise: (A) direct confirm — disk and memory match; (B) edit-then-confirm — disk and memory diverge. The handoff context for the next stage session is built at gate-confirm time. Reading from `session.artefactContent` (in-memory) after an edit would send stale context to the downstream skill, and `/trace` would validate the disk version (which it always reads), not the in-memory version.

**Correct rule:** disk is canonical from gate onward. The orchestrator write-then-read sequence is: (1) write `session.artefactContent` to disk, (2) read the file back from disk, (3) use disk content to populate the handoff block for the next session. The in-memory value is not used after the write.

### Reasoning

Option A requires either mutating an immutable system prompt, or pre-loading all 7 SKILL.md files at session start — both are incompatible with the current architecture without refactoring that goes beyond the MVP scope. Option B requires only: (a) a `priorArtefacts` parameter added to `buildSystemPrompt`, (b) an orchestration layer that creates new sessions per stage with the correct skill and prior artefacts, and (c) a gate-confirm handler that writes to disk then reads back for handoff. All three are additive changes to existing code — no refactoring of `htmlSubmitTurn`, `_skillTurnExecutor`, or the session data model.

---

## PROCEED — Conditions

**Unblocked stage:** `/definition` for `2026-05-06-web-ui-guided-outer-loop`

**Conditions that must hold for PROCEED to remain valid:**
1. `buildSystemPrompt` is extended with a `priorArtefacts` parameter — not reimplemented; the existing assembly logic is preserved
2. The orchestration layer creates one new `registerHtmlSession` per skill stage — it does not reuse sessions across stages
3. The gate-confirm handler reads from disk after writing — not from `session.artefactContent`
4. The `priorArtefacts` injection injects full artefact file content (not a summary) — the summary path is explicitly deferred to post-MVP

---

## Handoff Block Schema (definitive — authoritative output of this spike)

The handoff context is injected into the system prompt by `buildSystemPrompt` as follows:

```
--- HANDOFF CONTEXT ---

Feature: [feature-slug]
Journey stage: [current-skill-name] (e.g. "benefit-metric")
Prior stages completed: [list of completed stage names]

--- PRIOR ARTEFACT: artefacts/[feature-slug]/discovery.md ---
[full content of discovery.md read from disk]
--- END PRIOR ARTEFACT ---

--- PRIOR ARTEFACT: artefacts/[feature-slug]/benefit-metric.md ---
[full content of benefit-metric.md read from disk]
--- END PRIOR ARTEFACT ---
```

Rules:
- Only artefacts that have been written to disk (gate confirmed) are included
- Artefacts are included in pipeline order (discovery → benefit-metric → definition epics → story)
- Per-story stage sessions (/test-plan, /review, /definition-of-ready) inject the relevant story artefact, not all stories
- The feature slug and active stage name are always included even if no prior artefacts exist (e.g. at the /discovery stage itself, no prior artefacts are injected)

---

## What Remains Unknown

- Whether the model will correctly suppress WEB UI PROTOCOL artefact markers when reading a PRIOR ARTEFACT section that itself contains `---ARTEFACT-START---` / `---ARTEFACT-END---` (i.e., if a prior artefact block contains these strings, will the parser misfire?). **Mitigation:** the server-side artefact parser runs on the model's response, not on the system prompt — system prompt content is not parsed for artefact signals. This is not a risk.
- Whether injecting full SKILL.md content (including step-by-step instructions for /benefit-metric) alongside the WEB UI PROTOCOL section could confuse the model about which skill it is running at the current stage. This is the same question that applies to single-skill sessions today — the WEB UI PROTOCOL section already addresses this by instructing the model to follow the SKILL.md above it. No additional handling required.
- Live model coherence rating (MM2) — not measurable until first outer loop run post-MVP. Minimum signal is defined in benefit-metric.md.

---

## Discovery Handoff

Parent discovery: `artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md`

| Field | Changed? | Clarification |
|-------|----------|---------------|
| Problem statement | No | Unchanged |
| MVP scope | No | Unchanged — Option B was the directional preference; this spike confirms it |
| Assumptions | Yes — one strengthened | "The mfc.1 skill-turn-executor and system prompt assembly pattern is sufficient to drive per-skill sessions" is confirmed. The assumption about artefact detection generalising is confirmed (artefact parser reads model response, not system prompt). |
| Known risks | Yes — one ruled out | "The handoff context block must carry enough prior-stage context" — risk resolved: artefact content only is sufficient; schema is defined. |
| Technical constraints | Yes — one added | The `buildSystemPrompt` function requires a `priorArtefacts` parameter extension. The gate-confirm handler must use a write-then-read-from-disk sequence. |

No discovery re-run required. The problem framing and MVP scope are unchanged. The resolved risk and confirmed assumption should be noted in /decisions.
