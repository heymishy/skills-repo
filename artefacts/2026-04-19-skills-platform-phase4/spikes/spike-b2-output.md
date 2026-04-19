# Spike B2 Output: Craig's CLI MVP as Reference Implementation for Regulated and CI Surface Enforcement

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b2.md
**DoR reference:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-b2-dor.md
**Date:** 2026-04-19
**Investigator:** heymishy (operator)
**Verdict:** **PROCEED**

---

## Inputs Read

This investigation was conducted against Craig's artefacts as submitted in PR #155 (`artefacts/2026-04-18-cli-approach/`). The following artefacts were read in full before investigation began:

- `artefacts/2026-04-18-cli-approach/discovery.md` — approved discovery covering MVP scope items 1–6, Theme F coupling, Mode 1–3 integration shapes, and all Assumptions/Risks
- `artefacts/2026-04-18-cli-approach/benefit-metric.md` — M1–M5 product metrics and MM1–MM3 meta-metrics, including measurement definitions for P1–P4 fidelity properties
- `artefacts/2026-04-18-cli-approach/reference/012-cli-approach-explained-v2.md` — overview of the four-actor model (user, workflow, CLI, agent), seam contract, separation of evaluation and recording
- `artefacts/2026-04-18-cli-approach/reference/013-cli-approach-reference-material.md` — comprehensive reference covering prior platform primitives and CLI design rationale against them

The Spike A output (`artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`, verdict: PROCEED) was confirmed as the upstream gate before investigation began. The governance enforcement package produced by Spike A — `resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace` — forms the shared enforcement contract that all surface adapters, including the CLI adapter, will call.

---

## Verdict

**PROCEED**

Craig's CLI MVP design is a sound reference implementation for the regulated and CI surface class. The four load-bearing requirements (hash-abort on mismatch, envelope assembly before agent handoff, trace schema compatible with the existing assurance gate, non-fork sidecar install) are explicitly addressed and structurally enforced in the design. P2 (context injection exclusivity) and P4 (single-turn mediation) are both PARTIAL for Mode 1 (human-driven interactive) — a limitation Craig explicitly acknowledges, documents as residual risk, and provides a clear resolution path for via Mode 2 (headless subprocess). This P2 PARTIAL finding is consistent with Spike B1's finding for the VS Code/MCP surface: structural enforcement is the target of the operational mode designed for regulated/CI surfaces (Mode 2), not Mode 1. No REDESIGN trigger was identified. Assumption A2 is satisfied in full: the existing `assurance-gate.yml` accepts CLI-emitted traces without modification.

---

## P1–P4 Fidelity Assessment

| Property | CLI Surface Outcome |
|---|---|
| P1 — skill-as-contract (hash abort on mismatch) | SATISFIED |
| P2 — context injection via envelope (not ambient) | PARTIAL |
| P3 — per-invocation trace anchoring (assurance gate accepts without modification) | SATISFIED |
| P4 — single-turn interaction mediation | PARTIAL |

### P1 — Skill-as-contract: SATISFIED

Craig's discovery MVP scope item 1 states explicitly: "The skill body content handed to the agent matches the workflow's declared hash. A mismatch aborts the step." Hash verification fires at envelope-build time — before handoff to the agent — making it structurally enforced at the correct seam. The mechanism is deterministic: the CLI fetches the skill body, computes its hash, and compares against the workflow-declared hash. Any mismatch produces a hard abort, not a warning. This is the C5 load-bearing requirement and Craig treats it as the non-negotiable audit anchor aligned with ADR-003 (Architecture Decision Record 3: hash-at-execution-time is the primary audit signal). Craig's benefit-metric M1 provides the concrete validation criterion: 100% hash-classification-correct, zero false negatives, ≥95% minimum signal across 50 consecutive invocations. The `resolveAndVerifySkill` operation from the Spike A enforcement package maps directly to this envelope-build verification step — the CLI adapter calls into the shared package rather than reimplementing hash verification independently.

### P2 — Context injection via envelope: PARTIAL

The CLI envelope assembles the full context before agent handoff: skill body, prior-step artefacts, target path, output-shape expectations, and constraint envelope (writable paths, allowed tools, forbidden operations). Structural completeness is by design (reference 012 seam contract specification). However, Mode 1 — the only MVP mode — is declarative-only: the CLI writes the prompt file and exits; the operator manually takes it to their existing agent session (Copilot Chat, Claude Code, Cursor) where ambient workspace context remains accessible. Craig explicitly acknowledges this as Risk 5 in the discovery artefact and as a P2 metric caveat in benefit-metric M2: "Mode 1 constraint envelope is declarative-only — agent-side ambient-context leak is not structurally prevented. Target is structural completeness, not leak-proof-ness." This finding mirrors Spike B1's P2 PARTIAL result for the VS Code/MCP surface: envelope delivery works correctly, but ambient bypass is not structurally blocked in the interactive mode. The resolution path for the regulated/CI surface is Mode 2 (headless subprocess or inference-API call): the agent is invoked non-interactively with the envelope on input and exits on return — no ambient session context is accessible. Mode 2 is deferred from the MVP by design and is the correct next step when structural P2 enforcement is required.

### P3 — Per-invocation trace anchoring: SATISFIED

The `emit-trace` command produces trace entries using the existing platform trace schema: skill hash, input hash, output reference, transition taken, workflow-declaration hash, timestamp, and the optional `executorIdentity` field (CLI binary version + hash). All mandatory fields are identical to the existing schema. The `executorIdentity` field is optional and the existing assurance gate ignores it when absent — meaning traces from pre-CLI platform runs continue to pass re-verification unchanged, and CLI-emitted traces with the additional field also pass without gate modification. The maker/checker separation is structurally preserved: the CLI evaluates and emits locally; `assurance-gate.yml` re-verifies independently on PR before committing the trace to durable storage via `trace-commit.yml`. Craig's benefit-metric M3 specifies gate-reverification% target of 100% with a minimum signal of ≥95%. The `writeVerifiedTrace` operation from Spike A's enforcement package covers the chain-validation logic that `emit-trace` wraps for the CLI surface.

### P4 — Single-turn interaction mediation: PARTIAL

The CLI workflow model is structurally one-envelope-per-advance: each `advance`, `back`, or `navigate` command produces exactly one envelope and the CLI exits. At the CLI level, there is no persistent session between commands. However, in Mode 1, after the operator takes the envelope to their interactive agent session, additional turns in that session are not structurally prevented. Craig's benefit-metric M4 acknowledges this explicitly: "Mode 1 constraint envelope is declarative-only." For the regulated/CI surface class — Spike B2's target — Mode 2 enforces single-turn by design: the agent is invoked as a headless subprocess with the envelope as input and exits on return; additional turns are not possible in that execution model. P4 PARTIAL for Mode 1 is consistent with Spike B1's finding for VS Code/MCP and with Craig's own framing. Resolution path: Mode 2 for regulated/CI surfaces where P4 structural enforcement is required.

---

## Assumption A2 Validation

**Assumption A2 (from Craig's discovery):** The existing `assurance-gate.yml` can re-verify a CLI-emitted trace with minor-to-no modification.

**Outcome: A2 accepted — assurance gate requires no modification for the MVP trace schema.**

Craig's design introduces exactly one optional field in the trace schema: `executorIdentity` (CLI binary version + hash). All other trace fields use the existing platform schema without change. The existing assurance gate ignores `executorIdentity` when absent, so traces from pre-CLI platform runs continue to pass gate re-verification unchanged. CLI-emitted traces that include `executorIdentity` also pass because the gate does not assert on unexpected optional fields. There is no schema delta that requires a gate update, and no new parallel gate is required.

A2 is satisfied in full. This is not a REDESIGN trigger.

The only future modification path for A2 is if Theme F (credible second-line organisational independence) later decides to make `executorIdentity` mandatory in the gate's re-verification logic. That decision belongs to Theme F, not to this feature — consistent with Craig's scoping in discovery (MVP Scope §executorIdentity field).

---

## Architecture Constraints Verification

| Constraint | Status | Notes |
|---|---|---|
| C5 — hash verification aborts on mismatch (hard stop, not warning) | SATISFIED | MVP scope item 1 explicitly states "a mismatch aborts the step" — design treats this as load-bearing and non-negotiable; benefit-metric M1 zero-false-negatives criterion reinforces the hard-stop intent |
| C1 — non-fork: no SKILL.md or POLICY.md copied to consumer repo during sidecar install | SATISFIED | Sidecar model installs a directory under the consumer repo containing only lockfile and CLI tooling; no copy of SKILL.md, POLICY.md, or standards files is present in the consumer repo (discovery MVP scope item 2, benefit-metric M5 non-fork adoption: 100% target) |
| C4 — human approval gates routed through existing approval-channel adapter | SATISFIED | Reference 012 and Craig's discovery both state: where the workflow declares a human approval gate, it is routed to the configured approval channel via the approval-channel adapter (ADR-006 pattern); the CLI does not implement inline approval handling |
| ADR-004 — CLI configuration sourced from context.yml | SATISFIED | Craig's design specifies upstream source URL, surface type, and skill pin versions as sourced from `.github/context.yml`; no CLI configuration that bypasses context.yml is introduced in the MVP |
| MC-CORRECT-02 — verdict follows schema-first field definition | SATISFIED | Verdict recorded in `pipeline-state.json` under the pre-declared `features[0].spikes[2]` entry (id: "spike-b2") and `phase4.spikes["spike-b2"]` structure, both of which existed before this investigation |
| MC-SEC-02 — no credentials in artefacts or CLI config files | SATISFIED | This spike output contains no API keys, tokens, or credentials; no CLI config files are produced by this investigation |

---

## CLI–Spike A Integration

The governance enforcement package produced by Spike A maps directly to Craig's CLI command set at three enforcement seams:

- `resolveAndVerifySkill(skillName, skillsDir, expectedHash)` → CLI's envelope-build step inside `verify` and `advance` — hash verification fires before handoff to agent; C5 hard-stop implemented here
- `evaluateGateAndAdvance(feature, stories, gateId, proposedStateUpdate, pipelineState)` → CLI's post-return shape verification and state advance inside `advance` — prevents state advance without satisfied gate; resolves the Phase 3 vulnerability
- `writeVerifiedTrace(executionData, artefactChain)` → CLI's `emit-trace` command — chain-validated trace emission before the independent assurance gate re-verifies

The CLI acts as the adapter layer for the git-native surface: CLI commands own the seam (envelope build, state navigation, trace format, workflow graph traversal) while the enforcement package owns the governance logic (hash verification, gate evaluation, trace chain validation). This is the correct architectural decomposition consistent with Spike A's 3-operation boundary.

---

## Open Items for p4.enf-cli

1. **Mode 2 scope decision.** Mode 2 (headless subprocess) is the resolution path for structural P2 and P4 enforcement on regulated/CI surfaces. p4.enf-cli should declare whether Mode 2 is in-scope for E3 or whether Mode 1 plus explicit residual-risk documentation is the Phase 4 target. This decision affects the AC structure of the p4.enf-cli story.
2. **PR #155 merge decision.** Whether to merge Craig's PR #155 into master is a separate decision to be recorded in decisions.md after the verdict. This spike evaluates Craig's artefacts as investigation inputs; the merge decision is not within its scope.
3. **A2 ongoing monitoring.** If gate-reverification% falls below 95% in implementation testing, Assumption A2 re-runs and the schema alignment question becomes a workstream rather than an incremental fix — per Craig's benefit-metric M3 feedback loop.
