## Story: Pipeline context auto-loader at session start

**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Discovery reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/discovery.md
**Benefit-metric reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/benefit-metric.md

## User Story

As a **platform operator using the web UI**,
I want pipeline state and workspace context pre-loaded at session start,
So that skills like `/workflow` and `/orient` give an accurate "here is where we are and what's next" orientation from the first message — the same starting state I get when VS Code loads the workspace.

## Benefit Linkage

**Metric moved:** M3 — Web UI outer loop completeness (dogfood signal); MM2 — Unassisted replication rate
**How:** Without pre-loaded context, every web UI session starts cold — the model cannot orient the operator without first asking them to paste pipeline state manually. With the auto-loader, the model starts each session already aware of the active feature, current phase, checkpoint, and toolchain settings. This removes the session-start friction that makes the web UI feel inferior to VS Code for outer loop phases that do not require file reads mid-session. M3's minimum validation signal (discovery + benefit-metric + definition without VS Code fallback) is directly enabled by this story.

## Architecture Constraints

- **ADR-004:** `context.yml` is the single config source of truth — the loader reads `context.yml` from the repo root; it does not duplicate or cache config values
- **ADR-009 / No credential leakage:** `context.yml` uses `secretRef` pattern for sensitive values. A named implementation task must inspect the full `context.yml` schema and document the inspection result before this story ships — see AC5
- **D37 (Injectable adapter rule):** If a file-reading function is extracted as an adapter, its stub must throw (not return empty/null)
- **Zero external npm dependencies:** all file reads use Node.js `fs` built-ins only
- **No modification to `.github/skills/` or `artefacts/`** — this story adds to `buildSystemPrompt()` only

## Dependencies

- **Upstream:** None — this story is model-independent and has no dependency on wucp.0 or wucp.2
- **Downstream:** M3 minimum validation signal (partial outer loop completeness) — enables immediate post-ship measurement of Gap 3 value

## Acceptance Criteria

**AC1:** Given a web UI session starts, When `buildSystemPrompt()` runs, Then `pipeline-state.json`, `workspace/state.json`, and `context.yml` are read from the repo root and included in the system prompt if they exist — each labelled with its filename so the model can identify the source.

**AC2:** Given any context file listed in AC1 does not exist at its expected path, When `buildSystemPrompt()` runs, Then the missing file is silently skipped — no error is thrown, no error message appears in the session, and the session starts normally with the files that are present.

**AC3:** Given a session starts with an active feature slug resolvable from `pipeline-state.json`, When `buildSystemPrompt()` runs, Then the artefact file listing under `artefacts/[active-feature-slug]/` is included in the system prompt (filenames only — not file contents).

**AC4:** Given `workspace/learnings.md` exists, When `buildSystemPrompt()` runs, Then the first 50 lines of the file are included in the system prompt. If the file is shorter than 50 lines, the full file is included. If absent, it is silently skipped.

**AC5 (context.yml secretRef validation — named implementation gate):** Given `context.yml` is to be loaded into the system prompt, When this story is implemented, Then a schema inspection task is completed and its result saved to `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md` documenting: (a) all top-level fields in `context.yml` and their value types, (b) confirmation that no field value contains a credential (token, password, key, secret value — not a reference name), (c) confirmation that all sensitive values use the `secretRef` pattern (reference name only). This story must not be merged without this document existing and having been reviewed by the operator.

**AC6:** Given `fleet-state.json` exists at the repo root, When `buildSystemPrompt()` runs, Then it is included in the system prompt. If absent, it is silently skipped. The same rule applies to `artefact-coverage-exemptions.json`.

**AC7:** Given the pipeline context addition is assembled, When a model session begins, Then the operator's first message receives a response that correctly states the current pipeline stage and active feature slug — confirming the pre-loaded context was parsed by the model. (Verified manually in first dogfood session.)

## Out of Scope

- Mid-session file reads (model requesting a specific file after session start) — that is wucp.3 (Gap 1 tool execution loop)
- Token budget hard limiting — the story includes a token budget awareness check as an implementation task, but dynamic truncation logic is post-MVP if the budget is not exceeded in practice
- Artefact file contents in the initial load — filenames only; contents are fetched via the tool loop (wucp.3)
- Credential rotation or secrets management — `context.yml` secretRef names are safe to surface; this story adds no secrets handling logic

## NFRs

- **Security:** No credential values may appear in the assembled system prompt. Validated by AC5 schema inspection. Any future addition to `context.yml` that introduces a credential value field (not a secretRef) is a breaking change that requires a re-inspection.
- **Performance:** System prompt assembly must complete in under 500ms for repositories with up to 30 features in `pipeline-state.json` and `workspace/learnings.md` up to 500 lines. Files are read synchronously at session start — async is not required for this volume.
- **Security (path):** File reads in the auto-loader are from known, static paths (not from request data) — path traversal guard (coding standard, copilot-instructions.md) is not applicable here. If any path is ever derived from request data in a future extension, the guard becomes mandatory.
- **Accessibility:** None — system prompt change only, no UI changes

## Complexity Rating

**Rating:** 1 (well-understood — read files, assemble string, inject into system prompt)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
