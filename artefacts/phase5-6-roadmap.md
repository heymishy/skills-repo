# Phase 5 and Phase 6 Roadmap

**Document type:** Combined roadmap — replaces `phase5-proposal.md` as the planning reference
**Prepared:** 2026-04-21
**Input sources:** `artefacts/phase5-proposal.md` (scoping proposal, 9-finding accuracy review complete), `artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md` (strategic horizon reference)
**Status:** Draft — requires operator review before any story decomposition begins

---

## Summary of changes from the scoping proposal

The `phase5-proposal.md` produced a coherent gap audit (G1–G17) and six workstreams addressing governance harness, subagent isolation, context management, spec integrity, platform intelligence, and human capability. This document retains all of that and adds three material corrections from cross-referencing against the Phase 4 ref doc:

1. **Phase 4 completion work that was missing entirely.** The ref doc identifies Distribution (Theme B remainder) and Non-technical Channel (Theme C) as Phase 4 commitments that are not yet done. The original proposal's WS4 notes a Phase 4 lockfile dependency but provides no workstream to complete it. This document adds **WS0** as a Phase 4 completion track that is a prerequisite for all other Phase 5 work.

2. **Operational domain standards were omitted.** The ref doc explicitly defers 5.R1 (operational domain standards) to Phase 5. The original proposal contained no workstream for it. This document adds it as **WS7** with correct Phase 4 sequencing dependencies.

3. **Policy lifecycle management was demoted too far.** The ref doc identifies 5.R3 (policy lifecycle management, building on Theme F) as a Phase 5 commitment. The original proposal listed it only as a Phase 6 candidate. This document promotes it to Phase 6 entry (first item), conditioned on Theme F being proven in operation during Phase 5.

The sequencing section is substantially rewritten to reflect WS0's blocking role and to incorporate the ref doc's own Phase 5 entry conditions, theme dependencies, and open ADRs.

---

## 1. Opening — What Phase 5 and Phase 6 Deliver

### Phase 5

Phase 4 proves that a shared governance package can mediate agent execution at the invocation boundary for two surfaces (MCP for VS Code and Claude Code; CLI for regulated and CI contexts). It also resolves the three architectural problems that motivated it: distribution and update channel, structural enforcement, and second-line organisational independence. Phase 5 inherits a stable, multi-surface governance package and builds outward from it.

Phase 5 delivers two things in parallel. First, it completes the Phase 4 commitments that did not ship with Phase 4: the package distribution model (versioning, lockfile, conservative pinning, non-git consumers) and the non-technical discipline channel. These are WS0. They are not new scope — they are pre-committed Phase 4 work deferred by the scope narrowing decision that created Phase 4 in the first place. They are the first things to sequence.

Second, it builds the harness infrastructure, isolation mechanisms, context governance, spec integrity, platform intelligence, and human capability layers described in the original scoping proposal. By Phase 5 exit, a senior engineer reviewing the platform can point to a specific enforcement mechanism for every governance property the platform claims. A risk examiner can trace every agent execution to a versioned, hash-pinned instruction set, a specific model version, and a human approval record.

### Phase 6

Phase 6 delivers the capabilities that require Phase 5 observability signals before they can be scoped with confidence: policy lifecycle governance, agent identity, second model review, and federation at enterprise scale. It also closes the OST visualisation and multi-region trace federation items that require Phase 5 platform intelligence to be adopted at sufficient scale before a connected graph has data density. Phase 6 is not speculative — its entry conditions are explicit Phase 5 deliverables.

---

## 2. Gap Audit

The gaps below are drawn from four sources: SOURCE 1 (GitHub Spec Kit analysis), SOURCE 2 (Vistaly / Torres continuous discovery framework), SOURCE 3 (arXiv preprint 2604.14228 — deterministic harness vs. probabilistic instruction analysis of Claude Code), and SOURCE 4 (multi-framework comparison, Harness.io and comparable platforms). Each gap is audited against the current codebase. CLOSED means a specific file provides closing evidence. PARTIAL means the platform addresses some part of the gap but a meaningful portion remains open. CONFIRMED means no current mechanism.

Note: WS0 gaps are Phase 4 completion items, not new Phase 5 gaps. They are listed here for completeness and cross-reference.

| # | Gap | Source | Status | Evidence path |
|---|-----|--------|--------|---------------|
| G0a | Distribution versioning and lockfile: no per-release lockfile with per-skill hash pinning; consumers effectively on an unversioned fork | Phase 4 Theme B remainder | CONFIRMED | `sync-from-upstream.sh/ps1` syncs file-level without version pinning. The assurance gate checks a hash at gate time but no consumer lockfile records which named release the consumer is on. Phase 4 Theme B (4.B.4–4.B.6) committed to deliver this; it is the entry condition for WS4.3 in this proposal. |
| G0b | Non-technical discipline channel: product managers, business analysts, and other non-technical disciplines cannot participate in governed delivery | Phase 4 Theme C | CONFIRMED | The pipeline requires VS Code + git. Phase 4 Theme C committed to deliver an interaction surface for non-technical disciplines. Plain-language gate translation, artefact parity with Theme A surfaces, and discipline-appropriate context injection are all pending. |
| G0c | Operational domain standards: no encoded standards for incident response, change management, capacity planning | Ref doc 5.R1 | CONFIRMED | No SKILL.md or standards file for operational domains. The platform's scope currently covers software delivery disciplines only. Operational domain standards require the same encode→gate→trace pattern as software delivery standards but are blocked on multi-surface distribution (Phase 4) reaching operational teams. |
| G1 | Enforcement tier conflation: SKILL.md instruction and CI enforcement treated as equivalent governance | SOURCE 3 | PARTIAL | Phase 4 governance package begins to separate tiers (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace` per ADR-013) but SKILL.md schema does not declare per-step enforcement tier. No field in `pipeline-state.json` schema distinguishes "deterministically enforced" from "instructionally enforced" steps. |
| G2 | Zero-token hook architecture: no pre-tool, post-tool, or turn-boundary governance hooks during agent execution | SOURCE 3 | CONFIRMED | CI workflows fire at PR event boundaries only: `assurance-gate.yml` fires on PR open and synchronize (pre-merge); `trace-commit.yml` fires post-merge. No hooks fire during agent execution. The improvement agent reads post-hoc traces; it does not intercept execution events. |
| G3 | SkillTool vs. AgentTool split: no isolation boundary between skills running in the agent's primary context and sub-agents with filtered tool access | SOURCE 3 | CONFIRMED | All skills run in the agent's primary context. Phase 4 MCP mechanism scopes context injection but does not spawn isolated sub-agents with separate permission scopes. No sidechain architecture. |
| G4 | Sidechain transcripts: trace record is post-hoc, not a live structural sidechain during execution | SOURCE 3 | CONFIRMED | `workspace/traces/` entries are written after gate evaluation. No live execution sidechain exists. |
| G5 | Graduated compaction: no structural multi-layer context budget management | SOURCE 3 | CONFIRMED | The `/checkpoint` convention at 55% context is an operator instruction. No structural compaction mechanism. No Budget Reduction, Snip, Microcompact, Context Collapse, or Auto-Compact equivalent. |
| G6 | Graduated trust tiers: no mechanism translating work risk to agent permission scope | SOURCE 3 | CONFIRMED | `regulated: true/false` and `complianceProfile: standard/regulated` are declared in the formal `pipeline-state.json` schema. `oversightLevel: low/medium/high` is used extensively in pipeline-state data but is not declared in the JSON schema — it is an informal convention. Neither field controls agent permission scope at execution time. One implicit permission mode applies to all skills and all work types. (WS2 and WS3.3 depend on `oversightLevel` as a formal field; the prerequisite schema change is flagged in WS2.) |
| G7 | Deny-first principle: no capability denial declarations per skill or work type | SOURCE 3 | CONFIRMED | Skills describe what to do; none declare what capabilities are denied. No deny-list equivalent in any SKILL.md or governance gate. |
| G8 | Long-term capability preservation: no mechanism for practitioner comprehension of accumulated agent output | SOURCE 3 | CONFIRMED | No comprehension preservation mechanism, no practitioner review gate targeting human understanding, no comprehension measurement. |
| G9 | Spec drift detection: no ongoing check that implementation state aligns with specification state post-merge | SOURCE 1, SOURCE 4 | CONFIRMED | `validate-trace.sh` validates trace chain integrity. The assurance gate verifies skill hashes at gate time. Neither detects ongoing divergence post-merge. |
| G10 | Automated pre-flight artefact validation: no code-level check of prerequisite artefact presence and structural completeness before the coding agent begins work | SOURCE 1 | PARTIAL | 15 DoR hard blocks (H1-H9, H8-ext, H-E2E, H-NFR, H-NFR-profile, H-NFR2, H-NFR3) require human sign-off. No automated pre-flight check fires at agent-start to validate artefact presence and schema compliance in code. |
| G11 | Assumption-typed discovery gates: no structured assumption cards typed by category that gate delivery when unvalidated | SOURCE 2 | CONFIRMED | `/decisions` logs assumptions in free-form prose. `/spike` handles named unknowns. No structured assumption card schema typed by Desirability, Usability, Feasibility, Viability, Ethical, Scalability, or Legal category. |
| G12 | Bidirectional delivery-to-strategy feedback: no structural mechanism returning delivery actuals to the discovery layer | SOURCE 2 | PARTIAL | `/improve` and `workspace/learnings.md` extract patterns post-merge. No structural mechanism updates discovery-layer artefacts (opportunity scores, assumption card validity) from delivery evidence. |
| G13 | Dynamic checklist composition: DoR checklist is static regardless of work type, domain, or risk context | SOURCE 4 | CONFIRMED | DoR hard blocks H1-H9, H8-ext, H-E2E, H-NFR, H-NFR-profile, H-NFR2, H-NFR3 are static. The `regulated: true` flag activates H-NFR2 and H-NFR3, but checklist composition is hardcoded in the DoR SKILL.md. No domain-sensitive or oversight-level-sensitive composition. |
| G14 | Skill version pinning at consumption point: no per-squad or per-story lockfile pinning of which skill version governed a delivery | SOURCE 4 | PARTIAL | Phase 4 Theme B (4.B.4–4.B.5) is committed to deliver this. Currently, the assurance gate checks a hash at gate time but the hash is not associated with a named version in a consumer lockfile. Depends on G0a completion. |
| G15 | Iteration cap and doom loop detection: no structural limit on repeated failed execution cycles | SOURCE 4 | CONFIRMED | No skill includes an iteration cap. No CI script or governance gate detects a story stuck in a repeated failure cycle. `/systematic-debugging` is invoked by the operator; it is not triggered automatically when a failure threshold is reached. |
| G16 | Trace data as platform intelligence source: cross-team trace aggregation and derivation of improvement signals at scale | SOURCE 4 | PARTIAL | The improvement agent reads local traces for failure and staleness signals. `fleet-aggregator.js` reads squad data from `fleet/squads/*.json` and writes the aggregated `fleet-state.json`. Cross-team trace registry is aspirational — noted in `ref-skills-platform-phase4-5.md` as a Phase 5 condition. No queryable trace interface across multiple consumer squads. |
| G17 | Brownfield onboarding: no explicit path for teams starting with work already in progress | SOURCE 4 | PARTIAL | `retrospective-story.md` template exists for retroactive chain creation. A "designs-in-hand" workflow variant is referenced in pipeline documentation. No explicit guided onboarding path starting from a partly-built codebase with partial artefacts. |
| G18 | Session delta vs persistent knowledge split: implementation decisions do not update the governing spec artefacts. Specs treated as session artefacts — rather than a persistent truth layer updated by implementation learnings — produce spec-to-reality drift that is undetected until a later story discovers conflicting assumptions. | SOURCE 3 (Spec Kit community finding) | PARTIAL | WS5.2 (delivery-to-assumption feedback) closes this gap for assumption cards in the discovery artefact — delivery evidence updates assumption card status. The general case remains open: implementation decisions that contradict or extend ACs, out-of-scope changes that become canonical behaviour, and benefit metric targets that no longer reflect what shipped have no structural update mechanism. This is by design per product constraint 3 (spec immutability: the improvement loop hill-climbs delivery machinery toward the spec, not vice versa). The gap is the absence of a human-mediated spec review signal triggered by delivery evidence — distinct from the automated improvement loop. Phase scope: G18 is a named Phase 5 gap; closing the general case is a Phase 6 candidate conditioned on WS5.2 adoption proving the assumption-card pattern at scale. |
| G19 | Instruction assembly record: no deliverable records the exact instruction text assembled and injected at invocation time. WS4.3 closes the hash verification gap (SKILL.md file matches the lockfile hash). WS3.2 closes the context injection record (which artefacts were in scope). Neither records the verbatim assembled instruction text the agent received. | SOURCE 3 (regulator replay requirement) | CONFIRMED (intentionally deferred) | For a regulator replaying exactly what the agent was told to do — not just which files governed it but what they said — the current trace record is insufficient. The gap is intentionally deferred: storing verbatim assembled instruction text per invocation is expensive at fleet scale and raises data governance questions (instruction text may reference personal data present in artefacts injected into context). Named here as a known gap rather than left implicit. Phase scope: Phase 6 candidate, conditioned on WS9 (agent identity layer) defining the data retention and pseudonymisation model for per-invocation records before verbatim instruction text storage is designed. |

---

## 3. Workstream Proposals

Twelve workstreams are proposed across Phase 5 and Phase 6. WS0 is Phase 4 completion; WS1–WS6 are Phase 5 new build; WS7 is Phase 5 operational domains; WS8 onwards are Phase 6.

Classification codes:
- ADDITIVE: adds capability without changing existing interfaces or schemas
- SCHEMA CHANGE: requires a field addition to `pipeline-state.json` schema (governed by ADR-003)
- ARCHITECTURAL: changes how a component is structured without breaking existing consumers
- BREAKING: changes a public interface in a way that requires consumer migration

---

### Workstream WS0 — Phase 4 Completion (Distribution + Non-technical Channel)

**Phase:** Phase 5 (executes first — blocks all other WS)
**Gaps closed:** G0a (distribution versioning and lockfile), G0b (non-technical discipline channel)
**Phase 4 derivation:** Theme B deliverables 4.B.4–4.B.9 and Theme C deliverables 4.C.1–4.C.4, all committed in the Phase 4 ref doc but deferred when Phase 4 was narrowed to architectural survival priorities.

**Why this is first:** WS1 hook events require Phase 4 governance package stability. WS4.2 and WS4.3 depend on the Phase 4 lockfile model being implemented. WS5.3 depends on Phase 4 fleet aggregation. WS6.1 benefits from Theme C being delivered. Without WS0 complete, six of the seven remaining workstreams begin with at least one unmet dependency. Sequencing WS0 as a blocking first track is not a risk mitigation choice — it is the correct dependency-ordered execution.

**Phase 4 dependency:** Phase 4 Themes A and F must be stable before WS0 delivery work begins. Spike B1 verdict and Spike D (interaction model for non-technical disciplines) must be complete before WS0 can be fully scoped.

| Deliverable | Description | Classification | Ref doc source |
|-------------|-------------|----------------|----------------|
| WS0.1 | Package format and versioning: per-release lockfile with per-skill hash pinning. Consumers are explicitly on release vX.Y.Z, not "a fork that hasn't synced." Conservative pinning (staying on older release for stability) is a first-class option. | ARCHITECTURAL | 4.B.4 |
| WS0.2 | `upgrade` command with lockfile-diff visibility: consumer sees exactly what changes before accepting the upgrade. | ADDITIVE | 4.B.5 |
| WS0.3 | Upstream authority model: resolves whether `heymishy/skills-repo` is the authoritative upstream for the distribution model, or the productisation fork remains the publishing source. | ARCHITECTURAL | 4.B.6 |
| WS0.4 | Non-git consumer distribution: skills and standards reach channel adapters without direct git access (Teams bot backend, Foundry deployment, Confluence integration). | ARCHITECTURAL | 4.B.7 |
| WS0.5 | Phase 3 consumer migration path: operators who have wired `skills-upstream` remotes move to the Phase 4 model without breaking existing installs. | ADDITIVE | 4.B.8 |
| WS0.6 | CI-native artefact attachment: at assurance gate pass, CI uploads the full artefact chain as individually named files to the CI artefact store. An issue tracker post links to the summary. Non-technical operator or auditor reaches the full chain in two clicks — no git access, no tooling. | ADDITIVE | 4.B.9 |
| WS0.7 | Interaction surface for non-technical disciplines: channel and interaction model for product managers, business analysts, and other non-technical disciplines. Governed by Spike D output. | ARCHITECTURAL | 4.C.1 |
| WS0.8 | Plain-language gate translation layer: DoR hard blocks expressed as discipline-appropriate questions for non-technical channel users. | ADDITIVE | 4.C.2 |
| WS0.9 | Artefact parity: chain produced via the non-technical channel is structurally identical to chain produced via Theme A surfaces. | ADDITIVE | 4.C.3 |
| WS0.10 | Discipline standards injection: discipline standards (product management, business analysis, regulatory, design) injected into the non-technical surface at DoR boundary. | ADDITIVE | 4.C.4 |

**What WS0 is not:** WS0 does not redesign the governance package or add hook events. It completes committed Phase 4 work. If Phase 4 Theme B and Theme C are delivered as part of Phase 4 proper (i.e., Phase 4 timeline is extended to include them), WS0 collapses and Phase 5 begins directly at WS1. WS0 exists because the Phase 4 scope narrowing created a residual.

---

### Workstream WS1 — Harness Infrastructure

**Phase:** Phase 5 (starts after WS0.1–WS0.3 stable)
**Gaps closed:** G1 (enforcement tier conflation), G2 (hook architecture), G5 (graduated compaction)
**Ref doc derivation:** 5.E (agent behaviour observability — intermediate trace events at skill-step boundaries during execution)

**Phase 4 dependency:** Requires Phase 4 Theme A governance package (ADR-013) to be stable before adding hook events. Hook events at the MCP tool boundary depend on `p4-enf-mcp` being delivered and proven. CLI-surface hooks depend on `p4-enf-cli` being delivered. WS0.1 must be complete because WS1.4's hook consumer interface is invoked from lockfile-pinned skill content.

**Rationale:** Phase 4 proves structural enforcement at the invocation boundary. Phase 5 WS1 exposes intermediate execution events — not just invocation entry and gate exit — so the improvement loop and the operator have a richer in-flight signal. The ref doc's 5.E theme (agent behaviour observability) maps directly: behavioural deviation signal from intermediate trace events feeds the improvement agent with the kind of within-invocation evidence that the Phase 3 winging-it failure mode would have surfaced in real time.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS1.1 | Hook event schema: pre-tool, post-tool, turn-start, turn-end, session-start, session-end as a typed event vocabulary recorded by the governance package | SCHEMA CHANGE |
| WS1.2 | Enforcement tier declaration field in SKILL.md: each step declares `enforcement: structural` or `enforcement: instructional` — the governance package records this field in the trace entry at invocation time | ARCHITECTURAL |
| WS1.3 | Structural multi-layer context budget management: automated snip and microcompact triggers driven by the governance package's session state, not by operator judgment alone. Operator retains override capability. | ARCHITECTURAL |
| WS1.4 | Hook event consumer interface: a defined interface allowing governance gate scripts to subscribe to specific hook events (pre-tool: validate file-access scope; post-tool: record evidence field) without modifying governance package internals | ADDITIVE |

**What WS1 is not:** WS1 does not redesign CI workflows. The existing `assurance-gate.yml`, `trace-commit.yml`, and `trace-validation.yml` continue to function. Hook events augment — they do not replace — the PR-boundary gate.

---

### Workstream WS2 — Subagent Isolation

**Phase:** Phase 5 (after WS1.1 complete; gated on Spike B1 verdict)
**Gaps closed:** G3 (SkillTool vs. AgentTool split), G4 (sidechain transcripts), G6 (graduated trust tiers), G7 (deny-first principle)

**Phase 4 dependency:** Requires Spike B1 verdict on whether the MCP boundary is genuinely structural. If B1 finds the boundary bypassable, WS2 scopes to CLI-only for isolation guarantees. Requires WS1.1 hook events.

**Rationale:** The platform treats every skill invocation as equivalent: same agent, same tool access, same permission scope. A hash-verification step and a coding task with git write access run in the same context. WS2 closes this conflation with a deny-list model, sidechain transcripts that capture intermediate execution, and permission tier declaration in `context.yml` keyed to formal `oversightLevel` schema (see prerequisite below).

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS2.1 | Capability manifest: each SKILL.md declares the capabilities it requires (file-read, file-write, test-execution, git-read, git-write, external-tool-call). The governance package validates the declared set at invocation time against the current operating context's permission tier. | SCHEMA CHANGE |
| WS2.2 | Deny-list enforcement: governance package rejects skill invocations whose capability manifest includes capabilities not granted by the current permission tier. Denial is logged in the trace with the permission tier in effect at invocation time. | ARCHITECTURAL |
| WS2.3 | Structural sidechain transcript: governance package opens a sidechain log at invocation start and closes it at invocation end. The sidechain records intermediate tool calls and turn events (from WS1.1 hook events). The sidechain is a separate file from the post-hoc trace, written during execution and read-only after invocation end. | ARCHITECTURAL |
| WS2.4 | Permission tier declaration in context.yml: operators declare the default permission tier per surface type (VS Code: tier 2, CI: tier 1, regulated: tier 0) and the escalation approval path for tier promotions. No hardcoded tier values in governance package internals. | ADDITIVE |

**Prerequisite schema change:** WS2.2 (permission tier matching) and WS3.3 (practitioner gate keyed to `oversightLevel: high`) both depend on `oversightLevel: low/medium/high` being a formally declared field in the `pipeline-state.json` schema. It is currently an informal convention present in pipeline-state data but absent from the JSON schema. Promoting it to a declared schema field is an implicit SCHEMA CHANGE that must be included in the Phase 5 schema evolution sprint (see R3).

**What WS2 is not:** WS2 does not introduce a hosted runtime or a persistent agent process. All isolation is per-invocation, local, and reversible at the governance package level.

---

### Workstream WS3 — Context Governance

**Phase:** Phase 5 (WS3.3 and WS3.4 can begin in parallel with WS1 MVP; WS3.1 and WS3.2 follow WS1.1)
**Gaps closed:** G5 (graduated compaction — partially, with WS1.3 covering the structural mechanism), G6 (graduated trust tiers — trust tier declaration in `context.yml`), G8 (long-term capability preservation)

**Ref doc derivation:** Ref doc C14 (compaction management) as a design dimension and 5.E observability as the signal source for automated triggers.

**Phase 4 dependency:** None beyond Phase 4 being stable. WS3.4 formalises the `/checkpoint` convention, which remains useful regardless of Phase 4 delivery order.

**Rationale:** Context budget exhaustion is currently managed by operator convention. This is appropriate where the operator is present and experienced. It is not appropriate for regulated enterprise contexts where auditors require a deterministic record of what context was in scope at each invocation.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS3.1 | Context scope declaration: each skill step declares its context scope — which artefact types it expects to have in context, which it explicitly excludes, and the maximum context budget it is designed to operate within. The governance package injects context in accordance with the declared scope, not by passing the full session history. | ARCHITECTURAL |
| WS3.2 | Context boundary trace record: at each invocation, the governance package records the context scope that was injected (artefact list, token count estimate, exclusions) as a field in the trace entry. Auditors and operators can replay what the agent saw at invocation time. | SCHEMA CHANGE |
| WS3.3 | Practitioner review gate: a lightweight review step — distinct from the DoR sign-off and distinct from the DoD — that asks a named practitioner to confirm they can describe the key decisions made and the approach taken. The gate produces a one-field evidence record (`practitionerReviewStatus`) in the feature's pipeline state. Optional per feature, controlled by an `oversightLevel: high` flag or a per-feature opt-in in context.yml. | SCHEMA CHANGE |
| WS3.4 | Session continuity protocol: formalises the current `/checkpoint` convention as a governed protocol with a structured output schema, automated trigger conditions derived from WS1.1 hook events, and a recovery test that validates session resumption produces a deterministic result from the checkpoint. | ARCHITECTURAL |

---

### Workstream WS4 — Spec Integrity

**Phase:** Phase 5 MVP (second track alongside WS1, or immediately after WS0)
**Gaps closed:** G9 (spec drift detection), G10 (pre-flight artefact validation), G14 (skill version pinning), G15 (iteration cap and doom loop detection)
**Ref doc derivation:** 5.F (skills drift observability — divergence detection between platform skill versions and consuming squad running versions)

**Phase 4 dependency:** G14 (skill version pinning) directly extends Phase 4 Theme B / WS0.1. WS4.2 (lockfile-backed pre-flight) depends on WS0.1 lockfile design being finalised. WS4.1 and WS4.4 are independent of WS0 and can begin in parallel.

**Rationale:** The platform's current quality guarantee is a point-in-time gate. Neither the assurance gate nor the validate-trace script detects ongoing divergence after merge. WS4.1 closes the spec drift gap (5.F from the ref doc) with a scheduled CI check. WS4.3 (lockfile hash assertion) is the enforcement leg of the distribution versioning WS0.1 delivers.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS4.1 | Spec drift detection: a scheduled CI job that compares the governing story artefact's AC list against the current artefact chain and reports divergence as a flagged finding in `pipeline-state.json`. Divergence is a warning signal requiring operator acknowledgement, not a hard block. | ADDITIVE |
| WS4.2 | Automated pre-flight artefact validation: a Node.js check (following the pattern of existing `tests/check-*.js` scripts) that fires at agent-start — before any file modification — and validates the presence and structural completeness of all artefacts named in the DoR contract. Returns a machine-readable verdict. The coding agent blocks on a non-PASS verdict. | ADDITIVE |
| WS4.3 | Lockfile-backed skill hash assertion: at agent invocation, the governance package reads the consumer's lockfile (WS0.1 output) and asserts that the skill hash in the lockfile matches the hash of the SKILL.md file at the resolved path. A hash mismatch produces a hard block. The check is an extension to `resolveAndVerifySkill` (ADR-013). | ARCHITECTURAL |
| WS4.4 | Iteration cap and doom loop detection: the governance package records per-story attempt counts in `pipeline-state.json`. When the attempt count exceeds a configurable threshold (default: 3, operator-configurable in context.yml), the governance package emits a `doomLoopWarning` event (using the WS1.1 hook schema). The operator must explicitly reset the count to continue. | SCHEMA CHANGE |

---

### Workstream WS5 — Platform Intelligence

**Phase:** Phase 5 (WS5.1 and WS5.2 in parallel with WS1 MVP; WS5.3 and WS5.4 require WS0.4 and WS1.1)
**Gaps closed:** G11 (assumption-typed discovery gates), G12 (bidirectional delivery-to-strategy feedback), G16 (trace data as platform intelligence source)
**Ref doc derivation:** 5.H (cross-team trace registry — resolving the ADR-004 tension), cross-team failure pattern aggregation, standards autoresearch

**Phase 4 dependency:** G16 (cross-team trace aggregation) depends on WS0.4 (non-git consumer distribution) and the Phase 4 audit evidence model (4.B.9 / WS0.6) being available. G11 and G12 have no hard Phase 4 dependency but benefit from WS1 hook events providing richer trace signals.

**Rationale:** The platform produces a substantial volume of governed trace data. WS5 closes the gap identified in the ref doc's Phase 5 section: turning trace data from a compliance record into a platform intelligence source. WS5.3 specifically resolves ADR-004 (cross-team trace registry tension) identified in the Phase 3-4 reference doc.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS5.1 | Assumption card schema: a typed assumption record format — category (Desirability, Usability, Feasibility, Viability, Ethical, Scalability, Legal), status (untested, in-test, validated, invalidated), and evidence pointer — added to the discovery artefact schema and exposed as an optional section in the discovery artefact template. | SCHEMA CHANGE |
| WS5.2 | Delivery-to-assumption feedback: a post-DoD step (extending `/definition-of-done`) that identifies whether the completed story provided evidence relevant to any `in-test` assumption in the parent feature's discovery artefact, and records the evidence pointer and a status update. Closes the bidirectional feedback loop from delivery to discovery. | ADDITIVE |
| WS5.3 | Cross-team trace query interface: a query layer on top of the `fleet-aggregator.js` and improvement agent infrastructure that allows platform operators to ask structured questions across squad traces: failure rate by skill, spec drift frequency by feature type, doom loop incidence by oversight level. Local Node.js script consuming fleet-aggregated trace data — no hosted service, consistent with ADR-012. Resolves ADR-004 tension from the Phase 3-4 reference doc. | ADDITIVE |
| WS5.4 | Improvement signal derivation: the improvement agent's challenger generation step gains an automatic trigger when the WS5.3 query interface detects a cross-team pattern exceeding a configurable threshold (e.g. 3+ squads failing the same skill step in a rolling period). Threshold and period are operator-configured in context.yml under the existing `instrumentation` block. | ADDITIVE |

**What WS5 is not:** WS5 does not implement Opportunity Solution Tree visualisation (Phase 6 candidate), continuous discovery tooling, or a product strategy layer. It does not replace Jira, Confluence, or project management tooling (roadmap exclusion).

---

### Workstream WS6 — Human Capability

**Phase:** Phase 5 (fully independent of Phase 4; WS6.1 benefits from but is not blocked on WS0.7–WS0.10)
**Gaps closed:** G8 (long-term capability preservation — partially, with WS3.3 covering the practitioner review gate), G13 (dynamic checklist composition), G17 (brownfield onboarding)

**Phase 4 dependency:** G13 (dynamic checklist composition) benefits from Phase 4 Theme C being delivered first, because dynamic composition is most useful when multiple discipline contexts apply different checklist subsets. WS6 can proceed independently of Themes A and B.

**Rationale:** The DoR hard block checklist is a strength of the platform — unambiguous and consistently applied. It is also a friction source when engineering-specific checks apply to non-engineering work, or a regulated-context checklist applies to a trivial bug fix. WS6 makes composition declarative without weakening the governance guarantee.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS6.1 | Dynamic DoR checklist composition: DoR hard blocks decomposed into tagged blocks (`tag: engineering`, `tag: regulated`, `tag: product`, `tag: architecture`, `tag: security`). The context.yml compliance profile and the story's declared domain determine which tagged blocks are included. Composition rules are declared in context.yml, not hardcoded in SKILL.md. The default composition matches the current static list exactly — no existing behaviour changes by default. | ARCHITECTURAL |
| WS6.2 | Brownfield onboarding path: a guided sub-skill invoked when `workspace/state.json` is absent and `artefacts/` contains partial or absent artefacts for in-progress work. Walks the operator through backcasting the artefact chain. Extends the existing `retrospective-story.md` template with a step-by-step operator protocol. | ADDITIVE |
| WS6.3 | Maturity-gated skill disclosure: new operators see a reduced initial skill set (discovery, definition, test-plan, DoR, tdd, verify-completion) rather than the full skill library. Additional skills become available as teams complete a configurable number of delivery cycles. The disclosure threshold is configured in context.yml. Existing operators see no change. | ADDITIVE |
| WS6.4 | Comprehension checkpoints: a lightweight post-delivery question set (3–5 questions) that any named team member can complete after DoD to record whether they understand what was delivered, why key decisions were made, and how to operate the delivered capability. Responses recorded in `comprehension-log.md` in the feature's artefact folder. Opt-in per feature; produces no hard block. WS3.3 produces a pipeline evidence record; WS6.4 produces a learning record. Both are necessary — one is governance, one is capability development. | ADDITIVE |

---

### Workstream WS7 — Operational Domain Standards

**Phase:** Phase 5 (can begin design in parallel with WS0; delivery sequenced after WS0 reaches non-technical surfaces)
**Gaps closed:** G0c (operational domain standards)
**Ref doc derivation:** 5.R1 — Incident response, change management, capacity planning deferred from Phase 4.

**Phase 4 dependency:** Operational domain standards for non-technical workflows (change management sign-off, incident response coordination) require the non-technical channel (WS0.7–WS0.10) to reach operational participants. Standards for technical operational domains (automated incident response, capacity planning) can be delivered via the CLI mechanism and do not require WS0.7.

**Rationale:** The platform's role in operational domains is identical to software delivery — encode the standard, gate against it, produce the trace. The ref doc explicitly notes that Phase 4's multi-mechanism architecture means operational domains can be delivered via CLI (for technical incident response) and the non-technical channel (for change management sign-off) simultaneously. The discipline is the same; the channel selection depends on WS0.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS7.1 | Incident response standards: encode the organisation's incident response procedure as a SKILL.md with a structured gate (severity classification, escalation path, communication record, timeline trace). CLI mechanism. | ADDITIVE |
| WS7.2 | Change management standards: encode the change management procedure as a SKILL.md. Integrates with Theme F (assurance agent second-line independence) and the non-technical channel for change advisory board sign-off. Replaces the manual Change Request body that `/release` currently generates with a governed, gate-backed equivalent. | ADDITIVE |
| WS7.3 | Capacity planning standards: encode capacity planning review as a skill with a structured output (demand forecast, resource inventory, gap analysis). Integrates with the existing `/estimate` skill's `estimation-norms.md` signal. | ADDITIVE |

**What WS7 is not:** WS7 does not replace ServiceNow, PagerDuty, or capacity management tooling (roadmap exclusion). It governs the discipline-side procedure that coordinates with those tools — the same relationship as the platform to Jira and Confluence.

---

## 4. Phase 6 Workstreams

Phase 6 takes the Phase 5 observability signals, harness stability, and platform intelligence infrastructure and builds the capabilities that require them. None of these are speculative — each has an explicit entry condition derived from Phase 5 deliverables.

---

### Workstream WS8 — Policy Lifecycle Management (Phase 6, entry item)

**Ref doc derivation:** 5.R3 — Governed lifecycle for POLICY.md floor changes.
**Entry condition:** Phase 4 Theme F (second-line organisational independence) proven in operation through at least one full release cycle. Phase 5 WS5.4 improvement signal derivation delivered, because the same CoP co-ownership model governs both assurance-gate SKILL.md changes and POLICY.md floor proposals.

**Rationale:** Theme F delivers the governance structure that makes credible second-line independence claims possible — a risk function or independent CoP as co-owner of assurance-gate SKILL.md changes. 5.R3 extends the same governance structure to POLICY.md floor changes: proposals surface from improvement agent signals (via WS5.4), CoP co-owners review against the three-tier standards model, staged rollout with measurement, and retire-or-promote decision with audit trail. Without WS5.4, the proposals have no automated signal source. Without Theme F being proven in operation, the CoP co-ownership model has no established practice to build on.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS8.1 | POLICY.md floor change lifecycle: proposal → CoP review → staged rollout → measurement gate → retire or promote. Produces a governed audit trail at each stage. | ARCHITECTURAL |
| WS8.2 | Improvement agent integration: proposals from WS5.4 cross-team improvement signals trigger WS8.1 lifecycle automatically when a recurring standards exception exceeds threshold. Human approval gate at every stage (C4). | ADDITIVE |
| WS8.3 | Standards autoresearch: extends the Phase 3 autoresearch loop — which operates on SKILL.md content against a fixed EVAL.md harness using an LLM judge — to operate additionally on POLICY.md floor content. Recurring standards exceptions across squads surface as proposed CoP co-owner adjustments via the same challenger pre-check and human approval gate that governs SKILL.md proposals. Anti-overfitting uses the same mechanism as Phase 3: self-reflection gate at squad and cross-team level, with the platform-level eval suite as the regression anchor. The Phase 3 loop is the mechanism; WS8.3 adds POLICY.md as a second content type it governs, alongside the existing SKILL.md target. Entry condition: Phase 3 autoresearch loop operational. | ADDITIVE |

---

### Workstream WS9 — Agent Identity Layer

**Ref doc derivation:** 5.R2 — Signed execution identity per agent run traceable to model version and instruction-set version.
**Entry condition:** Phase 5 WS1 sidechain transcript (WS2.3) and WS4.3 lockfile model stable. Phase 4 Theme F proven in operation. Phase 5 WS5.3 cross-team trace query interface delivered.

**Rationale:** The ref doc identifies 5.R2 as the capability that closes the regulator audit chain — combined with Theme F second-line independence. Without WS2.3 (sidechain transcript), there is no intermediate execution record to attach identity to. Without WS4.3 (lockfile hash assertion), the instruction-set version cannot be verified at invocation time. Without WS5.3, the identity record cannot be queried cross-team to attribute failure patterns to model version changes.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS9.1 | Execution identity record: each skill invocation produces a signed identity record: model version, instruction-set version (from WS4.3 lockfile hash), timestamp, execution surface. Written to the sidechain transcript (WS2.3). | SCHEMA CHANGE |
| WS9.2 | Model version attribution in improvement signals: WS5.3 and WS5.4 queries gain a model-version dimension — failure rate by model version, doom loop incidence by model version. Enables the platform to detect when a model upgrade introduces behavioural regression. | ADDITIVE |

---

### Workstream WS10 — Second Model Review

**Ref doc derivation:** 5.G — Challenger evaluation at pipeline boundaries. Independent signal for the human approver; not an automated gate.
**Entry condition:** Phase 6 WS9 (agent identity) delivered. Phase 5 WS1.4 (hook consumer interface) delivering challenger trigger hooks.

**Rationale:** The ref doc explicitly conditions 5.G on agent identity (5.R2) for attribution. Without WS9, the second model's response cannot be attributed to a specific model version and therefore cannot be compared across executions. This is a genuine Phase 6 item — not scope creep, not a stretch goal.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS10.1 | Challenger trigger: at DoR sign-off boundary, an optional second model run produces an independent assessment of the story's ACs and risks. The human approver sees both assessments before signing off. The challenger does not block the pipeline — it informs the human approver. | ADDITIVE |
| WS10.2 | Challenger calibration: over time, the improvement agent tracks divergence between primary and challenger assessments and flags when the divergence pattern indicates consistent primary model blind spots. | ADDITIVE |

---

### Workstream WS11 — Enterprise Federation and Multi-Region Trace

**Ref doc derivation:** 5.H (cross-team trace registry at enterprise scale) plus cross-organisation aggregation.
**Entry condition:** Phase 5 WS5.3 cross-team trace query interface delivered and adopted by multiple squads. Phase 5 WS9.1 agent identity record resolving data governance obligations (author-traceable fields) before federation.

**Rationale:** WS5.3 delivers the local fleet-aggregated query interface. WS11 extends to cross-organisation and multi-region federation. The ref doc identifies a formal data governance model for inter-organisation sharing as a prerequisite — this requires WS9.1 to have defined which fields are author-traceable so that pseudonymisation rules can be designed before federation.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS11.1 | Cross-organisation trace federation: platform-level benchmarking queries across multiple consumer organisations' trace registries. Data governance model for inter-organisation sharing with explicit pseudonymisation of author-traceable fields. | ARCHITECTURAL |
| WS11.2 | OST visualisation: Opportunity Solution Tree connected graph model from SOURCE 2. Requires WS5 assumption card schema adopted at scale (minimum: 3 teams, 5 features each with assumption cards and delivery feedback) before a connected graph has sufficient data density to be useful. | ADDITIVE |

---

## 5. Risk Register

| # | Risk statement | Workstream | Likelihood | Impact | Mitigation |
|---|----------------|------------|------------|--------|------------|
| R1 | WS0 delayed by Spike B1 and Spike D being incomplete: WS0.7–WS0.10 (non-technical channel) cannot be scoped until Spike D produces an interaction model recommendation | WS0 | Medium — Spikes B1 and D are Phase 4 items; their completion depends on Phase 4 timeline | High — WS0.7 blockage delays WS5.3, WS6.1, WS7.2 which depend on multi-surface distribution | Treat WS0.1–WS0.6 (distribution versioning and CI attachment) as a separable first track that can complete without Spike D output. Begin WS0.7–WS0.10 only when Spike D is complete. WS0 partial delivery unblocks most of Phase 5. |
| R2 | Phase 4 Spike B1 finds MCP boundary is bypassable | WS2 | Medium — B1 is flagged as a critical open question in the Phase 4 ref doc | High — WS2 scope and classification changes for the two largest interaction surfaces | Design WS2 deliverables with explicit CLI-fallback paths. If B1 resolves unfavourably, WS2.1 and WS2.2 remain valid for CLI-mediated surfaces. |
| R3 | Schema proliferation: WS1.1, WS2.1, WS3.2, WS4.4, WS5.1 each require schema changes; the WS2 prerequisite formalisation of `oversightLevel` adds a sixth implicit schema change. Multiple simultaneous schema changes increase the risk of ADR-003 violations and consumer breakage | WS1–WS5 | High — five named SCHEMA CHANGE deliverables plus one prerequisite schema change | Medium — schema changes are additive (new fields only) so existing consumers should not break; but schema proliferation degrades readability | Batch schema changes per workstream. Define a Phase 5 schema evolution sprint at the start of the phase that designs all required fields and their interdependencies before any implementation begins. Enforce ADR-003 strictly for Phase 5. |
| R4 | Governance package interface instability: if Phase 4's shared governance package (ADR-013) undergoes interface changes during Phase 5, all workstreams that call through it (WS1, WS2, WS4.3) accumulate rework | WS1, WS2, WS4 | Medium — Phase 4 governance package is new and not yet proven stable across two surfaces | High — interface churn during WS1-WS4 implementation is expensive | Phase 5 entry condition explicitly requires Phase 4 governance package to be stable with multiple squads consuming before WS1 stories begin. |
| R5 | Assumption card adoption failure: WS5.1 adds assumption cards to the discovery artefact schema, but adoption depends on operators completing them | WS5 | Medium — optional fields are routinely skipped in the current pipeline | Medium — WS5 produces reduced value if adoption is low, but causes no harm and creates no regression | Make assumption card population a soft prompt (W-class warning, not H-class block) at benefit-metric sign-off for features with a measurable user impact claim. Configurable per team in context.yml. |
| R6 | Dynamic checklist composition creates undetected compliance gaps: a team's context.yml composition rules exclude a block the regulator considers mandatory | WS6 | Low — default composition matches current static list; gaps require active misconfiguration | High — a missed compliance check in a regulated context is a material governance failure | The `regulated` compliance profile locks the full H-NFR, H-NFR2, H-NFR3, and H-architecture block set. These blocks cannot be excluded by context.yml rules. |
| R7 | Cross-team trace aggregation introduces data governance obligations: cross-team trace data may contain personally identifiable information subject to data protection obligations | WS5, WS11 | Low to medium — depends on regulatory jurisdiction | High — data protection non-compliance is a material risk in a regulated enterprise | WS5.3 explicitly documents the personal data categories that may appear in trace data and provides a configuration option to pseudonymise or exclude author-traceable fields before aggregation. WS9.1 (agent identity) defines the pseudonymisation model before WS11 federation. |
| R8 | Practitioner review gate becomes a bottleneck: WS3.3 introduces a human review step gated on a named practitioner | WS3 | Low — the gate is opt-in per feature, controlled by context.yml | Medium — if adopted widely under time pressure, the gate creates a bottleneck that undermines operator confidence | Document clearly that the gate is intended for high-oversight features only. Provide a configurable timeout after which the gate auto-passes with a logged warning if no practitioner response is received. Auto-pass with warning is never available in the `regulated` compliance profile. |
| R9 | WS7 operational domain standards adopted without multi-surface reach: if WS0.7–WS0.10 (non-technical channel) is delayed, WS7.2 (change management standards) cannot reach change advisory board participants | WS7 | Medium — WS0 delivery is on the critical path for WS7.2 | Medium — WS7.1 and WS7.3 are deliverable without the non-technical channel; WS7.2 is not | Sequence WS7.1 (incident response) and WS7.3 (capacity planning) ahead of WS7.2 (change management). WS7.2 delivery is gated on WS0.7 being stable. |
| R10 | Platform investment return risk: if agentic AI delivery returns prove substantially lower than projected at the portfolio level — for reasons independent of governance quality — the case for continued platform investment weakens | All | Low — this is a portfolio-level strategic signal, not a technical delivery risk; the platform's Phase 4 benefit-metric is the leading indicator | High — a sustained return shortfall would trigger a build-versus-buy re-evaluation that this document alone cannot settle | The platform's IP (SKILL.md library, standards model, evaluation harness) is portable and survives a platform transition. The fallback is adopting a commercial platform and maintaining only the domain-specific content layer on top of it. Monitor via Phase 5 benefit-metric actuals. Review at Phase 5 midpoint; escalate if M1 (outer-loop unassisted replication rate) and M2 (delivery cycle time) signals are not trending toward targets after two full delivery cycles. |

---

## 6. Sequencing Recommendation

### Phase 5 entry conditions

The following must be satisfied before any Phase 5 story begins:
- Phase 4 Themes A and F are stable and confirmed producing artefact chains across at least two squads
- Phase 4 Spike B1 has produced a written verdict (MCP boundary structural or conventional)
- Phase 4 governance package (ADR-013) interface is frozen — no planned breaking changes
- Phase 4 Spike D output is complete, or WS0 is scoped to begin with the distribution-only track (WS0.1–WS0.6) while Spike D completes

### Recommended sequence — value-ordered

The sequence below orders by: (1) blocking dependency resolution first, (2) highest Phase 5 multiplier second (capabilities that unlock multiple downstream workstreams), (3) independently deliverable value third.

```
Track 1 — Blocking resolution (Phase 5 weeks 1–8)
  WS0.1  Package versioning and lockfile (unblocks WS4.2, WS4.3)
  WS0.2  Upgrade command
  WS0.3  Upstream authority resolution (ADR decision — low implementation cost)
  WS0.5  Phase 3 consumer migration path
  WS0.6  CI-native artefact attachment
  WS4.1  Spec drift detection (ADDITIVE, no WS0 dependency, high operator value)
  WS4.4  Iteration cap and doom loop detection (ADDITIVE, no WS0 dependency)

Track 2 — Harness foundation (Phase 5 weeks 4–14, overlaps Track 1)
  WS1.1  Hook event schema (multiplier: WS2.3, WS3.4, WS4.4 trigger, WS5.4 trigger)
  WS1.2  Enforcement tier declaration
  WS1.3  Structural compaction
  WS1.4  Hook consumer interface
  WS4.2  Pre-flight artefact validation (ADDITIVE, depends on WS0.1)
  WS4.3  Lockfile-backed hash assertion (depends on WS0.1 and WS1 governance package)

Track 3 — Intelligence foundation (Phase 5 weeks 4–12, overlaps Tracks 1 and 2)
  WS5.1  Assumption card schema (SCHEMA CHANGE, no hard dependency)
  WS5.2  Delivery-to-assumption feedback (depends on WS5.1)
  WS3.3  Practitioner review gate (SCHEMA CHANGE, depends on oversightLevel formalisation)
  WS3.4  Session continuity protocol (ARCHITECTURAL, no dependency)

Track 4 — Non-technical channel (Phase 5 weeks 8–18, gated on Spike D output)
  WS0.4  Non-git consumer distribution
  WS0.7  Interaction surface selection and build
  WS0.8  Plain-language gate translation
  WS0.9  Artefact parity
  WS0.10 Discipline standards injection

Track 5 — Isolation and deep governance (Phase 5 weeks 14–24, gated on WS1.1 and Spike B1)
  WS2.x  All subagent isolation deliverables
  WS3.1  Context scope declaration
  WS3.2  Context boundary trace record
  WS5.3  Cross-team trace query interface (depends on WS0.4)
  WS5.4  Improvement signal derivation (depends on WS5.3)

Track 6 — Human capability and operational standards (Phase 5 weeks 12–22)
  WS6.1  Dynamic DoR checklist composition
  WS6.2  Brownfield onboarding path
  WS6.3  Maturity-gated skill disclosure
  WS6.4  Comprehension checkpoints
  WS7.1  Incident response standards (ADDITIVE, CLI mechanism only)
  WS7.3  Capacity planning standards (ADDITIVE)
  WS7.2  Change management standards (gated on WS0.7 stable)

Phase 5 schema evolution sprint (recommended before Track 5 begins)
  Design all Phase 5 schema fields together before implementing any:
  WS1.1 hook event fields, WS2.1 capability manifest, oversightLevel formalisation,
  WS3.2 context boundary record, WS4.4 attempt count, WS5.1 assumption card
```

### Phase 6 sequence (entry conditions from Phase 5)

```
Phase 6 entry 1: WS8 (Policy Lifecycle)
  Entry condition: Theme F proven in operation + WS5.4 improvement signal derivation delivered

Phase 6 entry 2: WS9 (Agent Identity)
  Entry condition: WS2.3 sidechain transcript + WS4.3 lockfile model stable + WS5.3 trace query delivered

Phase 6 entry 3: WS10 (Second Model Review)
  Entry condition: WS9 agent identity delivered + WS1.4 hook consumer interface stable

Phase 6 entry 4: WS11 (Enterprise Federation)
  Entry condition: WS5.3 adopted by 3+ squads + WS9.1 agent identity (data governance model)
```

### Phase 5 MVP

If Phase 5 must deliver a minimum set, the MVP comprises three tracks:

**Track A — WS0 distribution completion (WS0.1–WS0.3, WS0.5, WS0.6):** The first and blocking track. Closes G0a, unblocks WS4.2, WS4.3, and all non-technical surface work. Without this track, six of the remaining workstreams have unmet dependencies.

**Track B — WS1 hook event infrastructure (WS1.1–WS1.4):** The foundation multiplier. Closes G1, G2, and G5; enables WS2.3 sidechain transcript, WS3.4 session continuity, WS4.4 doom-loop trigger, and WS5.4 improvement signal derivation — all of which depend on WS1.1 hook events.

**Track C — WS4 spec integrity (WS4.1, WS4.2, WS4.4):** The highest-value, smallest-footprint track. Closes G9, G10, and G15. WS4.1 and WS4.4 are ADDITIVE and fully independent; WS4.2 depends on WS0.1 (Track A), which is why Track A sequences first.

This MVP closes G0a, G1, G2, G5, G9, G10, and G15. It does not close isolation (G3, G4), trust tiers (G6, G7), or intelligence (G11, G12, G16). Those follow once WS1 hook events are proven.

### Phase 6 candidates promoted from proposal (confirmed here)

The following items from `phase5-proposal.md`'s Phase 6 candidates list are confirmed at Phase 6 with their entry conditions now made explicit:
- **Agent identity layer** → WS9, entry: WS2.3 + WS4.3 + WS5.3
- **Policy lifecycle management** → WS8, entry: Theme F proven + WS5.4 delivered
- **Second model review** → WS10, entry: WS9 delivered
- **OST visualisation** → WS11.2, entry: WS5 assumption cards at 3-team-scale adoption
- **Multi-region trace federation** → WS11.1, entry: WS5.3 multi-squad + WS9.1 data governance model

---

## 7. ADR Stubs

Three ADR stubs are proposed for recording in `.github/architecture-guardrails.md` when Phase 5 is formally approved. Do not add these to `architecture-guardrails.md` until the proposal has been reviewed and Phase 5 is formally opened.

```
| ADR-phase5-ws1 | Proposed | Phase 5 enforcement tier and hook event architecture:
  SKILL.md files declare per-step enforcement tier (structural or instructional);
  governance package records enforcement tier in trace entry at invocation time;
  hook events (pre-tool, post-tool, turn-start, turn-end) are a typed vocabulary
  consumed by governance gate scripts via the WS1.4 consumer interface.
  Constrains: all future SKILL.md authors (enforcement tier field required after WS1.2);
  all governance gate scripts that consume hook events (must use WS1.4 interface,
  not read hook event log directly). |

| ADR-phase5-ws0 | Proposed | Phase 5 distribution completion:
  WS0.1 lockfile-per-release is the authoritative versioning model for skill content;
  WS0.3 upstream authority decision determines whether heymishy/skills-repo or the
  productisation fork is the canonical upstream. WS4.3 lockfile-backed hash assertion
  is mandatory for all enforcement mechanism surfaces after WS0.1 is delivered.
  Constrains: all future distribution scripts (must not generate commits; must
  produce lockfile entries on install and upgrade). |

| ADR-phase5-schema | Proposed | Phase 5 schema evolution sprint:
  All Phase 5 schema changes are designed together before any implementation begins.
  No SCHEMA CHANGE deliverable ships without the full Phase 5 schema dependency graph
  being reviewed and approved. oversightLevel formalisation is the first schema change
  in the sprint — WS2 and WS3.3 are blocked until this field is declared. |
```

A separate ADR will be required for WS2 (capability manifest and deny-list) once Spike B1 verdict is available. The deny-first principle (WS2.2) is an architectural constraint with platform-wide implications and should not be introduced without a full ADR cycle with tech lead review.

---

## Appendix A — Workstream Summary Table

| Workstream | Phase | Primary gaps closed | Deliverables | Breaking changes | Critical dependency |
|------------|-------|--------------------|--------------|--------------------|-------------------|
| WS0 Distribution + Channel Completion | 5 (first) | G0a, G0b | WS0.1–WS0.10 | None | Phase 4 Themes A + F stable; Spike D output |
| WS1 Harness Infrastructure | 5 | G1, G2, G5 | WS1.1–WS1.4 | None | WS0.1–WS0.3; Theme A governance package stable |
| WS2 Subagent Isolation | 5 | G3, G4, G6, G7 | WS2.1–WS2.4 | None | Spike B1 verdict; WS1.1 hook events |
| WS3 Context Governance | 5 | G5 (partial), G6 (partial), G8 | WS3.1–WS3.4 | None | WS1.1 for WS3.1 and WS3.2; none for WS3.3 and WS3.4 |
| WS4 Spec Integrity | 5 | G9, G10, G14, G15 | WS4.1–WS4.4 | None | WS0.1 for WS4.2 and WS4.3 |
| WS5 Platform Intelligence | 5 | G11, G12, G16 | WS5.1–WS5.4 | None | WS0.4 for WS5.3; WS1.1 for WS5.4 |
| WS6 Human Capability | 5 | G8 (partial), G13, G17 | WS6.1–WS6.4 | None | WS0.7 benefits WS6.1; not a hard block |
| WS7 Operational Domain Standards | 5 | G0c | WS7.1–WS7.3 | None | WS0.7 for WS7.2; none for WS7.1 and WS7.3 |
| WS8 Policy Lifecycle Management | 6 | — | WS8.1–WS8.3 | None | Theme F proven in operation; WS5.4 delivered |
| WS9 Agent Identity | 6 | — | WS9.1–WS9.2 | None | WS2.3, WS4.3, WS5.3 delivered |
| WS10 Second Model Review | 6 | — | WS10.1–WS10.2 | None | WS9 delivered; WS1.4 stable |
| WS11 Enterprise Federation + OST | 6 | — | WS11.1–WS11.2 | None | WS5.3 multi-squad adoption; WS9.1 data governance model |

No Phase 5 or Phase 6 deliverable is classified as BREAKING. All schema changes are additive (new fields only, consistent with ADR-003).

---

## Appendix B — Competitive Landscape

This appendix addresses the question that stakeholders at the engineering, architecture, and risk level will ask when reviewing this proposal: why is this platform being evolved rather than replaced by or supplemented with a commercial or open-source alternative? The answer requires distinguishing three market layers that are routinely conflated, and then addressing each named product directly.

### Market layers

The market for AI-assisted software delivery contains three structurally distinct layers. Conflating them produces category errors in procurement and build-versus-buy analysis.

**Layer 1 — AI coding assistants.** Tools that help individual developers write, test, and review code within an IDE session: GitHub Copilot, Claude Code, Cursor, Windsurf, Kiro, Amazon Q Developer. These are execution runtimes. They have no concept of fleet-level standards, domain policy inheritance, or regulated-context audit trails. They are the substrates that skills-repo governs. None of them are alternatives to skills-repo — they are the layer below it.

**Layer 2 — Workflow and specification frameworks.** Open frameworks that bring structure to how agents are prompted and directed within a single project or small team: the GitHub Spec Kit, Vistaly's continuous discovery model, and comparable open-source specification protocols. These are the comparison class in the gap audit in Section 2 of this proposal. They are single-project in scope, not designed for multi-team fleet governance or regulated-context audit, and they are the source of the gap evidence this platform builds on.

**Layer 3 — Enterprise platform governance.** Commercial products that add governance infrastructure on top of Layer 1 tools: Harness.io, GitLab Duo Agent Platform, Qodo. These address the same governance problem as skills-repo. They have commercial licensing models, vendor dependencies, and varying degrees of customisability. They are the build-versus-buy question.

skills-repo is a Layer 3 capability built on top of Layer 1 tools, drawing gap evidence from Layer 2 research. The question for any Phase 5 investment decision is not "should we use skills-repo or one of these alternatives?" but "which alternatives address the same problem space, at what cost, and with what tradeoffs?"

### Tool-by-tool analysis

| Tool | Layer | Governance model | Key gap vs skills-repo | Complementary or competitive |
|------|-------|-----------------|----------------------|------------------------------|
| GitLab Duo Agent Platform | 3 | Agents as first-class pipeline participants within GitLab's unified data model; policy-aligned, auditable | Requires GitLab as the platform; not layerable onto a Bitbucket/Atlassian stack | Competitive if migrating to GitLab; not viable otherwise |
| Harness.io | 3 | Agents run as pipeline steps sharing execution context, secrets, connectors, and RBAC scope; versioned via GitX | Adds a commercial CI/CD platform subscription on top of existing toolchain licensing | Complementary: skills-repo skills could run as Harness pipeline steps; distinct cost and vendor-dependency trade |
| Qodo | 3 | Post-generation code review and governance; validates consistency across modules and enforces project-level rules before merge | Governs what the agent produced, not what it was directed to do; no equivalent to outer loop skill governance | Complementary: Qodo at the output boundary, skills-repo at the input and process boundary |
| GitHub Copilot | 1 | None at the governance layer; individual coding assistant | Is the execution substrate skills-repo governs, not a governance platform | The runtime, not the governance layer |
| Kiro | 1 | Spec-first workflow (EARS-structured requirements, design, and task documents) within a single IDE session | Single-developer or small-team scope; no multi-repo governance, no fleet standards, no financial-services audit trail; AWS-native with limited compliance transparency | Philosophically aligned on spec-first; not enterprise governance at fleet scale |
| Cursor / Windsurf | 1 | Team collaboration via shared workspaces and Git; admin controls for IDE settings | High-quality IDE execution; no on-premises or self-hosted option; governance requires a separate layer | Execution runtimes; skills-repo could govern a Cursor or Windsurf session as easily as a Copilot session |
| OpenHarness (HKUDS) | 1 | Open-source Python agent harness; implements PreToolUse/PostToolUse lifecycle hooks, multi-level permission modes (default/auto/plan), Auto-Compact context compression, and .md-based skills loading. Directly realises at Layer 1 several patterns Phase 5 targets at the governance layer: execution hooks (G2), graduated permissions (G6/G7), and structural compaction (G5). ~10k stars; April 2026. | Single-session execution scope; no fleet governance, no multi-team standards inheritance, no regulated-context audit trail. A useful reference for what WS1/WS2/WS3 mechanisms look like in practice. | Execution substrate, not governance layer. Validates the feasibility of Phase 5 patterns at Layer 1 — Phase 5 delivers them as governance-layer capabilities owned by the pipeline, not as harness internals. |
| Amazon Q Developer | 1 | AWS-native AI coding assistant; strong integration with AWS IAM and identity governance | Optimised for AWS-native development and code transformation tasks; not a governed SDLC workflow platform | Not relevant to Azure-primary cloud context |
| Azure AI Foundry / Copilot Studio | 1/3 hybrid | Enterprise AI development and deployment platform; Copilot Studio for Teams-based custom agents | Not an SDLC workflow governance platform; relevant to Phase 4 Theme C (ambient invocation surface) but not to the core governance layer | Potentially complementary for non-technical channel (WS0.7); not a replacement |

### GitLab Duo — the closest commercial equivalent

GitLab Duo Agent Platform is the most structurally similar commercial product to skills-repo. It introduces AI agents into the software development lifecycle as collaborators, with every agent action auditable and policy-aligned within GitLab's unified data model. It is a genuine competitor in the market sense.

The structural gap is platform coupling. GitLab Duo's governance model is inseparable from GitLab as the platform. An organisation using Bitbucket, Jira, and Confluence cannot adopt GitLab Duo's governance without migrating its entire development toolchain to GitLab. That is not a tool adoption decision — it is a platform migration decision with different scope, cost, risk, and timeline entirely. skills-repo is layered onto the existing toolchain. If the organisation is already on GitLab or is planning a GitLab migration for other reasons, the analysis changes.

### Harness.io — the most mature commercial equivalent to the governance model

Harness.io agents run as first-class pipeline steps sharing the pipeline's execution context, secrets, connectors, and RBAC scope. Custom agents are versioned in Git, governed by OPA policy, and auditable at the pipeline step level. It is the most mature commercial realisation of the governance-by-mechanism principle this platform is working toward in Phase 4 and Phase 5.

The practical distinction is additive cost and operational scope. Harness.io is a CI/CD runtime with agent governance built in. Adding it means adding a commercial platform subscription on top of existing GitHub and Atlassian licensing. skills-repo runs on the existing infrastructure with no additional licensing. The two are complementary at the architecture level — skills-repo skills could be invoked as Harness pipeline steps — but the procurement question is whether Harness's governance model justifies the commercial dependency given that skills-repo delivers an equivalent governance posture on existing infrastructure.

### Qodo — complementary, not overlapping

Qodo operates downstream of code generation: it inspects changes in full repository context, validates consistency across modules, and enforces project-level and organisational rules before merge. It governs what the agent produced. skills-repo governs what the agent was asked to do, how it was directed to do it, and whether the method prescribed by the skill was followed. These address different parts of the risk surface. In a mature deployment they are complementary: skills-repo at the pre-generation workflow boundary, Qodo at the post-generation review boundary.

### Why build rather than buy

Three reasons, each independently defensible.

**Auditability transparency.** Every commercial Layer 3 platform in this space — GitLab Duo, Harness, Qodo — presents governance claims to a regulator as a vendor compliance attestation or a platform audit log. skills-repo presents governance claims as inspectable files: SKILL.md instructions are readable English, CI gate scripts are readable Node.js, and the traces branch is an open git history. The difference matters when a regulator asks "how does your AI governance work?" and the answer needs to be demonstrable rather than asserted. A vendor's SOC 2 report answers a different question than a walkthrough of the exact files governing an agent execution.

**No platform dependency.** Every commercial governance platform either requires a platform migration (GitLab Duo) or adds a commercial runtime subscription on top of an existing toolchain (Harness, Qodo). skills-repo governs within the existing toolchain. The platform-agnostic architecture constraint (ADR-012) reflects this as a first-class design decision, not a current limitation. The enforcement mechanisms in Phase 4 — MCP for VS Code and Claude Code, CLI for regulated contexts — are designed to run where the engineer already works.

**Domain-specific depth.** The gap audit in Section 2 of this proposal identifies nineteen gaps between skills-repo's current state and the governance properties the platform needs to close. None of those gaps can be closed by adopting a commercial platform that does not know the organisation's payments domain standards, regulatory compliance checklists, or audit evidence requirements. Domain-specific governance has to be built regardless of which platform it runs on. The question is whether the platform that domain-specific governance runs on is owned or rented. Every investment in skills-repo's SKILL.md library, standards model, and evaluation harness is portable: if the platform is eventually replaced, the IP moves with it. That portability has compounding value as the library grows.


