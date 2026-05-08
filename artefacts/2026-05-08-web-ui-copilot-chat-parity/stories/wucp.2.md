## Story: Slash command router for freeform skill invocation

**Epic reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/epics/wucp-runtime-capabilities.md
**Discovery reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/discovery.md
**Benefit-metric reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/benefit-metric.md

## User Story

As a **platform operator using the web UI**,
I want to invoke any pipeline skill by typing a slash command,
So that I'm not limited to the linear journey stage sequence and can run `/workflow`, `/decisions`, `/estimate`, `/coverage-map`, or any other skill at any point in the outer loop — the same freedom I have in VS Code Copilot Chat.

## Benefit Linkage

**Metric moved:** M3 — Web UI outer loop completeness (dogfood signal)
**How:** The journey stage sequence forces operators through `discovery → benefit-metric → definition → review → test-plan → DoR` in order. In practice, operators need to run `/decisions` mid-definition, `/estimate` after story count is known, `/coverage-map` after merge, and `/workflow` at any time for orientation. Without the slash command router, each of these requires switching to VS Code. This story closes that gap — making M3 (full outer loop via web UI sole interface) achievable.

## Architecture Constraints

- **Zero external npm dependencies:** skill list is derived from `fs.readdirSync('.github/skills')` — no dynamic imports, no package lookups
- **No modification to `.github/skills/`:** skill capability annotations for the web UI surface cannot be added to SKILL.md files per the discovery constraint. The capability map (skill → required surface capabilities) is maintained as a static configuration object in the router implementation
- **D37 (Injectable adapter rule):** If the skill-loader is extracted as an adapter (`let _loadSkill = defaultFn`), its stub must throw
- **Coexistence with journey stage mode:** The router must not break the existing journey stage flow. Journey state (`stage`, `stageIndex`, `sessionId`) must be preserved across slash command invocations

## Dependencies

- **Upstream:** None — this story is model-independent and has no dependency on wucp.0 or wucp.1
- **Downstream:** M3 partial — together with wucp.1, enables the minimum validation signal for outer loop completeness measurement

## Acceptance Criteria

**AC1:** Given the operator types `/workflow` (or any slash-prefixed skill name matching a directory under `.github/skills/`) in the web UI message input, When the message is submitted, Then the server loads `.github/skills/[skill-name]/SKILL.md` and includes its full content in `buildSystemPrompt()` for that turn, replacing the current journey-stage skill with the requested skill.

**AC2:** Given the skill list is derived dynamically from `fs.readdirSync('.github/skills')`, When a new skill directory is added to `.github/skills/`, Then it is immediately available via the router with no code change required. (Verified by adding a test skill directory and confirming the router returns it in the available skills list.)

**AC3:** Given a slash command invokes a skill that requires surface capabilities not available in the web UI (e.g. `/branch-setup` requiring `git worktree`, `/trace` requiring `scripts/validate-trace.sh`), When the skill is loaded, Then the router includes a capability notice in the system prompt: `"NOTE: This skill requires [capability list]. Some outputs may be limited or unavailable in the web UI."` The capability map is a static configuration object in the router; the 44 skills are classified at implementation time.

**AC4:** Given the operator is in journey stage mode (e.g. mid-definition on story 2 of 4), When they type `/decisions` to log a decision, Then the router loads the `/decisions` SKILL.md for that turn only; on the next turn (if no slash command is typed), the session resumes journey stage mode at the same position it was at before the slash command. Journey stage position (`currentStage`, `stageIndex`) is not mutated by slash command invocations.

**AC5:** Given an unknown or misspelled skill name is typed (e.g. `/nonexistent`, `/workfow`), When the router attempts to load `.github/skills/nonexistent/SKILL.md` and the file does not exist, Then the server returns an informational message to the operator listing the available skills (derived from `fs.readdirSync('.github/skills')`), and `buildSystemPrompt()` is not modified.

**AC6:** Given a slash command is received, When the server processes it, Then the skill name is validated against the `fs.readdirSync` result before any file read is attempted — a slash command naming a skill that does not exist in the directory listing never reaches a file read operation.

## Out of Scope

- Capability annotation stored in SKILL.md files — the capability map is a static object in the router implementation for this MVP; SKILL.md modifications are out of scope per discovery constraints
- Fuzzy matching or autocomplete for skill names — exact match only; `AC5` handles unknown names
- Slash command history or bookmarks in the UI
- Sub-commands (e.g. `/estimate E2` as a parameterised invocation) — plain skill name routing only

## NFRs

- **Security:** Skill name from request input is validated against the `fs.readdirSync` allowlist before any file read. A skill name containing `/`, `..`, or path separators is rejected with HTTP 400 — no file read attempted. This is a path injection guard specific to this route.
- **Performance:** Skill load (readFileSync of SKILL.md) completes in under 100ms for any skill in the library. Current largest SKILL.md (reverse-engineer) is ~800 lines — well within sync read budget.
- **Accessibility:** None — no UI changes beyond the existing message input; capability notices are text in the model response

## Complexity Rating

**Rating:** 2 (clear path, but journey mode coexistence and capability annotation classification require careful implementation)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
