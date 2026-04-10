# Model Risk Register: Skills Platform Phase 1

**Platform:** Skills-based SDLC governance pipeline (GitHub Copilot Agent mode)  
**Document status:** Authored — pending T3M1 evidence record and sign-off (dependency-gated on P1.3 + P1.7 DoD-complete)  
**Audience:** Platform adopters, governance functions, risk reviewers  
**Maintained by:** Platform maintainer  
**Last substantive update:** 2026-04-10

> **Adoption gate:** This document must be read and signed off before the platform is used beyond the dogfood context. A `MODEL-RISK.md` without a completed sign-off record (Section 4) is not cleared for non-dogfood adoption.

---

## 1. Risk Register

The following risks are sourced from the discovery artefact (`artefacts/2026-04-09-skills-platform-phase1/discovery.md`, Assumptions and Risks section) and the platform operating model (`artefacts/2026-04-09-skills-platform-phase1/reference/ref-skills-platform-operating-model.md`, §5 control model).

Each entry states the risk clearly and records either a mitigation (a control that reduces the risk) or an explicit acceptance rationale (where the risk is accepted as-is, with conditions noted).

---

### Risk R1: Three-agent independence is procedural, not structural

**Risk:** The CI gate validates that three trace entries exist with the correct `inProgress`→`completed` structure. It cannot verify that the traces were produced in genuinely independent sessions. In a VS Code + Copilot Agent mode environment, all three agents are run by the same human operator using the same tooling. Nothing technically prevents running all three agents within a single session and writing three separate trace files. Independence is the operator's decision to start a new session — it is procedural, enforced by team practice, not by the platform architecture.

**Mitigation:** The CI gate requires three separate trace entries, each with the correct state transition. The assurance agent uses `trigger: ci` to distinguish CI-triggered gate runs from manual runs. The platform team reviews trace structure on every PR to verify three independent entries exist. Branch protection and required PR reviews are the structural backstop — no instruction change enters the platform without human review and merge approval. Non-dogfood adoption requires process controls outside the platform (independent reviewer of the assurance agent's SKILL.md) to establish genuine organisational independence.

---

### Risk R2: Hash verification is an audit signal, not tamper prevention

**Risk:** The cryptographic prompt hash recorded in the assurance trace is an audit anchor — it permanently records what instruction set governed execution. It is not a tamper prevention mechanism. A determined actor with repository write access can modify SKILL.md files, update the hash registry, and produce a new matching hash. The real protection is branch protection and required PR reviews. A hash mismatch warrants investigation; it does not prevent a determined actor from making a change.

**Acceptance:** This limitation is accepted for Phase 1. The platform's control model explicitly distinguishes structural checks (which the CI gate enforces independently) from audit checks (which detect what happened but do not prevent bypass by an actor with repo write access). Hash verification is an audit check. The real protection is branch protection and required reviews on the platform repository. SKILL.md files and `workspace/results.tsv` must be under the same branch protection rules. This scope is documented in the operating model ADR-003 and §5 control model — the platform does not overstate the enforcement mechanism.

---

### Risk R3: Anti-overfitting gate is self-assessed

**Risk:** The improvement agent (Phase 2) applies the self-reflection gate to its own proposals. A model that has drifted toward rubric-gaming will answer the self-reflection question correctly even for rubric-specific changes — the gate is only as reliable as the model's self-awareness. This limitation applies whenever the same model proposing a change is also evaluating whether the change is overfitted to the rubric.

**Mitigation:** The PR template for proposed skill diffs includes the self-reflection question as a mandatory reviewer checklist item. The human approver must apply the diagnostic test independently — not merely accept the agent's self-assessment. Two additional controls apply: (1) human reviewer explicitly confirms the answer independently using the PR checklist; (2) the challenger pre-check (Phase 2) tests proposed changes against a synthetic story using the full dev→assurance sequence before human review. Phase 1 operates without Phase 2 capabilities; during Phase 1, all improvement proposals are reviewed by the human platform maintainer who applies the self-reflection test manually.

---

### Risk R4: Token budget may constrain delivery pace

**Risk:** GitHub Copilot Pro+ has an approximate monthly token budget of 1,500 requests/month. Phase 1+2 is estimated at approximately 26 weeks at moderate delivery pace. Large context runs (full assurance gate, large implementation plan) consume budget faster. If the token budget is exhausted mid-phase, delivery must pause until the next budget cycle.

**Mitigation:** Progressive skill disclosure (P1.1) and context window management (P1.5) reduce per-session token consumption. The `/checkpoint` override at 55% context threshold mitigates mid-session exhaustion and avoids wasted requests from compaction. Large context operations are scoped to stay within the monthly budget. Delivery pace is monitored; if budget pressure is detected, the platform team adjusts story scope or pacing before exhaustion. This is an operational risk with an operational mitigation — no structural enforcement is possible at Phase 1.

---

### Risk R5: Copilot Agent mode inter-session limitation

**Risk:** One GitHub Copilot Agent mode session cannot spawn another session. The challenger pre-check in Phase 2 requires a human-assisted step rather than full automation. Any platform design that requires the inner loop to orchestrate sessions programmatically is blocked by this runtime limitation. Full automation of inter-session orchestration is not available in the current runtime.

**Acceptance:** This is an inherent runtime limitation, accepted as a constraint on the platform's Phase 1 and Phase 2 architecture. Phase 1 is designed to work within it — no Phase 1 story assumes automated inter-session orchestration. Phase 2 challenger pre-check is explicitly designed as a human-assisted step: the improvement agent writes the synthetic story spec and proposed SKILL.md to `workspace/proposals/`; the platform maintainer manually runs the dev and assurance agent sessions, then records the result. Full automation requires inter-session orchestration not available in the current runtime. Any Phase 3 design that assumes automated inter-session capability must be re-evaluated against the runtime available at that time.

---

## 2. Audit Question Mapping Table (§9.8)

This table maps all eight audit questions from the platform operating model (§9.8) to specific named fields in the assurance trace. A non-engineering reviewer can use this table to locate the answer to each question by opening the relevant file and reading the named field.

**Trace file location:** `workspace/traces/<story-id>.json` (append-only JSON; each entry is an object with a `status` field: `inProgress` or `completed`). Read the `completed` entry for gate results.

**Watermark log location:** `workspace/results.tsv` (tab-separated; one row per gate run; columns: timestamp, skillSetHash, surfaceType, passRate, fullTestScore, verdict, trigger).

| # | Audit Question | Trace Field | File | How to Locate |
|---|----------------|-------------|------|---------------|
| 1 | What instruction set governed this action? | `traceHash` | `workspace/traces/<story-id>.json` | Open the trace file; read the `completed` entry; `traceHash` is the SHA-256 hash of the assembled SKILL.md instruction set. Compare against the platform skills registry to confirm which version governed the run. |
| 2 | Which standards applied? | `standardsInjected` | `workspace/traces/<story-id>.json` | Open the trace file; read the `completed` entry; `standardsInjected` is an array. Each element contains: `disciplineId` (e.g. `software-engineering`), `filePath` (e.g. `standards/software-engineering/core.md`), and `hash` (SHA-256 of the standards file at the PR commit SHA). |
| 3 | Which model produced the output? | `commitSha` | `workspace/traces/<story-id>.json` | Open the trace file; read the `completed` entry; `commitSha` identifies the exact repository state (code, SKILL.md files, and platform configuration) at the time of the gate run. In Phase 1, the execution model is GitHub Copilot Agent mode; `commitSha` plus `traceHash` together identify the governing instruction version. |
| 4 | Was the output validated? | `verdict` | `workspace/traces/<story-id>.json` | Open the trace file; read the `completed` entry; `verdict` is `pass` or `fail`. A `pass` verdict means all structural and audit CI gate checks passed. A `fail` verdict means at least one check failed — see the gate run log for the specific failure. |
| 5 | Was regression detected? | `verdict` | `workspace/results.tsv` | Open `workspace/results.tsv`; find the row(s) matching the story's `skillSetHash` and `surfaceType`; read the `verdict` column: `baseline` (first run), `pass` (no regression), or `blocked` (regression detected — the `trigger` column names the reason: `pass-rate-below-watermark`, `score-below-best`, or `both`). |
| 6 | Was staleness flagged? | `stalenessFlag` | `workspace/traces/<story-id>.json` | Open the trace file; read the `completed` entry; `stalenessFlag` is set by the assurance agent when the staleness criterion is met (a SKILL.md instruction exceeded by margin >2 quality dimensions on 5+ consecutive stories). Value is `true` if flagged; absent or `false` if not. If flagged, the assurance agent records the affected instruction in `stalenessDetails`. |
| 7 | Was agent independence evidenced? | `trigger` | `workspace/traces/<story-id>.json` | Open the trace file; verify that three separate trace entries exist for the story: one with `trigger: manual` from the dev agent session, one with `trigger: manual` from the review agent session, and one with `trigger: ci` from the CI-triggered assurance gate. The presence of a `trigger: ci` entry confirms the assurance gate ran independently via CI rather than manually within the same session. |
| 8 | Is the hash verifiable against the registry? | `traceHash` | `workspace/traces/<story-id>.json` | Open the trace file; read `completed.traceHash`; recompute the SHA-256 hash of the assembled SKILL.md instruction set at the PR's `commitSha`; confirm the values match. The platform skills registry is the git history of `.github/skills/` and `.github/copilot-instructions.md` — no separate registry file in Phase 1. A mismatch warrants investigation (see R2 above for scope statement). |

> **Note for the reviewer:** All eight questions are answerable from the trace file and watermark log alone, without requiring engineering assistance, once the trace is populated by the P1.3 CI gate and the standards are injected by the P1.7 mechanism. Until P1.3 and P1.7 are DoD-complete, the `standardsInjected` and `stalenessFlag` fields will not be present in real traces. The T3M1 acceptance test record (Section 3) records the result of a reviewer applying all eight questions to a real trace.

---

## 3. T3M1 Acceptance Test Record

<!-- T3M1-EVIDENCE-RECORD-START -->

> **Status: PENDING — dependency-gated**
> This section is a template at delivery time. It is filled at DoD time after both prerequisite stories are DoD-complete and a real trace exists:
> - `p1.3-assurance-agent-ci-gate` must be DoD-complete and running in CI
> - `p1.7-standards-model-phase1` must be DoD-complete (standards injected into trace)
> - A real inner loop story must have been run through the P1.3 CI gate to produce the evidence trace
>
> **Do not fill this section with fabricated or estimated values. Record only real evidence.**

| Field | Value |
|-------|-------|
| Story ID used as evidence | `[to be filled at DoD — story ID of the inner loop story run through the P1.3 gate]` |
| Trace file path | `[to be filled at DoD — e.g. workspace/traces/<story-id>.json]` |
| Q1: Instruction set identified (`traceHash` present and non-empty)? | `[Y/N — to be filled at DoD]` |
| Q2: Standards applied (`standardsInjected` array present with ≥1 entry)? | `[Y/N — to be filled at DoD]` |
| Q3: Model/commit identified (`commitSha` present and non-empty)? | `[Y/N — to be filled at DoD]` |
| Q4: Output validated (`verdict` field present with `pass` or `fail`)? | `[Y/N — to be filled at DoD]` |
| Q5: Regression check present (`results.tsv` row with matching `skillSetHash`)? | `[Y/N — to be filled at DoD]` |
| Q6: Staleness flag assessed (`stalenessFlag` field present in entry)? | `[Y/N — to be filled at DoD]` |
| Q7: Agent independence evidenced (three trace entries with correct `trigger` values)? | `[Y/N — to be filled at DoD]` |
| Q8: Hash verifiable (recomputed hash matches `traceHash` in trace entry)? | `[Y/N — to be filled at DoD]` |
| Overall verdict | `[pass/fail — to be filled at DoD after all eight questions answered Y]` |

<!-- T3M1-EVIDENCE-RECORD-END -->

---

## 4. Sign-off Record

<!-- SIGN-OFF-RECORD-START -->

> **Instructions:** This block is completed by the human reviewer at DoD time as a manual action. Do not pre-populate the verdict. A `MODEL-RISK.md` without a completed sign-off is not cleared for non-dogfood adoption.

| Field | Value |
|-------|-------|
| Reviewer name | |
| Review date | |
| Verdict | |
| Conditions (if verdict is "approved with conditions") | |

**Permitted verdict values:** `approved for adoption` / `approved with conditions` / `not approved`

<!-- SIGN-OFF-RECORD-END -->
