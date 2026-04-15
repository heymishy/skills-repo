# Model Risk Register: Skills Platform Phase 1

**Platform:** Skills-based SDLC governance pipeline (GitHub Copilot Agent mode)  
**Document status:** Authored — pending T3M1 evidence record and sign-off (dependency-gated on P1.3 + P1.7 DoD-complete)  
**Audience:** Platform adopters, governance functions, risk reviewers  
**Maintained by:** Platform maintainer  
**Last substantive update:** 2026-04-16

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

### Risk R6: T3M1 Q8 tamper-evidence implementation is platform-specific

**Risk:** The tamper-evidence registry for T3M1 Q8 (`traceHash` attestation) is implemented in the dogfood instance (`heymishy/skills-repo`) using GitHub Artifact Attestation, which is available only on GitHub.com and GitHub Enterprise Server. Enterprise adopters running Bitbucket or Jenkins cannot use this implementation and must apply Option B (a dedicated read-only registry repository with a CI service account). The Q8 evidence mechanism therefore differs between the dogfood instance and a Bitbucket enterprise deployment. A reviewer applying T3M1 against a Bitbucket deployment will see `tamperEvidence.registryType: "registry-repo"` and a Git commit SHA as the `registryRef`, not an Artifact Attestation URL. The independent hash re-verification procedure (recompute SHA-256 of the trace file; compare the result against the registry entry) is procedurally identical for both options — only the retrieval step differs.

**Mitigation:** The `tamperEvidence` object in the trace schema explicitly records `registryType` (`"github-artifact-attestation"` or `"registry-repo"`), so a reviewer always knows which retrieval method to apply. `docs/HANDOFF.md` Section 2 (DEC-P3-002 note) documents the full Option B requirements for enterprise adopters. Decision DEC-P3-002 in `artefacts/2026-04-14-skills-platform-phase3/decisions.md` records this divergence and the enterprise porting note. Enterprise pilot onboarding must explicitly implement Option B and confirm that the Q8 entry is retrievable via `git log` on the registry repo before the T3M1 re-evaluation session is scheduled.

---

## 1.1 Artefact Coverage Audit Record

Artefact coverage audit conducted 2026-04-16. Phase 1: 8/8 complete. Phase 2: 13/13 complete. Post-pipeline changelog coverage: 45% (9/20 item groups covered by a formal story). Two HIGH gaps identified (/estimate, /issue-dispatch) — retrospective stories p3.15 and p3.16 raised. Full audit: workspace/retrospective-audit-2026-04-16.md

**Coverage score improvement target:** 80%+ of post-pipeline CHANGELOG item groups covered by a formal story before Phase 3 closes. Currently at 45% (9/20) at time of audit. Retrospective stories p3.15 and p3.16 bring the count to approximately 50% (10/20). Remaining A-classification items from the audit (see `workspace/retrospective-audit-2026-04-16.md` Finding 2) must be actioned to close the gap.

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

**Status: PARTIAL — 3 of 8 questions answered Y at Phase 2 close.**

Evidence was evaluated against the first real Phase 2 inner loop trace. This is the expected Phase 1+2 baseline — the five unanswered questions require Phase 3 gate enhancements to resolve. Full 8/8 is required before regulated-enterprise adoption. See `workspace/learnings.md` "T3M1 honest gap" entry and "Adversarial audit synthesis" entry for full gap analysis and Phase 3 roadmap.

| Field | Value |
|-------|-------|
| Story ID used as evidence | `p2.4` (AGENTS.md adapter — PR #31, merged 2026-04-11) |
| Trace file path | `workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl` |
| Q1: Instruction set identified (`traceHash` present and non-empty)? | **Y** — `traceHash` present and non-empty in the `completed` trace entry; verifiable against git history of `.github/skills/`. |
| Q2: Standards applied (`standardsInjected` array present with ≥1 entry)? | **Y** — Wired in p3.2a. Story schema defines `standardsInjected` at `.github/pipeline-state.schema.json` (story items). `run-assurance-gate.js` validates it via `validateT3M1Fields()` for regulated stories and fails with a named field reason when null/absent. Reviewers can inspect `standardsInjected` as an array of `{ id, hash }` objects in trace `completed` entries. |
| Q3: Model/commit identified (`commitSha` present and non-empty)? | **Y** — `commitSha` present and non-empty in the `completed` trace entry; identifies exact repository state at gate run time. |
| Q4: Output validated (`verdict` field present with `pass` or `fail`)? | **Y** — `verdict: pass` present in `completed` trace entry (CI gate passed for p2.4 PR #31). |
| Q5: Regression check present (`results.tsv` row with matching `skillSetHash`)? | **Y** — Wired in p3.2a for trace audit visibility. Story schema defines `watermarkResult` and gate enforcement requires non-null `{ pass, passRate }` for regulated stories. `runGate()` writes `watermarkResult.pass` and `watermarkResult.passRate` into trace `completed` entries for reviewer inspection. |
| Q6: Staleness flag assessed (`stalenessFlag` field present in entry)? | **Y** — Wired in p3.2a. Story schema defines `stalenessFlag: boolean`; `runGate()` fails regulated traces when null/absent and persists `stalenessFlag: true|false` in trace `completed` entries. |
| Q7: Agent independence evidenced (three trace entries with correct `trigger` values)? | **Y (trace identity field wired)** — p3.2a wires `sessionIdentity` into schema and gate output for regulated stories. `runGate()` enforces non-null `sessionIdentity` and writes `{ sessionId, agentType, startedAt }` to trace `completed` entries. `sessionId` is required to be opaque (hex-hash style), preventing PII leakage while preserving session-level audit identity. |
| Q8: Hash verifiable (recomputed hash matches `traceHash` in trace entry)? | **N** — Recomputation is possible manually against git history but is not automated in the assurance gate. No tooling exists to perform this check on a reviewer's behalf. Closes in Phase 3 (automated hash drift check story). |
| Overall verdict | **partial — 3/8 Y** — Instruction identity (Q1), commit traceability (Q3), and gate verdict (Q4) are confirmed. This is the honest Phase 1+2 baseline. Re-evaluate after Phase 3 delivers the five remaining gap closures. |

<!-- T3M1-EVIDENCE-RECORD-END -->

---

## 4. Sign-off Record

<!-- SIGN-OFF-RECORD-START -->

> **Instructions:** This block is completed by the human reviewer at DoD time as a manual action. Do not pre-populate the verdict. A `MODEL-RISK.md` without a completed sign-off is not cleared for non-dogfood adoption.

| Field | Value |
|-------|-------|
| Reviewer name | Hamish |
| Review date | 2026-04-12 |
| Verdict | approved with conditions |
| Conditions (if verdict is "approved with conditions") | T3M1 partial result (3/8 Y) is the expected Phase 1 baseline. Full coverage (Q2 standardsInjected, Q5 watermark, Q6 staleness, Q7 independence, Q8 hash verification) requires Phase 2 gate enhancements (p1.4, p1.7, p2.1). Document cleared for continued dogfood use. Non-dogfood adoption gate: repeat sign-off after all 8 questions fully satisfied. |

**Permitted verdict values:** `approved for adoption` / `approved with conditions` / `not approved`

<!-- SIGN-OFF-RECORD-END -->
