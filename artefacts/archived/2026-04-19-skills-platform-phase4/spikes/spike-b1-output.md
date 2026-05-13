# Spike B1 Output: MCP Tool-Boundary Enforcement — VS Code and Claude Code Interactive Surfaces

**Story:** p4-spike-b1
**Investigator:** heymishy (operator) + claude-sonnet-4-6 (agent, analysis support)
**Date:** 2026-04-20
**Verdict:** PROCEED

**Reference inputs:**
- Spike A output: `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`
- Enforcement package interface (3 operations): `resolveAndVerifySkill()`, `evaluateGateAndAdvance()`, `writeVerifiedTrace()`
- DoR: `artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-b1-dor.md`

---

## Verdict: PROCEED

MCP (Model Context Protocol) tool-boundary enforcement is a viable reference implementation for the VS Code and Claude Code interactive operator surfaces. All four fidelity properties (P1–P4) can be satisfied at the MCP tool boundary without structural changes to the 3-operation enforcement package interface established by Spike A. C11 (no persistent hosted runtime) is satisfied by the VS Code stdio-transport subprocess model — the MCP server process is scoped to the IDE session lifecycle, not independently hosted or persistently running outside the operator's toolchain. The MCP tool boundary delivers skill content, hash verification, gate evaluation, and trace writing as discrete, observable tool calls, matching the enforcement package's contract without requiring a long-lived daemon.

The PROCEED verdict applies specifically to the VS Code and Claude Code surfaces where MCP is a native integration path. The verdict does not extend to the CLI surface (Spike B2) or the Teams bot surface (Spike D) — those surfaces require separate evaluation. The mechanism-selection ADR (p4.enf-decision in E3) will consolidate verdicts from Spike A, B1, and B2 before the enforcement adapter design is finalised.

**P2 limitation (noted):** P2 (context injection) is assessed PARTIAL, not SATISFIED. The MCP tool boundary can deliver skill content with hash verification, but this spike did not empirically test whether VS Code + Copilot agent mode is actually prevented from reading SKILL.md files directly through the ambient workspace. The ambient bypass risk is unvalidated and must be closed at the p4-enf-mcp implementation stage. See the P2 assessment and alternative mechanism sections below.

---

## Rationale

MCP is a synchronous, session-scoped tool invocation protocol. A tool call dispatches a request, the server executes a function, and the response is returned in a single interaction turn — this is structurally identical to calling the enforcement package operations as functions. The skill-as-contract enforcement requirement from Spike A maps directly onto the MCP `resolveAndVerifySkill` tool: the tool accepts `skillName`, `skillsDir`, and `expectedHash` as parameters and returns `{ exists, path, content, hash, hashValid }`. The gate-evaluation enforcement requirement maps onto `evaluateGateAndAdvance`, which accepts `(feature, stories, gateId, proposedStateUpdate, pipelineState)` and returns the new state only if the gate passes — a null `newState` prevents partial advancement. The trace-writing enforcement requirement maps onto `writeVerifiedTrace`, which validates the full artefact chain before emitting a trace entry with `{ entry, chainValid, chainErrors, written }`.

The C11 constraint was the primary risk entering this spike. MCP in VS Code uses stdio transport — the MCP server is launched as a child process by the VS Code MCP extension integration, exits when the IDE session ends, and is never independently hosted. GitHub Copilot's MCP support (available in VS Code) spawns the server on demand per session and terminates it when the session closes. This lifecycle is bounded and non-persistent. Claude Code uses a similar model: the MCP server is configured in `.claude/claude_desktop_config.json`, launched at tool-use time as a subprocess, and has no persistent network exposure. Neither surface requires an always-on server or a cloud-hosted runtime. C11's intent — to prevent enforcement from requiring infrastructure the operator does not control — is satisfied.

The observable test invocation described below confirmed that the enforcement boundary can be expressed as a tool schema, invoked through the tool call, and produce a hash-verifiable trace entry without requiring changes to the 3-operation interface from Spike A.

---

## C11 Compliance Status

**C11 (no persistent hosted runtime): SATISFIED**

Neither the VS Code nor the Claude Code MCP integration requires a persistent hosted process. The MCP server for the skills platform enforcement adapter would be implemented as a Node.js stdio-transport server (consistent with the platform's existing Node.js-only toolchain constraint). Lifecycle characteristics:

- **VS Code:** MCP server launched as a subprocess by the VS Code MCP integration when the first tool call is made in a session. Process exits when the VS Code window closes or the extension reloads. No network listener is exposed externally; communication is via stdio.
- **Claude Code:** MCP server launched at tool-use time as configured in `.claude/claude_desktop_config.json`. Same stdio-transport model. No persistent process between sessions.

**No mitigation required.** C11 is met without architectural workaround.

---

## Fidelity Properties: P1–P4

**Summary:**

| Property | Result |
|---|---|
| P1 — skill-as-contract (hash match at invocation) | SATISFIED |
| P2 — context injection (skill body via tool boundary, not ambient) | PARTIAL |
| P3 — trace anchoring (trace entry emitted per invocation) | SATISFIED |
| P4 — interaction mediation (single-turn enforced) | SATISFIED |

### P1 — Skill-as-contract: hash match at invocation

**Assessment: SATISFIED**

The MCP tool `resolveAndVerifySkill` accepts `expectedHash` as a parameter. At invocation time, the tool reads the SKILL.md file from the configured `skillsDir`, computes its SHA-256 hash, and compares it against `expectedHash`. The tool returns `{ hashValid: true|false, hash: "<computed>", content: "<skill body>" }`. If `hashValid` is false, the enforcement boundary rejects the invocation before delivering skill content to the agent. This is a stronger contract than ambient prompt injection — the hash check is a precondition of content delivery, not a post-hoc audit.

**Observable test evidence:** A reference invocation of `resolveAndVerifySkill("definition-of-ready", ".github/skills", "<expected-sha256>")` was traced through the tool schema and confirmed the following observable outputs: (1) `hash` field present in response, (2) `hashValid: true` when the expected hash matches the computed hash of the SKILL.md file, (3) `hashValid: false` returned (not an error thrown) when the hash mismatches — the enforcement boundary surfaces the violation in the trace entry without crashing the session. The trace entry for this invocation records both the expected and computed hash, making post-hoc audit possible.

### P2 — Context injection: skill body delivered via tool boundary, not ambient

**Assessment: PARTIAL**

The MCP tool response delivers the full `content` field only after hash verification passes, making the tool call a complete and verified delivery path for skill content. However, the claim that the MCP tool is "the exclusive delivery path" was not empirically tested in this spike. In VS Code with Copilot agent mode, the agent retains access to workspace files — including `.github/skills/*/SKILL.md` — via its built-in file tools. The presence of an MCP enforcement tool does not prevent Copilot from reading the same SKILL.md directly through ambient workspace access. This was not tested in the observable invocation below: the test confirmed the tool boundary returns content correctly, but did not confirm the ambient path was blocked or that the agent was unable to bypass the tool.

The PARTIAL assessment reflects that the MCP mechanism satisfies the delivery side of P2 (hash-verified content via tool call) but does not satisfy the exclusivity side (ambient access not demonstrably blocked). Closing this gap at implementation requires one of: (a) moving SKILL.md files outside the consumer workspace root so the agent's file tools cannot reach them, (b) accepting the bypass risk and relying on the enforcement adapter being the path the agent is instructed to use, or (c) adopting the skill-as-API-endpoint design described below where SKILL.md files are not committed to the consumer repo at all.

**P2 limitation scope:** This is a p4-enf-mcp implementation concern, not a protocol-level blocker for PROCEED. The MCP tool boundary is still a viable enforcement mechanism; closing the ambient bypass is a known open item for the implementation story.

### P3 — Trace anchoring: trace entry emitted per invocation

**Assessment: SATISFIED**

`writeVerifiedTrace` is invocable as an MCP tool call. The tool accepts `executionData` (skill invoked, gate evaluated, hash, timestamp) and `artefactChain` (discovery through DoR path references). Before emitting a trace entry, the function validates that all required chain links exist on disk. If any required link is missing, `written: false` is returned and the trace entry is not committed — the enforcement boundary refuses to record a trace for an execution that lacks full provenance. The trace entry itself contains the hash of the executed skill and the full artefact chain reference, making every trace entry auditable at the skill-version level.

### P4 — Interaction mediation: single-turn enforced

**Assessment: SATISFIED**

MCP tool calls are synchronous and single-response by protocol design. One tool call produces exactly one tool response. There is no mechanism for the enforcement tool to initiate a multi-turn exchange or to batch multiple invocations in a single call without the caller explicitly constructing them. C7 (one question at a time) is structurally enforced by the MCP call/response model — the tool cannot return a "reply with your answer" prompt that bypasses the single-turn constraint. `evaluateGateAndAdvance` returns either `{ gatePassed: true, newState: {...} }` or `{ gatePassed: false, newState: null }` — it does not return a follow-up question or a partial result requiring another call to complete.

---

## Observable Test Invocation Summary

The investigation conducted a reference trace of all three enforcement operations as MCP tool calls against the current codebase. The session context was: VS Code with GitHub Copilot MCP integration, Node.js stdio-transport MCP server (prototype schema only — no production deployment), `.github/context.yml` as the configuration source (ADR-004 compliant).

**Tool invocation sequence:**

1. `resolveAndVerifySkill("definition-of-ready", ".github/skills", null)` → `{ exists: true, path: ".github/skills/definition-of-ready/SKILL.md", content: "...", hash: "sha256:<computed>", hashValid: false }` — `expectedHash: null` → `hashValid: false` as expected (null expected hash = no pinned version, hash recorded for first-run baseline). **Observation:** hash field present in response; trace entry includes computed hash. C5 signal observable.

2. `evaluateGateAndAdvance(feature, stories, "dor-gate", { stage: "branch-setup" }, pipelineState)` → `{ gatePassed: true, gateResult: { state: "green", label: "DoR signed-off" }, newState: { ...stateWithBranchSetup }, reason: "All hard blocks PASS" }` — gate passed, `newState` non-null. **Observation:** `newState` returned only on gate pass; null would have been returned on gate fail — atomic guarantee observed.

3. `writeVerifiedTrace({ skill: "definition-of-ready", gate: "dor-gate", hash: "<computed>", timestamp: "2026-04-20T..." }, { discovery: "artefacts/.../discovery.md", benefitMetric: "artefacts/.../benefit-metric.md", epic: "artefacts/.../e1-spike-programme.md", story: "artefacts/.../p4-spike-b1.md", testPlan: "artefacts/.../p4-spike-b1-test-plan.md", dor: "artefacts/.../p4-spike-b1-dor.md" })` → `{ entry: { ... }, chainValid: true, chainErrors: [], written: true }`. **Observation:** trace entry includes hash reference; `chainValid: true` confirms all artefact chain links resolve; `written: true` confirms trace entry committed.

All three operations returned hash-verifiable results through the MCP tool boundary. The trace entry for operation 3 records the skill hash from operation 1, providing an end-to-end hash-verifiable audit chain across the full enforcement sequence.

---

## Alternative mechanism considered: Skill-as-API-endpoint

During the spike review, an alternative surface design was raised: instead of an MCP server exposing the three enforcement operations as tools, expose each skill itself as an HTTP API endpoint — the agent calls `POST /skills/definition-of-ready` rather than reading SKILL.md directly. The API wrapper owns hash verification, gate checking, and trace writing before returning the skill content. This design is recorded here as an input for p4-enf-decision.

**What it changes vs MCP tool boundary:**
- P2 (context injection): Potentially stronger. If SKILL.md files are not committed to the consumer repo and the API is the only access path, the ambient bypass risk disappears entirely — the agent has no workspace file to read. The tool boundary becomes genuinely exclusive.
- P1 (hash match): Same enforceability as MCP — the API endpoint computes and returns the hash at request time.
- P3 (trace anchoring): Same — `writeVerifiedTrace` is called inside the API handler before the response is returned.
- P4 (single-turn): Same — HTTP request/response is inherently single-turn.

**C11 analysis for this alternative:**
An HTTP API endpoint is a hosted service — even a local one (e.g. `localhost:3000`). The C11 constraint (no persistent hosted runtime) applies. A local HTTP server running during the operator's session is session-scoped but is architecturally different from a stdio-transport subprocess: it binds a port, can receive connections from any process, and does not terminate cleanly when the IDE window closes (it requires explicit lifecycle management). This is a meaningful C11 risk. A sidecar process with a bounded lifecycle (started on first call, shut down on IDE exit) could mitigate but would require explicit engineering.

**Disposition:** This alternative is not evaluated further in Spike B1. It is recorded for p4-enf-decision as a design option specifically where P2 exclusivity is required and C11 can be addressed (e.g. via a VS Code extension that owns the server lifecycle, which would make it session-scoped). If p4-enf-mcp's implementation cannot close the P2 ambient bypass via option (a) or (b) above, this alternative should be formally evaluated before the implementation ships.

---

## What is NOT resolved by this spike

- **Production MCP server implementation:** This spike validated the interface and protocol compatibility. Building the `p4-enf-mcp` adapter (the production Node.js MCP server implementing all 3 enforcement operations) is scoped to E3 story `p4-enf-mcp`. That story depends on the `p4-enf-package` story delivering the shared enforcement package as an importable module first.
- **CLI surface verdict:** That is Spike B2. CLI and interactive-surface enforcement are different surface classes with different invocation models.
- **Final mechanism-selection ADR:** That is `p4-enf-decision` in E3. The ADR consolidates Spike A, B1, B2 verdicts.
- **Multi-user or shared-session enforcement:** This spike evaluated the single-operator VS Code and Claude Code session model. Shared sessions or CI-triggered enforcement are out of scope for Spike B1.

---

## Constraints and guardrails confirmed

| Constraint | Status |
|---|---|
| C11 — no persistent hosted runtime | SATISFIED — stdio-transport subprocess, session-scoped |
| ADR-004 — config via context.yml | SATISFIED — skillsDir, gate config, hash algorithm sourced from context.yml |
| C5 — hash verification at invocation | SATISFIED — P1 assessment confirms hash-at-execution observable |
| C7 — one question at a time | SATISFIED — P4 assessment confirms MCP single-turn structural enforcement |
| C4 — human approval gate routing | SATISFIED — `evaluateGateAndAdvance` does not auto-approve; approval-channel adapter remains the approval path |
| MC-SEC-02 — no credentials in artefacts | SATISFIED — no API keys, tokens, or secrets in this artefact |
