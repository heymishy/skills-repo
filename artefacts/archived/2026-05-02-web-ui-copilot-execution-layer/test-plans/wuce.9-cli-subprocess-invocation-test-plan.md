# Test Plan: wuce.9 — CLI subprocess invocation with JSONL output capture

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.9-cli-subprocess-invocation.md
**Epic:** wuce-e3
**Framework:** Jest + Node.js (backend unit + integration; `child_process.spawn` mocked in unit tests)
**Test data strategy:** Static fixtures committed to `tests/fixtures/`

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | Subprocess spawned with correct flags; token via env var; `COPILOT_HOME` set | Unit (spawn mock) | Live CLI binary required for true integration; unit tests verify spawn args |
| AC2 | JSONL parsed line-by-line via `split('\n').filter(Boolean).map(JSON.parse)` | Unit (fixture-based) | None |
| AC3 | Timeout → SIGTERM, then SIGKILL after 5s; rejects with TIMEOUT error | Unit (fake timers) | None |
| AC4 | Non-zero exit → error object with exit code + last N stderr lines | Unit + integration (mock) | None |
| AC5 | Skill name with shell metacharacters → rejected before any spawn | Unit | None |

---

## Named shared fixtures

The following fixtures are **canonical for E3 and E4** — defined here, reused by wuce.13 (skill launcher) and wuce.14 (artefact preview). They are the E3 equivalents of the OAuth token exchange fixtures (E1) and pending-signoff markdown fixtures (E2).

| Fixture path | Content | Purpose | Reused by |
|---|---|---|---|
| `tests/fixtures/cli/copilot-cli-success.jsonl` | Multi-event JSONL: skill_start → question → answer → progress → artefact → skill_complete | Primary success-path fixture for JSONL parser tests | wuce.9, wuce.13, wuce.14 |
| `tests/fixtures/cli/copilot-cli-error-partial.jsonl` | Partial JSONL with valid lines, one malformed line mid-stream, then an error event; subprocess exits non-zero | Error-path fixture: verifies parser resilience and non-zero exit handling | wuce.9, wuce.13 |

**`tests/fixtures/cli/copilot-cli-success.jsonl` canonical content** (one JSON object per line, no trailing commas):
```
{"type":"skill_start","skillName":"discovery","timestamp":"2026-05-02T10:00:00Z"}
{"type":"question","skillName":"discovery","id":"q1","text":"What is the core problem or opportunity you want to explore?"}
{"type":"answer","skillName":"discovery","questionId":"q1","text":"We want to automate our software delivery pipeline using AI agents."}
{"type":"progress","skillName":"discovery","message":"Assembling discovery artefact..."}
{"type":"artefact","skillName":"discovery","phase":"complete","content":"## Discovery: AI-Driven Pipeline Automation\n\n**Problem statement:** The team spends significant manual effort coordinating delivery pipeline steps.\n\n## Proposed solution\n\nAn AI agent layer that executes pipeline skills on demand.\n\n## Out of scope\n\nPost-MVP: multi-team rollout."}
{"type":"skill_complete","skillName":"discovery","exitCode":0,"duration":12450}
```

*Event taxonomy:*
- `skill_start` — CLI has begun processing
- `question` — skill is surfacing a clarifying question to be captured by the UI (wuce.13)
- `answer` — the assembled answer fed back into the prompt (may be present when `--no-ask-user` is combined with pre-assembled prompt)
- `progress` — intermediate status (safe to surface as streaming update in future)
- `artefact` — the primary output event; `content` is the skill's produced markdown (extracted by wuce.14)
- `skill_complete` — terminal event; `exitCode` 0 = success

**`tests/fixtures/cli/copilot-cli-error-partial.jsonl` canonical content:**
```
{"type":"skill_start","skillName":"discovery","timestamp":"2026-05-02T10:05:00Z"}
{"type":"question","skillName":"discovery","id":"q1","text":"What is the core problem?"}
{"type":"progress","skillName":"discovery","message":"Processing..."}
{invalid json line - simulates truncated buffer flush mid-stream
{"type":"error","skillName":"discovery","message":"Token validation failed","code":"AUTH_ERROR"}
```

*Notes on error fixture:*
- Line 4 is intentionally malformed (not valid JSON) — simulates a truncated line from a buffer boundary during async stdout read; the parser must handle this without throwing
- Line 5 is valid JSON; the parser must still process it after encountering the malformed line
- This fixture is used with a mock subprocess that exits with code `1` and stderr `"fatal: authentication failed\ngit: 'credential-osxkeychain' is not a git command"`

---

## Unit tests

### T1 — `executeSkill(skillName, prompt, token, homeDir)` spawn arguments (AC1)

**T1.1 — spawned with `shell: false`**
- Setup: mock `child_process.spawn`; call `executeSkill("discovery", "test prompt", "gho_token", "/tmp/home")`
- Expected: `spawn` called with `shell: false` in options object
- Rationale: AC1 security constraint; `shell: true` enables injection

**T1.2 — spawned with required flags in args array**
- Setup: mock `spawn`; capture `args` argument
- Expected: args array contains `"--output-format=json"`, `"--silent"`, `"--no-ask-user"`, `"--allow-all"`, `"-p"`, `"test prompt"` (in any order except `-p` must precede the prompt value)

**T1.3 — `COPILOT_GITHUB_TOKEN` passed via env, not in args**
- Setup: mock `spawn`; call with `token: "gho_test_token_value"`
- Expected: `"gho_test_token_value"` does NOT appear anywhere in the args array; spawn `env` option contains `COPILOT_GITHUB_TOKEN: "gho_test_token_value"`
- Rationale: AC1 mandatory security constraint; tokens in args are visible in `ps aux`

**T1.4 — `COPILOT_HOME` set to provided `homeDir` in subprocess env**
- Setup: mock `spawn`; call with `homeDir: "/tmp/copilot-sessions/abc123/sess-456"`
- Expected: spawn `env` option contains `COPILOT_HOME: "/tmp/copilot-sessions/abc123/sess-456"`

### T2 — JSONL parsing (AC2)

**T2.1 — success fixture parsed as array of objects, not a single `JSON.parse(stdout)` call**
- Setup: mock spawn stdout to emit contents of `tests/fixtures/cli/copilot-cli-success.jsonl`; mock process exit code 0
- Expected: resolved value is an array of 6 parsed objects; first object has `type: "skill_start"`; fifth has `type: "artefact"`
- Rationale: confirms `split('\n').filter(Boolean).map(JSON.parse)` not `JSON.parse(stdout)`

**T2.2 — `artefact` event content is returned as the primary result**
- Setup: mock stdout with success fixture
- Expected: the resolved value includes the `artefact` event object; `result.artefact.content` contains `"## Discovery: AI-Driven Pipeline Automation"`
- Verifies that the final artefact content is extractable from the parsed output

**T2.3 — malformed line mid-stream does not throw; valid lines before and after are parsed**
- Setup: mock stdout to emit contents of `tests/fixtures/cli/copilot-cli-error-partial.jsonl`; mock process exit code 1
- Expected: function rejects with an error object (non-zero exit); however the partial parse result accessible via the error object contains 2 valid objects (skill_start and question) and 1 valid object after the malformed line (the error event); no uncaught exception thrown from the parser itself
- Verifies AC2 + AC4: malformed line is skipped in parse; non-zero exit still causes rejection

**T2.4 — empty stdout (no output at all) handled without throwing**
- Setup: mock stdout emits nothing; exit code 1
- Expected: function rejects with error containing exit code `1`; no thrown exception from empty-string split

### T3 — Timeout behaviour (AC3)

**T3.1 — SIGTERM sent when timeout fires**
- Setup: mock spawn with a process that never exits; use Jest fake timers; `executeSkill` called with timeout of 5000ms
- Action: advance fake timer by 5001ms
- Expected: mock process `kill("SIGTERM")` called; function does not resolve

**T3.2 — SIGKILL sent 5 seconds after SIGTERM if process still running**
- Setup: mock process ignores SIGTERM (does not exit); advance timers past SIGTERM + 5s
- Expected: `kill("SIGKILL")` called after SIGTERM; function rejects with `{ code: "TIMEOUT" }`

**T3.3 — rejection error has `code: "TIMEOUT"` and no partial output**
- Setup: as above
- Expected: rejected error object has `code: "TIMEOUT"`; resolved value is not returned (function rejects, not resolves with partial data)
- Verifies AC3: "no partial output is returned"

### T4 — Non-zero exit code handling (AC4)

**T4.1 — rejects with error object containing exit code**
- Setup: mock spawn process exits with code `1`; stderr emits `"fatal: authentication failed\ngit credential failed"`
- Expected: function rejects; error object has `exitCode: 1`

**T4.2 — error object contains last N stderr lines, not raw complete stderr**
- Setup: mock stderr with 20 lines; process exits with code `2`
- Expected: error object `stderrLines` contains at most the last 10 lines (or configured N); full raw stderr string is not present on the error object
- Verifies AC4: "last N lines of stderr — no raw stderr is propagated to the web response"

### T5 — Allowlist validation (AC5)

**T5.1 — skill name with semicolon is rejected before spawn**
- Setup: mock `spawn` spy; call `executeSkill("discovery; rm -rf /", ...)`
- Expected: `spawn` NOT called; function rejects with an allowlist-violation error
- Verifies AC5 injection prevention

**T5.2 — skill name with backtick is rejected**
- Setup: as above with skill name `` "discovery`id`" ``
- Expected: `spawn` NOT called; rejection

**T5.3 — valid skill name from allowlist is accepted**
- Setup: configure allowlist to contain `["discovery", "review", "test-plan"]`; call with skill name `"discovery"`
- Expected: `spawn` IS called with the skill name; no rejection
- Verifies AC5 positive case: the allowlist check does not block legitimate invocations

**T5.4 — skill name not in allowlist is rejected even if it has no metacharacters**
- Setup: allowlist contains `["discovery"]`; call with `"unknown-skill"`
- Expected: `spawn` NOT called; rejection with allowlist error
- Rationale: skills must be from discovered list (wuce.11 provides this); names not in the list are forbidden

---

## Integration tests

### IT1 — `POST /api/skills/:name/execute` with valid payload → invokes subprocess (AC1, AC2)

- Setup: authenticated session; mock `executeSkill` module; payload: `{ prompt: "What problem are we solving?" }`
- Request: `POST /api/skills/discovery/execute`
- Expected: `200`; response body contains parsed JSONL result; `executeSkill` called with `skillName: "discovery"`, `token` from session, `homeDir` from session manager

### IT2 — `POST /api/skills/:name/execute` with invalid skill name → 400 (AC5)

- Setup: authenticated session
- Request: `POST /api/skills/discovery%3B rm -rf /execute` (URL-encoded semicolon)
- Expected: `400`; `executeSkill` NOT called

### IT3 — `POST /api/skills/:name/execute` requires authentication

- Setup: no session cookie
- Request: `POST /api/skills/discovery/execute`
- Expected: `401`

---

## NFR tests

### NFR1 — Audit log entry per invocation with correct fields

- Setup: authenticated session; spy on audit logger; call execute endpoint
- Expected: audit log call with `userId`, `skillName`, `exitCode`, `durationMs`; token value NOT present in log entry

### NFR2 — No `COPILOT_GITHUB_TOKEN` value in audit log or response

- Setup: session with token `"gho_secret_test_value"`; call execute endpoint
- Expected: `"gho_secret_test_value"` does not appear in any logged string; does not appear in the HTTP response body

### NFR3 — Subprocess spawned with `shell: false` (security invariant)

- This overlaps with T1.1 but is separated as an NFR because it must hold for every invocation path, including timeout and error paths
- Setup: mock spawn; trigger each of the three outcome paths (success, timeout, non-zero exit)
- Expected: in every path, `spawn` was called with `shell: false`

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC1 — live Copilot CLI binary required for true subprocess integration | No Copilot CLI binary available in CI | Unit tests with spawn mocks cover all flag, env var, and option checks; a manual integration smoke test is documented in the verification script |
| AC3 — actual process kill behaviour | OS-level signal delivery is runtime-only | Fake timers + mock process verify the kill sequence and error code; live timeout is a manual verification step |

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 17 |
| Integration tests | 3 |
| NFR tests | 3 |
| **Total** | **23** |

**acTotal: 5**
