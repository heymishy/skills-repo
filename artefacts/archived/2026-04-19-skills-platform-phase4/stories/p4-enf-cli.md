## Story: CLI enforcement adapter implementing Craig's MVP command set

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform operator in a regulated or CI environment (Craig's surface class)**,
I want to **have the CLI adapter enforce P1–P4 fidelity across the full MVP command set (`init`, `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emit-trace`)**,
So that **regulated and CI consumers have a deterministic, auditable governance mechanism that satisfies their traceability requirements without requiring an interactive MCP session**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync; M2 — Consumer confidence
**How:** The CLI adapter is the primary enforcement mechanism for regulated/CI consumers — Craig's surface class. Without this story, Craig's teams cannot claim structural per-invocation enforcement (they have Craig's MVP design but not an implementation integrated with the Phase 4 governance package). M1's distribution sub-problem 1b (commit-format traceability) is enforced via `advance`; M2's regulated consumer confidence depends on the `emit-trace` output being accepted by the assurance gate.

## Architecture Constraints

- Spike A output artefact: the governance enforcement package interface established at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md` (verdict: PROCEED) defines the 3-operation shared contract (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) that this CLI adapter calls — do not reimplement these operations independently
- Craig's CLI design artefacts: `artefacts/2026-04-18-cli-approach/discovery.md` (Mode 1 MVP command set), `artefacts/2026-04-18-cli-approach/reference/012-cli-approach-explained-v2.md`, and `artefacts/2026-04-18-cli-approach/reference/013-cli-approach-reference-material.md` are the source reference implementation — this story integrates Craig's design with the Phase 4 governance package; it does not re-derive the CLI design from scratch
- Spike B2 output artefact: the evaluation at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md` provides the P1–P4 gap analysis and Assumption A2 validation result — this story addresses any gaps flagged in the B2 verdict before implementation begins
- C5: hash verification at envelope build is the load-bearing property — `advance` must call `verifyHash` before building the skill envelope; a hash mismatch must abort `advance` with a structured error identifying the mismatching skill
- ADR-004: all CLI configuration (upstream source, context path, workflow declaration path) sourced from `.github/context.yml`
- ADR-002: workflow graph topology (from Craig's discovery) — nodes, allowed transitions, back-references; `advance` enforces the declared allowed-transitions array; any attempt to advance to a non-permitted next state is rejected
- MC-SEC-02: no API keys, tokens, or credentials in any CLI output, trace artefact, or config file produced by this story

## Dependencies

- **Upstream:** p4.enf-decision must be committed (confirms CLI as mechanism for regulated/CI surface class); p4.enf-package must be complete (provides governance package entry points); p4.spike-b2 must have PROCEED or REDESIGN verdict
- **Downstream:** p4.enf-second-line — the CLI adapter's trace output is an input to the second-line evidence chain; p4.dist-commit-format depends on the `advance` command being implemented

## Acceptance Criteria

**AC1:** Given Craig's Mode 1 MVP command set, When the CLI adapter is implemented, Then all nine commands are implemented and each has at least one passing unit test in `npm test`: `init` (sidecar + lockfile install), `fetch` (upstream content retrieval), `pin` (lockfile update), `verify` (hash re-check), `workflow` (workflow declaration read and display), `advance` (governed state transition with hash check), `back` (back-navigation to permitted prior state), `navigate` (arbitrary permitted transition), and `emit-trace` (trace artefact emission).

**AC2:** Given a workflow declaration with a graph topology (nodes with `allowedTransitions` arrays per Craig's ADR-002), When `skills-repo advance` is run from a node that does not permit the intended next state, Then the command exits with a non-zero status and an error message: "Transition to <target> not permitted from <current>. Allowed: <list>" — no state transition occurs.

**AC3:** Given `skills-repo advance` runs with a valid transition, When `verifyHash` is called on the current step's skill, Then: if the hash matches, the envelope is built and delivered; if the hash does not match, `advance` exits with error: "Hash mismatch for skill <skillId>: expected <expected>, got <actual>" — no envelope is built or delivered on mismatch.

**AC4:** Given `skills-repo emit-trace` produces a trace artefact, When the assurance gate runs on the PR that includes the trace (`scripts/validate-trace.sh --ci`), Then the trace artefact passes validation without requiring a new parallel gate or schema extension beyond what Spike B2's Assumption A2 evaluation identified as required — if the Spike B2 verdict flagged a schema delta, that delta is implemented as part of this story.

## Out of Scope

- Mode 2 (headless subprocess API) and Mode 3 (CLI-as-MCP-server) — Craig's discovery deferred these explicitly; Phase 4 implements Mode 1 (human-driven interactive) only
- MCP enforcement adapter — that is p4.enf-mcp; the CLI adapter is the regulated/CI mechanism; they do not overlap
- Upgrade UX for breaking skill-content changes across major versions — deferred per Craig's discovery Out of Scope

## NFRs

- **Security:** No credentials in CLI output, trace artefacts, or config files (MC-SEC-02); hash bypass path (no `--skip-verify` or equivalent flag) is prohibited (C5)
- **Correctness:** All 9 commands covered by unit tests; `emit-trace` output validated by `scripts/validate-trace.sh --ci`; ADR-004 compliance verified by governance check (no hardcoded URLs in CLI source)
- **Performance:** `advance` (including hash verify and envelope build) completes within 3 seconds for a typical skill envelope

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — Assumption A2 (assurance gate trace schema compatibility) is the most likely source of implementation complexity; a Spike B2 REDESIGN verdict may require schema alignment work before AC4 can be satisfied

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-cli.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 6 |
| intermediates_prescribed | 4 |
| intermediates_produced | 17 |
