# Spike Outcome: Copilot CLI Non-Interactive Server-Side Invocation

**Opened:** 2026-05-02 | **Scope:** Thorough | **Steps taken:** 6
**Done condition met:** Yes — all four sub-conditions satisfied
**Artefact path:** `artefacts/2026-05-02-web-ui-copilot-execution-layer/spikes/spike-copilot-cli-noninteractive-outcome.md`

---

## Outcome: PROCEED

### What was found

**1. Non-interactive invocation — first-class documented capability**

The GitHub Copilot CLI (the agent CLI, not the older `gh copilot suggest` helper) has a fully documented programmatic mode:

- **`-p PROMPT` flag**: Executes a prompt non-interactively and exits after completion. `copilot -p "invoke the /discovery skill"` is the canonical pattern.
- **Pipe input**: `echo "prompt" | copilot` also works as an alternative input method.
- **`-s` / `--silent`**: Suppresses usage stats and decoration — outputs only the agent response, documented explicitly as "useful for scripting with -p".
- **`--output-format=json`**: Outputs JSONL (one JSON object per line) — machine-parseable structured output.
- **`--autopilot` + `-p`**: Multi-step autonomous execution: `copilot --autopilot --yolo --max-autopilot-continues 10 -p "..."` — documented in the autopilot how-to page with this exact example for CI/CD use.
- **`--no-ask-user`**: Prevents the agent from pausing to ask clarifying questions.
- **`--allow-all` / `--yolo`**: Documented as "Required when using the CLI programmatically (env: `COPILOT_ALLOW_ALL`)".
- The docs include a full "Running GitHub Copilot CLI programmatically" how-to page with shell scripting patterns, capturing output in variables, CI/CD integration examples.

**2. Authentication for server-side use — documented env var pattern**

- **`COPILOT_GITHUB_TOKEN`** env var: Highest-precedence authentication token, documented as "most suitable for headless use such as automation".
- **Supported token types**: Fine-grained PATs (v2) with "Copilot Requests" permission, or OAuth tokens from the Copilot CLI app / GitHub CLI app. Classic PATs (`ghp_`) are not supported.
- **The GitHub Actions example in docs** uses `COPILOT_GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}`.
- **Constraint**: The token holder must have a Copilot subscription (the "Copilot Requests" permission on a fine-grained PAT requires the account to have Copilot). This means the web backend runs on behalf of a user who has a Copilot licence — or uses a service account with a Copilot licence.

**3. Session state for multi-turn — two viable patterns**

*Simple pattern (file-system sessions):*
- Each `-p` invocation creates a session stored locally.
- `--continue` resumes the most recent session in the current working directory.
- `--resume[=SESSION-ID]` resumes by ID, ID prefix, or name.
- Session state is stored in `~/.copilot/` (or `COPILOT_HOME` env var override) — per-user isolation is achievable by setting a distinct `COPILOT_HOME` per web session.

*ACP server pattern (public preview, recommended for multi-turn):*
- `copilot --acp --port 3000`: Runs the CLI as a TCP ACP (Agent Client Protocol) server.
- Official Node.js SDK: `@agentclientprotocol/sdk`.
- `newSession(cwd, mcpServers)` returns a `sessionId`; `prompt(sessionId, text)` sends subsequent turns.
- Explicit documented use cases: "CI/CD pipelines" and "Custom frontends".
- Cleaner web-native integration than subprocess management for multi-turn workflows.

**4. SKILL.md native support — built in, no config needed**

- Skills are loaded natively from `.github/skills/` in the working directory. If the backend CWD is set to the pipeline repo root, all `.github/skills/*/SKILL.md` files are auto-discovered.
- Also loadable from `~/.copilot/skills/`, `~/.agents/skills/`, or the `COPILOT_SKILLS_DIRS` env var (comma-separated list of additional directories).
- Skills are invoked via `/SKILL-NAME` in the prompt, or automatically by the agent when relevant.

**5. Self-hosting / BYOK (Bring Your Own Key) — fully supported**

Environment variables for own model provider:

| Variable | Purpose |
|---|---|
| `COPILOT_PROVIDER_BASE_URL` | API endpoint (any OpenAI-compatible URL, Azure OpenAI, Anthropic, Ollama, vLLM) |
| `COPILOT_PROVIDER_TYPE` | `openai` (default), `azure`, or `anthropic` |
| `COPILOT_PROVIDER_API_KEY` | API key (not required for local Ollama) |
| `COPILOT_MODEL` | Required when using a custom provider |
| `COPILOT_OFFLINE=true` | Disables all telemetry; only makes requests to the configured provider |

In BYOK + `COPILOT_OFFLINE=true` mode: no calls to GitHub's Copilot service. Skills still inject from `.github/skills/`. Limitation: `/delegate`, GitHub MCP server, and GitHub Code Search are unavailable — acceptable for skill execution use case.

Model constraints: must support tool calling (function calling) and streaming; 128k+ context recommended.

**6. ACP (Agent Client Protocol) — bonus integration path**

The CLI can run as a TCP or stdio server via `--acp`. The ACP protocol provides a proper `newSession`/`prompt` API pattern rather than requiring subprocess management. This is in public preview, explicitly listed for "CI/CD pipelines" and "Custom frontends", and has a published TypeScript/Node.js SDK.

---

### Reasoning

All four done conditions are satisfied by publicly documented, stable (not private beta) features:

(a) **Invocation mechanism confirmed**: `-p` flag for single-turn; ACP server for multi-turn. Both are documented with CI/CD examples.

(b) **Authentication model confirmed**: `COPILOT_GITHUB_TOKEN` env var with fine-grained PAT. Service account or user-scoped OAuth token both viable. The Copilot licence requirement is a known design constraint — Phase 2 was already scoped to Copilot-licence holders (metric P2 annotation in benefit-metric.md confirms this).

(c) **Session state approach confirmed**: Two options — `COPILOT_HOME` isolation for file-system sessions (simple), or ACP `sessionId` API for clean multi-turn (preferred for web backend). Session persistence is real but requires web backend to manage the `COPILOT_HOME` or `sessionId` lifecycle per user.

(d) **Self-hosting confirmed**: BYOK with Azure OpenAI, Anthropic, or any OpenAI-compatible endpoint (including Ollama). `COPILOT_OFFLINE=true` prevents any GitHub Copilot service calls. Skills still work from local filesystem.

---

## Conditions for PROCEED to remain valid

1. **Copilot licence per execution user**: The token used must have Copilot access. Service account model is viable but the service account needs a Copilot seat. Per-user OAuth delegation is the clean path — each user's token is passed as `COPILOT_GITHUB_TOKEN`, and only users with a Copilot licence can execute Phase 2 skills.
2. **ACP server remains available (public preview caveat)**: ACP is in public preview. The `-p` programmatic flag is stable and not preview-gated. If ACP breaks, fall back to subprocess `-p` pattern.
3. **Skills directory accessible to backend process**: The backend process must be able to set CWD to a checkout of the pipeline repo (or set `COPILOT_SKILLS_DIRS` to the skills directory path).
4. **BYOK model must support tool calling and streaming**: Requirement confirmed in docs. GPT-4o, Claude 3.5+, Gemini 1.5+ all qualify. Ollama models vary — needs confirmation per deployment.

---

## Unblocked stage

**Phase 2 stories (skill execution epic) can now be written in `/definition`.**

Phase 1 stories (OAuth read + sign-off surface) were never blocked — can also proceed.

M1 benefit metric (Copilot CLI/API feasibility spike) verdict: **PROCEED** — this is the evidence record.

---

## Suggested Phase 2 architecture (input to /definition)

```
[User browser] → [Web backend (Node.js/Python)]
                      ↓
              Sets env: COPILOT_GITHUB_TOKEN=$user_oauth_token
              Sets env: COPILOT_SKILLS_DIRS=/app/skills
              Sets env: COPILOT_HOME=/tmp/copilot-sessions/$user_id
                      ↓
              Invokes: copilot -p "/skill-name [assembled context]" 
                               --no-ask-user --allow-all-tools --silent
                               --output-format=json
              OR: ACP server per-session TCP connection
                      ↓
              Captures stdout (JSONL), extracts agent response
                      ↓
              [Web backend] commits artefact output to repo via GitHub API
                      ↓
              [User browser] renders result
```

For multi-turn skills (e.g. `/discovery` which asks questions): ACP pattern is preferred — `newSession()` + repeated `prompt(sessionId, ...)` calls map cleanly to a web conversation UI.

---

## What remains unknown

- **Copilot licence per-user token lifecycle**: OAuth token expiry and refresh not investigated. Web backend will need a token refresh strategy.
- **ACP server stability under concurrent connections**: Public preview caveat — load testing under N concurrent users not covered by docs. Conservative approach: one ACP server process per active session (not shared).
- **Streaming output to browser**: The CLI's `--output-format=json` produces JSONL on stdout. Converting that to Server-Sent Events (SSE) for live streaming to the browser UI is not covered here — a web-server design task, not a feasibility blocker.
- **Copilot premium request billing**: Each `-p` invocation uses one premium request (multiplied by model multiplier). Cost at scale not modelled. Covered by M1 metric — track as part of P2 measurement.
- **BYOK model tool-calling validation per deployment**: Confirmed as a requirement; specific Ollama model compatibility needs per-deployment verification.
