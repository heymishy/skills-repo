# Definition of Done: Evaluate Craig's CLI MVP as the reference implementation for regulated and CI surface enforcement (Spike B2)

**PR:** No formal PR — work committed directly to master at `6ab6125` (see Scope Deviations) | **Merged:** 2026-04-20
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b2.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-b2-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-b2-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Spike output exists; records Craig's artefacts were read as inputs | ✅ | T1–T3b passing; `spike-b2-output.md` exists, verdict `PROCEED`, references `artefacts/2026-04-18-cli-approach/discovery.md`, `benefit-metric.md`, and reference documents 012 and 013 | Automated: `tests/check-p4-spike-b2.js` T1–T3b | None |
| AC2 — P1–P4 fidelity properties stated as SATISFIED / PARTIAL / NOT MET for CLI | ✅ | T4×4 passing; P1 SATISFIED, P2 PARTIAL (Mode 1 declarative-only, envelope delivery works but ambient-context leak not structurally prevented), P3 SATISFIED, P4 PARTIAL (Mode 1 interactive session not constrained after envelope handoff) | Automated: `tests/check-p4-spike-b2.js` T4 | Design note: P2/P4 PARTIAL for Mode 1 is the intended finding; Mode 2 (headless subprocess) is the resolution path |
| AC3 — Assumption A2 validated with explicit outcome | ✅ | T5a/T5b/T6 passing; A2 explicitly accepted — assurance gate requires no modification; `executorIdentity` optional field is the only schema addition, gate ignores it when absent | Automated: `tests/check-p4-spike-b2.js` T5–T6 | None |
| AC4 — Verdict in spike artefact + pipeline-state.json + ADR in decisions.md (mechanism-selection ADR for CLI) | ✅ | T7/T7b/T8/T9a–T9e passing; verdict `PROCEED` in both `phase4.spikes["spike-b2"]` and `features[0].spikes[2]`; decisions.md ARCH entry for `spike-b2` includes decision, alternatives considered (A through D), rationale, and revisit trigger | Automated: `tests/check-p4-spike-b2.js` T7–T9e | None |
| AC5 — p4.enf-cli references Spike A, Spike B2 output, AND Craig's artefacts | ✅ | T10/T11/T12 passing; `p4-enf-cli.md` references `spike-a-output.md` (3-operation shared contract), `spike-b2-output.md`, and `artefacts/2026-04-18-cli-approach/` (Craig's reference implementation) | Automated: `tests/check-p4-spike-b2.js` T10–T12 | None |

**ACs satisfied: 5/5**

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** The spike investigation and deliverable commits were made on `feature/p4-spike-b2` and merged to `master` at `6ab6125` via a no-ff local merge. No draft PR was opened on GitHub before merging. This is a process deviation from the standard inner loop; the work is complete and on master, but the audit trail lacks a PR URL. Recorded here for `/trace` awareness. Future spike stories should open a draft PR before merging to preserve the PR audit trail.

**Deviation 2 — P2 and P4 assessed PARTIAL for Mode 1 (by design):** The story's AC2 asks for each property stated as SATISFIED / PARTIAL / NOT MET. P2 and P4 are both PARTIAL for Mode 1 — Craig's own discovery documentation names this as Risk 5 and a benefit-metric M2/M4 caveat. The spike correctly surfaces the finding. This is not a gap in the investigation; it is the intended output. Mode 2 (headless subprocess) is the architecture-approved resolution path for regulated/CI surfaces where structural P2 and P4 enforcement is required.

---

## Test Plan Coverage

**Tests from plan implemented:** 13/13 test IDs (25 assertions)
**Assertions passing:** 25/25
**Tests passing in CI:** 25

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — spike-b2-output.md exists | ✅ | ✅ | |
| T2 — contains valid verdict | ✅ | ✅ | Found: PROCEED |
| T3 — Craig's input artefacts referenced | ✅ | ✅ | discovery.md path + ref 012 present |
| T3b — benefit-metric or ref 013 referenced | ✅ | ✅ | |
| T4 — P1 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | SATISFIED |
| T4 — P2 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | PARTIAL |
| T4 — P3 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | SATISFIED |
| T4 — P4 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | PARTIAL |
| T5a — A2 referenced with explicit outcome | ✅ | ✅ | Accepted — no modification |
| T5b — A2 schema delta noted if modification required | ✅ | ✅ | `executorIdentity` optional field only |
| T6 — A2 schema delta flag or REDESIGN trigger if substantial | ✅ | N/A | Passes — no substantial modification required |
| T7 — pipeline-state.json spike-b2 entry | ✅ | ✅ | |
| T7b — spike-b2 entry valid verdict | ✅ | ✅ | PROCEED |
| T8 — state verdict matches artefact verdict | ✅ | ✅ | Both: PROCEED |
| T9a–T9e — decisions.md ARCH entry for spike-b2 complete | ✅ | ✅ | All 5 fields present |
| T10 — p4-enf-cli references Spike A output | ✅ | ✅ | |
| T11 — p4-enf-cli references Spike B2 output | ✅ | ✅ | |
| T12 — p4-enf-cli references Craig's artefacts | ✅ | ✅ | |
| T-NFR1 — no credentials outside code blocks | ✅ | ✅ | 0 found |
| T-NFR2a — verdict in pipeline-state features spikes array | ✅ | ✅ | |
| T-NFR2b — decisionsEntry field present in spike entry | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — No API keys, tokens, or credentials in spike artefact | ✅ | T-NFR1 passing; automated scan found 0 credential-shaped strings outside code blocks |
| C5 — Hash verification aborts on mismatch (hard stop, not warning) | ✅ | P1 SATISFIED; spike artefact explicitly confirms Craig's MVP scope item 1 states "mismatch aborts the step"; C5 load-bearing requirement treated as non-negotiable in CLI design |
| C1 — Non-fork distribution (no SKILL.md or POLICY.md copied to consumer repo) | ✅ | Architecture constraints table in spike output marks C1 as SATISFIED; sidecar install contains only lockfile and CLI tooling |
| C4 — Human approval gates routed through approval-channel adapter | ✅ | Architecture constraints table marks C4 as SATISFIED; CLI does not implement inline approval handling |
| ADR-004 — CLI configuration sourced from context.yml | ✅ | Architecture constraints table marks ADR-004 as SATISFIED; upstream source URL, surface type, and skill pin versions sourced from `.github/context.yml` |
| MC-CORRECT-02 — Schema-first field definition for pipeline-state.json | ✅ | T-NFR2a/T-NFR2b passing; verdict written to pre-declared `features[0].spikes[2]` (id: "spike-b2") and `phase4.spikes["spike-b2"]` entries |
| Audit — Verdict written to both artefact and pipeline-state.json | ✅ | Both paths updated: `phase4.spikes["spike-b2"].verdict` and `features[0].spikes[2].verdict` = `"PROCEED"` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Distribution sync (zero-commit install + conflict-free sync) | ❌ | After E2 distribution stories complete | Spike B2 confirms Craig's CLI sidecar design is a viable distribution path — prerequisite signal for M1. The metric itself requires at least one consumer team completing a zero-commit install. Signal remains `not-yet-measured`. |
| M2 — Consumer confidence (unassisted onboarding) | ❌ | After E3 enforcement stories complete | Spike B2 confirms CLI enforcement is viable for regulated/CI surface — prerequisite for M2. Measurement requires unassisted team member completing a full outer loop with the CLI adapter in place. Signal remains `not-yet-measured`. |

---

## Outcome

**COMPLETE WITH DEVIATIONS ✅**

ACs satisfied: 5/5
Deviations: 2 recorded (no formal PR; P2/P4 PARTIAL for Mode 1 by design)
Test gaps: None
NFRs: All addressed

**Follow-up actions:**
1. Process deviation (no PR) — noted for `/trace`. No follow-up story required; work is complete on master. Future spike stories should open a draft PR before merging.
2. Mode 2 scope decision — `p4-enf-cli` story must declare whether Mode 2 (headless subprocess for structural P2/P4 enforcement on regulated/CI surfaces) is in-scope for E3 or whether Mode 1 plus explicit residual-risk documentation is the Phase 4 target. This affects the AC structure of p4-enf-cli.
3. PR #155 merge decision — whether to merge Craig's PR #155 into master is a separate decision to be recorded in decisions.md. This spike evaluates Craig's artefacts as investigation inputs; the merge decision is not within its scope.

---

## DoD Observations

Spike B2 confirms the CLI mechanism satisfies the four load-bearing requirements (C5 hash-abort, C1 non-fork sidecar, C4 approval routing, ADR-004 context.yml config) and that Assumption A2 (assurance gate accepts CLI trace without modification) holds. The P2/P4 PARTIAL finding for Mode 1 mirrors Spike B1's finding for the VS Code/MCP surface — this is a platform-wide pattern: interactive modes cannot structurally prevent ambient bypass; headless/subprocess modes can. The implementation stories (p4-enf-mcp for B1, p4-enf-cli for B2) should both carry an explicit AC for their respective P2 closure approaches.

With both B spikes now PROCEED, the `ADR-phase4-enforcement` guardrail in `pipeline-state.json` is updated from `"not-assessed"` to `"met"` in this session's state write.
