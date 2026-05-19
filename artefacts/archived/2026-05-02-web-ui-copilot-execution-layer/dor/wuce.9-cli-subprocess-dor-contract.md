# Contract Proposal: CLI subprocess invocation with JSONL output capture

**Story:** wuce.9
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Execution module: `src/modules/skill-executor.js` — `executeSkill(skillName, prompt, token, homeDir) -> Promise<ParsedOutput>` — standalone module (ADR-009); not inline in any route handler
- Spawn configuration: flags `--output-format=json --silent --no-ask-user --allow-all -p`; environment: `COPILOT_GITHUB_TOKEN` and `COPILOT_HOME` set; `shell: false`
- Skill name allowlist validator: validates against `[a-z0-9-]` pattern before spawn; rejects with structured error if invalid
- JSONL parser: `stdout.split('\n').filter(Boolean).map(JSON.parse)` — mandated strategy (not streaming)
- Timeout handler: configurable via `WUCE_CLI_TIMEOUT_SECONDS` env var (default 300); SIGTERM on timeout, SIGKILL after 5s if still running
- Error capture: non-zero exit → error object with exit code + last N stderr lines (configurable via `WUCE_STDERR_LINES`, default 20); stderr lines containing token patterns redacted
- `ParsedOutput` type: `{ lines: ParsedLine[], exitCode: number, timedOut: boolean }`
- Test fixtures: `tests/fixtures/cli/copilot-cli-success.jsonl`, `tests/fixtures/cli/copilot-cli-error-partial.jsonl`

## Components NOT built by this story

- Streaming/WebSocket output delivery to browser client — out of scope (polling is wuce.14)
- Retry-on-transient-error logic — out of scope
- Request queue / concurrency limiter — out of scope
- Multi-step interactive session support — that is wuce.16

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | Spawn with flags + COPILOT_GITHUB_TOKEN+COPILOT_HOME in env | `executeSkill passes --output-format=json flag`, `--silent --no-ask-user --allow-all -p flags present`, `COPILOT_GITHUB_TOKEN set in subprocess env`, `COPILOT_HOME set to provided homeDir`, `token never in command-line args` |
| AC2 | JSONL parsed line-by-line via split/filter/map strategy | `stdout with 3 JSONL lines → 3 ParsedLine objects`, `empty lines filtered out`, `invalid JSONL line → parse error captured in result` |
| AC3 | Timeout → SIGTERM then SIGKILL after 5s → TIMEOUT error | `process exceeding timeout → SIGTERM sent`, `process still running 5s after SIGTERM → SIGKILL sent`, `timedOut: true in result` |
| AC4 | Non-zero exit → error with exit code + last N stderr | `exit code 1 → error object contains exit code`, `last 20 stderr lines in error object`, `token patterns in stderr are redacted` |
| AC5 | Shell metacharacters in skill name → reject before spawn | `skill name "discovery" → accepted`, `skill name "discovery; rm -rf /" → rejected before spawn`, `skill name "../etc/passwd" → rejected before spawn`, `rejection error contains no shell output` |

## Assumptions

- The Copilot CLI binary path is configured via `COPILOT_CLI_PATH` env var; module does not hardcode the path
- `homeDir` is provided by the session manager (wuce.10) — the executor module does not create or manage session directories

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/modules/skill-executor.js` | Create | `executeSkill` standalone module |
| `src/utils/skill-name-validator.js` | Create | Allowlist regex validator |
| `tests/cli-subprocess.test.js` | Create | 23 Jest tests for wuce.9 |
| `tests/fixtures/cli/copilot-cli-success.jsonl` | Create | Multi-line JSONL fixture |
| `tests/fixtures/cli/copilot-cli-error-partial.jsonl` | Create | Partial success + error JSONL fixture |

## Contract review

**APPROVED** — all components are within story scope, MEDIUM finding 9-M1 resolved by AC2 explicit parse strategy, security constraints (shell: false, env-only token, allowlist) documented in coding agent instructions, no scope boundary violations identified.
