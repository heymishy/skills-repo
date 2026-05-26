# Reference: Skills Platform — Execution Boundary Model and Invocation Telemetry

**Document type:** Strategic reference — design principle addendum
**Status:** Draft — for outer loop review
**Created:** 2026-05-21
**Relates to:** `ref-skills-platform-phase4-5.md` — extends Design Properties P1–P4
**Drop into:** `artefacts/2026-05-21-execution-boundary/reference/`

> **Note for the discovery skill:** This document establishes two new first-class design principles (P5 and P6) for the skills platform. They are additive to the Phase 4/5 reference and do not supersede any existing design decisions. P5 governs the execution boundary between outer and inner loop. P6 governs invocation telemetry. Read alongside `ref-skills-platform-phase4-5.md`.

---

## Background: Two loops, one repo

The skills platform operates across two distinct execution contexts that share a repository but have fundamentally different governance properties.

The **outer loop** is where skills execute. The Web UI is the harness. The platform owns the model call, controls context injection, applies guardrails, and streams the full execution trace. This is governed execution — observable, auditable, and reproducible.

The **inner loop** is where engineers implement. VS Code, Claude Code, Cursor, or any other tool is the harness. The platform does not own this execution and cannot observe it deeply. This is autonomous execution — fast, flexible, and appropriately ungoverned at the tool level.

These two loops connect through a single interface: **the governed artefact**. The outer loop produces it. The inner loop consumes it. The pre-commit hook and CI gate verify that the handoff occurred correctly.

This is not a limitation of the current architecture. It is a deliberate design choice that this document formalises as a first-class principle.

---

## Design Property P5: Execution Boundary Separation

### Statement

Governance enforcement is scoped to the outer loop. The inner loop is harness-agnostic. The governed artefact is the boundary between them.

### Rationale

Attempting to govern the inner loop at the tool call level would require owning the harness — mandating a specific IDE, extension, or execution environment across 50 teams. This creates platform dependency, constrains engineer autonomy, and produces high-volume, low-signal telemetry (every file read, every iteration, every revert).

The outer loop is where governance is both feasible and valuable. The Web UI harness owns the model interaction entirely: it selects the model, injects the skill, applies guardrails and standards, and streams the execution trace. Every decision the platform needs to evidence for regulatory purposes happens in this layer.

The inner loop is where engineers are most productive when they have full tool autonomy. An engineer using Claude Code against a governed artefact is operating within a constraint established by the outer loop, regardless of which tool they use to satisfy it.

### The governed artefact as contract

The artefact produced by the outer loop is not documentation. It is a **contract** — the distillation of everything the outer loop reasoned across before producing it:

- Which standards were checked (architecture, API, security, regulatory)
- Which guardrails were applied (compliance profile, domain constraints)
- Which context was considered (discovery, existing design decisions, NFRs)
- What the acceptance criteria are — traceable to the standards that produced them

The engineer does not need to re-reason across all of that context. The outer loop already did. The artefact delivers the conclusion in a form the engineer can implement against.

### Implication for harness choice

Because governance is scoped to the outer loop, the inner loop harness is a team-level decision. Teams may use:

- GitHub Copilot Chat (VS Code)
- Claude Code (CLI)
- Cursor
- Any other tool that can read files and write code

The platform makes no claim over this choice. The gate checks the output, not the tool that produced it.

This is also what makes the platform durable. When a new AI tool emerges, or when GitHub changes the Copilot pricing model, or when a team migrates to a different IDE, the platform governance model does not change. The outer loop remains the governed execution surface. The inner loop remains the engineer's domain.

### Relationship to the CI gate

The pre-commit hook and CI gate are the enforcement surface for the boundary. They verify:

1. That a governed artefact arrived in the repo (outer loop ran)
2. That the artefact's trace hash is intact (it was not modified outside the outer loop)
3. That the implementation satisfies the acceptance criteria the outer loop produced (the boundary was honoured)

The gate does not ask what tool the engineer used. It does not inspect the inner loop session. It checks the artefact and the AC satisfaction — both of which are legible from the repo state alone.

---

## Design Property P6: Invocation Telemetry Spine

### Statement

Every outer loop skill execution produces a timestamped JSONL event log as a first-class artefact. This log is the evidence base for platform governance, model evaluation, and regulatory audit. It is written by the Web UI harness deterministically — not by the model.

### Why the Web UI is the right telemetry surface

The Web UI owns the Anthropic API call. This means it has access to the full SSE stream that Copilot Chat does not expose:

- Every `thinking` block — the model's reasoning before acting
- Every `tool_use` event — which file was read, which search was run, which standard was checked
- Every `tool_result` — what came back and what the model did with it
- Every `content_block` — the artefact as it was written
- Token counts, latency, model identity, stop reason

None of this is available from within a VS Code session using Copilot Chat. The Chat Debug View shows it as a UI panel but exposes no programmatic API. MCP servers can observe their own tool calls but not the built-in harness tool calls (`read_file`, `semantic_search`, `run_in_terminal`). A VS Code extension can contribute tools but cannot observe the closed harness loop.

The Web UI does not have these constraints. It is the harness. The full stream is available on every invocation.

### What the telemetry log captures

For a skill execution such as `/discovery`, the JSONL records the complete execution trace in sequence:

```jsonl
{"ts":"...","event":"skill_invoked","skill":"discovery","version":"2.1.0","model":"claude-sonnet-4-6","input_tokens":14240,"team":"T42","repo":"acme-corp/payments-api","git_sha":"d4f8a2..."}
{"ts":"...","event":"thinking","content":"I need to understand the bounded context boundaries before I can assess risk areas. Let me start with the domain folder structure..."}
{"ts":"...","event":"tool_use","tool":"read_file","input":{"path":"src/domain/payments/index.ts"}}
{"ts":"...","event":"tool_result","tool":"read_file","size_bytes":2840,"latency_ms":12}
{"ts":"...","event":"tool_use","tool":"read_file","input":{"path":".skills/standards/api-standards.md"}}
{"ts":"...","event":"thinking","content":"The API standards require idempotency keys on all POST endpoints. The current payment initiation endpoint does not declare this. This is a risk area I need to surface in the discovery artefact..."}
{"ts":"...","event":"tool_use","tool":"read_file","input":{"path":".skills/guardrails/pci-scope.md"}}
{"ts":"...","event":"tool_use","tool":"semantic_search","input":{"query":"BSB validation ACE submission"}}
{"ts":"...","event":"thinking","content":"Found 3 bounded contexts clearly. The legacy ACE integration boundary is the highest risk — no explicit error contract and no idempotency. I have enough to write the discovery artefact now."}
{"ts":"...","event":"tool_use","tool":"write_file","input":{"path":".skills/artefacts/discovery-report.md"}}
{"ts":"...","event":"artefact_written","name":"discovery-report.md","sha":"7bc3d1...","size_bytes":4821}
{"ts":"...","event":"gate_evaluated","result":"pass","checks":{"schema":true,"required_sections":true,"ac_present":true},"fidelity_score":0.94}
{"ts":"...","event":"skill_complete","duration_ms":68400,"output_tokens":3821,"rounds":7,"artefacts":["discovery-report.md"]}
```

This is not a reconstruction after the fact. It is the actual execution trace written as the stream arrives, one `appendFileSync` per event. The model does not write it and cannot influence it.

### The model is the subject, not the author

This distinction matters for regulated use. If the model wrote its own telemetry, a sufficiently capable model could produce a flattering account of its own execution. The telemetry has audit value only because it is written by infrastructure the model cannot influence.

The Web UI harness writes the log. The model produces text and tool calls. The harness observes both and records them. The model's thinking blocks appear in the log because the harness extracted them from the stream — not because the model was asked to report on itself.

### JSONL as the format

JSONL (newline-delimited JSON) is the right format for this telemetry:

- **Append-only**: each event is one `appendFileSync` call at the moment it occurs
- **Streamable**: readable line-by-line without parsing the whole file
- **Queryable**: `grep`, `jq`, or any log tooling works natively
- **Committable**: plain text, diffable, auditable in git history
- **Cheap**: sub-kilobyte per event, no inference cost, no network call

Each skill execution produces one JSONL file named by timestamp, skill, and team:

```
.skills/traces/2026-05-21T14:32:01Z_discovery_T42.jsonl
```

This file is committed alongside the skill artefacts in the same CI run. It is uploaded to the CI artefact store as an individually linkable file — consistent with the CI-native audit attachment pattern established in Phase 4 (deliverable 4.B.9).

### Tiered telemetry model

Not all events carry equal cost or value. The log operates across three tiers:

**Tier 1 — Always-on, near-zero cost**
Structured invocation metadata: skill ID, version, model, team, repo, git SHA, token counts, latency, gate result, artefact SHAs. This is the audit spine — always written, always committed, always queryable. Sub-kilobyte per invocation.

**Tier 2 — Full trace, written for every outer loop execution**
Complete event stream including thinking blocks, tool calls, tool results, and artefact writes. Written by the Web UI harness as the stream arrives. Available for any outer loop invocation. Not available for inner loop Copilot Chat sessions — and not needed there.

**Tier 3 — Periodic fleet sweep**
Async inferential analysis running across the Tier 1 log from all teams. Surfaces drift patterns that accumulate over time: skill versions falling behind, fidelity scores trending downward, token cost anomalies by skill type. Runs on a schedule, not per-invocation. Cost is amortised across the fleet.

### What the telemetry does not capture — and why that is acceptable

The inner loop is not instrumented. An engineer's Copilot Chat session, Claude Code run, or Cursor interaction produces no telemetry in the platform's log. This is intentional.

The inner loop is ungoverned at the tool level by design (see P5). Instrumenting it would require a VS Code extension, a per-developer install, and ongoing maintenance against an undocumented VS Code internal API that GitHub explicitly states is not designed for external consumption. The cost is high, the signal is low, and the governance value is zero — because the gate checks the output, not the process.

What the telemetry *does* capture is everything that matters for the regulated question: what governed artefacts did the outer loop produce, what did it reason across to produce them, and did the implementation satisfy the acceptance criteria those artefacts contained.

The inner loop gap is a feature, not a limitation.

---

## The acceptance criteria as governance closure

The acceptance criteria in the outer loop artefact are not documentation. They are the **closure of the governance chain**.

The outer loop reasoned across standards, guardrails, regulatory constraints, and domain context. The acceptance criteria are the distillation of that reasoning into concrete, testable statements that the inner loop must satisfy. They connect "what standards apply" to "did the implementation satisfy them" with a full evidence trail in the JSONL.

When the CI gate checks AC satisfaction, it is not checking what tool the engineer used or how they arrived at the implementation. It is checking whether the implementation satisfies the criteria that the outer loop produced from its governed context. That is the right question for a regulated environment.

The full evidence chain for any feature is therefore:

```
JSONL event log
  → what the outer loop reasoned across (standards, guardrails, context)
  → what it concluded (acceptance criteria, risk areas, design decisions)

Artefact (committed, SHA-linked to JSONL)
  → the distillation of that reasoning in implementable form

CI gate result (linked to CI run, individually accessible)
  → did the implementation satisfy the AC the outer loop produced

Audit answer
  → yes, with full provenance — no assertion required
```

This is the evidence model that makes "AI-assisted delivery in a regulated bank" a defensible statement rather than a risk posture.

---

## Summary: What changes with P5 and P6

| Before | After |
|---|---|
| Telemetry was a gap — partially addressable via pre-commit hook reconstruction | Telemetry is a first-class artefact written by the Web UI harness in real time |
| Inner loop harness was implicitly Copilot Chat | Inner loop harness is explicitly team-choice, by design |
| AC was a documentation convention | AC is the governance closure — the testable output of the outer loop's reasoning |
| Audit evidence was the gate result | Audit evidence is the full JSONL + artefact + gate result chain |
| Platform governance depended on what Copilot Chat exposed | Platform governance is independent of any inner loop tool |

P5 and P6 together mean the platform's governance model is durable against tool changes, harness changes, and model changes. The outer loop is the governed surface. The inner loop is the engineer's surface. The artefact is the contract between them. The JSONL is the proof.

---

*End of document*
