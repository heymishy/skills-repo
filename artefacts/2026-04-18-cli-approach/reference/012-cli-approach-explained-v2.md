# 012 — The CLI approach, explained (v2)

**Date:** 2026-04-18
**Supersedes:** 009
**Purpose:** Overview of the CLI approach to AI-assisted workflow. Standalone. Does not compare to alternative architectures.

---

## One-sentence version

Match the job to the tool. Agents do reasoning and context-transformation. A CLI (command-line interface) is a toolbox of deterministic procedural primitives. A declared workflow composes them. The user observes and approves at gates.

---

## Why this shape exists

AI agents are **excellent** at two things:

- **Reasoning** — judgment, inference, synthesis.
- **Context-transformation** — turning one shape of information (intent, spec, code, review) into another.

Both are genuinely hard, and a large language model does them better than any hand-rolled script. Irreplaceable.

AI agents are **unreliable** at one thing that matters here:

- **Following instructions deterministically.** Same instructions, same agent, two moments — two different outputs. Not because the agent is misbehaving; because LLM output is context-dependent and context drifts. Sequencing, path discipline, not-skipping-step-4, checking-the-output-landed-where-expected — all fragile.

Engineering move: **don't ask the agent to do anything you can do deterministically instead.**

---

## The four actors

| Actor | Job | Competent at |
|---|---|---|
| **User** | Initiator, observer, approver-at-gates. Routed via approval-channel adapters (not limited to CI). | Final judgment. Authorising scope. Breaking ties. |
| **Workflow** | Declared, checked-in, versioned, hash-verifiable sequence of skills and tools. Executable by any compatible runtime. | Answering *what happens in what order*. |
| **CLI** | **One** executor of the workflow — a toolbox of deterministic procedural primitives (fetch, pin, verify, advance, emit-trace). | Procedural work, repeatably, with the same result every run. |
| **Agent** | Supplies content and reasoning within one bounded step. | Cognitive transformation. |

Each layer does the job it is structurally suited to. Nothing else.

The CLI is *an* executor of the workflow, not *the* executor. The workflow is the durable artefact; the CLI is one way to run it. Other runtimes — a CI (continuous integration) gate, a different CLI implementation, a chat-native runner driving progressive skill disclosure — can consume the same declared workflow and produce comparable behaviour.

---

## The seam contract

The CLI hands a structured envelope to the agent at each cognitive step. The envelope is content-integrity-verified.

**CLI → agent:**

- **Skill body** — delivered by value or by reference, hash-verified against the workflow's declared hash before handoff.
- **Prior-step artefacts** forming the reasoning context.
- **Target path** for the output.
- **Output-shape expectations** that the CLI will check on return.
- **Constraint envelope** — writable paths (sidecar + artefacts directory), allowed tools, forbidden operations.

**Agent → CLI:**

- Artefact at the target path.
- Optional structured result for next-step consumption.

**CLI after return:**

- Verifies artefact shape against expectations.
- Records the skill hash, input hash, and output reference for later audit.
- Emits a trace artefact. Does **not** commit the trace inline — see *Separation of evaluation and recording*.

Hash verification at envelope-build time is the audit anchor: whatever the agent read matches what the workflow declared. **Hash-at-execution-time is the primary audit signal.** It preserves the property the existing skills platform relies on (ADR-003).

---

## The CLI is a toolbox, not one tool

A common first reaction to "CLI as control plane" is to imagine one fat program. That is not the shape.

The CLI is a Unix-style **collection of small sharp commands**. `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emit-trace`, `upgrade`, and more as the workflow requires. Each command does one procedural thing well.

`coreutils` ships around a hundred commands and nobody calls that a Unix violation. Same logic applies.

The discipline that matters is not the size of the toolbox. It is that **every individual tool stays deterministic and sharp**. The trap is tools that try to do reasoning — those are Unix violations no matter how small.

---

## The workflow is first-class

The workflow is a declared artefact: checked in, versioned, hash-verifiable. It is not ambient in the agent's head or the user's head.

It declares the **graph** of skill steps and their allowed transitions (sequential, branching, or back-references), the entry condition for each step, the skill hashes that must match at runtime, the expected output shape for each step, the approval gates where human signal is structurally required, and the approval channel that fulfils each gate.

Being first-class means the workflow can be consumed by more than one runtime. The CLI runs it on a developer laptop. A CI system runs the same workflow against a pull request. A chat-native harness can consume it to drive progressive skill disclosure in an interactive session. Same declared artefact, same structural sequence, different executors.

---

## The shape of one step

1. CLI reads the workflow, identifies the next step (or surfaces options if the current node declares multiple transitions — operator picks).
2. CLI builds the seam envelope (fetch skill body, verify hash, gather context, set constraints).
3. CLI hands envelope to agent.
4. Agent reads the skill, reasons, produces the artefact.
5. Agent returns.
6. CLI verifies artefact shape, records hashes, advances workflow state, emits a trace artefact.
7. An **independent runner** (out-of-band) re-verifies and commits the trace to durable storage.

---

## Separation of evaluation and recording

The CLI's step-6 verify-and-advance is a consumer-side action. It runs on the operator's machine, in the operator's context. On its own it is not audit-grade.

For audit-grade assurance, **evaluation and recording are architecturally separated**, following maker/checker control principles: the actor that evaluates is not the actor that commits the record. The CLI evaluates locally and emits a trace artefact. An **independent runner** — a CI gate, a separate workflow, a second CLI invocation under different credentials — re-verifies the same claim against the same workflow declaration. That independent verification is what commits the trace to durable storage.

This mirrors the existing platform's assurance-gate / trace-commit split (two workflows, one per role). The CLI is the **consumer-side counterpart** to the independent gate — same contract, different execution context. Not a replacement for it.

---

## Agent integration at the seam

The seam is modality-agnostic. The contract is the same across all three modes.

1. **Human-driven interactive session (local dev).** CLI writes the envelope as a prompt file and exits. Operator takes it to their agent session (Copilot Chat, Claude Code, Cursor). Agent does the cognitive work. Operator invokes the next CLI command. No credentials, no vendor coupling.

2. **Headless subprocess or API call (CI).** CLI invokes an agent non-interactively — as a subprocess (`claude -p ... --allowed-tools ...`) or via an inference API — with the envelope on input and the constraint envelope enforced at the tool level. Artefact lands; CLI verifies. No human.

3. **CLI-as-MCP-server (within-step, host-driven).** The agent hosts; CLI commands are MCP (Model Context Protocol) tools. The agent uses CLI tools as part of its own reasoning **within a single step**. The workflow still drives sequencing — the agent cannot invoke a step outside the declared order. Within-step composition only.

Invariants across modes: the seam envelope is hash-integrity-verified; the workflow (not the agent) drives sequencing; the constraint envelope is enforced; trace emit is independent of mode.

---

## Automation and pipelines

A CLI is the lingua franca of automation. Shell, Make, GitHub Actions, Jenkins, cron — all drive CLIs. Exit codes, stdout, stderr. Every pipeline tool already speaks this contract.

- **Same tool in dev and in CI.** The binary a developer runs on their laptop is the binary a CI runner invokes. Reproducibility stops depending on "works on my machine."
- **Composability for free.** `skills-repo fetch && skills-repo verify && skills-repo advance` is a shell pipeline. No new DSL.
- **Approval gates remain human.** Where the workflow declares a human approval gate, it is routed to the configured approval channel (GitHub Issue, Jira, Slack, Teams) via the approval-channel adapter. CI can fulfil structural evaluation; it cannot substitute for human approval at gates that declare it.

---

## The savant analogy

Agents behave like an extraordinarily capable but unreliable specialist. Brilliant at bounded cognitive work. Variable at planning, sequencing, self-verification.

You hand such a specialist one bounded task at a time, inside a schedule written by someone else, with deterministic infrastructure around them.

**Workflow = the schedule. Agent = the savant. CLI = the procedural infrastructure around both.**

---

## Load-bearing claim

Agents are reliable where asked to reason, and fragile everywhere else. A workflow is reliable only if the non-reasoning parts don't flow through the agent. The CLI approach is the engineering response: match job to tool, keep each tool sharp, compose through a declared workflow, separate evaluation from recording, and leave only the reasoning to the reasoner.
