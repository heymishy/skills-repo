# Benefit Metric: Skills Platform — Phase 1 Foundation

**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Date defined:** 2026-04-09
**Metric owner:** Hamish (platform maintainer)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative is being dogfooded — the platform team runs the pipeline on itself to deliver Phase 1 and simultaneously validate that the pipeline is self-sufficient for a solo operator. Tier 1 metrics track platform capability outcomes. Tier 2 metrics track what the dogfood run validates about the pipeline itself. Both are required; Tier 2 is the primary validation signal for Phase 1.

---

## Tier 1: Product Metrics (Platform Capability)

### Metric 1: Update channel — platform skill to consuming squad

| Field | Value |
|-------|-------|
| **What we measure** | Elapsed time from a core skill update committed to the platform repo to that update being present in the consuming squad's assembled `copilot-instructions.md`, without any merge action authored or resolved by the squad |
| **Baseline** | Currently infinite — no update channel exists. Any platform skill change requires the consuming squad to manually fork-and-pull. Distribution mechanism: none. |
| **Target** | Update present in consuming squad's assembled context within one cycle (push model: ≤ 72 hours; pull model: ≤ one session open), with zero merge steps by the squad |
| **Minimum validation signal** | Update received without any merge step authored by the squad, within either 72 hours (push model) or one session open (pull model), whichever applies to the implemented distribution mechanism |
| **Measurement method** | Platform maintainer commits a controlled skill change to the platform repo, waits one cycle, inspects the consuming squad's assembled `copilot-instructions.md` for the change without any squad merge action. Records: change reference, distribution mechanism (push/pull), elapsed time commit → availability, change present in assembled context (Y/N), squad merge action required (Y/N). Single acceptance test at P1.1 DoD. |
| **Feedback loop** | If signal not met at P1.1 DoD: distribution mechanism is not operational. P1.1 cannot be marked done. Options: fix the distribution mechanism, or scope-reduce to a manual-trigger pull model and re-test. Decision logged in decisions.md. |

#### M1 Acceptance Test Record

*Populated at P1.1 DoD. Required fields per AC6 and the p1.1 test plan.*

| Field | Value |
|-------|-------|
| `changeReference` | |
| `distributionMechanism` | pull |
| `elapsedTime` | |
| `changePresentInAssembledContext` | |
| `squadMergeActionRequired` | false |

---

### Metric 2: CI-triggered assurance gate — automated governance on PR

| Field | Value |
|-------|-------|
| **What we measure** | Whether the first inner loop PR after P1.3 delivery satisfies all four sub-conditions: (1) gate fired automatically on PR open or update event — evidenced by CI log trigger event, not a manual command; (2) trace records a valid `inProgress`→`completed` transition; (3) gate verdict and trace hash visible in the PR without opening a separate tool; (4) no human initiation of the assurance run |
| **Baseline** | Zero — no CI-triggered assurance gate exists. The assurance agent runs on manual operator invocation only. No PR in the prototype has an automated gate verdict. |
| **Target** | The first inner loop PR after P1.3 delivery satisfies all four sub-conditions. This is the acceptance test for P1.3 itself — metric and P1.3 DoD point to the same evidence. |
| **Minimum validation signal** | Gate fires on PR event (evidenced by CI log), and an `inProgress` trace is written — regardless of whether the gate completes cleanly or governance checks pass. `inProgress` written = CI integration exists. `inProgress` with no `completed` = agent started but stopped mid-run (execution problem, not integration problem). |
| **Measurement method** | Platform maintainer opens the first inner loop PR after P1.3 delivery, inspects CI log for trigger event type, inspects PR for trace hash and gate verdict. Records: story ID, trigger event type, `inProgress`→`completed` present (Y/N), gate verdict visible in PR (Y/N), no manual initiation (Y/N). Single acceptance test at P1.3 DoD. |
| **Feedback loop** | If signal not met at P1.3 DoD: CI integration has not landed. P1.3 cannot be marked done. If `inProgress` absent: trigger mechanism failed — check CI configuration. If `inProgress` present but `completed` absent: agent started but stopped — check assurance agent execution log. |

---

### Metric 3: Standards injection — verifiable governance in trace

| Field | Value |
|-------|-------|
| **What we measure** | Whether a real inner loop story trace shows all three anchor discipline IDs (`software-engineering`, `security-engineering`, `quality-assurance`) in the `standardsInjected` array, with hashes that match the corresponding standards files at the PR's commit SHA. Hashes are computed by the assurance agent at gate time (not self-reported by the dev agent). Git is the registry at Phase 1 — no separate registry file. |
| **Baseline** | Zero — no `standardsInjected` array exists in any trace. Standards files do not yet exist (P1.7 delivers them). Baseline is absence of the capability. |
| **Target** | A real inner loop story that legitimately requires all three anchor disciplines (e.g. a git-native software engineering story with a security tag and QA requirement) — where the trace shows all three disciplines in `standardsInjected` with matching hashes at the PR's commit SHA. Binary, read directly from the trace file. The story is chosen for real need; the metric passes as a consequence. |
| **Minimum validation signal** | `standardsInjected` array is present in the trace with at least one entry containing a valid hash. Schema works, injection mechanism operational, hash computation and trace write functioning. Fewer than three disciplines = content problem (P1.7 partially delivered), not a plumbing problem. |
| **Measurement method** | Platform maintainer opens the target story's trace file after P1.7 delivery, inspects `standardsInjected`, recomputes hashes of the three standards files at the PR's commit SHA, confirms they match. Records: story ID, commit SHA, `software-engineering` present (Y/N), `software-engineering` hash match (Y/N), `security-engineering` present (Y/N), `security-engineering` hash match (Y/N), `quality-assurance` present (Y/N), `quality-assurance` hash match (Y/N). Single acceptance test at P1.7 DoD. |
| **Feedback loop** | If fewer than three disciplines present at P1.7 DoD: identify which standards files are missing or not injecting. Iteration problem within P1.7 scope. If hash mismatch: assurance agent is recording a different commit's file than the PR commit SHA — check gate-time hash computation logic. |

---

### Metric 4: Watermark gate — automatic regression detection

| Field | Value |
|-------|-------|
| **What we measure** | Whether the watermark gate demonstrably blocks a synthetic regression — two sub-conditions, both required: (1) the gate rejects the degraded run automatically with no human review step triggered; (2) the rejection and reason (score dropped below watermark) are visible in the PR without opening a separate tool |
| **Baseline** | Zero — no watermark gate exists. `workspace/results.tsv` does not exist. No automated regression detection of any kind is in place. |
| **Target** | Platform maintainer adds a deliberately failing scenario to `suite.json`, runs the gate, confirms both sub-conditions are met, removes the scenario. The acceptance test leaves no permanent artefacts and is documented in the DoD record. |
| **Minimum validation signal** | Gate detects the degraded score and writes a rejection verdict to `workspace/results.tsv` — even if the PR visibility sub-condition (surfacing in PR) is not yet met. Detection and tracking mechanism works; PR surfacing is an output formatting iteration. |
| **Measurement method** | Platform maintainer runs the controlled acceptance test at P1.4 DoD. Records: scenario added to `suite.json` (description), watermark value at time of test, degraded score that triggered rejection, gate verdict (blocked Y/N), rejection visible in PR (Y/N), rejection reason surfaced (score dropped below watermark Y/N), scenario removed (Y/N). Single acceptance test, no ongoing cadence at Phase 1. |
| **Feedback loop** | If gate does not detect degraded score: watermark comparison logic is not operational. P1.4 cannot be marked done. If detection works but PR visibility fails: output formatting problem — iterate on P1.4 PR reporting before DoD. |

---

## Tier 2: Meta Metrics (Dogfood Validation)

### Meta Metric 1: Solo operator — full outer loop unassisted

| Field | Value |
|-------|-------|
| **Hypothesis** | A solo operator can run the full outer loop (discovery through DoR) for a real story using only the repo's own reference material, with no platform team assistance and no blocking lookups outside the repo |
| **What we measure** | Two sub-conditions: (1) all outer loop stages complete in one session; (2) all information sourced from within the repo — blocking lookups (where the operator cannot identify a path forward after a genuine attempt from within the repo) logged as gap findings, enrichment lookups (operator could have proceeded but went outside for confidence) not counted. A blocking lookup is defined as: the operator cannot identify a path forward from within the repo after a genuine attempt of reasonable duration (~10 minutes). |
| **Baseline** | Not yet established. This Phase 1 dogfood run is the first attempt. The current session's gap log is the baseline record — the number and nature of blocking lookups encountered during this outer loop run is the "before" state for Phase 2 improvement. Gap log tracking started: 2026-04-09. External lookups so far: none identified. |
| **Target** | All outer loop stages complete in one session, zero blocking lookups required. Enrichment lookups permitted and not counted. Gap log records only blocking lookups — the ones where the platform couldn't answer and the operator had to go outside to proceed. |
| **Minimum signal** | All outer loop stages complete in one session, with one or more blocking lookups logged. Platform is self-sufficient enough to finish; gaps are improvement inputs, not stoppers. Below floor: any stage that cannot complete even after a genuine attempt, requiring external resolution before the stage can proceed. |
| **Measurement method** | Operator logs in real time during this Phase 1 dogfood run. At session end, records per stage: stage name, completed in session (Y/N), elapsed time (minutes), blocking lookups (question + where resolved). Logged in `workspace/learnings.md`. Single run. The gap log from this session is also the Phase 2 baseline. |
| **Feedback loop** | Blocking lookups are platform improvement findings — each is a signal that reference material, a skill, or a template is insufficient. Fed into the improvement loop. Not treated as operator failures. |

---

### Meta Metric 2: Cross-session resume via `workspace/state.json`

| Field | Value |
|-------|-------|
| **Hypothesis** | A session interrupted at any phase boundary can be resumed in a new session using only `workspace/state.json` and the artefact folder, with no verbal priming from the operator and no re-running of prior stages |
| **What we measure** | At a natural session boundary: new session opened with SESSION START hook only (no operator-provided verbal context), and all three sub-conditions: (1) correct stage identified; (2) no prior work repeated; (3) no context gap forcing a re-decision already recorded in state.json. The test is adversarial — no verbal priming is the real-world condition for a crashed session or handoff. |
| **Baseline** | Zero — no cross-session resume has ever been attempted against `workspace/state.json`. First natural session boundary in this dogfood run is both the baseline measurement and the first real test. Schema was designed in the abstract and has not been validated against real delivery conditions. |
| **Target** | Clean resume (all three sub-conditions pass) achieved within two natural session boundaries. First boundary may fail and produce a schema gap finding. Gap is fixed, schema updated, second boundary passes cleanly. Two iterations distinguishes "schema needed one real-world correction" from "mechanism unreliable." |
| **Minimum signal** | Resume attempted at a natural boundary, failure logged with specific gap identified (e.g. "correct stage not identified — `state.cycle.discovery` was null"), schema updated. Mechanism is operational even if first attempt failed; gap is captured and addressed. Below floor: resume not attempted, or attempted and failed with no identifiable gap. |
| **Measurement method** | Operator records at each natural session boundary until clean pass. Per boundary: session number, phase at boundary, `state.json` sections populated at boundary (list), correct stage identified (Y/N), no prior work repeated (Y/N), no re-decisions required (Y/N), verbal priming used (Y/N), gap found (description or none). Logged in `workspace/learnings.md`. |
| **Feedback loop** | Failed resume + specific null section = schema gap finding. Fix the schema for that phase section and verify on next natural boundary. A second failure after schema update indicates a resume logic problem (how the SESSION START hook reads and interprets state.json), not a schema problem — different fix class. |

---

### Meta Metric 3: `/checkpoint` command — reliable mid-phase state write

| Field | Value |
|-------|-------|
| **Hypothesis** | The `/checkpoint` operator convention, when invoked manually at any mid-phase point, reliably writes the current phase's section of `state.json` and exits cleanly enough to support a resumable session — validating that the instructional implementation is operationally trustworthy as an escape valve |
| **What we measure** | Three sub-conditions on a single deliberate mid-phase test invocation: (1) session terminates within 60 seconds — no hang, no waiting state; (2) current phase section in `state.json` is fully populated — all required fields present for that phase, not truncated; (3) a new session opened from that `state.json` identifies the correct resume point — the checkpoint is actually resumable, not just a file write. `/checkpoint` currently exists as an instruction in `copilot-instructions.md`, not as a structured skill. This test validates whether the instructional implementation is reliable enough to trust. |
| **Baseline** | Instructional, never tested — `/checkpoint` has been described in `copilot-instructions.md` and the operating model but never deliberately invoked and verified against `state.json`. Baseline is "instruction exists, behaviour unvalidated." |
| **Target** | All three sub-conditions pass within two deliberate test invocations. First invocation may fail (expected — partial phase state is harder to capture correctly than end-of-phase state). Gap finding identifies specific failure (missing field, hung session, wrong resume stage). Schema or instruction updated. Second invocation passes. If second invocation fails: promote `/checkpoint` from instruction to structured skill with explicit phase-boundary write logic. |
| **Minimum signal** | `/checkpoint` invoked, `state.json` write attempted (some fields written for the current phase), session terminates within 60 seconds. Write mechanism exists and fires; incomplete fields are a schema iteration problem. Below floor: invocation produces no write at all, or session does not terminate within 60 seconds. |
| **Measurement method** | Operator runs one deliberate mid-phase test invocation during Phase 1 dogfood run at a naturally convenient point. Records: phase at invocation, `state.json` sections populated before invocation (pre-invocation snapshot), fields written during invocation (list), session terminated within 60 seconds (Y/N), new session resumed correctly from written state (Y/N), gap found (description or none). Repeat once if first attempt fails. Logged in `workspace/learnings.md`. |
| **Feedback loop** | Sub-condition 1 fails (hang): instruction does not include a clean exit step — add explicit termination instruction to `/checkpoint` convention. Sub-condition 2 fails (incomplete fields): schema missing required fields for partial phase state — update schema to handle mid-phase writes. Sub-condition 3 fails (wrong resume): SESSION START hook cannot interpret partial phase state — either extend the hook or promote `/checkpoint` to a structured skill. |

#### MM3 Evidence Record — Invocation 1 (2026-04-09)

| Field | Value |
|-------|-------|
| **Invocation date** | 2026-04-09 |
| **Invocation number** | 1 of max 2 |
| **Phase at invocation** | definition — mid-task, between epic 3 written and epic 4 not yet written |
| **state.json sections populated before invocation** | `cycle.discovery` (approved), `cycle.benefitMetric` (complete), `cycle.definition` partial (epicsWritten: 3, no stories section) |
| **Fields written by checkpoint** | `currentPhase` updated to `"definition"`, `cycle.definition.status`, `cycle.definition.slicingStrategy`, `cycle.definition.epicCount`, `cycle.definition.storyCount`, `cycle.definition.epicsWritten` (3 paths), `cycle.definition.epicsRemaining` (1 entry), `cycle.definition.storiesRemaining` (10 slugs with descriptions), `cycle.definition.resumeInstruction` |
| **Sub-condition 1: session terminated within 60 seconds** | Partial pass — session did not exit via clean terminate; context compaction fired during write execution. The state write completed correctly before compaction triggered session close. Session ended within the 60-second window but via compaction, not the intended clean-exit path. |
| **Sub-condition 2: phase section fully populated** | Pass — all logically required fields for a mid-phase definition checkpoint are present. No truncation. `resumeInstruction` written, resume point unambiguous. |
| **Sub-condition 3: new session resumed correctly** | TBD — testing in next session open |
| **Verdict against floor** | Above floor — write mechanism fired, required fields present, session ended within 60s. Meets minimum signal definition. |
| **Verdict against target** | Below full target — target requires clean terminate; actual exit was compaction-triggered. The state write survived compaction correctly, but the exit mechanism was not the intended one. Target not met on sub-condition 1. |
| **Gap found** | Compaction occurred during checkpoint execution. The write completed before compaction fired, so state integrity was preserved. However: the `/checkpoint` convention has no instruction telling the operator to invoke it *before* the context window reaches compaction threshold — the instruction says "75% threshold" but does not enforce early invocation, meaning a late-invoked checkpoint is racing compaction. Gap: the convention needs an explicit note that `/checkpoint` must be invoked with enough context headroom that the write can complete before compaction fires. This is a documentation gap, not a structural failure. |
| **Next action** | Update `/checkpoint` documentation in `copilot-instructions.md` to note that invocation should happen before the session reaches compaction pressure, not at it. Test sub-condition 3 on next session open. If sub-condition 3 passes: invocation 1 verdict = above-floor partial pass, proceed to invocation 2 to test clean-exit path. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

### Tier 3 Metric 1: Assurance trace readability for non-engineering risk review

| Field | Value |
|-------|-------|
| **Obligation source** | Platform design principle: the assurance trace must be readable by a non-engineering risk reviewer without engineering assistance — answering the eight audit questions defined in the operating model (§9.8). `MODEL-RISK.md` substantiates this claim only if the trace actually answers the questions. |
| **Metric** | A non-engineering reader (risk function, compliance officer, or designated stand-in) can answer all eight questions from the trace file alone, without asking for assistance: (1) what instruction set governed this action; (2) which standards applied; (3) which model produced the output; (4) was the output validated; (5) was regression detected; (6) was staleness flagged; (7) agent independence evidenced; (8) hash verifiable against registry |
| **Target** | All eight questions answerable from the trace file alone — binary pass. Test uses the trace from the metric 2 acceptance test story (first inner loop PR after P1.3 DoD). |
| **Validated by** | Hamish (platform maintainer) acting as stand-in risk reviewer for dogfood context. In non-dogfood adoption, must be a genuine non-engineering reviewer. |
| **Sign-off required at DoR** | Yes — any story that modifies the trace schema must confirm this metric is not degraded before receiving DoR sign-off |
| **Feedback loop** | Any question not answerable from the trace alone is a trace schema gap. Each gap produces a specific schema addition to the P1.3 story scope. If all eight questions are answerable, `MODEL-RISK.md` is substantiated by real evidence. If not, `MODEL-RISK.md` cannot be signed off regardless of its contents. |

---

## Metric Coverage Matrix

*Populated by the /definition skill after stories are created. Every metric must have at least one story. Every story must reference at least one metric.*

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Update channel latency | `p1.1-distribution-progressive-disclosure` | ✅ Covered |
| M2 — CI-triggered assurance gate | `p1.3-assurance-agent-ci-gate` (direct delivery) | ✅ Covered |
| M3 — Standards injection in trace | `p1.7-standards-model-phase1` (content), `p1.3-assurance-agent-ci-gate` (injection mechanism) | ✅ Covered |
| M4 — Watermark gate blocks regression | `p1.6-living-eval-regression-suite` (suite content), `p1.4-watermark-gate` (direct delivery) | ✅ Covered |
| MM1 — Solo operator outer loop | `p1.1-distribution-progressive-disclosure` (progressive disclosure), `p1.2-surface-adapter-model-foundations` (surface scoping), `p1.7-standards-model-phase1` (reduces blocking lookup at DoR), `p1.8-model-risk-documentation` (removes governance blocking lookup) | ✅ Covered |
| MM2 — Cross-session resume | `p1.5-workspace-state-session-continuity` (direct delivery) | ✅ Covered |
| MM3 — /checkpoint mid-phase write | `p1.5-workspace-state-session-continuity` (direct delivery) | ✅ Covered |
| T3M1 — Trace readability for risk review | `p1.3-assurance-agent-ci-gate` (trace vehicle), `p1.7-standards-model-phase1` (standards content in trace), `p1.8-model-risk-documentation` (eight-question definition and T3M1 acceptance record) | ✅ Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
