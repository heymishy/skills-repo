# Spike A Output: Governance Logic Extractability and Shared Core Interface Definition

**Story:** p4-spike-a
**Investigator:** heymishy (operator) + claude-sonnet-4-6 (agent, analysis support)
**Date:** 2026-04-19
**Verdict:** PROCEED

**Interface summary (3 enforcement operations, mapped from original 5):**

| Original label | Maps to | Key params / return shape |
|---|---|---|
| skill-resolution | `resolveAndVerifySkill()` | params: `(skillName, skillsDir, expectedHash)` → returns `{ exists, path, content, hash, hashValid }` |
| hash-verification | `resolveAndVerifySkill()` | combined with skill-resolution — hash computed and verified in one call → returns `{ hashValid }` |
| gate-evaluation | `evaluateGateAndAdvance()` | params: `(feature, stories, gateId, proposedStateUpdate, pipelineState)` → returns `{ gatePassed, gateResult }` |
| state-advancement | `evaluateGateAndAdvance()` | combined with gate-evaluation — returns `{ newState }` only if `gatePassed` is true; null otherwise |
| trace-writing | `writeVerifiedTrace()` | params: `(executionData, artefactChain)` → returns `{ entry, chainValid, chainErrors, written }` |

---

## Rationale

The codebase investigation read ~20 source files across `scripts/`, `src/`, `dashboards/`, and `.github/scripts/` and found that the governance operations the platform relies on are already implemented as stateless, mostly pure functions with I/O cleanly separated from logic. `processApproveCommentEvent()` in `src/approval-channel/index.js` takes state as a parameter and returns a mutation — the caller owns file reads and writes. `evaluateScenario()` and `evaluateSuite()` in `src/suite-parser/index.js` take data in, return results, and perform no I/O at all. `evaluateGate()` in `dashboards/pipeline-viz.html` is a pure browser function. The scripts that combine I/O with logic (`validate-trace.sh`, `check-skill-contracts.js`) follow a read→transform→write pattern where the transform step is separable. No governance operation requires a persistent runtime, long-lived server, or daemon — every operation is a synchronous function call invocable from any surface. C11 (no persistent hosted runtime for enforcement) is satisfied without structural rework.

During the investigation, the operator challenged whether the original 5-operation decomposition (skill-resolution, hash-verification, gate-evaluation, state-advancement, trace-writing) was the correct analytical frame. The original 5 labels were generated during `/definition` as a hypothesis — not derived from code analysis. Reviewing the actual code revealed that the enforcement boundary is narrower and more precise than the 5-operation model suggested. The platform's design philosophy is: keep governance logic light, allow operator flexibility and navigation, and only enforce rules that are non-negotiable for audit integrity. This reframes the package as a minimal enforcement core, not a full governance orchestration layer.

The critical design insight is that the pipeline has two distinct layers. The outer loop — discovery through epic decomposition — scales with complexity (from a single defect fix short-track to a multi-team programme) and is navigated flexibly by the operator via `/workflow`. The operator moves forward, backward, regroups, iterates. That navigation is instructional and must stay that way. The inner boundary — story execution downward — is invariant regardless of how you got there: the story has ACs, the test plan has failing tests, DoR gates it, implementation makes tests pass, DoD verifies. The enforcement package lives at this invariant boundary. It has no opinion about the outer loop.

---

## Enforcement boundary: 3 operations, not 5

The investigation narrowed the shared package interface from 5 operations to 3, each mapping to a non-negotiable audit requirement:

### 1. Skill-resolution and hash-verification (combined)

**Why it must be enforced:** C5 requires every SKILL.md delivered to an agent to be versioned and hash-verified. Without this, the trust chain between what was authored and what was executed is broken. The Phase 3 finding — an agent reading a skill verbatim and still violating its prescribed method — makes hash-at-execution-time the primary integrity signal.

**What exists today:** `check-skill-contracts.js` has a static `CONTRACTS` array mapping skill names to file paths and required strings. Resolution is `skillName → filePath → fs.existsSync + fs.readFileSync`. Hash verification exists in `validate-trace.sh`/`.ps1` as JSON schema validation but not as SHA-based content hashing. The hash-at-execution-time signal that C5 requires does not yet exist as a discrete function — it must be built.

**Candidate interface:**

```
resolveAndVerifySkill(skillName, skillsDir, expectedHash) → {
  exists: boolean,
  path: string,
  content: string | null,
  hash: string | null,
  hashValid: boolean
}
```

**Parameters:** `skillName` — the skill to resolve. `skillsDir` — the directory containing SKILL.md files (injected, not hardcoded per ADR-004). `expectedHash` — the pinned hash from the lockfile or version manifest.

**Returns:** Resolution result including computed hash and validity against the expected hash.

**Design note:** Skill-resolution and hash-verification are combined into a single operation because they are always performed together — you never verify a hash without first resolving the file, and you never resolve a file at the enforcement boundary without verifying its hash. Separating them creates a gap where resolution can occur without verification.

### 2. Gate-evaluation with guarded state-advancement (combined)

**Why it must be enforced:** The Phase 3 violation was specifically this: the agent advanced state without the gate passing. Post-hoc gate evaluation cannot detect this because the output was schema-conformant. The enforcement is that `advanceState()` can only succeed if `evaluateGate()` returns pass — they must be a single atomic operation at the enforcement boundary.

**What exists today:** `evaluateScenario()` and `evaluateSuite()` in `src/suite-parser/index.js` are already pure functions — data in, results out, no I/O. `processApproveCommentEvent()` in `src/approval-channel/index.js` is already a pure state mutation function — takes `(event, pipelineState, context)`, returns `{ success, story }`, caller owns file I/O. These are the building blocks; they need to be composed into a single guarded operation. Note: `dashboards/pipeline-viz.html` contains an `evaluateGate()` function that was inspected but is UI-only display logic for the pipeline dashboard — it computes rendering state, not governance verdicts, and is not an enforcement source.

**Candidate interface:**

```
evaluateGateAndAdvance(feature, stories, gateId, proposedStateUpdate, pipelineState) → {
  gatePassed: boolean,
  gateResult: { state, label, findings },
  newState: object | null,
  reason: string
}
```

**Parameters:** `feature` — the feature context. `stories` — story array for the feature. `gateId` — which gate to evaluate. `proposedStateUpdate` — the state change the caller wants to make. `pipelineState` — the current pipeline state object (injected, not read from disk).

**Returns:** Gate evaluation result. `newState` is non-null only if `gatePassed` is true. If the gate fails, `newState` is null and no state advancement occurs — the caller cannot apply a partial update.

**Design note:** Gate evaluation and state advancement are combined because separating them is the exact vulnerability Phase 3 exposed. The function evaluates and — only if the gate passes — produces the new state. The caller writes the new state to disk, but cannot construct the new state without this function producing it.

### 3. Verified trace-writing (chain-validated)

**Why it must be enforced:** Without a trace entry for every execution, the audit trail has gaps, the improvement agent has no signal, and no audit-readiness claim can be made. Per the operator's design direction, the trace must resolve the full artefact chain upward — not just "story X passed gate Y" but the complete provenance from programme (if applicable) through discovery, benefit-metric, epic, story, test-plan, and DoR. This ensures that programme-level and complex multi-team deliveries maintain their full trace even though the enforcement package operates at the story-down boundary.

**What exists today:** `redactTrace()` in `src/improvement-agent/trace-interface.js` is a pure transform. `readAllTraces()` and `queryTraces()` take directory as an injected parameter. `writeProposalFile()` in `failure-detector.js` is explicit I/O with an injected path. `scripts/validate-trace.sh`/`.ps1` perform chain validation (discovery check, test plan coverage, blocker check) — this validation logic can be extracted from the CLI wrapper. The JSONL parsing in `trace-interface.js` is separable from the file reads.

**Candidate interface:**

```
writeVerifiedTrace(executionData, artefactChain) → {
  entry: object,
  chainValid: boolean,
  chainErrors: string[],
  written: boolean
}
```

**Parameters:** `executionData` — what happened (skill executed, gate evaluated, state advanced, timestamp, hash). `artefactChain` — the full provenance chain:

```
artefactChain: {
  programme?: string,       // optional — only if programme-track
  discovery: string,        // required — path to discovery.md
  benefitMetric: string,    // required — path to benefit-metric.md
  epic: string,             // required — path to epic artefact
  story: string,            // required — path to story artefact
  testPlan: string,         // required — path to test-plan artefact
  dor: string               // required — path to DoR artefact
}
```

**Returns:** The trace entry object and chain validation result. `written` is true only if all required chain links resolve. If any required link is missing, the function returns `chainValid: false`, `chainErrors` listing the missing links, and `written: false`. The caller cannot produce a valid trace entry without a complete chain.

**Design note:** The chain validation is the operation that carries the weight of full-trace integrity. The outer loop is flexible — navigate however you like. But when you finally execute at the story boundary, the trace function requires proof that the full chain exists. No chain, no trace entry, no completion claim. For programme-track work, the programme reference is included; for standard-track or short-track, it is omitted but all other links are required.

---

## What is explicitly NOT in the enforcement package

The following are governance concerns that remain instructional (operator-navigated, `/workflow`-guided) and are not structurally enforced by the shared package:

- **Skill selection and sequencing** — the operator picks which skill to run, in what order. The multi-path navigation model (forward, backward, regroup, light track) is preserved. The package does not enforce ordering.
- **Outer loop navigation** — discovery, benefit-metric, clarify, definition, review, test-plan, DoR. These scale with complexity and are operator-directed. The package has no opinion about them.
- **Approval routing** — the channel adapter pattern (`src/approval-channel/`) is surface-specific by design (GitHub issue comments, Bitbucket, ADO, Teams). It routes approval events to the gate-evaluation operation but is not itself part of the enforcement core.
- **Configuration resolution** — `context.yml` reading (ADR-004) is a cross-cutting concern used by everything. It stays as a utility, not an enforcement operation.
- **Improvement agent operations** — failure detection, staleness detection, proposal generation. These consume trace data but are analytical, not enforcement.

---

## Configurability and extensibility concern

The operator raised a valid concern: the gates and rules must be configurable and extensible over time. New constraints will be added, existing ones may be relaxed as the platform matures, and different consumers may need different policy floors (enterprise vs. personal context).

**Design direction:** The enforcement package must be opinionated about *what* it enforces (the 3 operations above) but configurable about *how strictly*. Which gates exist, what the chain requirements are for a given track (programme vs. standard vs. short), what the hash algorithm is, and what constitutes a passing gate — these are policy inputs, not hardcoded logic. ADR-004 already mandates that all configuration is sourced from `.github/context.yml`. The package reads its rules from config.

**Extensibility model:** New enforcement operations can be added to the package over time, but the bar for inclusion is: "if an agent can skip this, the audit trail is broken." Operations that don't meet this bar stay instructional. This prevents the enforcement package from growing into a full orchestration layer that collapses the navigation flexibility the platform depends on.

**Implementation note:** The details of the configuration model — schema, defaults, consumer override mechanism — are a `p4-enf-package` (E3) design concern, not a spike deliverable. The spike establishes that configurability is a requirement; the implementation story works out the design.

---

## Relationship to discovery scope item 4.B.9 (Audit evidence accessibility)

The shared enforcement package directly enables 4.B.9. When all surfaces (VS Code + Copilot via MCP, Craig's CLI, Teams bot, future orchestration) invoke the same 3 enforcement operations, the trace output is structurally consistent regardless of which surface produced it. An auditor or risk professional consuming governance evidence does not need to know which surface was used — the trace chain, hash verification result, and gate evaluation result have the same shape everywhere. This is a prerequisite for making governance output readable to non-technical audiences: the data must be consistent before it can be presented.

---

## C11 compliance assessment

**C11 (no persistent hosted runtime for enforcement):** All three enforcement operations are pure functions. They take data as parameters, return results, and perform no I/O themselves — the caller owns file reads and writes. No server, daemon, or long-lived process is required. Each operation is a synchronous function call that any surface adapter can invoke: an MCP tool handler, a CLI command, a Teams bot message handler, or a GitHub Actions step. The package is a library, not a service.

---

## Codebase evidence summary

| Current location | What exists | Pure? | Maps to enforcement operation |
|-----------------|-------------|-------|-------------------------------|
| `.github/scripts/check-skill-contracts.js` | Static CONTRACTS array, `skillName → filePath → fs.existsSync` | Mostly — static list + I/O | Skill-resolution + hash-verification |
| `scripts/validate-trace.sh` / `.ps1` | JSON schema validation, chain checks | No — embedded in CLI with Python | Hash-verification (schema part) + Verified trace (chain part) |
| `src/suite-parser/index.js` | `evaluateScenario()`, `evaluateSuite()` | YES — data in, results out, no I/O | Gate-evaluation |
| `dashboards/pipeline-viz.html` | `evaluateGate(feature, stories, gateId)` | UI display only — not governance logic | Not applicable — rendering function, not an enforcement source |
| `src/approval-channel/index.js` | `processApproveCommentEvent(event, state, ctx)` | YES — pure mutation, caller owns I/O | Gate-evaluation + state-advancement (composition target) |
| `src/improvement-agent/trace-interface.js` | `redactTrace()`, `queryTraces(filters, dir)` | Transform pure, I/O via injected paths | Verified trace-writing |
| `src/improvement-agent/failure-detector.js` | `detectFailureSignals(traces, config)` | YES — data params only | NOT in enforcement package (analytical) |
| `scripts/process-dor-approval.js` | Thin CLI wrapper: read → transform → write | Pattern already separated | Demonstrates the read→transform→write pattern the package formalises |

---

## Verdict summary

**PROCEED.** The governance logic is extractable into a shared package that operates at the story-execution boundary. The existing codebase already implements the core operations as stateless, mostly pure functions with I/O cleanly separated. The package interface is 3 enforcement operations (not the original 5) — narrowed to the minimum required to prevent audit trail compromise while preserving operator navigation flexibility across the full range of pipeline scales (defect short-track through multi-team programme). No persistent runtime is required (C11). The exact package API — configuration schema, extensibility points, error handling — is a `p4-enf-package` implementation concern, not a spike deliverable.
