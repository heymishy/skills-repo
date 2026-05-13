## Story: MCP enforcement adapter for VS Code and Claude Code surfaces

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As an **interactive operator using VS Code or Claude Code**,
I want to **have the MCP tool boundary intercept each skill invocation, verify the skill hash, inject the skill body and standards context, and emit a trace entry — before the agent receives the skill content**,
So that **my interactive outer-loop sessions are governed per-invocation (P1–P4) and I can claim governance-by-design for a VS Code or Claude Code session without any change to my operator workflow**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** The interactive operator surface (VS Code, Claude Code) is the primary adoption path for technical team members. Per-invocation enforcement via MCP makes governance automatic and invisible — the operator does not need to remember to verify hashes or emit traces; the tool boundary does it. Without this story, the interactive surface has convention-based governance (the operator remembers to verify) rather than structural governance (the tool boundary enforces it), and M2's consumer confidence claim cannot be grounded in demonstrated enforcement.

## Architecture Constraints

- C11: no persistent hosted runtime — the MCP adapter must be event-driven; it activates per tool call and terminates after the call; it must not require an always-on MCP server process running in the operator's environment; if the VS Code / Claude Code MCP integration requires a server process, the adapter must use the shortest-lived server lifecycle possible (per-session, not per-environment) and this constraint must be documented in the implementation
- C5: hash verification at the tool call boundary is non-negotiable — the adapter invokes `verifyHash` from the governance package before delivering the skill body to the agent; a hash mismatch aborts the tool call with a structured error
- C7: single-turn mediation — the MCP tool's input schema permits only a single question context per tool call; the adapter's input schema must be validated to reject multi-question payloads
- C4: approval gates routing through MCP must invoke the approval-channel adapter (ADR-006) rather than auto-approving
- Spike B1 output artefact: the reference implementation design from `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b1-output.md` is the architecture input for this story; the implementation follows the B1 verdict, it does not redesign the adapter independently
- ADR-004: MCP tool configuration (skill source path, lockfile location, trace target) is read from `.github/context.yml`

## Dependencies

- **Upstream:** p4.enf-decision must be committed (confirms MCP is the mechanism for the interactive surface class); p4.enf-package must be complete (provides `resolveSkill`, `verifyHash`, `evaluateGate`, `advanceState`, `writeTrace` entry points); p4.spike-b1 must have PROCEED or REDESIGN verdict
- Spike A output artefact: the governance package interface that p4-enf-package implements is derived from Spike A's verdict at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`; the MCP adapter depends on the governance package (p4.enf-package) which in turn implements the Spike A interface — this story must not enter DoR until Spike A has a PROCEED or REDESIGN verdict
- **Downstream:** p4.enf-second-line — the MCP adapter's trace output is an input to the second-line evidence chain

## Acceptance Criteria

**AC1:** Given the MCP adapter is installed and an operator initiates a skill step in VS Code or Claude Code, When the MCP tool boundary intercepts the invocation, Then it calls `verifyHash` from the governance package before delivering any skill content to the agent — if `verifyHash` returns `HASH_MISMATCH`, the tool call returns a structured error to the agent and no skill body is delivered.

**AC2:** Given the MCP tool is invoked with a valid hash match, When the tool prepares the skill body for delivery, Then P2 context injection is performed: the skill body, the applicable standards for the operator's declared discipline (from the sidecar), and the current state context are assembled into the tool's response — the agent receives a complete context, not just the skill file text.

**AC3:** Given the operator completes a skill step and the MCP tool's return handler runs, When the trace entry is emitted via `writeTrace`, Then the trace entry contains: skillHash (the verified hash), inputHash (SHA-256 of the operator's input), outputRef (reference to the produced artefact), transitionTaken (workflow state change), surfaceType `"mcp-interactive"`, and timestamp — and the trace passes `scripts/validate-trace.sh --ci`.

**AC4:** Given C11 applies and the MCP adapter is reviewed in CI, When the CI check runs, Then a test confirms that the adapter does not spawn a persistent background process — the test starts the adapter, invokes one tool call, and confirms the adapter process exits after the call completes.

## Out of Scope

- CLI enforcement — that is p4.enf-cli
- VS Code extension UI (panels, sidebar widgets) — the adapter implements the MCP tool boundary; it does not add any VS Code UI beyond what the MCP protocol provides
- Non-interactive surfaces (CI/headless) — the adapter is for interactive VS Code / Claude Code sessions; CI/headless use the CLI adapter
- Testing the adapter against every possible MCP client implementation — the CI test covers VS Code and Claude Code as specified by the Spike B1 reference implementation

## NFRs

- **Security:** No skill content or operator input logged to external services (MC-SEC-02); hash verification must not have a bypass path
- **Correctness:** All four fidelity properties (P1–P4) covered by integration tests in `npm test`; trace validated by `scripts/validate-trace.sh --ci`
- **Performance:** MCP tool call overhead (hash verify + context inject + trace write) adds at most 500 milliseconds to the operator-perceived latency

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — C11 compliance for the persistent-process constraint may require a REDESIGN if the VS Code MCP integration cannot support per-call lifecycle management

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 6 |
| intermediates_prescribed | 4 |
| intermediates_produced | 16 |
