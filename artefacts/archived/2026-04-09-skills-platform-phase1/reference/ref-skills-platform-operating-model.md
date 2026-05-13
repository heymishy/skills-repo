# Reference: Skills Platform — Operating Model

**Document type:** Discovery reference material — operating model and control framework  
**Drop into:** `artefacts/2026-04-09-skills-platform-phase1/reference/`  
**Read alongside:** `ref-skills-platform-phase1-2.md`, `ref-skills-platform-standards-model.md`  
**Last updated:** 2026-04-09 (Managed Agents + context window patterns)

> **Note for the discovery skill:** This document defines how the platform operates at runtime — the control model, governance boundaries, failure mode detection, and regulatory framing. It does not define what to build (see Phase 1–2 document) or what standards apply (see standards model document). Read all three before generating discovery artefacts.

---

## 1. What the platform is and is not

The skills platform is a governed instruction delivery system. At runtime, it assembles the correct set of SKILL.md instructions for the agent working on a given story, gates the agent's outputs against defined policy floors, and produces an auditable trace of what instruction set governed which action.

It is not a process burden. It replaces undisciplined ad-hoc prompting with a structured, versioned, auditable equivalent. For a risk audience: the platform is not introducing a new control; it is making an existing, informal control explicit, hashable, and traceable.

---

## 2. The outer loop model

The outer loop is the human-operated planning and governance cycle. The intended pattern is one outer loop cycle per session — this is when context pressure typically stays below the 75% threshold. Nothing technically enforces this; the platform is designed so a new session can resume cleanly from `workspace/state.json` at any phase boundary, making session breaks low-friction rather than trying to enforce them. Each cycle writes a complete checkpoint at each phase boundary. A new session resumes from the checkpoint; no conversation replay is required.

**Phase A — Discovery and planning**

Each step below is a phase boundary. The skill responsible for that phase writes its section of `state.json` at completion before handing off to the next phase.

1. **Discovery** — product intent translated into structured problem statement, benefit metric, and delivery surface classification → writes `state.cycle.discovery`
2. **Spike** (if required) — bounded investigation of unknowns, time-boxed, producing a recommendation artefact → writes `state.cycle.spike`
3. **Story decomposition** — epics broken into stories sized for inner loop execution → writes `state.cycle.stories`
4. **Estimation** — effort estimates produced using SKILL.md calibration data; estimation gaps are governance signals, not scheduling noise
5. **Definition of Ready gate** — each story reviewed against DoR criteria before entering the inner loop queue → writes `state.cycle.readiness`
6. **Phase A review** — outer loop participants confirm the backlog is ready for execution

**Phase B — Per-story governance**

For each story entering the inner loop, the dev agent writes `state.execution` at story start and updates it at completion.

1. Test plan produced before implementation begins
2. Story-level DoR confirmed (test plan present, AC clear, delivery surface identified, dependencies resolved)
3. Story released to inner loop queue

**Human override — `/checkpoint`** <!-- ADDED: 2026-04-09 -->

The human operator monitors token usage via the session hover indicator. If context pressure approaches 75% before a natural phase boundary, the operator invokes `/checkpoint` to trigger the current phase-boundary skill to write its state and exit cleanly. This is the escape valve, not the primary mechanism — phase boundaries are the structural trigger.

---

## 3. The inner loop model

The inner loop is agent-executed delivery. The agent works from the story spec, governed by the assembled skill set for that story's delivery surface and discipline context.

The inner loop never modifies the story spec. The spec is the benchmark. The inner loop hill-climbs toward the spec — it does not redefine success.

**Progressive skill disclosure — context management** <!-- ADDED: 2026-04-09 -->

Skills are loaded progressively across inner loop phases, not all at once. This is the primary context management mechanism for the inner loop — token budget is managed by only having the relevant skills in context at each phase.

- **Session start:** `copilot-instructions.md` base layer only
- **Story context confirmed:** discovery-phase skills loaded
- **Implementation begins:** implementation skills loaded on demand
- **Review phase:** review skill loaded
- **Assurance phase:** assurance skill loaded

Execution skills do not monitor token counts — the phase sequence controls disclosure. The on-demand skill loading mechanism (P1.1) is the delivery mechanism; progressive disclosure is the formalised pattern for using it as context management.

**Delivery surface adapter** <!-- ADDED: 2026-04-09 -->

The brain's relationship to any delivery surface is through a uniform interface: `execute(surface, context) → result`. The brain never branches internally on surface type. Surface-specific execution complexity lives behind the adapter interface. The assurance agent interprets the result; it does not know whether the adapter ran a CI pipeline or produced a manual checklist.

Surface type is resolved before the adapter is called via one of two paths — both are permanently valid:

- **Path A — EA registry** (when available and integrated): registry is queried at Phase A start; surface type is injected from registry data; no squad input required
- **Path B — `context.yml` explicit declaration** (when registry not available or not integrated): squad tech lead declares surface type directly in `context.yml`; treated as equally authoritative; the squad is accountable for the accuracy of the declaration

The adapter receives a surface type and executes. It does not know or care which path resolved the surface type.

For stories spanning multiple surfaces, both paths support multiple surface types: Path A detects them from registry cross-platform dependencies; Path B requires the squad to declare `delivery-surface: [git-native, saas-gui]` explicitly. The discovery skill handles multiple DoD gates either way.

| Surface type | Adapter implementation | Verification | DoD gate |
|---|---|---|---|
| git-native | Code + PR + CI | Automated test suite + coverage | PR review + trace hash |
| IaC | Terraform/Pulumi + PR | Plan diff review + policy check | PR review + trace hash |
| SaaS-API | API call sequence | Response validation + idempotency | Trace hash + manual spot check |
| SaaS-GUI | Step-by-step instruction set | Screenshot evidence + manual verification | Manual sign-off + trace hash |
| M365-admin | Admin centre instruction set | Configuration export diff | Manual sign-off + trace hash |
| Manual | Runbook | Human execution record | Manual sign-off |

---

## 4. The three-agent governance loop

Three agents operate in sequence on each inner loop story. Independence is the intent — and the CI gate provides an audit backstop — but the honest characterisation is **procedural with audit verification**, not fully structural.

**What the CI gate actually verifies:** Three traces exist with the correct structure and a valid `inProgress`→`completed` transition. It cannot verify that the traces were produced by genuinely independent sessions. Trace content, including session IDs, is self-reported by the agents. In practice, in a VS Code + Copilot Agent mode environment, all three agents are run by the same human. Nothing technically prevents running all three in one session and writing three separate trace files. The independence is the human's decision to start a new session — that is procedural, enforced by team practice and the platform team's review of the trace structure, not by the architecture.

The docs elsewhere claim independence is "structural." That claim is accurate for session independence being unverifiable — the CI gate cannot fake structural guarantees it doesn't have. The independence is real in practice when the operator follows the pattern; the docs should not overstate the enforcement mechanism.

**Dev agent** — implements the story. Emits trace events during execution (not on completion). Writes `state.execution` at completion.

**Review agent** — reviews the dev agent's output against story AC and DoR/DoD criteria. Cannot modify the output; can only verdict and comment. Emits its own trace events during review.

**Assurance agent** — independently verifies the review agent's verdict against POLICY.md floors. Two-check gate: eval suite must pass at ≥ threshold AND full score must be ≥ watermark in `workspace/results.tsv`. Records hash of assembled SKILL.md set in the assurance trace.

The cryptographic prompt hash in the assurance trace is the **audit anchor** — it permanently records what instruction set governed execution. It is not a tamper prevention mechanism. See ADR-003 and §5 control model for the full scope statement.

---

## 5. Control model

The control model distinguishes between **structural checks** (the CI gate enforces these independently of agent behaviour — they cannot be bypassed by the agent) and **audit checks** (the gate records these — they detect what happened but do not prevent a determined actor with repo write access from bypassing them).

| Failure mode | Type | Metric | Detection mechanism | Enforcement point |
|---|---|---|---|---|
| Instruction drift (accidental) | Audit | Prompt hash mismatch against registry | Assurance agent hash check | Flagged in trace — warrants investigation |
| Instruction drift (deliberate) | Audit | Hash mismatch + PR bypass evidence | Drift detection cross-squad | Platform team investigation — RBNZ finding |
| Policy floor breach | Structural | AC or DoD criteria not met | Assurance agent criteria check | Story blocked, trace flagged |
| Surface type mismatch | Structural | Story classified as wrong surface | DoR check at Phase B | Story returned to Phase A |
| Estimation calibration gap | Audit | Actual vs estimated velocity divergence > threshold | Outer loop Phase A review | Calibration update to EVAL.md |
| Regression | Structural | Score below watermark | Assurance agent watermark gate | Change reverted, failure logged |
| Standards non-compliance | Structural | Discipline standard floor breach | Standards composition check at skill injection | Story blocked at DoR |
| Supply chain compromise (distributed package) | Audit | Hash mismatch of received skill package against platform registry | Platform integrity check at skill load | Skill load blocked, alert raised |
| Stale constraint | Audit | SKILL.md instruction over-satisfied by margin across N stories | Improvement agent staleness signal | Platform team review — proposed instruction removal |
| Partial trace | Structural | `inProgress` trace with no `completed` transition | CI gate trace validation | Story blocked pending trace completion |

**Note on `results.tsv` and `suite.json` bypass:** These files have the same bypass vulnerability as SKILL.md files — anyone with write access to the repo can edit `results.tsv` to lower the watermark baseline, delete entries from `suite.json` to shrink the eval suite, or delete the files entirely (in which case every run trivially passes). These are **audit and detection mechanisms**, not structural prevention. The real protection is branch protection + required reviews on the platform repo. `suite.json` and `results.tsv` must be under the same branch protection rules as SKILL.md files.

**Note on hash verification scope:** A hash mismatch is an audit signal that warrants investigation — not a prevention mechanism. See ADR-003 for full scope statement.

---

## 6. Regulatory framing — three lines of defence

**Structural vs instructional governance** <!-- ADDED: 2026-04-09 -->

Structural governance is always preferred over instructional governance. An instruction tells the agent what to do — the agent can fail to follow it. A structural check enforces the property independently of agent behaviour — the agent cannot bypass it.

Where a governance requirement can be enforced structurally by the CI gate, it must be. SKILL.md instructions are advisory first-line guidance. CI gate checks are the authoritative structural enforcement.

**First line — dev and review agents.** Instructional governance via SKILL.md. Practitioners following defined standards.

**Second line — assurance agent + CI gate.** Automated second-line-style checking. The CI gate independently verifies: hash matches registry, trace has valid `inProgress`→`completed` transition, watermark gate passes.

**Important limitation on second-line framing:** The assurance agent's instruction set (its SKILL.md) is authored, controlled, and approved by the platform team — the same team that owns the first-line delivery agents. True organisational second-line independence requires the second-line function to be independent from what it's assessing. A RBNZ examiner will ask: who governs the assurance agent's instruction set, and are they independent of the delivery function? The honest answer is currently no. The platform provides second-line-style automation; organisational independence requires a process control outside the platform — the risk function should independently review the assurance agent's SKILL.md, not just its outputs. This is a known limitation.

**Third line — audit agent (Phase 3).** Samples the append-only trace log. Produces periodic attestation. Platform team and risk function review.

**Human approval gate.** No instruction change enters the platform without human review and merge approval. The independence and composition of the approval function matters — a platform maintainer who both proposes and reviews their own SKILL.md changes, or who is under pressure from the delivery team they're governing, degrades this gate. The platform does not enforce reviewer independence; that is an organisational process control.

---

## 7. The improvement loop — first-class outer loop activity

The improvement loop is a fifth activity in the outer loop, operating in defined cycles.

### The architectural invariant

**The spec is immutable to the improvement loop.** The loop hill-climbs the delivery machinery (SKILL.md files, EVAL.md suites, `workspace/suite.json`) toward the spec. It never moves the spec.

### Stateless session design <!-- ADDED: 2026-04-09 -->

The improvement agent is fully stateless between sessions. All state is externalised to `workspace/` before the session ends. If it crashes mid-run, the partial state is recoverable. The session itself is disposable.

The improvement agent operates in defined cycles — one cycle per session:
1. Read new traces via queryable interface
2. Cluster failure patterns
3. Apply staleness detection
4. Write proposals to `workspace/proposals/`
5. Update `workspace/state.json`
6. Render `workspace/learnings.md` from `state.json`
7. Exit cleanly

### Two signal types <!-- ADDED: 2026-04-09 -->

**Failure signal** — agent failed to meet a SKILL.md criterion. Triggers a proposed fix.

**Staleness signal** — agent consistently over-satisfied a SKILL.md instruction across N stories. The model has improved past the constraint. Triggers a proposed instruction removal or simplification.

Staleness detection metric: a SKILL.md instruction the assurance agent records as "exceeded by margin >2 quality dimensions on 5+ consecutive stories" is a staleness candidate.

### Trace emission — during execution, not on completion <!-- ADDED: 2026-04-09 -->

All agents emit trace events during execution using an `emitEvent` pattern before each step is considered complete. The trace has an `inProgress` state that transitions to `completed` on clean exit. The CI gate validates this transition. Crashed sessions leave a recoverable partial `inProgress` trace.

### Anti-overfitting constraint

Before any proposed SKILL.md change is submitted, the improvement agent applies the self-reflection gate:

> "If the specific task that triggered this improvement disappeared entirely, would this change still make the harness better?"

**Limitation:** This gate is assessed by the same model proposing the change. A model that has drifted toward rubric-gaming will also answer "yes" to this question for rubric-specific changes — the gate is only as reliable as the model's self-awareness. The gate should not be the sole check. Two additional controls are required:

1. **Human reviewer explicitly applies the test** — the PR template for proposed diffs must include the self-reflection question as a reviewer checklist item, not just agent output. The human approver confirms the answer independently.
2. **Challenger pre-check as a second signal** — the challenger run on a synthetic test story (Phase 2 deliverable) provides independent evidence of whether the proposed change produces genuine improvement or games the eval metric.

### Governance boundary

| Actor | Can do | Cannot do |
|---|---|---|
| Dev agent | Implement story per spec | Modify spec, SKILL.md, POLICY.md |
| Review agent | Verdict on output | Modify output, SKILL.md, POLICY.md |
| Assurance agent | Gate output, flag failures/staleness, update results.tsv | Modify SKILL.md, POLICY.md, merge changes |
| Improvement agent | Propose SKILL.md diffs, update state.json + learnings.md | Self-merge, modify POLICY.md, modify spec |
| Human (platform team) | Merge approved SKILL.md diffs | None — full authority |

---

## 8. Context window management <!-- ADDED: 2026-04-09 -->

Context window management is a first-class platform concern. The platform does not rely on compaction — compaction makes irreversible lossy decisions and produces no signal that it has occurred.

### Why self-monitoring is not viable

Agents cannot read their own token consumption. The hover indicator is visible to the human operator only. Any approach requiring the agent to detect context pressure is unreliable. Phase boundaries are the structural trigger instead.

### Phase boundary as the structural trigger

Each outer loop phase boundary is a mandatory checkpoint. The phase-boundary skill writes its section of `workspace/state.json` at completion before handing off — regardless of context level. A new session always resumes from the last completed phase without reading prior conversation.

### Improvement agent cycle

The improvement agent operates in single-cycle sessions. If context pressure approaches threshold mid-cycle, the agent writes partial state and exits. The next session resumes from `workspace/state.json`. Proposals written so far are preserved in `workspace/proposals/`.

---

## 9. Design principles

1. **The spec is the benchmark.** Inner loop and improvement loop never redefine success.
2. **Instruction sets are first-class artefacts.** SKILL.md files are versioned, hashable, auditable policy documents.
3. **Independence is the intent, enforced by human discipline with an audit backstop.** The CI gate verifies three traces exist; it cannot verify they were independent sessions. Human practice is the real control.
4. **Failure and staleness are both signal.** Failures to fix; stale constraints to remove.
5. **Structural governance preferred over instructional.** Where CI can enforce a property independently, it must.
6. **Minimise and recover from compaction.** State written at phase boundaries; sessions disposable. Compaction will occasionally occur in the runtime — the platform designs for clean recovery from `state.json`, not for preventing what can't be prevented.
7. **The human approval gate is non-negotiable.** No instruction change without human review and merge approval.
8. **Usability test for model risk controls:** A risk officer should be able to read the assurance trace and answer: what instruction set governed this action, which standards applied, which model produced the output, was the output validated, was regression detected, was staleness flagged.

---

## Changelog

| Date | Change | Section |
|---|---|---|
| 2026-04-09 | Phase boundary checkpoint pattern added to outer loop model; human /checkpoint override | §2 |
| 2026-04-09 | Progressive skill disclosure as formal context management for inner loop | §3 |
| 2026-04-09 | Surface adapter `execute(surface, context) → result` — brain is surface-agnostic | §3 |
| 2026-04-09 | Stale constraint and partial trace rows added to control model | §5 |
| 2026-04-09 | Structural vs instructional governance principle; CI gate structural checks enumerated | §6 |
| 2026-04-09 | Improvement agent stateless session design and defined cycle pattern | §7 |
| 2026-04-09 | Staleness signal as second improvement agent signal type | §7 |
| 2026-04-09 | Trace emission during execution (inProgress state) | §7 |
| 2026-04-09 | §8 context window management added | §8 (new) |
| 2026-04-07 | §7 improvement loop; regression row in control model | §7, §5 |
