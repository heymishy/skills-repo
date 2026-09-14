# Test Plan: Eliminate stale-socket LLM call failures caused by Fly machine suspend/resume during a discovery session (lasr-s1)

**Story:** artefacts/2026-09-14-llm-agent-suspend-resume-fix/stories/lasr-s1-disable-keepalive-on-llm-agents.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-lasr-s1-llm-agent-keepalive.js`. Since the two agents are module-private (not exported), tests read the module's own source and, where the agent constructor is reachable via a fresh require, inspect the constructed `https.Agent` instance's `options` directly.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Source-inspection | `skill-turn-executor.js` source shows `_anthropicAgent` constructed with `keepAlive: false` |
| T2 | AC2 | Source-inspection | `skill-turn-executor.js` source shows `_copilotAgent` constructed with `keepAlive: false` |
| T3 | AC3 | Source-inspection | Both agent-construction lines still include `maxSockets: 4`, unchanged |
| T4 | AC1/AC2 | Behavioural | Loading the module fresh and reading each agent instance's own `.keepAlive` property (Node's `https.Agent` exposes this) confirms `false` at runtime, not just in source text |
| T5 | AC4 | Source-inspection | The comment block above the agent declarations mentions "suspend"/"resume"/"stale" (the real rationale), and no longer claims "reuse TLS connections across turns" as the reason |
| T6 | AC5 | Source-inspection | All four `https.request(options, ...)` call sites still reference `_anthropicAgent`/`_copilotAgent` via their `options.agent` field, unchanged in count and shape |

## Regression coverage

- Full existing test suite re-run — no existing test asserts `keepAlive: true` anywhere in the codebase (confirmed via repo-wide search before writing this plan), so no existing test is expected to need updating.
- Any existing `skill-turn-executor.js`-touching tests (mock-LLM-gateway wiring, timeout behaviour) re-run unmodified to confirm this change doesn't alter call construction beyond the agent's own `keepAlive` flag.

## Out of Scope (per story)

- `fly.toml` configuration changes.
- Timeout/retry-logic changes.
- Client-side (browser) SSE connection tolerance changes.
- Proactive socket-pool invalidation on detected staleness.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
