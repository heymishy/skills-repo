## Story: CLI subprocess invocation with JSONL output capture

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e3-phase2-execution-engine.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **platform operator running the web backend**,
I want the execution engine to invoke the Copilot CLI as a subprocess with a skill prompt and capture its JSONL output,
So that skill execution can be triggered programmatically from the web backend without any interactive terminal session.

## Benefit Linkage

**Metric moved:** M1 — Copilot CLI/API feasibility (spike verdict: PROCEED)
**How:** This story realises the PROCEED verdict from the spike as production-quality code — the subprocess invocation pattern (with `--output-format=json`, `--silent`, `--no-ask-user`, `--allow-all`) is the primary stable execution path; without it, P2 is impossible.

## Architecture Constraints

- Mandatory security constraint: the `COPILOT_GITHUB_TOKEN` (user-scoped token) must be passed to the subprocess via environment variable injection only — never via command-line argument or file (both are visible in process listings)
- Mandatory security constraint: user-supplied skill names and prompt content must be validated against an allowlist of known skills before constructing the subprocess command — command injection via skill name must be mitigated
- Mandatory security constraint: subprocess execution must have a hard timeout (configurable via env var, default 300 seconds) — no unbounded process execution
- ADR-009: the subprocess execution module is a separate concern from the web request handler — it must be a standalone module with a defined interface (`executeSkill(skillName, prompt, token, homeDir) -> Promise<ParsedOutput>`)
- The subprocess must be spawned without a shell (i.e. `spawn(executable, args, {shell: false})`) to prevent shell injection

## Dependencies

- **Upstream:** wuce.1 (user-scoped OAuth token is the input to this engine), wuce.10 (per-user `COPILOT_HOME` is a required parameter — implement wuce.9 and wuce.10 together or accept that wuce.9 is integration-tested with a shared temp home until wuce.10 is done)
- **Downstream:** wuce.11 (skill discovery resolves the skill name to a validated entry before wuce.9 executes it), wuce.13 (guided UI calls this engine)

## Acceptance Criteria

**AC1:** Given a valid Copilot CLI binary is installed and `COPILOT_GITHUB_TOKEN` is set for a user with a Copilot subscription, When `executeSkill("discovery", "<assembled prompt>", token, homeDir)` is called, Then the subprocess is spawned with flags `--output-format=json --silent --no-ask-user --allow-all -p "<prompt>"`, the `COPILOT_GITHUB_TOKEN` env var is set in the subprocess environment, `COPILOT_HOME` is set to `homeDir`, and the function returns the parsed JSONL output as a structured object.

**AC2:** Given the CLI subprocess produces valid JSONL output, When the output is captured, Then each line is parsed as a separate JSON object and the final parsed result (skill artefact content) is returned — not the raw JSONL string.

**AC3:** Given the subprocess execution exceeds the configured timeout (default 300 seconds), When the timeout fires, Then the subprocess is killed (SIGTERM, then SIGKILL after 5 seconds), the function rejects with a `TIMEOUT` error code, and no partial output is returned.

**AC4:** Given the CLI subprocess exits with a non-zero code, When the failure is detected, Then the function rejects with an error object containing the exit code and the last N lines of stderr — no raw stderr is propagated to the web response.

**AC5:** Given a user-supplied skill name contains shell metacharacters (e.g. `discovery; rm -rf /`), When the engine validates the input, Then the name is rejected against the allowlist before any subprocess is spawned — no subprocess is started.

## Out of Scope

- ACP (Agent Client Protocol) server session management — ACP is an alternative path; the subprocess (`-p` flag) is the primary stable path in this story; ACP multi-turn is covered in wuce.10 and wuce.16
- Streaming output to the browser in real time — acceptable for v1 to return complete output; streaming is a progressive enhancement
- Skill execution for skills that require interactive clarifying questions (which `--no-ask-user` prevents) — the UI layer (Epic 4) manages prompt assembly to avoid this scenario

## NFRs

- **Security:** Token passed via env var only. No shell=true spawning. Command injection mitigation via allowlist. Hard timeout enforced.
- **Performance:** Subprocess invocation overhead (excluding CLI execution time) under 500ms.
- **Audit:** Each subprocess invocation logged with: user ID, skill name, exit code, execution duration. No prompt content or token values logged.

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
