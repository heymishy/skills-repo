# Discovery: Execution Boundary Model and Invocation Telemetry

**Status:** Approved
**Created:** 2026-05-21
**Approved by:** Hamish King — Engineering Lead — 2026-06-14
**Author:** Copilot (discovery session 2026-05-21 — driven by reference document P5/P6 and repo assessment)
**Feature slug:** `2026-05-21-execution-boundary`
**Artefact path:** `artefacts/2026-05-21-execution-boundary/discovery.md`
**Reference materials:** `artefacts/2026-05-21-execution-boundary/reference/ref-skills-platform-execution-boundary.md`

---

## Executive Summary

- **Telemetry gap confirmed:** The Web UI execution engine currently produces zero execution telemetry. Every tool call, thinking block, and standards check the model performs during a skill run is discarded after the response is assembled. The platform can attest that an artefact was written, but not what the model reasoned across to produce it.
- **Architecture gap confirmed:** The inner loop harness is implicitly "VS Code + Copilot Chat" — an emergent default, not a declared design property. No formal execution boundary separates what is governed from what is engineer-autonomous. This ambiguity undermines compliance claims and makes the governance surface dependent on whatever tools GitHub exposes.
- **The fix is one step from the existing infrastructure:** `skill-turn-executor.js` already has an Anthropic direct API path; streaming is explicitly marked "not yet implemented." The telemetry capability requires implementing Anthropic SSE streaming with event capture — no new runtime, no new npm dependency, no structural change to the session model.
- **Phase 5 WS1 + WS2 are this feature:** The Phase 5 roadmap names WS1 (hook event schema) and WS2 (subagent isolation) as planned workstreams. This discovery provides the design intent document (P5 + P6) that those workstreams should implement against, and adds the Claude Agent SDK inner loop extension as an optional Phase 5 WS2 extension.
- **The cloud platform feature creates urgency:** The `2026-05-20-cloud-platform` ideation identifies "tamper-evident audit trail" as one of three MVP capabilities. Without JSONL execution telemetry, that claim cannot be substantiated.

---

## Problem Statement

The skills platform makes governance claims: that skill executions are traceable, that standards were checked, that guardrails were applied, that the acceptance criteria in a DoR artefact derive from the outer loop's reasoning across compliance and architectural context. These claims rest entirely on the instruction set that was injected — not on observable evidence of what happened during execution.

This is a structural gap, not a documentation gap. The Web UI calls the Anthropic API (or Copilot proxy) and receives a response. The model's thinking blocks, tool_use events (which files it read, which standards it checked), and tool_result events (what it found) arrive in the SSE stream and are discarded. The current implementation captures only the final text output. There is no record of the reasoning path.

For a platform consuming team that is not in a regulated environment, this is a quality gap — the improvement loop has less signal to work with. For a platform consuming team in a regulated environment (a bank, a healthcare provider, a government agency), this is a compliance gap: "the model was instructed to check the standard" is a policy claim; "here is the tool_use event showing the model read the standard and the thinking block showing what it concluded" is evidence.

Secondarily: the inner loop is implicitly VS Code + Copilot Chat. No design decision has been recorded saying that the inner loop is deliberately ungoverned by design, that this is a first-class principle, and why. Without that decision, the boundary between what the platform governs and what it does not is ambiguous. Teams in regulated environments need to be able to assert the scope of platform governance to a risk examiner — and currently the platform cannot answer that question cleanly.

---

## Who It Affects

**Platform maintainer (primary):** Currently cannot answer "what did the outer loop model reason across to produce this artefact?" Cannot substantiate governance claims to a risk function with execution evidence. Maintains the improvement loop, which currently has no tool call signal to work with — only artefact text as output.

**Tech lead / squad lead (primary):** When a risk examiner asks "how do I know your AI tool checked the OWASP requirements?", the only answer today is "the SKILL.md file told it to." After this feature: "here is the JSONL showing the tool_use event for the OWASP standards file and the thinking block showing what the model concluded from it."

**Platform operator (SaaS context):** The `2026-05-20-cloud-platform` feature identifies "tamper-evident audit trail" as one of the three MVP capabilities for a commercial product. Without P6 telemetry, this capability cannot be delivered.

**Second-line risk function / compliance reviewer:** Currently has no programmatic evidence of AI execution. Must rely on process claims. After this feature: can query the JSONL log for any skill execution and verify what the model read, what it reasoned, and what the gate evaluated.

---

## Why Now

Three converging triggers make this the right moment:

**1. Infrastructure is one step away.** `skill-turn-executor.js` already has an Anthropic direct API path. The Anthropic path is non-streaming today ("not yet implemented" at line 333). Implementing SSE streaming with `appendFileSync` per event requires no new runtime, no new npm packages beyond Node's built-in `https` module (already in use), and no structural change to the session model. The integration point is already wired.

**2. The cloud platform feature requires it.** The `2026-05-20-cloud-platform` ideation completed all lenses (D, C, E, B) and is ready for `/discovery`. Its MVP definition includes "tamper-evident audit trail." The execution boundary document (P5 + P6) must be designed and the telemetry spine must be built before that feature's discovery can formally commit to the audit trail claim.

**3. Phase 5 WS1 and WS2 are already on the roadmap but have no design reference.** The product roadmap names WS1 (hook event schema) and WS2 (subagent isolation) as Phase 5 planned workstreams. These are the engineering delivery of P5 and P6. Without this discovery and benefit-metric formalizing the design intent, WS1/WS2 start from no documented baseline.

---

## MVP Scope

The minimum viable scope that proves the concept end to end:

**1. Anthropic SSE streaming with JSONL event capture (P6 Tier 1 + Tier 2)**
Implement `_callAnthropicStream()` in `skill-turn-executor.js` — an Anthropic streaming variant that uses the Messages API with `stream: true` and `betas: ["interleaved-thinking-2025-05-14"]`. As each SSE event arrives, call `appendFileSync` to the session JSONL log file. Capture: `skill_invoked` (with model, version, token counts, team, git SHA), `thinking` (model reasoning blocks), `tool_use` (tool name + input), `tool_result` (size, latency), `artefact_written` (name, SHA, size), `gate_evaluated` (result, fidelity score), `skill_complete` (duration, output tokens, rounds). The JSONL file is named `{ISO-timestamp}_{skill}_{teamId}.jsonl` and written to the session directory.

**2. Execution boundary declaration (P5)**
Document the execution boundary as a formal design decision in `product/decisions.md` and `artefacts/2026-05-21-execution-boundary/decisions.md`. The declaration: outer loop is the governed execution surface; inner loop is harness-agnostic by design; the governed artefact is the contract between them; the CI gate checks artefact + AC satisfaction, not tool choice. This is a one-time design decision that makes the governance scope claim auditable.

**3. JSONL committed alongside artefact (P6 integration)**
Modify the skill session write-back flow so that when an artefact is committed to the repo (the existing `completeStage()` path), the JSONL trace file for that execution is also committed alongside it. The file lives at `artefacts/[feature-slug]/traces/[ISO-timestamp]_{skill}.jsonl`. SHA of the JSONL file is recorded in the artefact's front matter or in `pipeline-state.json` under the story entry.

**4. CI artefact upload of JSONL (P6 + 4.B.9 completion)**
Extend the CI assurance gate to upload the JSONL trace file as an individually linkable CI artefact (completing Phase 4 deliverable 4.B.9). The file is uploaded with a stable naming convention so a risk examiner can link directly to the trace for any CI run.

---

## Out of Scope

- **Claude Agent SDK inner loop subprocess** (mentioned in discovery prompt as "P5 extension") — spawning `@anthropic-ai/claude-agent-sdk` as a Web UI subprocess to govern the inner loop via `PreToolUse` / `PostToolUse` hooks is a Phase 5 WS2 extension. It requires a separate spike for SDK maturity assessment, max-iterations guardrail design, and codebase scope bounding. Not part of this discovery's MVP. Out of scope reason: adds significant complexity and a new npm runtime dependency; the core P5 boundary declaration and P6 telemetry are independently valuable and should ship first.
- **Copilot proxy path telemetry** — The Copilot proxy strips thinking blocks. Tier 2 telemetry (thinking blocks) is only achievable on the Anthropic direct API path. The Copilot proxy path will produce Tier 1 telemetry only (invocation metadata, token counts, gate result). Attempting to reconstruct thinking blocks from the proxy path is out of scope; the limitation should be documented rather than worked around.
- **VS Code / Copilot Chat inner loop instrumentation** — A VS Code extension or debug log reader for the inner loop session is explicitly out of scope. P5 formalises that the inner loop is ungoverned by design; instrumenting it would contradict the design property.
- **Tier 3 fleet sweep analytics** — Async cross-team analysis of the Tier 1 log for drift patterns is a Phase 5 WS5 concern. The schema must be designed to support it, but the sweep logic itself is out of scope for this feature.
- **Enterprise fork telemetry parity** — The enterprise fork (Copilot Enterprise proxy, Bitbucket, Rovo Dev) has a different telemetry posture (thinking blocks stripped). Designing a Bitbucket-specific telemetry path is out of scope; the enterprise fork's limitations should be documented in `decisions.md` with a RISK-ACCEPT.
- **Retention, access control, and PII governance for the JSONL log** — A full data governance model for the telemetry store (retention period, PII risk assessment, access control, deletion workflow) is out of scope for Phase 5. The JSONL files are git-committed and treated as delivery artefacts subject to the same retention model as other artefacts. A more rigorous governance model is a Phase 6 WS9 concern (agent identity layer).

---

## Assumptions and Risks

[ASSUMPTION] `@anthropic-ai/claude-agent-sdk` is production-stable enough for regulated use — unconfirmed; requires a spike before Phase 5 WS2 design commit.

[ASSUMPTION] Anthropic's `interleaved-thinking-2025-05-14` beta API is stable and will not be deprecated on short notice — unconfirmed; the beta header model for extended thinking requires verification before committing to it as the telemetry surface.

[ASSUMPTION] Code and context sent via the direct Anthropic API path does not violate the data residency constraints of regulated enterprise consumers — unconfirmed; the enterprise fork must route through Copilot Enterprise proxy; this assumption applies only to the SaaS path.

[ASSUMPTION] The `appendFileSync` write pattern (one line per SSE event) produces a durable JSONL log without truncation risk even when the Node.js process restarts mid-stream — unconfirmed; a session recovery path for partial JSONL files should be designed before production use.

**Confirmed risk — telemetry gap for enterprise Copilot proxy path:** Teams using Copilot Enterprise proxy will receive Tier 1 telemetry only (invocation metadata). Thinking blocks (Tier 2) are unavailable because the proxy strips them. This is not an assumption; it is a known structural limitation. The implication: governance claims made via the JSONL evidence model have different strength depending on the execution path used. This must be documented and the enterprise consumer informed at onboarding time.

**Confirmed risk — outer loop currently non-streaming on Anthropic path:** `_callAnthropic()` in `skill-turn-executor.js` is explicitly non-streaming. Implementing `_callAnthropicStream()` requires testing against the Anthropic streaming SSE format including extended thinking events. The streaming implementation is well-understood (the Copilot path already streams), but the Anthropic-specific event schema (`content_block_start`, `content_block_delta`, `content_block_stop` with `thinking` type) requires specific handling.

---

## Directional Success Indicators

**Governance claim substantiability:**
Baseline: Zero — no execution-level evidence of what the model reasoned across during any outer loop skill run.
Target: 100% of outer loop skill runs on the direct Anthropic API path produce a committed JSONL trace file with at minimum Tier 1 events (skill_invoked, skill_complete, gate_evaluated).
Measured via: presence check on `artefacts/*/traces/*.jsonl` files in CI; gate check that JSONL SHA is recorded in pipeline-state.json.

**Thinking block capture rate (Tier 2):**
Baseline: 0 — thinking blocks are discarded today.
Target: ≥ 90% of Anthropic direct API skill runs capture at least one `thinking` event per run (validates that extended thinking is enabled and the stream captures it correctly).
Measured via: JSONL event type frequency analysis; can be automated via `jq '.event' traces/*.jsonl | sort | uniq -c`.

**Execution boundary decision recorded:**
Baseline: [UNKNOWN BASELINE] — no formal decision exists documenting why the inner loop is ungoverned.
Target: A formal ADR exists in `decisions.md` declaring P5 (execution boundary separation), reviewable by a risk examiner.
Measured via: presence of ADR entry with P5 reference in `artefacts/2026-05-21-execution-boundary/decisions.md`.

**CI trace linkability:**
Baseline: Gate result is linkable to CI run but not to per-invocation execution trace.
Target: Every CI run produces a JSONL artefact upload linked from the gate result comment, meeting Phase 4 deliverable 4.B.9.
Measured via: CI artefact upload step present in assurance gate workflow; link appears in PR comment.

---

## Constraints

**C11 (no persistent agent runtime):** The JSONL writer is stateless — one `appendFileSync` per event; no daemon, no queue, no hosted service. Satisfied by design.

**C12 (credentials structural):** `ANTHROPIC_API_KEY` must not appear in the agent's environment during a skill run. The key is read by `skill-turn-executor.js` at call time from `process.env`; it must not be injected into the model's context or logged in the JSONL file. The JSONL schema explicitly excludes credential fields. Constraint satisfied by existing architecture; JSONL writer must not log `Authorization` headers or `x-api-key` values.

**C3 (spec immutability):** JSONL trace files are evidence, not spec. The improvement loop may read them but may not modify them or use them to propose spec changes. Satisfied by design — JSONL is append-only and committed to `artefacts/*/traces/`, not to `artefacts/*/dor/` or `standards/`.

**C5 (hash verification):** The JSONL file SHA must be recorded in pipeline-state.json at the time of commit. The SHA is the tamper-evidence anchor — if the JSONL file is modified after commit, the recorded SHA will no longer match. This extends the existing hash model (currently applied to SKILL.md files) to execution traces. This is a new constraint extension, not a violation.

**Direct Anthropic API → data residency:** Enterprise consumers with data residency requirements (e.g. regulated Australian or NZ financial institutions) cannot route code context through the Anthropic API (US-based). The SaaS Web UI using direct Anthropic API is valid only for consumers who have accepted this residency posture. The enterprise fork must use Copilot Enterprise proxy (UK/US regional routing) and accept Tier 1-only telemetry. This must be declared in `decisions.md` as an architectural fork, not treated as a configuration option.

**Phase 5 WS1 dependency:** The hook event schema (WS1) and subagent isolation design (WS2) in the Phase 5 roadmap are the correct engineering delivery vehicles for P5 and P6. This discovery is the design reference. The implementation follows the existing Phase 5 workstream sequencing: WS1 before WS2, WS0 distribution track before both.

---

## Current State Findings (from repo assessment)

### `skill-turn-executor.js` — primary integration point

**File:** `src/modules/skill-turn-executor.js`

The module has two provider paths:
- **Copilot path** (`_callCopilot`, `_callCopilotStream`): SSE streaming implemented; captures `choices[].delta.content` text only; thinking blocks are stripped by the Copilot proxy and never reach the harness.
- **Anthropic path** (`_callAnthropic`): Non-streaming; receives complete response JSON; discards response metadata after extracting `content[0].text`; explicitly noted "Anthropic streaming not yet implemented" at line 333.

**The telemetry integration point is `_callAnthropic`.** The streaming variant needs to be implemented here, capturing the full SSE event stream. The existing `_callCopilotStream` provides a reference implementation for the SSE parse loop.

### `execute.js` — outer loop entry point

**File:** `src/web-ui/routes/execute.js`

Delegates to `skillExecutor.executeSkill()` which spawns the Copilot CLI as a subprocess (`child_process.spawn`). This path produces no execution telemetry; stdout/stderr are captured for response assembly only.

The Web UI's turn-based execution path (`skill-turn-executor.js`) is the correct integration surface for P6 — not the CLI subprocess path. The CLI subprocess path is used for skill dispatch; the turn executor is used for model API calls during skill execution.

### Existing JSONL infrastructure — outcome traces, not execution events

**Files:** `src/trace-registry/getTraces.js`, `platform/traces/[squadId]/[storySlug].jsonl`

The existing JSONL format records gate-level outcomes (AC pass rate, story slug, squad, date). These are outcome records — one entry per story, one file per squad. They are not execution event streams. The P6 JSONL is a different schema: one file per skill invocation, one line per SSE event. The two formats should coexist without collision; the P6 files live at `artefacts/[feature-slug]/traces/`, distinct from `platform/traces/`.

### No existing telemetry reconstruction in CI

**File:** `.github/scripts/run-assurance-gate.js`

Writes `inProgress` → `completed` trace entries but these are gate-level state transitions, not execution event capture. No telemetry is reconstructed from artefacts post-hoc. The gap is structural — there is nothing to reconstruct from because the execution events are never written.

### `pipeline-state.json` — per-invocation record absent

Currently records per-story phase transitions and gate results but no per-invocation execution trace reference. The P6 design requires adding a `traceRef` field to the story entry in `pipeline-state.json` pointing to the committed JSONL file — consistent with the `traceRef` field already defined in the `AdapterResult` type contract in `product/tech-stack.md`.

---

## ADR Candidates

**ADR-E1: Outer loop provider routing — direct Anthropic API vs Copilot proxy (telemetry implication)**
The choice of provider determines telemetry depth. Direct Anthropic: Tier 1 + Tier 2 (thinking blocks, tool events). Copilot proxy: Tier 1 only (invocation metadata). This is a deployment-path fork, not a configuration option — the two paths make different governance claims. Not in existing decision log; requires a formal ADR declaring when each path is appropriate and what governance claims each supports.

**ADR-E2: Execution boundary as a first-class design property (P5)**
No existing ADR declares that governance is scoped to the outer loop, that the inner loop is harness-agnostic by design, and why. The existing `decisions.md` contains implementation decisions (adapter wiring, session structure, token field naming). The P5 execution boundary is an architectural principle. It should be recorded as an ADR alongside the existing guardrails in `.github/architecture-guardrails.md`.

**ADR-E3: JSONL execution event stream schema — P6 Tier 1 / Tier 2 field definitions**
The existing outcome trace schema (`platform/traces/`) covers gate-level fields. The P6 schema is different: event type, timestamp, skill invocation metadata, model identity, thinking blocks, tool call details. Field definitions, mandatory fields, and schema ownership must be recorded before implementation begins. Not in existing decision log.

**ADR-E4: Prompt caching strategy for skill/standards content**
Anthropic's prompt caching (`cache_control: {"type": "ephemeral"}`) can reduce outer loop Tier 2 token costs by 60–70% on stable skill/standards content. The caching configuration must be an explicit decision — it affects what is cached, for how long, and whether cached content is included in the Tier 1 token count. Not in existing decision log.

**ADR-E5: Inner loop max-iterations guardrail (for Phase 5 WS2 Claude Agent SDK path)**
If the Claude Agent SDK inner loop is implemented, a max-iterations cap is required to prevent runaway execution on large codebases. The guardrail value, the action on hitting the cap (pause and report vs hard stop), and the cost exposure model must be decisions. Out of scope for this MVP but must be decided before WS2 implementation begins.

---

## Scope Recommendation

**Phase placement:** Phase 5 — this is WS1 (hook event schema) + partial WS2 (execution boundary declaration). It should be sequenced after WS0 (distribution track) is stable but does not depend on it.

**Epic structure:**

*Epic 1 — P6 Tier 1: Invocation metadata spine (smallest viable slice)*
Stories: (a) Implement `_callAnthropicStream()` in `skill-turn-executor.js` with SSE parse loop and JSONL `appendFileSync` for `skill_invoked` + `skill_complete` + `gate_evaluated` events only. (b) Commit JSONL file alongside artefact in the session write-back flow. (c) Record JSONL SHA in `pipeline-state.json` `traceRef` field. (d) CI upload of JSONL as individually linkable artefact (completing 4.B.9). This is the smallest meaningful slice — it proves the concept end to end with Tier 1 events only.

*Epic 2 — P6 Tier 2: Full execution trace*
Stories: (a) Extend JSONL capture to include `thinking` blocks, `tool_use`, and `tool_result` events. (b) Handle `content_block_start` / `content_block_delta` / `content_block_stop` with `thinking` type in the SSE parse loop. (c) Add `fidelity_score` calculation to `gate_evaluated` event (reuse existing eval harness scoring). (d) Test coverage for partial stream / mid-stream failure recovery.

*Epic 3 — P5: Execution boundary declaration and documentation*
Stories: (a) ADR-E1 through ADR-E3 recorded in `decisions.md`. (b) P5 property added to `.github/architecture-guardrails.md`. (c) Consumer documentation: what the JSONL contains, what it does not contain, and what the enterprise Copilot proxy path implications are.

*Epic 4 — Phase 5 WS2: Claude Agent SDK inner loop (gated on SDK maturity spike)*
Out of MVP scope. Requires: spike on `@anthropic-ai/claude-agent-sdk` maturity and stability, ADR-E5 (max-iterations guardrail), and WS0 distribution track stable.

**Smallest viable slice:** Epic 1, stories (a) and (b) only — implementing streaming with Tier 1 events and committing the JSONL alongside the artefact. This proves the concept (stream → JSONL → committed artefact) and is independently valuable as a platform improvement without any dependency on the cloud platform or enterprise consumers.

---

## Risk Register

**Risk 1 — Cost (inner loop Claude Agent SDK)**
Likelihood: Medium (if Epic 4 proceeds without scope bounding). A Claude Agent SDK session running against a large enterprise codebase (e.g. 200,000 LOC) with no context bounding or max-iterations cap could consume $10–50 per story in context tokens — an order of magnitude above the $0.68–$3.00 estimate for bounded scope. Mitigation: Epic 4 is out of scope for Phase 5 MVP; max-iterations cap (ADR-E5) and codebase scope bounding are prerequisites. The cost risk does not apply to Epic 1–3 (telemetry only, no SDK inference).

**Risk 2 — Telemetry gap for enterprise Copilot proxy path**
Likelihood: High (structural, not probabilistic). Enterprise teams routing through Copilot Enterprise proxy will receive Tier 1 telemetry only — invocation metadata, no thinking blocks, no tool events. The governance claims supportable on that path are weaker. Mitigation: Document the limitation explicitly in the ADR (ADR-E1) and in consumer onboarding documentation. Do not make Tier 2 telemetry a mandatory compliance claim; make it a best-available evidence claim conditional on the execution path.

**Risk 3 — Anthropic beta API stability (`interleaved-thinking-2025-05-14`)**
Likelihood: Low-medium. The beta header for extended thinking is an Anthropic beta feature. Anthropic may change the event schema, rename the beta flag, or promote it to stable with a different API shape before Phase 5 WS1 ships. Mitigation: Design the JSONL event capture to be schema-version-aware; include the beta header value in the `skill_invoked` event so the schema version is recorded in the trace. Monitor Anthropic changelog.

**Risk 4 — Data residency (direct Anthropic API)**
Likelihood: High (structural) for enterprise consumers with regulatory data residency requirements. Code context and skill content sent to the direct Anthropic API leaves the consumer's jurisdiction. Mitigation: The enterprise fork must route through Copilot Enterprise proxy regardless of this feature. The SaaS path is only valid for consumers with no data residency constraint. This must be declared in the execution path ADR (ADR-E1) and enforced through `context.yml` `regulated: true` path detection — when `regulated: true`, the execution engine must use the proxy path.

---

## /clarify Recommendation

This discovery contains 4 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] `@anthropic-ai/claude-agent-sdk` is production-stable enough for regulated use — unconfirmed; requires a spike before Phase 5 WS2 design commit.
- [ASSUMPTION] Anthropic's `interleaved-thinking-2025-05-14` beta API is stable and will not be deprecated on short notice — unconfirmed; requires verification before committing to it as the telemetry surface.
- [ASSUMPTION] Code and context sent via the direct Anthropic API path does not violate the data residency constraints of regulated enterprise consumers — unconfirmed; applies only to SaaS path, but scope of "regulated consumers" needs confirmation.
- [ASSUMPTION] The `appendFileSync` write pattern produces a durable JSONL log without truncation risk — unconfirmed; a session recovery path for partial JSONL files should be designed before production use.

---

## Attribution

**Contributors:**
- Hamish King — Platform operator / product owner — 2026-05-21

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

*Produced by /discovery skill — 2026-05-21. Reference materials: `artefacts/2026-05-21-execution-boundary/reference/ref-skills-platform-execution-boundary.md`.*
