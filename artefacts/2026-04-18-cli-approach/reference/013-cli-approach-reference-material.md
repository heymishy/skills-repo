# 013 — Reference material: the CLI approach for AI-assisted workflow

**Date:** 2026-04-18
**Intended use:** Comprehensive background for outer-loop discovery. Supplied as input to `/discovery`, `/clarify`, `/benefit-metric`, and `/definition`. Not for human skim reading — designed for machine extraction.
**Scope boundary:** Positions the CLI approach against the existing skills-platform primitives. Does not compare to alternative architectures (a framework-based approach is documented separately by its own author).
**Primary source corpus:** `heymishy/skills-repo/` on disk (README, CHANGELOG, docs, architecture-guardrails, standards, .github/).

---

## 1. Problem statement

### 1.1 The reliability gap in AI-assisted delivery

AI coding agents produce substantial work inside bounded cognitive tasks. They are also **non-deterministic**: given the same apparent inputs on two different occasions, they produce outputs that can differ in sequencing, path discipline, completeness, and compliance with declared procedure. The non-determinism is a property of how LLMs (large language models) behave — output is conditioned on context, and context drifts across runs, sessions, and even within a single extended session.

For casual use this is tolerable. For governed delivery — particularly in regulated environments where an auditor must be able to answer *what was the agent doing, against which instructions, and can I verify that?* — it is not.

### 1.2 What cannot be delegated to the agent

Three categories of work are fragile when delegated to an LLM:

1. **Sequencing** — deciding which skill, step, or tool comes next.
2. **Path discipline** — writing outputs to declared locations, reading inputs from declared locations.
3. **Self-verification** — claiming the work is done without independent evidence.

These are the categories where deterministic machinery outperforms reasoning. A 50-line shell script does them perfectly every time; an LLM does them *mostly* correctly, at variable cost.

### 1.3 What must remain with the agent

Two categories are irreplaceable:

1. **Reasoning** — judgment, inference, synthesis of context.
2. **Context-transformation** — turning one shape of information into another (intent → spec, spec → tests, tests → code, code → review).

These are the jobs LLMs are genuinely good at and where no hand-rolled script substitutes.

### 1.4 The engineering move

Separate the two categories. The agent does what it is good at. A deterministic executor does what it is good at. The two are connected through a declared workflow that neither side can unilaterally rewrite.

---

## 2. Existing platform primitives (prior art)

The skills platform already in production (Phase 1 and Phase 2 complete per `heymishy/skills-repo/README.md`) carries a set of primitives that any new approach must respect or explicitly supersede.

### 2.1 SKILL.md as instruction-set-as-code

A `SKILL.md` file is a natural-language instruction set encoding a complete delivery phase or discipline practice. Versioned. Hash-verified. Loaded progressively at the phase boundary where needed. Not a prompt template — it encodes expected behaviour, quality criteria, and the state-write contract for its phase.

Reference: README §Primitives; `.github/skills/*/SKILL.md`.

### 2.2 Hash verification as the primary audit signal

ADR-003 (Architecture Decision Record 3) is explicit: `standards/index.yml` uses a schema-first model; prompt hash verification is the primary audit signal — the hash is stored in the trace at execution time. This is the mechanism that makes governance *demonstrable* rather than *attested*.

Reference: README §Architecture decisions (ADR-003); `.github/architecture-guardrails.md`.

### 2.3 Assurance gate as structural control plane

`assurance-gate.yml` runs on every pull request. It reads the DoR (Definition-of-Ready) artefact, extracts POLICY.md floors, verifies instruction-set hashes against the trace, evaluates DoD (Definition-of-Done) criteria, posts a verdict, and gates merge. It runs independently of the delivery code it evaluates — maker/checker separation.

Reference: `.github/workflows/assurance-gate.yml`; README §Assurance and traceability.

### 2.4 Evaluation–recording separation

The assurance gate does not commit trace files to the pull-request branch. The gate evaluates and uploads the trace as a workflow artefact; a separate post-merge workflow (`trace-commit.yml`) commits the trace to master. This avoids a HEAD-chase loop (gate commits → new HEAD → gate must re-run) and preserves maker/checker independence.

Reference: CHANGELOG [Unreleased] §Changed 2026-04-13.

### 2.5 Progressive skill disclosure

Skills load at the phase boundary where they are needed, driven by the current pipeline state in `workspace/state.json`. This is the existing workflow-composition mechanism: `/workflow` is the navigator that inspects state and declares which skill runs next.

Reference: README §Skills reference; `workspace/state.json`; `tests/check-workspace-state.js`.

### 2.6 Surface adapter pattern

One governance brain, six delivery-surface adapters (git-native, IaC, SaaS-API, SaaS-GUI, M365-admin, manual). Surface-specific complexity is kept behind a single contract: `execute(surface, context) → result`. The brain never branches on surface type.

Reference: README §Core principles; §Delivery surfaces.

### 2.7 POLICY.md floors

Each discipline directory contains `core.md` (full requirements) and `POLICY.md` (non-negotiable floor — three to five requirements lifted from `core.md`). POLICY.md floors are injected into DoR artefacts at sign-off and verified by the assurance gate on every pull request. Floors cannot be relaxed below their stated minimum.

Reference: README §Standards model; `standards/*/POLICY.md`.

### 2.8 Anti-fork distribution

A named Phase 1 problem statement: *"Updates break forks. The original pattern for adopting a skills-based SDLC is to fork this repository. Once forked, any upstream improvement requires a manual pull and conflict resolution. The update channel is severed at fork time."* The distribution model delivered in Phase 1 enables consumption and upstream sync without forking.

Reference: README §Problems this solves.

### 2.9 Self-improving harness

Delivery signal feeds back into skills and standards through `/improve` (human-driven) and `/improvement-agent` (agent-driven, continuous). Both route any SKILL.md change through a human review gate before it reaches production.

Reference: README §Self-improving harness.

### 2.10 Human approval at every gate

DoR sign-off, assurance-gate merge decision, DoD confirmation — all require a human signal. The platform automates verification; it does not automate judgment. Approval routing is adapter-based (ADR-006): first implementation is GitHub Issue workflow; Jira, Confluence, Slack, and Teams are Phase 3 delivery items.

Reference: README §Core principles; ADR-006.

### 2.11 Evidence-first evaluation

ADR-002: governance gates must use evidence fields, not stage-proxy. Verification reads the full output before claiming pass.

Reference: ADR-002.

### 2.12 Zero external dependencies (where tractable)

`npm test` is a 5-check chain with no external dependencies. `parse-session-timing.js` is zero-dependency Node. A dependency is a cost that has to earn its keep.

Reference: `package.json`; `scripts/parse-session-timing.js`.

---

## 3. The core principle

### 3.1 Unix philosophy, applied

Do one thing well. Match the job to the tool.

An LLM is excellent at reasoning and context-transformation. A script is excellent at deterministic sequencing, path discipline, and verification. These are different tools. A single piece of software that tries to do both will be worse at both.

The engineering response is to structure delivery so that each tool is used only for its strength, composed through a declared contract that neither side can unilaterally rewrite.

### 3.2 Implications

- The agent is never asked to sequence.
- The agent is never asked to verify its own output.
- The agent is never asked to fetch, pin, or hash content.
- The executor is never asked to reason.
- The executor is never asked to interpret user intent.
- The workflow is not held in any actor's head — it is declared.

---

## 4. The four actors

### 4.1 User

Initiator, observer, approver-at-gates. Kicks off a workflow. Watches traces. Is pulled in where the workflow declares an approval gate. Not in the loop for sequencing or step-by-step verification.

Fulfillable by a human operator, a CI system, or a mixed arrangement (human for approvals, CI for observation). Approval gates are routed through the approval-channel adapter (ADR-006 pattern, extended to the CLI context).

### 4.2 Workflow

A **first-class declared artefact**. Checked in, versioned, hash-verifiable. Answers *what happens in what order*.

Declares:

- The graph of skill steps and their allowed transitions (sequential, branching, or back-references).
- The entry condition for each step.
- The skill hashes that must match at runtime.
- The expected output shape for each step.
- The approval gates where human signal is structurally required.
- The approval channel that fulfils each gate.

### 4.3 CLI

**One executor of the workflow** — not the executor. A Unix-style collection of small, sharp, deterministic procedural primitives. Individual commands do one thing well. The collection can be as large as the workflow requires.

Responsibilities:

- Fetch hash-verified content from declared sources.
- Pin content via a lockfile.
- Build the seam envelope (skill body, context, target path, constraint envelope).
- Invoke the agent at the seam.
- Verify artefact shape on return.
- Advance the workflow.
- Emit trace artefacts for independent recording.

Non-responsibilities (explicit):

- Reason about user intent.
- Decide what skill applies next outside the workflow's declaration.
- Commit audit-grade trace records directly.
- Replace human approval at declared gates.

### 4.4 Agent

Supplies **content and reasoning within one bounded step**. Does not sequence. Does not decide what comes next. Reads the skill body, reasons about the input, produces the artefact.

May be a human-driven interactive session, a headless subprocess, or a host exposing the CLI's commands as MCP tools. The choice of modality does not affect the seam contract.

---

## 5. The seam contract

The seam is the boundary between the CLI and the agent. The contract is stable across all agent modalities.

### 5.1 CLI → agent envelope

- **Skill body** — the instruction set the agent must follow. Delivered by value (full text) or by reference (file path). In both cases the CLI verifies the hash matches the workflow's declared hash before handoff.
- **Prior-step artefacts** — the reasoning context accumulated by the workflow.
- **Target path** — where the artefact must land.
- **Output-shape expectations** — what the CLI will check on return.
- **Constraint envelope** — writable paths (sidecar + artefacts directory), allowed tools, forbidden operations.

### 5.2 Agent → CLI return

- Artefact at the target path.
- Optional structured result for next-step consumption.

### 5.3 CLI post-return

- **Shape verification** — artefact matches declared shape.
- **Hash recording** — skill hash, input hash, output reference captured for trace.
- **Advance** — workflow state updated.
- **Trace emit** — a trace artefact is produced for independent recording (NOT committed inline).

### 5.4 Content integrity — hash at execution time

At every seam-build the CLI verifies that the skill content it is about to hand to the agent matches the hash the workflow declares. If the hash does not match, the step aborts. This is the mechanism that makes *what the agent read* independently verifiable post-hoc. It preserves ADR-003's primary audit signal.

---

## 6. Separation of evaluation and recording

Following maker/checker control principles (derived from financial-services separation-of-duties; see README §Conceptual lineage), **the actor that evaluates a step is not the actor that records the evaluation** in durable form.

- The CLI evaluates locally — verifies the artefact shape, checks hashes, confirms the step completed — and emits a trace artefact.
- An **independent runner** (a CI gate, a separate workflow, a second CLI invocation under different credentials) re-verifies the same claim against the same workflow declaration.
- The independent runner's verdict is what commits the trace to durable storage.

This mirrors the existing assurance-gate / trace-commit architecture: `assurance-gate.yml` evaluates on pull request; `trace-commit.yml` records on post-merge. The CLI extends the same pattern to consumer-side execution. It is the consumer-side counterpart to the existing gate, **not a replacement for it**.

Reference: CHANGELOG [Unreleased] §Changed 2026-04-13.

---

## 7. CLI as toolbox

The CLI is not one fat program. It is a collection of small sharp commands, each a Unix-style tool.

### 7.1 Examples of procedural primitives

- `fetch` — retrieve declared content (skills, templates, standards) from the declared source; hash-verify on arrival.
- `pin` — write a lockfile capturing the fetched content hashes.
- `verify` — re-verify hashes against the lockfile; re-check artefact shapes.
- `workflow` — surface current node + available transitions.
- `advance` — take the default transition (or `--to=<step>`).
- `back` — retreat one step (if permitted by the workflow declaration).
- `navigate <step>` — jump to any reachable node.
- `emit-trace` — write a trace artefact for independent recording.
- `upgrade` — re-fetch against a newer source ref, diff, confirm, re-pin.
- `init` — scaffold the sidecar, seed the workflow reference.

### 7.2 The rule that matters

Each individual tool must stay **deterministic and sharp**. The collection can grow. A fat toolbox of sharp tools is fine. A toolbox containing even one tool that attempts reasoning is a Unix violation regardless of size.

---

## 8. Workflow as first-class declared artefact

The workflow is **not ambient** in any actor's head. It is a declared file, committed, versioned, hash-verified.

The declaration is a **graph** of skill steps and their allowed transitions — sequential paths, branches with operator-chosen targets, back-references for retreat. Linear pipelines are one shape; multi-path navigation (`/workflow → any skill anytime`) is another. The CLI executes whatever topology the workflow declares.

### 8.1 Multiple runtimes may consume it

Because the workflow is declarative, more than one runtime can execute it:

- **The CLI** on a developer laptop.
- **A CI system** driving a gate evaluation run.
- **A chat-native runner** (e.g. Copilot Chat consuming the declaration to drive progressive skill disclosure).
- **A future runtime** not yet designed.

Each runtime produces a comparable trace. The workflow is the durable contract.

### 8.2 Relationship to progressive skill disclosure

Progressive skill disclosure (existing platform) is a specific pattern for executing a workflow: skills load at the phase boundary where the workflow declares them needed. The CLI approach is compatible — the CLI is a runtime that honours the same declaration. The workflow artefact unifies CLI-driven and chat-driven execution.

---

## 9. The shape of one step

1. CLI reads the workflow, identifies the next step.
2. CLI builds the seam envelope (fetch skill body, verify hash, gather context, set constraints).
3. CLI hands envelope to agent.
4. Agent reads the skill, reasons, produces the artefact.
5. Agent returns.
6. CLI verifies artefact shape, records hashes, advances workflow state, emits a trace artefact.
7. Independent runner (out-of-band) re-verifies and commits the trace to durable storage.

---

## 10. Integration modalities

Three modes fill the seam. Same contract in all three.

### 10.1 Mode 1 — Human-driven interactive session

CLI writes the envelope as a prompt file and exits. Operator takes the envelope to their agent session (Copilot Chat, Claude Code, Cursor). Agent does the cognitive work. Operator invokes the next CLI command.

Properties: no credentials required, no vendor coupling, human is the transport between CLI and agent. Suitable for local development. Lowest infrastructure cost.

### 10.2 Mode 2 — Headless subprocess or API call

CLI invokes an agent non-interactively — as a subprocess (e.g. `claude -p ... --allowed-tools ...`) or via an inference API. Envelope passes in; constraint envelope enforced at the tool level; artefact lands at the target path; CLI verifies.

Properties: no human in the loop; suitable for CI pipelines; requires credential management; couples to a specific agent runtime.

### 10.3 Mode 3 — CLI-as-MCP-server (within-step)

The agent hosts; CLI commands are MCP (Model Context Protocol) tools. The agent uses CLI tools (fetch, verify) as part of its own reasoning **within a single step**. The workflow still drives sequencing — the agent cannot invoke a step outside the declared order.

Properties: useful when reasoning spans multiple tool uses within a single cognitive step. Does not grant the agent workflow-sequencing authority. Within-step composition only.

### 10.4 Invariants across modes

- The seam envelope is hash-integrity-verified.
- The workflow (not the agent) drives sequencing.
- The constraint envelope is enforced.
- Trace emit is independent of mode.

---

## 11. Automation and pipelines

### 11.1 CLI as automation lingua franca

Every pipeline tool already in existence — shell, Make, GitHub Actions, Jenkins, cron — drives CLIs via exit codes, stdout, stderr. The CLI approach inherits every pipeline pattern that already exists. No new DSL, no new protocol.

### 11.2 Specific properties

- **Same tool in dev and in CI.** Reproducibility does not depend on "works on my machine."
- **Composability for free.** `skills-repo fetch && skills-repo verify && skills-repo advance` is a shell pipeline.
- **Exit codes are exit codes.** Pipeline tools consume them directly.

### 11.3 Approval gates remain human

Where the workflow declares a human approval gate, it is routed to the configured approval channel (GitHub Issue, Jira, Slack, Teams) via the ADR-006 approval-channel adapter. CI can fulfil structural evaluation; it cannot substitute for human approval at gates that declare one.

---

## 12. Distribution and consumption

### 12.1 Non-fork property

The platform's Phase 1 commitment is that consumers do not fork the skills repo in order to adopt it. Forking severs the update channel.

The CLI approach preserves this property. A consumer installs the CLI from a package registry (npm). The CLI materialises a sidecar (`.skills-repo/` or equivalent) in the consumer's repo, pointing at declared upstream content and pinning it via a lockfile. The consumer never edits the skills repo to adopt it.

### 12.2 Upgrade semantics

`skills-repo upgrade` (or equivalent) re-fetches from the declared upstream source at a newer ref, computes the diff against the current lockfile, surfaces the changes for consumer review, and on confirmation re-pins. Consumer customisations (if supported) are sidecar-local and survive upgrade.

### 12.3 POLICY.md floors across upgrades

Floors present in the upstream skills repo are propagated at `init` and at each `upgrade`. They cannot be relaxed below the stated minimum by the consumer. This preserves the existing platform's floor-invariance guarantee.

---

## 13. Surface adapter compatibility

The CLI approach as described is most naturally realised on a git-native consumer (a repository with a sidecar directory). It composes differently on non-git-native surfaces.

### 13.1 Git-native (reference case)

Sidecar is a directory under the consumer's repo. Artefacts are files. Lockfile is a committed JSON file. Trace emits are files destined for post-merge commit by an independent runner. Paradigmatic case.

### 13.2 Non-git-native surfaces

For IaC (infrastructure-as-code), SaaS-API, SaaS-GUI, M365-admin, and manual surfaces, the *sidecar* and *artefact* concepts must be interpreted through the existing surface adapter contract (`execute(surface, context) → result`). The adapter resolves what "sidecar" and "artefact" mean for that surface (a cloud blob, a tenant configuration object, a checklist entry in a tracking system, etc.).

This is an **open question**: whether the CLI approach specifies the surface-specific sidecar semantics or delegates them to the existing adapter layer. See §16.

---

## 14. Mapping to existing platform primitives

| 012 / 013 term | Maps to existing platform primitive |
|---|---|
| Workflow (declared artefact) | `/workflow` skill + `workspace/state.json` + progressive skill disclosure; extended to an explicit declarative file at the workflow level |
| CLI (toolbox) | Generalisation of `scripts/` + `tests/check-*.js` + `npm test` + assurance-gate invocations, unified behind a consumer-runnable binary |
| Agent | Coding agent in Copilot agent mode (inner loop); operator + Copilot Chat (outer loop) |
| Seam contract | Formalisation of the existing skill-body-plus-context-plus-state handoff at phase boundaries |
| Constraint envelope | `artefacts/` read-only instruction + POLICY.md floors + CODEOWNERS, extended to a runtime-enforced envelope at the seam |
| CLI-side verification | Consumer-side counterpart to `assurance-gate.yml` — same properties, different execution context |
| Trace emit + independent record | Extension of the existing `assurance-gate.yml` / `trace-commit.yml` split to consumer-side runs |
| Sidecar | `artefacts/` + `workspace/` in the existing platform; the CLI materialises equivalent structure in consumer repos |
| Upgrade | Formalisation of the Phase-1 non-fork distribution commitment |
| Approval gates | ADR-006 approval-channel adapter pattern, extended to all runtime modes |

---

## 15. What the CLI approach is not

- **Not a replacement for SKILL.md.** SKILL.md remains the unit of governed agent behaviour. The CLI delivers SKILL.md content hash-verified; it does not alter or replace it.
- **Not a replacement for the assurance gate.** The CLI is a consumer-side executor. The assurance gate is the independent recording/enforcement point. Both are needed.
- **Not a framework running inside the agent.** The CLI is a separate process with its own permissions, filesystem scope, and identity. Critical for the control-plane property.
- **Not a new governance model.** Governance-by-demonstration, hash verification, POLICY.md floors, human approval at gates — all preserved. The CLI is machinery that enforces what the existing model declares.
- **Not a vendor-specific integration.** The seam contract is agnostic. Copilot, Claude Code, Cursor, and headless API calls all fill the same seam.
- **Not a sequencing authority for the agent.** The workflow drives sequencing. The CLI executes it. The agent reasons within a step but never outside it.

---

## 16. Open questions for discovery

Concrete questions a discovery artefact must address. Each is a decision that shapes subsequent design.

1. **Where does the workflow artefact live?** In the consumer's repo? In the skills repo shipped via the sidecar? In both with override semantics?

2. **Who owns workflow modifications at consumer sites?** Can a consumer add a step? Remove one? Replace a skill? What invariants (POLICY.md floor coverage, approval-gate presence) must survive such modifications?

3. **How does CLI versioning relate to skill content versioning?** Independently versioned, or coupled? What does `npm update skills-repo` semantically mean — new CLI, new skills, or both?

4. **Where is hash verification enforced — before envelope build, after artefact return, or both?** Implications for audit-chain completeness.

5. **How does the CLI approach interact with non-git-native surfaces** (IaC, SaaS-API, SaaS-GUI, M365-admin, manual)? Does the CLI specify these or delegate to the surface adapter?

6. **What is the relationship between the CLI's verify step and the existing assurance-gate CI step?** Redundant, complementary, or subsumption? The current proposal is *consumer-side counterpart to the independent gate*; this must be validated against the gate's actual responsibilities.

7. **Is the CLI a mandatory execution path, or one of several?** Copilot Chat today drives workflows without a CLI. Does adopting the CLI approach supersede that, or does the workflow artefact allow both?

8. **What is the upgrade UX?** What does a consumer see, sign off, and commit during a skill content upgrade? How is a breaking change signalled and handled?

9. **How are customisations handled?** A consumer may want to add a step, or replace a default with a local version. Supported? Survives upgrade? Governance implications?

10. **Distribution of the CLI itself.** npm is the paradigmatic case. Are there consumers who cannot run npm-installed Node binaries? Fallback distribution?

11. **Credential handling in mode 2 (headless).** Where do inference-API credentials live? How are they scoped? How do they interact with maker/checker separation?

12. **Trace-schema alignment.** Does the CLI's emitted trace use the existing platform's trace JSON schema, or a different one? Implications for fleet aggregation.

---

## 17. Primary source references

| Topic | File in `heymishy/skills-repo/` |
|---|---|
| Platform principles | `README.md` (§Mission, §Core principles, §Audience and scale) |
| Architectural decisions | `.github/architecture-guardrails.md` (ADR-001 through ADR-006) |
| Assurance gate evaluation | `.github/workflows/assurance-gate.yml` |
| Trace-commit separation | `.github/workflows/trace-commit.yml`; `CHANGELOG.md` [Unreleased] §Changed 2026-04-13 |
| Skills library | `.github/skills/*/SKILL.md` |
| Standards and floors | `standards/*/core.md`, `standards/*/POLICY.md`; `standards/index.yml` |
| Pipeline state schema | `workspace/state.json`; `tests/check-workspace-state.js` |
| Surface adapters | `src/` subdirectories per surface; README §Delivery surfaces |
| Approval-channel adapter pattern | ADR-006; README §Fleet and multi-team operation |
| Self-improving harness | `.github/skills/improve/SKILL.md`; `.github/skills/improvement-agent/SKILL.md` |
| Non-fork distribution | README §Problems this solves |
| Audit framework (T3M1) | README §Assurance and traceability; `docs/MODEL-RISK.md` |
| Conceptual lineage | README §Conceptual lineage (Karpathy, BMAD, OpenHarness, maker/checker, IAM) |

---

## 18. Document status

- **Draft** — 2026-04-18.
- **Intended flow:** input to `/discovery` (outer-loop first skill) and subsequent outer-loop skills through DoR sign-off.
- **Maintenance:** this document should be updated as discovery surfaces answers to §16 open questions. Current content reflects state at 012 / 013 drafting time.
- **Vocabulary policy:** acronyms expanded on first use, consistent with the existing platform's first-use-descriptor standard.
