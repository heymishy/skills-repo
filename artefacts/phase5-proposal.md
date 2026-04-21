# Phase 5 Scoping Proposal

**Document type:** Scoping proposal -- not an approved roadmap or story artefact
**Prepared:** 2026-04-21
**Input sources:** `artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md`, `.github/architecture-guardrails.md`, `product/roadmap.md`, `product/constraints.md`, `product/tech-stack.md`, `README.md`
**Status:** Draft -- requires operator review before any story decomposition begins

---

## 1. Opening -- What Phase 5 Delivers

The platform today governs delivery through a combination of structural CI checks (at PR boundaries), instructional skill files (at execution time), and a hash-verified distribution model. The CI checks are deterministic -- they pass or fail against evidence fields in `pipeline-state.json`. The skill files are probabilistic -- they describe the method the agent should follow, but nothing prevents the agent from producing schema-conformant output without following the prescribed method. Phase 3 produced direct evidence of this failure: an agent read a SKILL.md verbatim, self-reported execution, and produced output that matched the required schema while skipping the prescribed method entirely. Phase 4 addresses this for specific interaction surfaces by extracting a shared governance package and selecting an enforcement mechanism -- MCP for VS Code and Claude Code contexts, CLI for regulated and CI contexts -- that intercepts agent execution at the invocation boundary rather than only evaluating output after the fact.

Phase 5 extends and consolidates that foundation. By the end of Phase 5, the platform will have closed the gap between instructional and structural enforcement across all major interaction surfaces; introduced graduated trust tiers that match the oversight intensity of a work item to the agent permissions granted for it; provided structural mechanisms for detecting specification drift, managing context budget continuity, and tracing intermediate agent execution events; and delivered the operational domain standards and agent identity layer that complete the regulated enterprise story that Phase 4 opens. A senior engineer reviewing the platform at Phase 5 exit can point to a specific enforcement mechanism -- not a SKILL.md instruction -- for each governance property the platform claims. A risk examiner reviewing the same platform can trace every agent execution to a versioned, hash-pinned instruction set, a specific model version, and a human approval record.

Phase 5 does not redesign the pipeline. The outer loop -- discovery through definition-of-ready -- and the inner loop -- branch setup through verify-completion -- remain the delivery vehicle. Phase 5 adds structural properties to those loops that Phase 4 begins to make possible.

---

## 2. Gap Audit

The gaps below are drawn from four sources: SOURCE 1 (GitHub Spec Kit analysis), SOURCE 2 (Vistaly / Torres continuous discovery framework), SOURCE 3 (arXiv preprint 2604.14228 -- deterministic harness vs. probabilistic instruction analysis of Claude Code), and SOURCE 4 (multi-framework comparison, Harness.io and comparable platforms). Each gap is audited against the current codebase. A gap is marked CLOSED only when a specific file has been read that provides closing evidence. A gap is marked PARTIAL when the platform addresses some part of the gap but a meaningful portion remains open. A gap is marked CONFIRMED when the platform has no current mechanism addressing it.

| # | Gap | Source | Status | Evidence path |
|---|-----|--------|--------|---------------|
| G1 | Enforcement tier conflation: SKILL.md instruction and CI enforcement treated as equivalent governance | SOURCE 3 | PARTIAL | Phase 4 governance package begins to separate tiers (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace` per ADR-013) but SKILL.md schema does not declare per-step enforcement tier. No field in `pipeline-state.json` schema distinguishes "deterministically enforced" from "instructionally enforced" steps. |
| G2 | Zero-token hook architecture: no pre-tool, post-tool, or turn-boundary governance hooks during agent execution | SOURCE 3 | CONFIRMED | CI workflows fire at PR event boundaries only: `assurance-gate.yml` fires on PR open and synchronize (pre-merge); `trace-commit.yml` fires post-merge. No hooks fire during agent execution. The improvement agent reads post-hoc traces; it does not intercept execution events. |
| G3 | SkillTool vs. AgentTool split: no isolation boundary between skills running in the agent's primary context and sub-agents with filtered tool access | SOURCE 3 | CONFIRMED | All skills run in the agent's primary context. Phase 4 MCP mechanism scopes context injection but does not spawn isolated sub-agents with separate permission scopes. No sidechain architecture. |
| G4 | Sidechain transcripts: trace record is post-hoc, not a live structural sidechain during execution | SOURCE 3 | CONFIRMED | `workspace/traces/` entries are written after gate evaluation (see `assurance-gate.yml`, `trace-commit.yml`). No live execution sidechain exists. The assurance gate reads trace files; it does not produce them during execution. |
| G5 | Graduated compaction: no structural multi-layer context budget management | SOURCE 3 | CONFIRMED | The `/checkpoint` convention at 55% context is an operator instruction (documented in `copilot-instructions.md`). No structural compaction mechanism. No Budget Reduction, Snip, Microcompact, Context Collapse, or Auto-Compact equivalent. |
| G6 | Graduated trust tiers: no mechanism translating work risk to agent permission scope | SOURCE 3 | CONFIRMED | `regulated: true/false` and `complianceProfile: standard/regulated` are declared in the formal `pipeline-state.json` schema. `oversightLevel: low/medium/high` is used extensively in pipeline-state data but is not declared in the JSON schema -- it is an informal convention. Neither field controls agent permission scope at execution time. One implicit permission mode applies to all skills and all work types. (WS2 and WS3.3 depend on `oversightLevel` as a formal field; the prerequisite schema change is addressed in the WS2 section.) |
| G7 | Deny-first principle: no capability denial declarations per skill or work type | SOURCE 3 | CONFIRMED | Skills describe what to do; none declare what capabilities are denied. No deny-list equivalent in any SKILL.md or governance gate. |
| G8 | Long-term capability preservation: no mechanism for practitioner comprehension of accumulated agent output | SOURCE 3 | CONFIRMED | The platform optimises for delivery velocity and governance compliance. No comprehension preservation mechanism, no practitioner review gate targeting human understanding, no comprehension measurement. |
| G9 | Spec drift detection: no ongoing check that implementation state aligns with specification state post-merge | SOURCE 1, SOURCE 4 | CONFIRMED | `validate-trace.sh` validates trace chain integrity (artefact-to-state linkage). The assurance gate verifies skill hashes at gate time. Neither detects divergence between merged implementation and governing specification on an ongoing basis. |
| G10 | Automated pre-flight artefact validation: no code-level check of prerequisite artefact presence and structural completeness before the coding agent begins work | SOURCE 1 | PARTIAL | 15 DoR hard blocks (H1-H9, H8-ext, H-E2E, H-NFR, H-NFR-profile, H-NFR2, H-NFR3) require human sign-off that artefacts exist. The DoR contract defines file touchpoints. But no automated pre-flight check fires before agent execution to validate artefact presence and schema compliance in code. Tests in `tests/` run in CI, not at agent-start. |
| G11 | Assumption-typed discovery gates: no structured assumption cards typed by category that gate delivery when unvalidated | SOURCE 2 | CONFIRMED | `/decisions` logs assumptions and risk acceptances in free-form prose. `/spike` handles named unknowns. No structured assumption card schema typed by Desirability, Usability, Feasibility, Viability, Ethical, Scalability, or Legal category. |
| G12 | Bidirectional delivery-to-strategy feedback: no structural mechanism returning delivery actuals to the discovery layer | SOURCE 2 | PARTIAL | `/improve` and `workspace/learnings.md` extract patterns post-merge. The improvement agent (`src/improvement-agent/`) reads traces for failure signals. But no structural mechanism updates discovery-layer artefacts (opportunity scores, assumption card validity) from delivery evidence. |
| G13 | Dynamic checklist composition: DoR checklist is static regardless of work type, domain, or risk context | SOURCE 4 | CONFIRMED | DoR hard blocks H1-H9, H8-ext, H-E2E, H-NFR, H-NFR-profile, H-NFR2, H-NFR3 are static. The `regulated: true` flag activates H-NFR2 and H-NFR3, but checklist composition is hardcoded in the DoR SKILL.md. No domain-sensitive or oversight-level-sensitive composition. |
| G14 | Skill version pinning at consumption point: no per-squad or per-story lockfile pinning of which skill version governed a delivery | SOURCE 4 | PARTIAL | Phase 4 Theme B (distribution, `ref-skills-platform-phase4-5.md` section 4.B.4-4.B.5) is designing a lockfile model. Currently, `sync-from-upstream.sh/ps1` syncs skill files without version pinning. The assurance gate checks a hash at gate time but the hash is not associated with a named version in a consumer lockfile. |
| G15 | Iteration cap and doom loop detection: no structural limit on repeated failed execution cycles | SOURCE 4 | CONFIRMED | No skill includes an iteration cap. No CI script or governance gate detects a story stuck in a repeated failure cycle. `/systematic-debugging` is invoked by the operator; it is not triggered automatically when a failure threshold is reached. |
| G16 | Trace data as platform intelligence source: cross-team trace aggregation and derivation of improvement signals at scale | SOURCE 4 | PARTIAL | The improvement agent reads local traces for failure and staleness signals. `fleet-aggregator.js` reads squad data from `fleet/squads/*.json` and writes the aggregated `fleet-state.json`. Cross-team trace registry is aspirational -- noted in `ref-skills-platform-phase4-5.md` as a Phase 5 condition. No queryable trace interface across multiple consumer squads. |
| G17 | Brownfield onboarding: no explicit path for teams starting with work already in progress | SOURCE 4 | PARTIAL | `retrospective-story.md` template exists for retroactive chain creation. A "designs-in-hand" workflow variant is referenced in pipeline documentation. No explicit guided onboarding path starting from a partly-built codebase with partial artefacts. |

Gaps G1 through G8 are primarily Harness Infrastructure and Context Governance workstream items. Gaps G9, G10, G14, G15 are Spec Integrity items. Gaps G11, G12 are Platform Intelligence items. Gaps G3, G4, G6, G7 are Subagent Isolation items. Gap G13 is a Human Capability item. Gaps G16, G17 extend Platform Intelligence and Human Capability respectively.

---

## 3. Workstream Proposals

Six workstreams are proposed for Phase 5. Each workstream is named, its primary gap closure is stated, deliverables are listed with classification, and its Phase 4 entry condition is declared. Workstreams are not independent -- Phase 4 dependencies are explicit.

Classification codes used below:
- ADDITIVE: adds capability without changing existing interfaces or schemas
- SCHEMA CHANGE: requires a field addition to `pipeline-state.json` schema (governed by ADR-003)
- ARCHITECTURAL: changes how a component is structured without breaking existing consumers
- BREAKING: changes a public interface in a way that requires consumer migration

### Workstream WS1 -- Harness Infrastructure

**Gaps closed:** G1 (enforcement tier conflation), G2 (hook architecture), G5 (graduated compaction)

**Phase 4 dependency:** Requires Phase 4 Theme A governance package (ADR-013) to be stable before adding hook events to the enforcement mechanism surface. Hook events at the MCP tool boundary depend on Phase 4 MCP spoke (`p4-enf-mcp`) being delivered and proven. CLI-surface hooks depend on Phase 4 CLI spoke (`p4-enf-cli`) being delivered.

**Rationale:** Phase 4 proves that a shared governance package can mediate agent execution at the invocation boundary for two surfaces. Phase 5 WS1 extends that foundation to expose intermediate execution events -- not just invocation entry and gate exit -- so that the improvement loop and the operator have a richer signal. It also closes the enforcement tier conflation by adding an explicit per-step tier declaration to the SKILL.md schema and propagating that declaration through the governance package's hash verification step.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS1.1 | Hook event schema: pre-tool, post-tool, turn-start, turn-end, session-start, session-end as a typed event vocabulary recorded by the governance package | SCHEMA CHANGE |
| WS1.2 | Enforcement tier declaration field in SKILL.md: each step declares `enforcement: structural` or `enforcement: instructional` -- the governance package records this field in the trace entry at invocation time | ARCHITECTURAL |
| WS1.3 | Structural multi-layer context budget management: automated snip and microcompact triggers driven by the governance package's session state, not by operator judgment alone. Operator retains override capability. | ARCHITECTURAL |
| WS1.4 | Hook event consumer interface: a defined interface allowing governance gate scripts to subscribe to specific hook events (pre-tool: validate file-access scope; post-tool: record evidence field) without modifying governance package internals | ADDITIVE |

**What WS1 is not:** WS1 does not redesign CI workflows. The existing `assurance-gate.yml`, `trace-commit.yml`, and `trace-validation.yml` workflows continue to function. Hook events augment -- they do not replace -- the PR-boundary gate.

---

### Workstream WS2 -- Subagent Isolation

**Gaps closed:** G3 (SkillTool vs. AgentTool split), G4 (sidechain transcripts), G6 (graduated trust tiers), G7 (deny-first principle)

**Phase 4 dependency:** Requires Phase 4 Spike B1 to have resolved whether the MCP boundary is genuinely structural. If B1 produces a verdict that the MCP boundary is bypassable in the target substrates (VS Code Copilot agent mode, Claude Code), WS2 cannot close G3 structurally for those surfaces and must scope to CLI-only enforcement for isolation guarantees. WS2 deliverables are conditioned on B1's verdict.

**Rationale:** The platform's current model treats every skill invocation as equivalent: same agent, same tool access, same permission scope. This conflates skills that should execute with narrow scope (a hash-verification step that needs only a file-read) with skills that execute tasks requiring broad tool access (a coding task that needs file writes, test execution, and git operations). The conflation means there is no technical mechanism to grant narrow permissions to a skill that does not need broad access, and no mechanism to prevent a broadly-scoped invocation from contaminating a narrow verification step.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS2.1 | Capability manifest: each SKILL.md declares the capabilities it requires (file-read, file-write, test-execution, git-read, git-write, external-tool-call) -- the governance package validates the declared set at invocation time against the current operating context's permission tier | SCHEMA CHANGE |
| WS2.2 | Deny-list enforcement: governance package rejects skill invocations whose capability manifest includes capabilities not granted by the current permission tier. Denial is logged in the trace with the permission tier in effect at invocation time. | ARCHITECTURAL |
| WS2.3 | Structural sidechain transcript: governance package opens a sidechain log at invocation start and closes it at invocation end. The sidechain records intermediate tool calls and turn events (from WS1.1 hook events). The sidechain is a separate file from the post-hoc trace, written during execution and read-only after invocation end. | ARCHITECTURAL |
| WS2.4 | Permission tier declaration in context.yml: operators declare the default permission tier per surface type (VS Code: tier 2, CI: tier 1, regulated: tier 0) and the escalation approval path for tier promotions. No hardcoded tier values in governance package internals. | ADDITIVE |

**Prerequisite schema change:** WS2.2 (permission tier matching) and WS3.3 (practitioner gate keyed to `oversightLevel: high`) both depend on `oversightLevel: low/medium/high` being a formally declared field in the `pipeline-state.json` schema. It is currently an informal convention present in pipeline-state data but absent from the JSON schema. Promoting it to a declared schema field is an implicit SCHEMA CHANGE that must be included in the Phase 5 schema evolution sprint (see R3).

**What WS2 is not:** WS2 does not introduce a hosted runtime or a persistent agent process. All isolation is per-invocation, local, and reversible at the governance package level. No persistent state beyond the sidechain transcript file.

---

### Workstream WS3 -- Context Governance

**Gaps closed:** G5 (graduated compaction -- partially, with WS1.3 covering the structural mechanism), G6 (graduated trust tiers -- trust tier declaration in `context.yml`), G8 (long-term capability preservation)

**Phase 4 dependency:** None beyond Phase 4 being stable. WS3 can begin design work in parallel with Phase 4 delivery if the governance package interface (ADR-013) is finalised. WS3 deliverables that depend on hook events (WS1.1) are sequenced after WS1.1.

**Rationale:** Context budget exhaustion is currently managed by operator convention (the `/checkpoint` at 55% threshold). This is appropriate for Phase 3 and Phase 4, where the operator is present and experienced. It is not appropriate for regulated enterprise contexts where auditors require a deterministic record of what context was in scope at each invocation. The platform needs to declare what information is available to the agent at each invocation boundary and to preserve that declaration as part of the trace. Separately, the platform currently has no mechanism for maintaining human practitioner comprehension of accumulated agent output across a feature delivery. This is not a governance property in the regulatory sense, but it is a team health property: as more delivery is agent-driven, the risk of a team that cannot explain what was built increases.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS3.1 | Context scope declaration: each skill step declares its context scope -- which artefact types it expects to have in context, which it explicitly excludes, and the maximum context budget it is designed to operate within. The governance package injects context in accordance with the declared scope, not by passing the full session history. | ARCHITECTURAL |
| WS3.2 | Context boundary trace record: at each invocation, the governance package records the context scope that was injected (artefact list, token count estimate, exclusions) as a field in the trace entry. Auditors and operators can replay what the agent saw at invocation time. | SCHEMA CHANGE |
| WS3.3 | Practitioner review gate: a lightweight review step -- distinct from the DoR sign-off and distinct from the DoD -- that asks a named practitioner (not the coding agent and not the original operator) to read the delivered feature's summary artefact and confirm they can describe the key decisions made and the approach taken. The gate produces a one-field evidence record (`practitionerReviewStatus`) in the feature's pipeline state. The gate is optional per feature, controlled by an `oversightLevel: high` flag or a per-feature opt-in in context.yml. | SCHEMA CHANGE |
| WS3.4 | Session continuity protocol: formalises the current `/checkpoint` convention as a governed protocol with a structured output schema (replacing the current free-form `workspace/state.json` checkpoint block), automated trigger conditions derived from WS1.1 hook events, and a recovery test that validates session resumption produces a deterministic result from the checkpoint. | ARCHITECTURAL |

---

### Workstream WS4 -- Spec Integrity

**Gaps closed:** G9 (spec drift detection), G10 (pre-flight artefact validation), G14 (skill version pinning), G15 (iteration cap and doom loop detection)

**Phase 4 dependency:** G14 (skill version pinning) directly extends Phase 4 Theme B distribution model. WS4.2 (lockfile-backed pre-flight) depends on the Phase 4 lockfile design (4.B.4) being finalised. WS4.1 (spec drift detection) depends only on Phase 4 governance package stability. WS4.3 and WS4.4 are independent of Phase 4 distribution work and can be designed in parallel.

**Rationale:** The platform's current quality guarantee is a point-in-time gate: at DoR sign-off, the story is ready; at the assurance gate, the delivered artefact chain is complete. Neither guarantee detects ongoing divergence after merge. A team that delivers a story correctly, then makes follow-on changes that deviate from the original spec, has no structural signal that the deviation has occurred. Similarly, a coding agent that begins work without confirming prerequisite artefacts are present and structurally complete may produce work that satisfies its instructions but violates the governing spec -- because the spec artefact it was told to read was incomplete or missing when it read it. Both failure modes compound over time.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS4.1 | Spec drift detection: a scheduled CI job (distinct from PR-triggered assurance gate) that compares the governing story artefact's AC list against the current state of the artefact chain and reports divergence as a flagged finding in `pipeline-state.json`. Divergence is not a hard block -- it is a warning signal requiring operator acknowledgement. | ADDITIVE |
| WS4.2 | Automated pre-flight artefact validation: a Node.js check (following the pattern of existing `tests/check-*.js` scripts) that fires at agent-start -- before any file modification -- and validates the presence and structural completeness of all artefacts named in the DoR contract. Returns a machine-readable verdict. The coding agent blocks on a non-PASS verdict. Implementation follows ADR-011 (artefact-first rule -- this script is a new governance check script and requires a story artefact). | ADDITIVE |
| WS4.3 | Lockfile-backed skill hash assertion: at agent invocation, the governance package reads the consumer's lockfile (Phase 4 4.B.4 output) and asserts that the skill hash in the lockfile matches the hash of the SKILL.md file at the resolved path. A hash mismatch produces a hard block. The check is an extension to `resolveAndVerifySkill` (ADR-013). | ARCHITECTURAL |
| WS4.4 | Iteration cap and doom loop detection: the governance package records per-story attempt counts in `pipeline-state.json`. When the attempt count for a story exceeds a configurable threshold (default: 3, operator-configurable per story type in context.yml), the governance package emits a `doomLoopWarning` event (using the WS1.1 hook schema). The operator receives the warning and must explicitly reset the count to continue. | SCHEMA CHANGE |

---

### Workstream WS5 -- Platform Intelligence

**Gaps closed:** G11 (assumption-typed discovery gates), G12 (bidirectional delivery-to-strategy feedback), G16 (trace data as platform intelligence source)

**Phase 4 dependency:** G16 (cross-team trace aggregation) depends on Phase 4 distribution model (4.B.7 -- non-git consumer distribution and the audit evidence accessibility model in 4.B.9) being available. G11 and G12 have no hard Phase 4 dependency but benefit from the WS1 hook event infrastructure being available to provide richer trace signals.

**Rationale:** The platform currently produces a substantial volume of governed trace data across outer loop and inner loop executions. This data is consumed locally by the improvement agent but is not aggregated across teams, not queryable against a standard schema, and not used to derive improvement signals that feed back to the skills themselves. The Torres-influenced continuous discovery framing in SOURCE 2 identifies a structural gap: the platform treats discovery as a one-time gate rather than as a continuous loop where delivery evidence invalidates or validates assumptions made at discovery time. Closing this gap does not require replacing the pipeline -- it requires adding a structured feedback path from the inner loop (delivery actuals) back to the outer loop (assumption card status, opportunity score updates).

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS5.1 | Assumption card schema: a typed assumption record format -- category (Desirability, Usability, Feasibility, Viability, Ethical, Scalability, Legal), status (untested, in-test, validated, invalidated), and an evidence pointer -- added to the discovery artefact schema and exposed as an optional section in the discovery artefact template. The DoR H-block set gains an optional check: if the story's governing discovery artefact contains assumptions in `in-test` status with no evidence pointer, the story is flagged as an assumption-under-test delivery (for traceability, not as a hard block). | SCHEMA CHANGE |
| WS5.2 | Delivery-to-assumption feedback: a post-DoD step (extending the `/definition-of-done` skill) that identifies whether the completed story provided evidence relevant to any `in-test` assumption in the parent feature's discovery artefact, and records the evidence pointer and a status update (validated or invalidated). The update is written to the discovery artefact's assumption card section. This is a backward link -- delivery evidence updating discovery state -- that the platform currently has no mechanism for. | ADDITIVE |
| WS5.3 | Cross-team trace query interface: a query layer on top of the `fleet-aggregator.js` and improvement agent infrastructure that allows platform operators to ask structured questions across squad traces: failure rate by skill, spec drift frequency by feature type, doom loop incidence by oversight level. The query interface is a local Node.js script consuming fleet-aggregated trace data -- no hosted service, consistent with ADR-012 platform-agnostic architecture. | ADDITIVE |
| WS5.4 | Improvement signal derivation: the improvement agent's challenger generation step (currently triggered manually or by the improvement cycle schedule) gains an automatic trigger when the WS5.3 query interface detects a cross-team pattern that exceeds a configurable threshold (e.g. more than 3 squads failing the same skill step in a rolling period). The threshold and period are operator-configured in context.yml under the existing `instrumentation` block. | ADDITIVE |

**What WS5 is not:** WS5 does not implement Opportunity Solution Tree visualisation, continuous discovery tooling, or a product strategy layer. It adds assumption tracking and delivery-to-discovery feedback within the existing pipeline structure. It does not replace Jira, Confluence, or project management tooling (roadmap exclusion).

---

### Workstream WS6 -- Human Capability

**Gaps closed:** G8 (long-term capability preservation -- partially, with WS3.3 covering the practitioner review gate), G13 (dynamic checklist composition), G17 (brownfield onboarding)

**Phase 4 dependency:** G13 (dynamic checklist composition) extends the DoR skill and benefits from Phase 4 Theme C (non-technical discipline participation) being delivered first, because dynamic composition is most useful when multiple discipline contexts (engineering, product, regulatory) apply different checklist subsets. WS6 can proceed independently of Phase 4 Themes A and B.

**Rationale:** The DoR hard block checklist is a strength of the platform -- it is unambiguous and consistently applied. It is also a source of friction when it applies engineering-specific checks to non-engineering work or applies a full regulated-context checklist to a trivial bug fix. Phase 4 Theme C addresses the non-technical discipline participation problem. WS6 addresses the underlying structural issue: the checklist composition is hardcoded, and teams operating at different maturity levels or in different domain contexts cannot adjust the composition without modifying the SKILL.md. Making composition declarative -- driven by domain, oversight level, and compliance profile in context.yml -- reduces that friction without weakening the governance guarantee.

| Deliverable | Description | Classification |
|-------------|-------------|----------------|
| WS6.1 | Dynamic DoR checklist composition: the DoR hard block list is decomposed into tagged blocks -- `tag: engineering`, `tag: regulated`, `tag: product`, `tag: architecture`, `tag: security`. The context.yml compliance profile (`standard` or `regulated`) and the story's declared domain determine which tagged blocks are included. The composition rules are declared in context.yml, not hardcoded in SKILL.md. The default composition matches the current static list exactly -- no existing behaviour changes by default. | ARCHITECTURAL |
| WS6.2 | Brownfield onboarding path: a guided sub-skill invoked when `workspace/state.json` is absent and `artefacts/` contains partial or absent artefacts for in-progress work. The sub-skill walks the operator through backcasting the artefact chain, producing retroactive story, benefit-metric, and DoR artefacts from the existing codebase state. Extends the existing `retrospective-story.md` template with a step-by-step operator protocol. | ADDITIVE |
| WS6.3 | Maturity-gated skill disclosure: new operators and teams entering at bootstrap see a reduced initial skill set (discovery, definition, test-plan, DoR, tdd, verify-completion) rather than the full 30+ skill library. Additional skills become available as teams complete a configurable number of delivery cycles. The disclosure threshold is configured in context.yml. Existing operators see no change -- their full skill set continues to be available. | ADDITIVE |
| WS6.4 | Comprehension checkpoints: a lightweight post-delivery question set (3-5 questions) that any named team member can complete after a story is DoD-complete to record whether they understand what was delivered, why the key decisions were made, and how to operate the delivered capability. Responses are recorded in a `comprehension-log.md` in the feature's artefact folder. The gate is opt-in per feature; it produces no hard block. Its value is measured by tracking comprehension rate over time per team as a team health indicator. | ADDITIVE |

---

## 4. Risk Register

| # | Risk statement | Workstream | Likelihood | Impact | Mitigation |
|---|----------------|------------|------------|--------|------------|
| R1 | Phase 4 Spike B1 finds MCP boundary is bypassable: if the agent can read `pipeline-state.json` directly via `read_file` alongside MCP tools, WS2 (Subagent Isolation) cannot deliver structural guarantee for VS Code and Claude Code surfaces | WS2 | Medium -- B1 is flagged as a critical open question in the Phase 4 ref doc | High -- WS2 scope and classification changes for the two largest interaction surfaces | Design WS2 deliverables with explicit CLI-fallback paths. If B1 resolves unfavourably, WS2.1 and WS2.2 remain valid for CLI-mediated surfaces. Document the scope change explicitly in WS2 story artefacts at Phase 5 definition time. |
| R2 | Governance package interface instability: if Phase 4's shared governance package (ADR-013) undergoes interface changes during Phase 5, all workstreams that call through it (WS1, WS2, WS4.3) accumulate rework | WS1, WS2, WS4 | Medium -- Phase 4 governance package is new and not yet proven stable across two surfaces | High -- interface churn during WS1-WS4 implementation is expensive | Phase 5 entry condition explicitly requires Phase 4 governance package to be stable with multiple squads consuming before WS1 stories begin. Do not begin WS1.4 until WS1.1 has been delivered and consumed by one real delivery cycle. |
| R3 | Schema proliferation: WS1.1, WS2.1, WS3.2, WS4.4, WS5.1 each require schema changes to `pipeline-state.json` or to SKILL.md files; the WS2 prerequisite formalisation of `oversightLevel` adds a sixth implicit schema change. Multiple simultaneous schema changes increase the risk of ADR-003 (schema-first) violations and consumer breakage | WS1, WS2, WS3, WS4, WS5 | High -- five named SCHEMA CHANGE deliverables plus one prerequisite schema change | Medium -- schema changes are additive (new fields only) so existing consumers should not break; but schema proliferation degrades readability and increases the cognitive load of the pipeline state file | Batch schema changes per workstream rather than per deliverable. Define a Phase 5 schema evolution sprint at the start of the phase that designs all required fields and their interdependencies before any implementation begins. Enforce ADR-003 (schema-first) strictly for Phase 5. |
| R4 | Assumption card adoption: WS5.1 adds assumption cards to the discovery artefact schema, but adoption depends on operators completing them. If operators skip assumption cards (as they skip optional sections today), WS5.2 (delivery-to-assumption feedback) produces no signal | WS5 | Medium -- optional fields are routinely skipped in the current pipeline | Medium -- WS5 produces reduced value if adoption is low, but causes no harm and creates no regression | Make assumption card population a soft prompt (W-class warning, not H-class block) at benefit-metric sign-off for features with a measurable user impact claim. The warning is configurable and can be disabled per team in context.yml. |
| R5 | Dynamic checklist composition creates undetected compliance gaps: if a team's context.yml composition rules exclude a block that the regulator considers mandatory, the team may receive DoR sign-off on a story that lacks a required compliance check | WS6 | Low -- default composition matches current static list; gaps require active misconfiguration | High -- a missed compliance check in a regulated context is a material governance failure | The `regulated` compliance profile locks the full H-NFR, H-NFR2, H-NFR3, and H-architecture block set. These blocks cannot be excluded by context.yml rules. Only `standard` profile features can have composition adjusted. Document the locked set explicitly in context.yml schema comments and in the WS6.1 story AC. |
| R6 | Context scope declaration overhead: WS3.1 requires skill authors to add a context scope declaration to each SKILL.md. If authors skip or under-declare the scope, the governance package injects more context than declared and the audit record is inaccurate | WS3 | Medium -- SKILL.md authoring conventions are enforced by process, not by tooling | Low -- an inaccurate scope declaration produces a misleading but not incorrect trace record; it does not enable a governance bypass | Add a linter check to the governance-sync pre-commit hook that flags SKILL.md files missing a context scope declaration block after Phase 5 WS3.1 is defined. The linter is a WARNING (not a hard block) for one full delivery cycle before being promoted to ERROR. |
| R7 | Cross-team trace aggregation introduces data governance obligations: WS5.3 queries trace data across squads. In a regulated enterprise context, cross-team trace data may contain personally identifiable information (audit trail author names, commit hashes traceable to individuals) subject to data protection obligations | WS5 | Low to medium -- depends on regulatory jurisdiction of the consuming organisation | High -- data protection non-compliance is a material risk in a regulated enterprise | WS5.3 explicitly documents the personal data categories that may appear in trace data and provides a configuration option to pseudonymise or exclude author-traceable fields before aggregation. This is a platform design obligation, not a consumer configuration obligation. |
| R8 | Practitioner review gate becomes a bottleneck: WS3.3 introduces a human review step gated on a named practitioner. In fast-moving teams or regulated contexts with limited named reviewers, this gate may block delivery unnecessarily | WS3 | Low -- the gate is opt-in per feature, controlled by context.yml | Medium -- if adopted widely under time pressure, the gate creates a bottleneck that undermines operator confidence in the platform | Document clearly that the gate is intended for high-oversight features only. Provide a configurable timeout after which the gate auto-passes with a logged warning if no practitioner response is received. The timeout is operator-configured in context.yml. Auto-pass with warning is never available in the `regulated` compliance profile. |

---

## 5. Sequencing Recommendation

### Phase 5 entry conditions

The following conditions must be satisfied before any Phase 5 story begins:
- Phase 4 Themes A, B, C, F are stable and consumed by at least two squads running full outer loop cycles
- Phase 4 Spike B1 (MCP boundary verification) has produced a written verdict that WS2 can cite
- Phase 4 governance package (ADR-013) interface is frozen -- no planned breaking changes
- Phase 4 lockfile model (4.B.4) is implemented -- WS4.2 and WS4.3 depend on it

### MVP (workstreams WS1 and WS4)

WS1 (Harness Infrastructure) and WS4 (Spec Integrity) are proposed as the Phase 5 minimum viable delivery. The rationale: WS1 provides the hook event infrastructure that WS2 and WS3 depend on -- delivering WS1 first prevents rework in later workstreams. WS4 closes the most operationally significant risks (spec drift, pre-flight validation, doom loop detection) with the smallest architectural footprint. Three of WS4's four deliverables are ADDITIVE and do not require changes to the governance package interface.

Expected MVP deliverable set:
- WS1.1 (hook event schema), WS1.2 (enforcement tier declaration), WS1.3 (structural compaction), WS1.4 (hook consumer interface)
- WS4.1 (spec drift detection), WS4.2 (pre-flight artefact validation), WS4.3 (lockfile-backed hash assertion), WS4.4 (iteration cap)

The MVP does not close the subagent isolation gaps (G3, G4) or the trust tier gaps (G6, G7). Those require WS2, which is gated on Spike B1 verdict and WS1.1 hook events. The MVP does not close the platform intelligence gaps (G11, G12, G16). Those require WS5.

### Extended Phase 5 (WS2, WS3, WS5, WS6)

After MVP stabilisation:
- WS2 (Subagent Isolation) -- conditioned on Spike B1 verdict and WS1.1 availability
- WS3 (Context Governance) -- can begin WS3.3 and WS3.4 in parallel with WS1 MVP; WS3.1 and WS3.2 follow WS1.1
- WS5 (Platform Intelligence) -- WS5.1 and WS5.2 can begin in parallel with WS1 MVP; WS5.3 and WS5.4 require Phase 4 fleet aggregation and WS1 hook events
- WS6 (Human Capability) -- fully independent of Phase 4; can begin design in parallel with Phase 4 delivery

### Phase 6 candidates

The following items are out of scope for Phase 5 but are logical Phase 6 candidates, named here to prevent scope creep during Phase 5:
- Agent identity layer (5.R2 in the roadmap) -- signed execution identity per agent run, traceable to model version and instruction set version. Depends on Phase 5 WS1 sidechain transcript and WS4 lockfile model being stable.
- Policy lifecycle management (5.R3) -- governed lifecycle for POLICY.md floor changes with CoP review. Depends on Phase 4 Theme F (second-line independence) being proven in operation.
- Second model review (5.G in the roadmap) -- challenger evaluation at pipeline boundaries. Depends on agent identity (Phase 6 candidate above) for attribution.
- Opportunity Solution Tree visualisation -- connected graph model from SOURCE 2. Requires WS5 assumption card schema to be adopted at scale before a connected graph has sufficient data density to be useful.
- Multi-region trace federation -- cross-organisation trace aggregation for platform-level benchmarking. Requires WS5.3 cross-team query interface and a formal data governance model for inter-organisation sharing.

---

## 6. ADR Stub

The following ADR stub is proposed for recording in `.github/architecture-guardrails.md` at the point Phase 5 is formally approved. It is recorded here as a proposal stub -- do not add this stub to `architecture-guardrails.md` until the proposal has been reviewed and Phase 5 is formally opened.

```
| ADR-phase5-ws1 | Proposed | Phase 5 enforcement tier and hook event architecture:
  SKILL.md files declare per-step enforcement tier (structural or instructional);
  governance package records enforcement tier in trace entry at invocation time;
  hook events (pre-tool, post-tool, turn-start, turn-end) are a typed vocabulary
  consumed by governance gate scripts via the WS1.4 consumer interface.
  Constrains: all future SKILL.md authors (enforcement tier field required after WS1.2);
  all governance gate scripts that consume hook events (must use WS1.4 interface,
  not read hook event log directly). |
```

A separate ADR entry will be required for WS2 (capability manifest and deny-list) once Spike B1 verdict is available. The deny-first principle (WS2.2) is an architectural constraint with platform-wide implications and should not be introduced without a full ADR cycle with tech lead review.

---

## Appendix -- Workstream Summary Table

| Workstream | Primary gaps closed | Deliverables | Breaking changes | Phase 4 dependency |
|------------|--------------------|--------------|--------------------|-------------------|
| WS1 Harness Infrastructure | G1, G2, G5 | WS1.1 -- WS1.4 | None | Theme A governance package stable |
| WS2 Subagent Isolation | G3, G4, G6, G7 | WS2.1 -- WS2.4 | None (SCHEMA + ARCHITECTURAL only) | Spike B1 verdict; WS1.1 hook events |
| WS3 Context Governance | G5 (partial), G6 (partial), G8 | WS3.1 -- WS3.4 | None | WS1.1 for WS3.1 and WS3.2; none for WS3.3 and WS3.4 |
| WS4 Spec Integrity | G9, G10, G14, G15 | WS4.1 -- WS4.4 | None | Phase 4 lockfile model (4.B.4) for WS4.3 |
| WS5 Platform Intelligence | G11, G12, G16 | WS5.1 -- WS5.4 | None | Phase 4 fleet aggregation for WS5.3; WS1.1 for WS5.4 |
| WS6 Human Capability | G8 (partial), G13, G17 | WS6.1 -- WS6.4 | None | Theme C for WS6.1 (benefits from it; not blocked on it) |

No Phase 5 deliverable is classified as BREAKING. All schema changes are additive (new fields only, consistent with ADR-003). All architectural changes affect internal governance package behaviour, not the skill format or operator-facing artefact structure. Consumer migration is not required for any Phase 5 workstream under the current proposal.

---

## Appendix B -- Competitive Landscape

This appendix addresses the question that stakeholders at the engineering, architecture, and risk level will ask when reviewing this proposal: why is this platform being evolved rather than replaced by or supplemented with a commercial or open-source alternative? The answer requires distinguishing three market layers that are routinely conflated, and then addressing each named product directly.

### Market layers

The market for AI-assisted software delivery contains three structurally distinct layers. Conflating them produces category errors in procurement and build-versus-buy analysis.

**Layer 1 -- AI coding assistants.** Tools that help individual developers write, test, and review code within an IDE session: GitHub Copilot, Claude Code, Cursor, Windsurf, Kiro, Amazon Q Developer. These are execution runtimes. They have no concept of fleet-level standards, domain policy inheritance, or regulated-context audit trails. They are the substrates that skills-repo governs. None of them are alternatives to skills-repo -- they are the layer below it.

**Layer 2 -- Workflow and specification frameworks.** Open frameworks that bring structure to how agents are prompted and directed within a single project or small team: the GitHub Spec Kit, Vistaly's continuous discovery model, and comparable open-source specification protocols. These are the comparison class in the gap audit in Section 2 of this proposal. They are single-project in scope, not designed for multi-team fleet governance or regulated-context audit, and they are the source of the gap evidence this platform builds on.

**Layer 3 -- Enterprise platform governance.** Commercial products that add governance infrastructure on top of Layer 1 tools: Harness.io, GitLab Duo Agent Platform, Qodo. These address the same governance problem as skills-repo. They have commercial licensing models, vendor dependencies, and varying degrees of customisability. They are the build-versus-buy question.

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
| OpenHarness (HKUDS) | 1 | Open-source Python agent harness; implements PreToolUse/PostToolUse lifecycle hooks, multi-level permission modes (default/auto/plan), Auto-Compact context compression, and .md-based skills loading. Directly realises at Layer 1 several patterns Phase 5 targets at the governance layer: execution hooks (G2), graduated permissions (G6/G7), and structural compaction (G5). ~10k stars; April 2026. | Single-session execution scope; no fleet governance, no multi-team standards inheritance, no regulated-context audit trail. A useful reference for what WS1/WS2/WS3 mechanisms look like in practice. | Execution substrate, not governance layer. Validates the feasibility of Phase 5 patterns at Layer 1 -- Phase 5 delivers them as governance-layer capabilities owned by the pipeline, not as harness internals. |
| Amazon Q Developer | 1 | AWS-native AI coding assistant; strong integration with AWS IAM and identity governance | Optimised for AWS-native development and code transformation tasks; not a governed SDLC workflow platform | Not relevant to Azure-primary cloud context |
| Azure AI Foundry / Copilot Studio | 1/3 hybrid | Enterprise AI development and deployment platform; Copilot Studio for Teams-based custom agents | Not an SDLC workflow governance platform; relevant to Phase 4 Theme C (ambient invocation surface) but not to the core governance layer | Potentially complementary for non-technical channel (Phase 4 Theme C); not a replacement |

### GitLab Duo -- the closest commercial equivalent

GitLab Duo Agent Platform is the most structurally similar commercial product to skills-repo. It introduces AI agents into the software development lifecycle as collaborators, with every agent action auditable and policy-aligned within GitLab's unified data model. It is a genuine competitor in the market sense.

The structural gap is platform coupling. GitLab Duo's governance model is inseparable from GitLab as the platform. An organisation using Bitbucket, Jira, and Confluence cannot adopt GitLab Duo's governance without migrating its entire development toolchain to GitLab. That is not a tool adoption decision -- it is a platform migration decision with different scope, cost, risk, and timeline entirely. skills-repo is layered onto the existing toolchain. If the organisation is already on GitLab or is planning a GitLab migration for other reasons, the analysis changes.

### Harness.io -- the most mature commercial equivalent to the governance model

Harness.io agents run as first-class pipeline steps sharing the pipeline's execution context, secrets, connectors, and RBAC scope. Custom agents are versioned in Git, governed by OPA policy, and auditable at the pipeline step level. It is the most mature commercial realisation of the governance-by-mechanism principle this platform is working toward in Phase 4 and Phase 5.

The practical distinction is additive cost and operational scope. Harness.io is a CI/CD runtime with agent governance built in. Adding it means adding a commercial platform subscription on top of existing GitHub and Atlassian licensing. skills-repo runs on the existing infrastructure with no additional licensing. The two are complementary at the architecture level -- skills-repo skills could be invoked as Harness pipeline steps -- but the procurement question is whether Harness's governance model justifies the commercial dependency given that skills-repo delivers an equivalent governance posture on existing infrastructure.

### Qodo -- complementary, not overlapping

Qodo operates downstream of code generation: it inspects changes in full repository context, validates consistency across modules, and enforces project-level and organisational rules before merge. It governs what the agent produced. skills-repo governs what the agent was asked to do, how it was directed to do it, and whether the method prescribed by the skill was followed. These address different parts of the risk surface. In a mature deployment they are complementary: skills-repo at the pre-generation workflow boundary, Qodo at the post-generation review boundary.

### Why build rather than buy

Three reasons, each independently defensible.

**Auditability transparency.** Every commercial Layer 3 platform in this space -- GitLab Duo, Harness, Qodo -- presents governance claims to a regulator as a vendor compliance attestation or a platform audit log. skills-repo presents governance claims as inspectable files: SKILL.md instructions are readable English, CI gate scripts are readable Node.js, and the traces branch is an open git history. The difference matters when a regulator asks "how does your AI governance work?" and the answer needs to be demonstrable rather than asserted. A vendor's SOC 2 report answers a different question than a walkthrough of the exact files governing an agent execution.

**No platform dependency.** Every commercial governance platform either requires a platform migration (GitLab Duo) or adds a commercial runtime subscription on top of an existing toolchain (Harness, Qodo). skills-repo governs within the existing toolchain. The platform-agnostic architecture constraint (ADR-012) reflects this as a first-class design decision, not a current limitation. The enforcement mechanisms in Phase 4 -- MCP for VS Code and Claude Code, CLI for regulated contexts -- are designed to run where the engineer already works.

**Domain-specific depth.** The gap audit in Section 2 of this proposal identifies seventeen gaps between skills-repo's current state and the governance properties the platform needs to close. None of those gaps can be closed by adopting a commercial platform that does not know the organisation's payments domain standards, regulatory compliance checklists, or audit evidence requirements. Domain-specific governance has to be built regardless of which platform it runs on. The question is whether the platform that domain-specific governance runs on is owned or rented. Every investment in skills-repo's SKILL.md library, standards model, and evaluation harness is portable: if the platform is eventually replaced, the IP moves with it. That portability has compounding value as the library grows.

**The one circumstance that changes this analysis.** If the returns on agentic AI delivery prove substantially lower than projected at the portfolio level -- for reasons independent of governance quality -- the case for continued platform investment weakens. At that point the fallback position is adopting a commercial platform and maintaining only the domain-specific content layer on top of it. Having invested in governance thinking rather than tool adoption means the SKILL.md library and standards model survive the platform transition. The IP is not locked to the current implementation.
