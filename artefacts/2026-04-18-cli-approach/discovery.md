# Discovery: CLI approach for AI-assisted workflow

<!--
  USAGE: Produced by the /discovery skill. The structured outcome of early exploration —
  what problem we're solving, for whom, and what success looks like at the edges.

  Status must be "Approved" before /benefit-metric can proceed.
  MVP scope and out-of-scope fields are the primary review targets.

  To evolve: update this template, open a PR, tag BA lead + product lead.
-->

**Status:** Approved
**Created:** 2026-04-18
**Clarified:** 2026-04-18 via /clarify
**Approved by:** craigfo — 2026-04-18
**Author:** Claude (operator-driven via /discovery, /clarify, /decisions)

**Reference material consumed:**

- `reference/012-cli-approach-explained-v2.md` — overview (read during /discovery; re-read in amended form during /clarify for graph navigation primitives).
- `reference/013-cli-approach-reference-material.md` — comprehensive reference (read during /discovery; re-read in amended form during /clarify for graph navigation primitives).
- `reference/link-ref-skills-platform-phase4-5.md` — pointer to the phase4-5 strategic horizon reference (read during /clarify).
- `artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md` — phase4-5 strategic horizon reference (followed from the link-ref; read in full during /clarify; source of the five-mechanism matrix framing, P1–P4 properties, Theme F, and the §16-to-spike mapping).
- `reference/pr-comments-98.md` — verbatim PR #98 conversation (read during /clarify).
- `reference/pr-comments-155.md` — verbatim PR #155 conversation (read during /clarify; source of the (a)/(b) decision, the 10-of-12-open-questions-land-in-spikes mapping, and the non-linear navigation feedback that drove the graph amendments).

**EA registry blast-radius:** No EA (enterprise architecture) registry entry exists for this proposal. The feature is a new platform primitive — a consumer-side executor, a declared workflow artefact, and a seam contract — not an existing registered system. `architecture.ea_registry_authoritative: true` is set in `.github/context.yml`; with no `systemId` to query, `getBlastRadius()` is not called. This does not block discovery. Downstream skills (/definition, /reverse-engineer) may register the new primitives in the EA registry at definition time.

---

## Problem Statement

AI coding agents are reliable at reasoning and context-transformation, and unreliable at sequencing, path discipline, and self-verification. The non-determinism is a property of how LLMs (large language models) behave — output is conditioned on context, and context drifts across runs, sessions, and even within a single extended session. For casual use this is tolerable. For governed delivery — where auditors must answer *what was the agent doing, against which instructions, and can I verify that?* — the non-determinism breaks **demonstrability**: the property on which the platform's primary audit signal (hash-at-execution-time, ADR-003 (Architecture Decision Record 3)) depends.

Three categories of work are fragile when delegated to an agent: sequencing (which skill or step comes next), path discipline (reading inputs from and writing outputs to declared locations), and self-verification (claiming the work is done without independent evidence). When these categories run through the agent, each outer-loop cycle costs operator attention to re-check sequencing and landing paths, and each assurance artefact becomes an attestation of process rather than a demonstration of it.

**Who experiences it:** AI-operators running the outer and inner loops (attention cost per cycle, rework when steps land wrong); auditors and risk reviewers (cannot independently verify the instruction set that ran without out-of-band reconstruction); the end outcome itself (degraded trace integrity and variable artefact quality between runs with the same inputs).

**How often:** every agent-driven step in every feature. This is the default state today, not an edge case.

## Who It Affects

**Primary:**

- **Developer / engineer (outer-loop operator)** — running /discovery through DoR (Definition of Ready) and then the inner loop on a feature. Trying to move work through the pipeline without having to babysit step sequencing, output paths, or self-verification claims. Hits the problem on every agent-driven step.
- **Tech lead / squad lead** — owns squad-level delivery governance, reviews exceptions, signs DoR. Trying to trust that the governance chain recorded on a PR (pull request) *demonstrates* what governed the delivery rather than *attesting* to it. Hits the problem when an audit signal is an attestation and cannot be independently reconstructed.
- **Platform maintainer** — owns the core skill library, registry, and upstream update channel. Trying to ship skill / template / standards updates to consumer repositories without forcing forks, and to keep POLICY.md floors invariant across upgrades. Hits the problem when the adoption pattern implicitly requires a fork (severing the upstream channel) or when consumer-side execution has no structural control plane.
- **Auditor / risk reviewer (non-engineer)** — reviewing an assurance trace on a merged PR to answer "what instruction set governed this action, which standards applied, can I verify this?" without engineering assistance. Hits the problem when the evaluator is the same actor as the recorder, or when the trace cannot be re-verified against a workflow declaration.
**System actors (named because maker/checker allocates responsibility):**

- **CI (continuous integration) runner / independent runner** — today the assurance gate (`assurance-gate.yml`) and the trace-commit workflow (`trace-commit.yml`). Under the CLI approach, its scope extends to re-verifying consumer-side CLI trace emissions before committing them to durable storage. This is the record-commit authority.
- **Consumer squad (adopting organisation)** — wants to consume the platform and receive skill updates without forking the upstream repository. Hits the problem when adoption today biases toward forking (or a chat-native-only composition that cannot be reproduced in CI), which severs the update channel and breaks the non-fork constraint (`product/constraints.md` §1).

**Secondary (affected through artefact quality, not directly by the seam):**

- Product manager / BA (business analyst), CoP (community of practice) leads — participate in outer-loop /discovery, /benefit-metric, and /definition. Affected indirectly through trace integrity and floor propagation.

## Why Now

The platform is early enough that an architectural change of this shape is still tractable. Phase 1 and Phase 2 are complete; Phase 3 is beginning. The primitives that would be affected — SKILL.md as instruction-set-as-code, hash verification as audit signal, assurance-gate / trace-commit separation, POLICY.md floors, progressive skill disclosure, surface adapters, non-fork distribution — are in place but not yet entrenched by a large consumer base or a mature runtime surface. Structural decisions made now land cheaply.

**The window closes as the harness accretes.** Every additional runtime path that bakes in agent-driven sequencing, every consumer that adopts by forking, every trace emitted by the same actor that recorded it — each one compounds the migration cost. If a deterministic executor, a declared workflow artefact, and consumer-side maker/checker are going to be introduced at all, they are cheapest to introduce before the chat-native composition hardens into the assumed path. Waiting *mushrooms*: retrofit of the seam contract into a live harness, re-distribution of a non-fork consumer model into sites that have already forked, and retro-fitting maker/checker onto traces that are already being recorded by their own evaluator.

## MVP Scope

**Shape:**

- **One integration mode — Mode 1 only** (human-driven interactive session per reference §10.1). The CLI (command-line interface) writes the seam envelope as a prompt file and exits. The operator takes the envelope to their existing agent session (Copilot Chat, Claude Code, Cursor). No credentials, no vendor coupling, no headless subprocess or inference-API path in the MVP.
- **One delivery surface — git-native.** Sidecar is a directory under the consumer's repository; lockfile is a committed JSON file; trace artefacts are files in the consumer's tree. Non-git-native surfaces (IaC (infrastructure-as-code), SaaS-API, SaaS-GUI, M365-admin, manual) are deferred.
- **One consumer flow — install plus run one outer-loop step end-to-end.** `init` scaffolds the sidecar in a test repository; the consumer runs one declared step (for example /discovery) through the CLI; the emitted trace is re-verified by the existing `assurance-gate.yml` on PR.
- **Minimum viable command set — `init`, `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emit-trace`.** Navigation primitives (`workflow`, `advance` with optional `--to=<step>`, `back`, `navigate <step>`) reflect the workflow-as-graph topology — per node the declaration specifies allowed transitions (0 terminal, 1 next, N branching with operator-chosen target, back-references for retreat). The CLI executes whatever the workflow declaration permits; the operator is the navigator. The `upgrade` command is deferred until the first consumer has a lockfile to upgrade from.
- **CLI verification contract lives inside the workflow declaration (per-node fields), not as a separate artefact.** Each node carries the fields the CLI validates before a transition — expected-output-shape, required-prior-artefacts, skill hash, approval-gate metadata where applicable. The workflow declaration is the contract. No dedicated `verify-contract.json` is introduced in MVP. Rationale: simpler artefact inventory; fewer files to pin; Theme F (when it lands) governs a single declared file for both topology and contract. Extractability note: if Spike A (governance logic extractability) surfaces a reason to move the contract into a separate artefact — for example, to let a different runtime consume the same contract shape without consuming the topology — that is a follow-on migration under a separate workstream, not a MVP constraint.
- **Trace schema addition — optional `executorIdentity` field (CLI binary version + hash).** This feature introduces one optional field in emitted trace entries: `executorIdentity`, recording the CLI binary version and hash that produced the entry. The field is **optional** in the schema — the existing assurance-gate re-verification ignores it when absent, accepting traces from pre-CLI platform runs unchanged. Introduced to support a future Theme F evidence chain (if Theme F chooses to make `executorIdentity` mandatory for the second-line audit story, that is Theme F's call, not this feature's). No other trace-schema changes are introduced by this feature. Every other trace field continues to use the existing platform schema. Reference §16.12 (trace-schema alignment) remains the broader architectural question and stays gated by Spike A.
- **One declared workflow covering one outer-loop phase.** The first workflow declaration does not need to cover the full pipeline — just enough to prove the seam contract (envelope build, hash verification, artefact shape verification, state advance, trace emit) works end-to-end for one step.
- **Independent recording is the existing assurance gate.** The MVP does not introduce a new independent runner. It emits trace artefacts that the current `assurance-gate.yml` and `trace-commit.yml` split re-verifies and commits — the consumer-side counterpart slots into the existing maker/checker architecture.

**What must be true for the first person who uses it to find it useful:**

1. The skill body content handed to the agent matches the workflow's declared hash. A mismatch aborts the step. This preserves ADR-003's audit signal at the consumer-side seam. Hash verification is load-bearing at envelope build (before handoff to the agent); a post-return re-verification is belt-and-braces and MVP treats the envelope-build check as the primary audit anchor (resolves reference §16.4).
2. Sidecar install does not require forking the skills repository. The non-fork constraint (`product/constraints.md` §1) is preserved.
3. The artefact produced by the agent lands at the declared target path, or the CLI surfaces the gap. Path discipline is removed from agent responsibility.
4. Workflow state advances only after shape verification succeeds. Self-verification is removed from agent responsibility.
5. The trace artefact emitted by the CLI is independently re-verifiable by the existing assurance gate against the same workflow declaration. Maker/checker is preserved.
6. The operator is the navigator across the workflow graph (choosing `advance`, `advance --to=<step>`, `back`, or `navigate <step>`); the agent never sees the graph. Sequencing is removed from agent responsibility; navigation authority sits with the operator, not the agent.

**Theme F coupling — informing inputs, not delivered items (phase4-5 Problem 3):**

Theme F is heymishy's parallel Phase 4 workstream delivering credible second-line organisational independence. This feature **informs** Theme F (by defining the shape of artefacts Theme F governs) but does **not** deliver Theme F's governance controls. The dual-authority approval routing, the second-line governance model, RBNZ-ready documentation, and the organisational-independence evidence chain are Theme F's deliverables, not this feature's. This feature's outputs that become Theme F inputs:

- **CLI verification contract (shape).** This feature defines the structure of the checks the CLI runs before any `advance`, `back`, or `navigate` transition (hash verification, output-shape check, state-precondition check). The contract lives inside the workflow declaration as per-node fields (Q5 resolution) — no dedicated contract artefact in MVP. Theme F decides how changes to that contract are governed (single-authority or dual-authority). This feature does not specify the governance routing.
- **Workflow declaration structure.** This feature defines what a workflow declaration contains — node topology, allowed transitions, approval-gate nodes, skill hashes, approval channels. Theme F decides whether declaration changes are platform-team-only or require second-line co-approval, and defines the change-class boundary. This feature does not specify the governance routing.
- **CLI binary identity as an optional trace field (Q6 resolution).** This feature introduces `executorIdentity` as an optional field in the trace schema (CLI binary version + hash). Existing assurance-gate re-verification ignores the field when absent. Whether Theme F's evidence chain (4.F.2) requires the field to be present, and whether it becomes mandatory in the assurance gate's re-verification, is Theme F's call — not this feature's. See MVP Scope for the schema-change statement.
- **Docs cross-reference (light).** This feature's documentation references `ref-skills-platform-phase4-5.md` §Theme F as the parallel workstream; it does not produce governing-body-ready documentation itself (that is 4.F.3).

## Out of Scope

**Architectural non-goals (permanent — not deferred):**

- **Replacing SKILL.md as the unit of governed agent behaviour.** SKILL.md remains the instruction set. The CLI delivers SKILL.md hash-verified; it does not redefine, mutate, or compile it. Excluded because SKILL.md as-code is the platform's governance anchor.
- **Replacing the assurance gate.** The CLI is a consumer-side executor. `assurance-gate.yml` plus `trace-commit.yml` remain the independent recording and enforcement point. Excluded to preserve maker/checker: the evaluator-recorder split is structurally non-negotiable.
- **Giving the agent sequencing authority.** The agent never decides what step comes next, even in Mode 3 (CLI-as-MCP (Model Context Protocol)-server). Workflow-driven sequencing is the reliability property the architecture rests on. Excluded by definition.
- **New governance model.** No new floors, no new gate semantics, no new approval model. The CLI approach enforces what the existing governance model declares; it does not relax or extend POLICY.md floors or approval-gate semantics.
- **Vendor-specific integration.** The seam contract is agnostic. The feature does not ship a Copilot-only, Claude-only, or Cursor-only path. Excluded to keep the seam portable across agent runtimes.
- **Governance of the assurance-gate's own SKILL.md content.** That is the core deliverable of Theme F (phase4-5 §4.F.1) and lives in the parallel Theme F work track. This feature's in-scope Theme F contributions (above) cover CLI verification contract, workflow-declaration governance, and CLI binary identity — not the assurance-gate's SKILL.md itself.
- **Organisational design of the risk function / CoP approval authority.** Organisational control, not a platform feature. This feature specifies the *interface* to that authority (approval routing, change-class boundaries) but does not design the authority itself.
- **Theme F approval routing / channel adapter.** The ADR-006 approval-channel adapter pattern is already in the platform; this feature does not extend it. Theme F's approver is routed through the existing channel adapter, not through a new mechanism.

**Phase-deferred (MVP boundary — valid follow-ons, not in this feature):**

- **Mode 2 (headless subprocess or inference-API) and Mode 3 (CLI-as-MCP-server).** Only Mode 1 ships first. Excluded because Mode 2 pulls in credential handling, vendor-runtime coupling, and CI-side constraint enforcement — all of which deserve their own discovery.
- **Non-git-native surfaces** (IaC, SaaS-API, SaaS-GUI, M365-admin, manual). The MVP is git-native. Sidecar semantics on other surfaces are resolved through the existing surface adapter, which itself may need extension — that is downstream work.
- **Consumer-side workflow customisation** (adding a step, replacing a skill, removing a step). Customisation is reference §16.2 open question. Deferred until the base non-customised flow demonstrates.
- **Upgrade UX for breaking skill-content changes.** The `upgrade` command exists conceptually; breaking-change signalling and the consumer sign-off experience are deferred (reference §16.8).
- **CLI distribution fallbacks** for consumers who cannot run npm-installed Node binaries. npm is the paradigmatic case for MVP. Alternate distributions (standalone binary, OCI image, other) are deferred.
- **Enterprise traceability — configurable commit-message-format validation.** phase4-5 §B.3 / Spike B2 names operator-configured commit-format validation as the concrete CLI enforcement response to distribution sub-problem 1b (e.g. a consumer MyCo requires a Jira story reference of shape `JIRA-XXXX` in every commit message; other consumers have differently-shaped internal traceability standards). This would land as a precondition check on `advance` / `back` / `navigate` — the CLI refuses to advance state if the last commit's message fails the operator-configured format rule, with the rule held in `.github/context.yml`. Deferred from MVP. When delivered, it is the Spike B2 sub-problem-1b criterion exercised end-to-end. "Install generates no commits" remains an implicit scope boundary of the MVP (install is not in MVP scope; runtime commands do not generate commits by design) rather than a named design property.

## Assumptions and Risks

**Assumptions (unvalidated — if any are wrong, reshape or stop):**

1. **Auditors will accept consumer-side evaluation provided the recorder is independent.** The maker/checker split at the consumer-side is structurally acceptable when the recorder (the existing assurance-gate) re-verifies consumer-emitted traces against the workflow declaration. The CLI's structural claim holds on its own technical merits: hash-verified envelope, declared-path artefact landing, trace schema aligned with the existing gate. In regulated contexts where the governing body also requires organisational second-line independence for the assurance-gate's own governance, this feature's structural correctness is a necessary but not sufficient input — Theme F (phase4-5 Problem 3 / heymishy's parallel workstream) addresses the organisational-independence question. This feature is not conditional on Theme F; it composes with Theme F where the consuming organisation's governance bar requires both structural and organisational controls. If an auditor's position is that all evaluation must run under their direct control (not just recording), the CLI's "consumer-side counterpart" framing does not clear their bar regardless of Theme F. That is the part of this assumption that remains genuinely unvalidated.
2. **The existing `assurance-gate.yml` can re-verify a CLI-emitted trace with minor-to-no modification.** The current trace JSON schema is close enough to what the CLI emits that no new parallel gate is required. If the gate needs substantial rework, the MVP's "slot into existing maker/checker" claim becomes a separate workstream.
3. **Mode 1 (human-driven interactive session) is sufficient to validate value.** A feature that ships only Mode 1 is useful enough to one real consumer to justify continuing. If demonstrated value requires Mode 2 (headless or API), the MVP is mis-scoped.
4. **The seam envelope (skill body + prior artefacts + target path + output-shape expectations + constraint envelope) is sufficient context for agents in Mode 1.** If Copilot Chat, Claude Code, or Cursor sessions need ambient context the envelope does not deliver, the seam contract is under-specified.
5. **Workflow declarations can be authored and maintained as a first-class artefact without becoming a second SKILL.md problem.** Authoring burden is bounded; drift between the declared workflow and the actual skill library is manageable. If maintaining workflows turns out to be as expensive as maintaining skills, the governance surface area doubles.
6. **The coreutils-style "small sharp commands" discipline is sustainable.** CLI commands stay deterministic and do not accrete reasoning over time. If a future maintainer adds a `fetch-and-reformat` command, the Unix-violation safeguard is behavioural rather than structural.
7. **Progressive skill disclosure (existing) and CLI-driven workflow execution (new) compose cleanly.** A chat-native session consuming the workflow declaration produces comparable behaviour to the CLI consuming it. Asserted in reference §8.2 but not yet demonstrated.
8. **Spike A (governance logic extractability) lands adequately — or adequately enough.** This feature is framed as the reference implementation for Spike B2 (CLI enforcement mechanism, mechanism 1 of 5 in phase4-5's matrix). The framing assumes Spike A either (a) succeeds — a shared governance-package core exists that CLI, MCP server, and orchestration mechanisms each adapt around — or (b) produces the evidence that separate implementations are the pragmatic path, in which case this feature is evaluated on its own merits against skill format and trace schema contracts alone. If Spike A produces a third outcome that reshapes mechanism identity itself, this feature's framing re-runs.

**Risks (what could make this not worth building):**

1. **Adoption friction narrows the audience.** npm install plus sidecar plus lockfile plus new commands is more overhead than the current chat-native adoption path. If consumers with low governance burden prefer the lighter path, the CLI approach serves regulated delivery only — a narrower consumer base than the current platform targets.
2. **Non-fork adoption is not validated by the MVP.** The MVP flow demonstrates one outer-loop step. It does not necessarily exercise the upgrade path — which is where the non-fork property actually earns its keep. The feature's signature adoption claim could ship un-validated.
3. **Independent runner dependency at consumer sites.** Maker/checker requires an independent recorder. Consumers without CI (a real slice of the target base) get local-only traces — not audit-grade. The approach is unavailable to them without CI already in place.
4. **Double composition path fragments the improvement signal.** Chat-native progressive skill disclosure plus CLI-driven workflow execution equals two surfaces for every skill, two trace shapes, two places the improvement loop must reason about failure patterns. Could dilute the self-improving-harness signal.
5. **Constraint envelope is declarative-only in Mode 1.** The CLI writes a prompt file; the operator takes it to their agent session; the agent may fetch or read outside the declared envelope. The "forbidden operations" list is a convention, not runtime-enforced. This weakens the seam claim in Mode 1 specifically — which is also the MVP's only mode.
6. **Consumer customisation semantics are unresolved** (reference §16.2, §16.9). If a real consumer wants to add a step and the answer is "not supported yet", the non-fork property loses credibility: they fork to customise, which is exactly the failure mode the platform was designed to prevent.
7. **Second platform-team maintenance surface.** Workflow declarations plus CLI command set equals a new maintenance surface on top of skills and standards. Finite platform-team bandwidth; could delay the improvement-loop throughput for the existing surface.

## Directional Success Indicators

**Primary framework — per-invocation skill fidelity (phase4-5 Spike B2 evaluation targets).** This discovery adopts the four fidelity properties named in the Phase 4 / Phase 5 strategic horizon reference (`artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md`) as the primary success framework. Spike B2 evaluates the CLI (mechanism 1 of 5 in the phase4-5 matrix) against these four properties; the discovery's indicators below are framed to align with that evaluation. Indicators that are not fidelity properties are demoted to secondary groups and labelled as such.

**P1 — Skill-as-contract (input, execution, and output contracts validated):**

1. Hash verification at envelope build fires on a deliberate mismatch (input contract). A tampered skill body aborts the step with a clear error — not silently proceed.
2. Agent outputs land at the declared target path or the CLI surfaces the gap before `advance` (output contract). "Artefact in the wrong place" stops appearing in operator-visible outcomes.
3. Two runs of the same workflow node with the same skill content produce artefacts satisfying the same output-contract shape (execution-contract reproducibility).

**P2 — Active context injection at invocation (platform assembles scoped context before handoff):**

4. The CLI's envelope-build is the only path by which skill content, standards, prior artefacts, target path, and output-shape expectations reach the agent inside a skill invocation. Ambient context leaking from the operator session is minimised structurally (Mode 1 caveat: the envelope is declarative-only — carried as Risk 5 in the Assumptions and Risks section).
5. An agent session that executes a skill outside a CLI-built envelope — for example, a developer opening SKILL.md directly in their IDE — is structurally distinguishable from a CLI-driven run. Either the operator cannot advance state, or the resulting trace records the absence of the platform-assembled context.

**P3 — Per-invocation trace anchoring (every invocation produces audit-grade trace):**

6. Every `advance`, `back`, and `navigate` transition emits a trace entry recording: skill hash, input hash, output reference, transition taken, workflow-declaration hash, timestamp.
7. An auditor / risk reviewer can answer "what governed this action, which standards applied, was the output validated" from the emitted trace plus the workflow declaration alone — no engineering assistance. This extends the existing platform success outcome (`product/mission.md` §4) to consumer-side execution.
8. The trace emitted by the consumer-side CLI is accepted by the existing `assurance-gate.yml` on PR without a new parallel gate being introduced (Assumption A2 validated).
9. Two runs of the same workflow node with the same skill content produce traces whose skill-body hashes match. An auditor can confirm that the instruction set that ran on Monday is the instruction set that ran on Friday without engineering help.

**P4 — Interaction mediation (turn-by-turn, not batch submission):**

10. The agent never sees the workflow graph. Each invocation's envelope delivers only the current node's scoped context — no ability to read the declaration, no ability to author a multi-node batched artefact, no ability to advance state itself. The operator is the navigator (choosing `advance`, `advance --to=<step>`, `back`, or `navigate <step>`); the agent reasons within a single node.
11. For a skill prescribing "ask one question, wait for answer," the CLI's envelope permits exactly one exchange per invocation — not an agent-authored complete artefact from a batched prompt. P4 mediation is the specific property that addresses the observed winging-it failure mode documented in phase4-5.

---

**Secondary — distribution and adoption (Theme B / phase4-5 sub-problems 1a–1c; not P1–P4 fidelity properties):**

- A consumer adopts via `init` + sidecar + lockfile without forking the skills repository. The consumer's own repository contains no copy of SKILL.md or POLICY.md files — only the lockfile plus any declared customisations.
- `upgrade` propagates a skill change from upstream to a consumer without forking: re-fetches, diffs, surfaces for review, re-pins. POLICY.md floors in the upgraded content apply on the next run. (Upgrade UX for breaking changes is phase-deferred; see Out of Scope.)

**Secondary — workflow portability (Theme A runtime-agnosticism signal; not a P1–P4 fidelity property):**

- A second runtime consumes the same workflow declaration and produces a comparable trace. A chat-native harness (Copilot Chat driving progressive skill disclosure) and the CLI, both reading the same workflow artefact, produce traces a human reviewer cannot structurally distinguish at the audit level.

**Secondary — maintenance discipline (not a P1–P4 fidelity property):**

- At a six-month review, no CLI command has accreted reasoning behaviour. The coreutils-style sharpness discipline holds under contribution pressure — a Unix-violation guardrail that is behavioural, not structural.

**(Theme F demonstrables removed in Q4 pull-back.** Theme F's second-line independence demonstrables are Theme F's success indicators, not this feature's. This feature's outputs inform Theme F's evidence chain (CLI verification contract shape, workflow declaration structure, candidate trace field) but do not themselves constitute Theme F demonstrables. See Theme F coupling in MVP Scope and Clarification log Q4.)

## Constraints

**Time:**

- The "now" window described in Why Now is a time-box constraint on starting the work, not a deadline on finishing it. Phase 3 is beginning; the architecture is cheapest to change today.

**Budget / team capability:**

- Single-operator platform team today (roles: tech_lead = qa = analyst = product = "me" per `.github/context.yml`). The CLI's scope must fit alongside ongoing skill and standards maintenance. Any design that effectively doubles the maintenance surface without a corresponding reduction elsewhere is not affordable.

**Regulatory / governance (hard — inherited platform constraints the CLI must preserve, not relax):**

- **Non-fork distribution** (`product/constraints.md` §1). Consumers must be able to receive skill updates without forking. The CLI sidecar-plus-lockfile adoption path is bound by this.
- **POLICY.md floors are non-negotiable** (`product/constraints.md` §2). The CLI's `fetch`, `pin`, and `upgrade` commands must propagate floors and must not permit relaxation below the declared minimum.
- **Spec immutability** (`product/constraints.md` §3). Nothing the CLI does may move story specifications, ACs (acceptance criteria), DoR or DoD criteria, or POLICY.md floors. Automated agents — including any automation the CLI fronts — may not mutate these artefacts.
- **Human approval gate for instruction-set changes** (`product/constraints.md` §4). SKILL.md, POLICY.md, and standards changes require human review before merge. The CLI cannot auto-upgrade without a human sign-off step in its flow.
- **Instruction sets versioned and hash-verified** (`product/constraints.md` §5; ADR-003). Hash at execution time is the primary audit signal. The CLI preserves this at envelope build; the trace records the hash.
- **Surface type declared** (`product/constraints.md` §6). Path A (EA registry) or Path B (`.github/context.yml`) — both equally authoritative. The CLI must honour whichever resolved the declaration.
- **One question at a time in skill interactions** (`product/constraints.md` §7). Applies to any CLI-mediated skill invocation.
- **Theme F second-line independence (phase4-5 §Theme F) — coupling, not delivery.** This feature informs Theme F (by defining the shape of the CLI verification contract, the workflow declaration structure, and candidate trace fields) but does not deliver Theme F controls. Theme F's deliverables (§4.F.1 governance model, §4.F.2 audit evidence, §4.F.3 documentation) live in the parallel Theme F work track; this feature's structural outputs become Theme F inputs. This feature's artefacts must not contradict Theme F's design intent — but delivering Theme F's controls is out-of-scope here.

**Technical dependencies:**

- **npm** as the paradigmatic distribution channel. Non-npm fallbacks are an open question (reference §16.10) and are explicitly out-of-scope for MVP.
- **Existing `assurance-gate.yml` and `trace-commit.yml`** (the maker/checker workflows) — the CLI is their consumer-side counterpart, not a replacement. The MVP depends on the existing gate's re-verification capability.
- **`workspace/state.json` and `.github/pipeline-state.json` schemas** — the CLI's `advance` must write states that pass `tests/check-workspace-state.js` and the pipeline-state validators already in place.
- **Existing SKILL.md format.** Delivered by hash; not reshaped by the CLI.
- **Existing surface adapter contract** (`execute(surface, context) → result`) for non-git-native futures. Not exercised by MVP.
- **Node runtime on consumer sites.**
- **`.github/architecture-guardrails.md`** is noted as the repo-level ADR register and architecture guardrails source per `copilot-instructions.md` §Architecture standards. Downstream /definition will surface any applicable guardrails and propose new ADRs where this work introduces structural decisions (CLI command-set shape, workflow-declaration schema, consumer-sidecar layout).

**Stakeholder interface:**

- Auditor / risk-reviewer persona does not themselves run the CLI. Their interface is the trace plus the workflow declaration as read on PR review and post-merge evidence. The CLI's observable-to-auditor surface is the emitted trace and the hash-verifiability of the workflow declaration — not the CLI commands themselves.

---

## Clarification log

**2026-04-18 — Clarified via /clarify.** Inputs: `reference/012-cli-approach-explained-v2.md` (amended for graph navigation primitives), `reference/013-cli-approach-reference-material.md` (amended for graph navigation primitives), `reference/pr-comments-98.md` (verbatim PR #98 conversation), `reference/pr-comments-155.md` (verbatim PR #155 conversation), and the linked phase4-5 strategic horizon reference (`artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md` — via `reference/link-ref-skills-platform-phase4-5.md`).

### Pre-settled by operator (absorbed without question)

- **Q: (a)/(b) framing decision.** A: **(a)** — CLI is the reference implementation for Spike B2 (mechanism 1 of 5 in phase4-5's matrix), not the universal governance package. Discovery text throughout positions the feature as one cell in the multi-mechanism matrix.
- **Q: Workflow shape — forced sequence or graph?** A: **Graph.** 012 / 013 amended with navigation primitives (`workflow`, `advance` with optional `--to=<step>`, `back`, `navigate <step>`). MVP command set updated; Success Indicator P4 realisation reflects operator-as-navigator; Out of Scope "consumer-side workflow customisation" framing unchanged (still deferred as reference §16.2).

### Operator-answered (this session)

- **Q1: Adopt P1–P4 as the explicit named success-indicator framework?** A: **Option B — P1–P4 as primary framework; drop or demote indicators that don't cleanly map.** Directional Success Indicators rewritten with P1–P4 (skill-as-contract / active context injection / per-invocation trace anchoring / interaction mediation) as the primary group containing 11 fidelity indicators. Non-fidelity indicators demoted to three clearly-labelled secondary groups: distribution and adoption (Theme B sub-problems 1a–1c), workflow portability (Theme A runtime-agnosticism), maintenance discipline.
- **Q2: Theme F (second-line organisational independence) scope treatment.** A: **Option A — in scope** (see Q4 below for pull-back). Initially absorbed as CLI-specific Theme F deliverables. Subsequently revised — see Q4.
- **Q3: Enterprise traceability (commit-message-format validation) — in MVP or deferred?** A: **Option C — fully deferred.** Named in Out of Scope (phase-deferred) as tied to phase4-5 §B.3 / Spike B2 sub-problem 1b. Example generalised: MyCo requires `JIRA-XXXX` reference in commit messages; other consumers have differently-shaped internal standards. "Install generates no commits" remains an implicit MVP scope boundary, not a named design property.
- **Q4: Pull back Theme F scope — this feature *informs* Theme F, not *delivers* it.** A: **Directive applied.** Theme F is heymishy's parallel workstream. Initial Q2 absorption over-claimed. Revisions:
  - MVP Scope — "Theme F contributions — in scope for this feature" subsection renamed "Theme F coupling — informing inputs, not delivered items". The four bullets reframed from deliverables to inputs (contract shape, declaration structure, candidate trace field, light docs cross-reference).
  - Success Indicators — "Secondary — Theme F second-line independence demonstrables" group removed entirely, replaced by a short note explaining the removal and pointing to MVP Scope / Clarification log.
  - Assumption 1 — softened: structural correctness stands on its own technical merits; Theme F composes where governance bar requires both; non-regulated consumers not blocked by Theme F progress. Retained the genuinely unvalidated piece (auditor position on direct control).
  - Who It Affects — "Risk function / independent CoP co-owner" removed from Primary persona list (further refined under Q7).
  - Constraints — Theme F item softened from "constraint" to "coupling, not delivery".
  - Out of Scope (permanent) — the three Theme F boundary items kept (still correctly out-of-scope).
- **Q5: Where does the CLI verification contract live as an artefact?** A: **Option B — part of the workflow declaration (per-node fields).** No dedicated `verify-contract.json` in MVP. Each node in the declaration carries the fields the CLI validates before a transition (expected-output-shape, required-prior-artefacts, skill hash, approval-gate metadata). Rationale: simpler artefact inventory; fewer files to pin; Theme F (when it lands) governs a single file for both topology and contract. Extractability note: if Spike A surfaces a reason to move the contract into a separate artefact, that is a follow-on migration under a separate workstream — not an MVP constraint.
- **Q6: Trace-schema changes for "CLI binary identity in trace"?** A: **Option C — name schema additions in this feature as an optional field.** MVP introduces one optional trace-schema field: `executorIdentity` (CLI binary version + hash). Existing assurance-gate re-verification ignores the field when absent. Whether Theme F's evidence chain (4.F.2) requires the field to be present or mandatory is Theme F's call — not this feature's. Broader trace-schema alignment (reference §16.12) stays gated by Spike A.
- **Q7: Does the risk-function / CoP co-owner persona apply to all consumer types?** A: **Option D — drop entirely.** The persona is Theme F's concern, not this feature's. The indirect-dependency note added under Q4 is removed. Who It Affects no longer names Risk function / CoP co-owner in any capacity. Theme F coupling is now carried only by MVP Scope (as inputs), Assumption 1 (soft coupling), Out of Scope (what's fenced off), Constraints (informs-not-delivers), and this Clarification log.

### Operator-answerable, absorbed (not separate questions — settled by upstream reference)

- **Reference §16.4 (hash-verification placement).** Settled per heymishy's #155 detailed reply: hash verification is load-bearing at envelope build (before handoff to the agent); post-return re-verification is belt-and-braces. Absorbed into MVP Scope "what must be true" item 1.
- **Reference §16.6 (CLI vs assurance gate relationship).** Settled in discovery Problem Statement / MVP Scope item 5 / Out of Scope (permanent): consumer-side counterpart, not replacement. No further clarification needed.
- **Reference §16.7 (CLI mandatory or one of several).** Settled by the (a) framing and the multi-mechanism matrix in phase4-5: **one of several.** Absorbed via Q2's Theme F framing.

### Parked — inner-loop implementation detail (not in any outer-loop spike)

- **Reference §16.11 (credential handling in Mode 2).** Parked per heymishy's #155 reply — genuinely inner-loop implementation detail. Not in any spike; surfaces when Mode 2 is un-deferred post-MVP.

### Deferred — spike-gated (not forcing an answer in /clarify)

Mapped to phase4-5's spike programme per heymishy's #155 detailed reply. Each is deliberately not resolved in this discovery; each will be resolved by its named spike and fed back to this feature at the relevant downstream step.

- **Reference §16.1 (where does the workflow declaration live? Consumer repo / skills repo / both with override semantics?).** Maps to **Spike C1 (repo structure collision) + Spike C3 (update channel versioning and conservative pinning)**. Discovery does not pre-commit; MVP framing covers both a consumer-owned declaration path and an upstream-pinned declaration path.
- **Reference §16.2 (who owns workflow modifications at consumer sites? Add / remove / replace a step? Invariants?).** Maps to **Spike C1 + Spike C3**. Discovery's current Out of Scope (phase-deferred) item "Consumer-side workflow customisation" stands — customisation semantics deferred until base flow demonstrates.
- **Reference §16.3 (CLI versioning vs skill content versioning — independent or coupled? Semantics of `npm update skills-repo`?).** Maps to **Spike C3**. CLI binary identity as a candidate trace field (see Theme F coupling under MVP Scope; disposition under Q6 below) would make the versioning boundary observable post-spike but does not pre-commit the coupling model.
- **Reference §16.5 (non-git-native surfaces — specify or delegate to surface adapter?).** Maps to **Spike C4 (non-git consumer distribution) + Spike D (interaction model for non-technical disciplines)**. Discovery stays git-native for MVP; non-git-native is a named permanent delegation to the existing surface adapter with Spike C4 / D shaping the outcome.
- **Reference §16.8 (upgrade UX — consumer sign-off, breaking-change signalling).** Maps to **Spike C3**. Named in Out of Scope (phase-deferred).
- **Reference §16.9 (consumer customisations — add a step, replace a default with a local version — supported? survives upgrade? governance implications?).** Maps to **Spike C1 + Spike C3**. Named in Out of Scope (phase-deferred).
- **Reference §16.10 (distribution of the CLI itself — npm paradigmatic, fallbacks?).** Maps to **Spike C3**. Named in Out of Scope (phase-deferred).
- **Reference §16.12 (trace-schema alignment — CLI's emitted trace uses the existing platform schema, or a different one?).** Maps to **Spike A (governance logic extractability) / P3 (per-invocation trace anchoring property)**. Resolution is architecturally load-bearing — feeds Theme A's cross-team trace registry, 5.H in phase4-5. Named as an open architectural question gated by Spike A.

### New or materially revised assumptions

- **Assumption 1 materially revised** (Q4 pull-back): softened from "not independent — joint with Theme F" to "structural correctness stands on its own technical merits; Theme F composes where governance bar requires both". Retained one genuinely unvalidated piece (auditor position on direct control).
- **Assumption 8 introduced** (Q1 / original /clarify session): Spike A lands adequately — either shared governance-package core, or evidence that separate implementations are pragmatic. If Spike A produces a third outcome that reshapes mechanism identity itself, this feature's framing re-runs.

### Explicit stance decisions taken in /clarify (to be logged in /decisions)

- **(a)/(b) framing: (a) — CLI is the reference implementation for Spike B2, not the universal governance package.** Pre-settled by operator prior to /clarify; recorded as an explicit stance for the record.
- **Theme F: informs, not delivers.** This feature's outputs (workflow declaration structure, per-node verification contract fields, optional `executorIdentity` trace field) become Theme F inputs. Dual-authority approval routing, RBNZ-ready documentation, and the organisational-independence evidence chain are Theme F's deliverables, not this feature's. Decided in Q4.
- **Workflow declaration carries the verification contract (per-node fields); no separate `verify-contract.json` in MVP.** Decided in Q5. Extractability preserved as a follow-on migration if Spike A surfaces a reason.
- **Trace-schema change scope: one optional field (`executorIdentity`).** No other schema additions in MVP. Decided in Q6.

---

**Next step:** Human review and approval → /benefit-metric
