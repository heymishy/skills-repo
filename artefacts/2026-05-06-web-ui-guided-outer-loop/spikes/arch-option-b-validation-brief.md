# Spike Brief: Option B Architecture Validation

**Feature:** `2026-05-06-web-ui-guided-outer-loop`
**Spike slug:** `arch-option-b-validation`
**Opened:** 2026-05-06
**Blocking:** `/definition` — stories cannot be written until orchestration architecture is resolved

---

## Question

Does Option B (per-skill sessions with handoff context block) produce coherent multi-stage outer loop output using the existing mfc.1 architecture, and what is the correct minimal handoff block schema?

## Type

Type 3 — Design decision: which of two or more approaches should we take?

## Blocking

`/definition` for `2026-05-06-web-ui-guided-outer-loop` — story decomposition cannot begin until the orchestration architecture (Option A vs Option B) is resolved and the handoff block schema is defined, as both directly shape story scope and AC design.

## Scope

Thorough — three sub-questions requiring code analysis, option comparison, and implementation constraint mapping (up to 10 steps; done condition was defined before investigation began).

## Done Condition

Each of the three sub-questions has a definitive answer backed by code evidence:
1. Option A vs Option B — architectural compatibility ruling against the existing `registerHtmlSession` / `buildSystemPrompt` / `session.done` model
2. Handoff block schema — one of: full prior turns, artefact content only, or model-synthesised summary — with rationale
3. Save-and-continue gate — disk version canonical from gate onward, or in-memory session.artefactContent canonical

## Out of Scope

- Inner loop orchestration (branch-setup, subagent-execution, etc.) — outer loop only
- Multi-user session isolation — single-operator session only
- Side-trip nesting (descoped from MVP) — straight-through happy path only
- Full implementation detail of the orchestration layer — only architectural shape sufficient to unblock story decomposition
- Runtime verification against a live model — static code analysis and schema design only

## Outcome Options

- **PROCEED:** Option B is architecturally viable; handoff schema is defined; save-and-continue canonicity is resolved; definition can begin
- **REDESIGN:** One or more sub-questions revealed a structural blocker requiring changes to discovery scope, mfc.1 architecture, or MVP boundary before definition can proceed
- **DEFER:** An unknown cannot be resolved through code analysis alone and requires a live model test or external input before definition can proceed

---

*Brief saved before investigation began.*
