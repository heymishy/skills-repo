# Discovery: CLI approach for AI-assisted workflow

<!--
  USAGE: Produced by the /discovery skill. The structured outcome of early exploration —
  what problem we're solving, for whom, and what success looks like at the edges.

  Status must be "Approved" before /benefit-metric can proceed.
  MVP scope and out-of-scope fields are the primary review targets.

  To evolve: update this template, open a PR, tag BA lead + product lead.
-->

**Status:** Draft — awaiting approval
**Created:** 2026-04-18
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (operator-driven via /discovery)

**Reference material consumed:** `reference/012-cli-approach-explained-v2.md` (overview) and `reference/013-cli-approach-reference-material.md` (comprehensive) — both read in full before the first conversational question.

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
- **Minimum viable command set — `init`, `fetch`, `pin`, `verify`, `advance`, `emit-trace`.** The `upgrade` command is deferred until the first consumer has a lockfile to upgrade from.
- **One declared workflow covering one outer-loop phase.** The first workflow declaration does not need to cover the full pipeline — just enough to prove the seam contract (envelope build, hash verification, artefact shape verification, state advance, trace emit) works end-to-end for one step.
- **Independent recording is the existing assurance gate.** The MVP does not introduce a new independent runner. It emits trace artefacts that the current `assurance-gate.yml` and `trace-commit.yml` split re-verifies and commits — the consumer-side counterpart slots into the existing maker/checker architecture.

**What must be true for the first person who uses it to find it useful:**

1. The skill body content handed to the agent matches the workflow's declared hash. A mismatch aborts the step. This preserves ADR-003's audit signal at the consumer-side seam.
2. Sidecar install does not require forking the skills repository. The non-fork constraint (`product/constraints.md` §1) is preserved.
3. The artefact produced by the agent lands at the declared target path, or the CLI surfaces the gap. Path discipline is removed from agent responsibility.
4. Workflow state advances only after shape verification succeeds. Self-verification is removed from agent responsibility.
5. The trace artefact emitted by the CLI is independently re-verifiable by the existing assurance gate against the same workflow declaration. Maker/checker is preserved.
6. The operator does not have to decide what the next step is. `advance` tells them; the workflow artefact is authoritative.

## Out of Scope

**Architectural non-goals (permanent — not deferred):**

- **Replacing SKILL.md as the unit of governed agent behaviour.** SKILL.md remains the instruction set. The CLI delivers SKILL.md hash-verified; it does not redefine, mutate, or compile it. Excluded because SKILL.md as-code is the platform's governance anchor.
- **Replacing the assurance gate.** The CLI is a consumer-side executor. `assurance-gate.yml` plus `trace-commit.yml` remain the independent recording and enforcement point. Excluded to preserve maker/checker: the evaluator-recorder split is structurally non-negotiable.
- **Giving the agent sequencing authority.** The agent never decides what step comes next, even in Mode 3 (CLI-as-MCP (Model Context Protocol)-server). Workflow-driven sequencing is the reliability property the architecture rests on. Excluded by definition.
- **New governance model.** No new floors, no new gate semantics, no new approval model. The CLI approach enforces what the existing governance model declares; it does not relax or extend POLICY.md floors or approval-gate semantics.
- **Vendor-specific integration.** The seam contract is agnostic. The feature does not ship a Copilot-only, Claude-only, or Cursor-only path. Excluded to keep the seam portable across agent runtimes.

**Phase-deferred (MVP boundary — valid follow-ons, not in this feature):**

- **Mode 2 (headless subprocess or inference-API) and Mode 3 (CLI-as-MCP-server).** Only Mode 1 ships first. Excluded because Mode 2 pulls in credential handling, vendor-runtime coupling, and CI-side constraint enforcement — all of which deserve their own discovery.
- **Non-git-native surfaces** (IaC, SaaS-API, SaaS-GUI, M365-admin, manual). The MVP is git-native. Sidecar semantics on other surfaces are resolved through the existing surface adapter, which itself may need extension — that is downstream work.
- **Consumer-side workflow customisation** (adding a step, replacing a skill, removing a step). Customisation is reference §16.2 open question. Deferred until the base non-customised flow demonstrates.
- **Upgrade UX for breaking skill-content changes.** The `upgrade` command exists conceptually; breaking-change signalling and the consumer sign-off experience are deferred (reference §16.8).
- **CLI distribution fallbacks** for consumers who cannot run npm-installed Node binaries. npm is the paradigmatic case for MVP. Alternate distributions (standalone binary, OCI image, other) are deferred.

## Assumptions and Risks

**Assumptions (unvalidated — if any are wrong, reshape or stop):**

1. **Auditors will accept consumer-side evaluation provided the recorder is independent.** The maker/checker split at consumer-side is structurally acceptable. If an auditor's position is that all evaluation must run under their direct control (not just recording), the CLI's "consumer-side counterpart" claim does not clear the governance bar.
2. **The existing `assurance-gate.yml` can re-verify a CLI-emitted trace with minor-to-no modification.** The current trace JSON schema is close enough to what the CLI emits that no new parallel gate is required. If the gate needs substantial rework, the MVP's "slot into existing maker/checker" claim becomes a separate workstream.
3. **Mode 1 (human-driven interactive session) is sufficient to validate value.** A feature that ships only Mode 1 is useful enough to one real consumer to justify continuing. If demonstrated value requires Mode 2 (headless or API), the MVP is mis-scoped.
4. **The seam envelope (skill body + prior artefacts + target path + output-shape expectations + constraint envelope) is sufficient context for agents in Mode 1.** If Copilot Chat, Claude Code, or Cursor sessions need ambient context the envelope does not deliver, the seam contract is under-specified.
5. **Workflow declarations can be authored and maintained as a first-class artefact without becoming a second SKILL.md problem.** Authoring burden is bounded; drift between the declared workflow and the actual skill library is manageable. If maintaining workflows turns out to be as expensive as maintaining skills, the governance surface area doubles.
6. **The coreutils-style "small sharp commands" discipline is sustainable.** CLI commands stay deterministic and do not accrete reasoning over time. If a future maintainer adds a `fetch-and-reformat` command, the Unix-violation safeguard is behavioural rather than structural.
7. **Progressive skill disclosure (existing) and CLI-driven workflow execution (new) compose cleanly.** A chat-native session consuming the workflow declaration produces comparable behaviour to the CLI consuming it. Asserted in reference §8.2 but not yet demonstrated.

**Risks (what could make this not worth building):**

1. **Adoption friction narrows the audience.** npm install plus sidecar plus lockfile plus new commands is more overhead than the current chat-native adoption path. If consumers with low governance burden prefer the lighter path, the CLI approach serves regulated delivery only — a narrower consumer base than the current platform targets.
2. **Non-fork adoption is not validated by the MVP.** The MVP flow demonstrates one outer-loop step. It does not necessarily exercise the upgrade path — which is where the non-fork property actually earns its keep. The feature's signature adoption claim could ship un-validated.
3. **Independent runner dependency at consumer sites.** Maker/checker requires an independent recorder. Consumers without CI (a real slice of the target base) get local-only traces — not audit-grade. The approach is unavailable to them without CI already in place.
4. **Double composition path fragments the improvement signal.** Chat-native progressive skill disclosure plus CLI-driven workflow execution equals two surfaces for every skill, two trace shapes, two places the improvement loop must reason about failure patterns. Could dilute the self-improving-harness signal.
5. **Constraint envelope is declarative-only in Mode 1.** The CLI writes a prompt file; the operator takes it to their agent session; the agent may fetch or read outside the declared envelope. The "forbidden operations" list is a convention, not runtime-enforced. This weakens the seam claim in Mode 1 specifically — which is also the MVP's only mode.
6. **Consumer customisation semantics are unresolved** (reference §16.2, §16.9). If a real consumer wants to add a step and the answer is "not supported yet", the non-fork property loses credibility: they fork to customise, which is exactly the failure mode the platform was designed to prevent.
7. **Second platform-team maintenance surface.** Workflow declarations plus CLI command set equals a new maintenance surface on top of skills and standards. Finite platform-team bandwidth; could delay the improvement-loop throughput for the existing surface.

## Directional Success Indicators

1. **Hash verification at envelope build actually fires on a mismatch** — rather than being code that runs but never blocks. A deliberate mismatch (tampered skill content) aborts the step with a clear error.
2. **A consumer adopts via sidecar plus lockfile without forking the skills repository.** The install path is npm-install plus `init`; the consumer's own repository contains no copy of SKILL.md or POLICY.md files — only the lockfile plus any declared customisations.
3. **The trace emitted by the consumer-side CLI is accepted by the existing assurance gate on PR** without a new parallel gate being introduced. Re-verification runs; verdict posts; the merge decision follows the existing maker/checker flow.
4. **Agent outputs land at declared target paths on the first attempt, or the CLI surfaces the gap before it propagates.** The "artefact in the wrong place" failure mode stops showing up in operator-visible outcomes.
5. **Two runs of the same workflow with the same skill content produce traces whose skill-body hashes match.** Demonstrability: an auditor can confirm "the instruction set that ran on Monday is the instruction set that ran on Friday" without engineering help.
6. **An auditor / risk reviewer can answer "what governed this action, which standards applied, was the output validated" from the trace plus workflow declaration alone** — no engineering assistance. This is the existing platform success outcome (`product/mission.md` §4) extended to consumer-side execution.
7. **Upgrade propagates a skill change from upstream to a consumer without forking.** `skills-repo upgrade` re-fetches, diffs, surfaces for review, re-pins. The POLICY.md floor in the upgraded content applies on the next run.
8. **A second runtime consumes the same workflow declaration and produces a comparable trace.** A chat-native harness (Copilot Chat driving progressive skill disclosure) and the CLI, both reading the same workflow artefact, produce traces a human reviewer cannot structurally distinguish at the audit level. This validates the "workflow as first-class, runtime-agnostic" claim.
9. **The operator does not narrate the next step.** They run `advance` and the CLI tells them. The shift of sequencing responsibility is observable in session logs — "what's next?" questions directed at the agent decline in frequency and are directed at the CLI instead.
10. **CLI commands stay sharp over time.** A six-month review finds no command has accreted reasoning behaviour. The Unix-violation guardrail holds under contribution pressure.

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

**Next step:** Human review and approval → /benefit-metric
