# Agent Tooling Compatibility Matrix

**Purpose:** Documents compatibility between the skills pipeline and alternative AI coding agents, covering instruction surface resolution, system prompt delivery, DoR handoff format, trace generation, and known gaps. Produced as evidence for M5 (alternative agent tooling compatibility matrix). The baseline is GitHub Copilot in VS Code agent mode.

**Scope:** Compatibility is assessed against the `--target vscode` dispatch format and the skills pipeline as defined in `.github/copilot-instructions.md`. A live delivery run using non-GitHub-Copilot tooling is a Phase 4 story — see `workspace/phase4-backlog-agent-live-delivery-run.md`.

**Assessment method:** Structured documentation review, prompt-pattern analysis, and checklist verification. No live end-to-end delivery run was conducted for non-baseline tools.

**Date:** 2026-04-18

---

## Compatibility Matrix

| Tool | Instruction Surface Resolution | System Prompt Delivery on Task Start | DoR Handoff Format Compatibility | Trace Generation | Known Gaps |
|------|-------------------------------|--------------------------------------|----------------------------------|------------------|------------|
| **GitHub Copilot** (baseline) | yes | yes | yes | yes | None — this is the reference implementation. All pipeline conventions (`.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md`, `--target vscode` issue format) are designed for this surface. |
| **Cursor** | partial | partial | partial | partial | (1) `.cursorrules` has an effective size ceiling (~2 KB before truncation warnings); the full `copilot-instructions.md` plus referenced SKILL.md files exceed this limit and must be selectively pruned before each session. (2) `--target vscode` dispatch does not auto-trigger Cursor — operator must manually paste DoR artefact path into the Cursor chat context at session start. (3) Multi-file instruction sets (`.github/instructions/*.instructions.md` with `applyTo` patterns) are not natively resolved; files must be manually aggregated into `.cursorrules`. |
| **Claude Code** | yes | yes | partial | partial | (1) DoR handoff requires explicit `--system-prompt artefacts/[feature]/dor/[story-slug]-dor.md` at `claude` invocation — there is no `--target claude-code` issue dispatch format; omitting the flag means the session starts without the DoR artefact in context. (2) Session transcripts are stored locally under `.claude/sessions/` only; PR comment generation requires an additional `gh pr comment` tool call or wrapper script — no automatic PR trace output. |
| **Amazon Q Developer** | partial | partial | partial | no | (1) No auto-load of project instruction files at session start — operator must explicitly pass `--context .github/copilot-instructions.md` and each relevant SKILL.md path at every CLI invocation. (2) No GitHub Issues integration — `--target vscode` dispatch does not trigger Amazon Q Developer; DoR artefact and story artefact paths must be passed via `--context` flags manually. (3) Trace is fully operator-owned: git add, commit, push, and `gh pr create` all happen outside the agent session with no scaffolding from the tool itself; `validate-trace.sh` is compatible only if run separately by the operator. |

---

## Column Definitions

| Column | Meaning | Values |
|--------|---------|--------|
| **Instruction Surface Resolution** | Can the agent automatically discover and load project-level instruction files (`.github/copilot-instructions.md`, `AGENTS.md`, skill files) without operator intervention? | yes / partial / no |
| **System Prompt Delivery on Task Start** | Is the project-level system prompt (equivalent of `copilot-instructions.md`) injected into the session context automatically at start, with no operator action required? | yes / partial / no |
| **DoR Handoff Format Compatibility** | Can the agent receive a DoR artefact via the `--target vscode` issue stub format, or an equivalent mechanism, without requiring the operator to manually construct the session context? | yes / partial / no |
| **Trace Generation** | Does the agent produce GitHub commit metadata, PR traces, or equivalent artefacts that `validate-trace.sh` can verify, without operator-initiated git operations? | yes / partial / not supported / no |

---

## Phase 4 Scope

The compatibility gaps documented above for Cursor, Claude Code, and Amazon Q Developer are not blockers for adopting the pipeline with those tools — they require additional operator steps rather than pipeline redesign. Bridging these gaps (e.g. `--target cursor`, `--target claude-code` dispatch formats, auto-loader scripts) is Phase 4 scope.

See `workspace/phase4-backlog-agent-live-delivery-run.md` for the gate condition and prerequisites for a live Phase 4 delivery run.
