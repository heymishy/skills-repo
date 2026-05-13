# Definition of Done: Evaluate MCP tool-boundary enforcement as the reference implementation for VS Code and Claude Code surfaces (Spike B1)

**PR:** No formal PR — work committed directly to master at `b416f89` (see Scope Deviations) | **Merged:** 2026-04-20
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b1.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-b1-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-b1-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Spike output exists with valid verdict + ≥3-sentence rationale + observable test evidence (hash-verifiable trace) | ✅ | T1–T4 passing; `spike-b1-output.md` exists, verdict `PROCEED`, rationale ≥3 sentences, hash and trace fields present with observable invocation evidence | Automated: `tests/check-p4-spike-b1.js` T1–T4 | None |
| AC2 — C11 compliance status explicitly stated; if violated, mitigation proposed | ✅ | T5–T6 passing; C11 explicitly stated as SATISFIED; no persistent hosted runtime required for VS Code stdio-transport subprocess model | Automated: `tests/check-p4-spike-b1.js` T5–T6 | None |
| AC3 — P1–P4 fidelity properties each stated as SATISFIED / PARTIAL / NOT MET | ✅ | T7×4 passing; P1 SATISFIED, P2 PARTIAL (ambient bypass risk unvalidated), P3 SATISFIED, P4 SATISFIED | Automated: `tests/check-p4-spike-b1.js` T7 | Design note: P2 PARTIAL is the intended finding — not a gap; resolution is a p4-enf-mcp implementation concern |
| AC4 — Verdict in pipeline-state.json spike record + ADR in decisions.md | ✅ | T8/T8b/T9/T10a–T10e passing; verdict `PROCEED` in both `phase4.spikes["spike-b1"]` and `features[0].spikes[1]`; decisions.md ARCH entry includes decision, alternatives, rationale, and revisit trigger | Automated: `tests/check-p4-spike-b1.js` T8–T10e | None |
| AC5 — p4.enf-mcp references both Spike A output and Spike B1 output as architecture inputs | ✅ | T11/T12 passing; `p4-enf-mcp.md` references both `spike-a-output.md` and `spike-b1-output.md` | Automated: `tests/check-p4-spike-b1.js` T11–T12 | None |

**ACs satisfied: 5/5**

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** The spike investigation and deliverable commits were merged directly to `master` at `b416f89` via a no-ff merge of `feature/p4-spike-b1`. No draft PR was opened on GitHub before merging. This is a process deviation from the standard inner loop; the work is complete and on master, but the audit trail lacks a PR URL. Recorded here for `/trace` awareness. Future spike stories should open a draft PR before merging to preserve the PR audit trail.

---

## Test Plan Coverage

**Tests from plan implemented:** 13/13 test IDs (24 assertions)
**Assertions passing:** 24/24
**Tests passing in CI:** 24 (T6 correctly passes as not-applicable — C11 not violated)

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — spike-b1-output.md exists | ✅ | ✅ | |
| T2 — contains valid verdict | ✅ | ✅ | Found: PROCEED |
| T3 — rationale ≥3 sentences | ✅ | ✅ | |
| T4a — artefact contains "hash" | ✅ | ✅ | |
| T4b — artefact contains "trace" | ✅ | ✅ | |
| T4c — observable result recorded | ✅ | ✅ | |
| T5a — C11 constraint referenced | ✅ | ✅ | |
| T5b — C11 compliance outcome stated | ✅ | ✅ | SATISFIED |
| T6 — C11 mitigation (if violated) | ✅ | N/A | Passes as not-applicable — C11 not violated |
| T7 — P1 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | SATISFIED |
| T7 — P2 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | PARTIAL |
| T7 — P3 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | SATISFIED |
| T7 — P4 has SATISFIED/PARTIAL/NOT MET | ✅ | ✅ | SATISFIED |
| T8 — pipeline-state.json spike-b1 entry | ✅ | ✅ | |
| T8b — spike-b1 entry valid verdict | ✅ | ✅ | PROCEED |
| T9 — state verdict matches artefact verdict | ✅ | ✅ | Both: PROCEED |
| T10a–T10e — decisions.md ARCH entry complete | ✅ | ✅ | All 5 fields present |
| T11 — p4-enf-mcp references Spike A | ✅ | ✅ | |
| T12 — p4-enf-mcp references Spike B1 | ✅ | ✅ | |
| T-NFR1 — no credentials outside code blocks | ✅ | ✅ | 0 found |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — No API keys, tokens, or credentials in spike artefact | ✅ | T-NFR1 passing; automated scan found 0 credential-shaped strings outside code blocks |
| C11 — No persistent hosted runtime | ✅ | Explicitly assessed as SATISFIED in spike output; VS Code stdio-transport subprocess model is session-scoped and non-persistent; no mitigation required |
| C5 — Hash verification preserved as primary audit signal | ✅ | P1 SATISFIED; `resolveAndVerifySkill` tool accepts `expectedHash` param and returns `{ hashValid }` — hash check is a precondition of content delivery; observable test invocation confirmed hash field present in response |
| C4 — Human approval routing preserved | ✅ | Out of scope for this spike (no code changes); artefact explicitly excludes approval handling from the MCP tool boundary — approval gates route through the existing approval-channel adapter (ADR-006) |
| ADR-004 — Configuration from context.yml | ✅ | Observable test invocation used `.github/context.yml` as the configuration source; ADR-004 compliance noted in spike output |
| Audit — Verdict written to both artefact and pipeline-state.json | ✅ | Both paths updated: `phase4.spikes["spike-b1"].verdict` and `features[0].spikes[1].verdict` = `"PROCEED"` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Consumer confidence (unassisted onboarding) | ❌ | After E3 enforcement stories complete | Spike B1 confirms MCP is a viable enforcement mechanism for the VS Code surface — this is a prerequisite signal for M2, not the metric itself. Signal remains `not-yet-measured`; measurement requires at least one unassisted team member completing a full outer loop with the MCP enforcement adapter in place. |

---

## Outcome

**COMPLETE WITH DEVIATIONS ✅**

ACs satisfied: 5/5
Deviations: 1 recorded (no formal PR — work committed directly to master)
Test gaps: None
NFRs: All addressed

**Follow-up actions:**
1. Process deviation (no PR) — noted for `/trace`. No follow-up story required; work is complete on master. Future spike stories should open a draft PR before merging.
2. P2 PARTIAL (ambient bypass in VS Code not empirically blocked) — this is a known open item for `p4-enf-mcp` implementation; it does not block the PROCEED verdict and requires no immediate follow-up story. Closing the ambient bypass is a p4-enf-mcp AC concern.

---

## DoD Observations

Spike B1 and Spike B2 share the P2 PARTIAL finding (declarative envelope delivery works; ambient bypass not structurally blocked in interactive mode). This is a consistent platform-level finding — not an individual spike failure — and the resolution path (Mode 2 headless subprocess for B2, skill-as-API-endpoint or workspace exclusion for B1) is the same architectural pattern applied to each surface's implementation story. The p4-enf-mcp and p4-enf-cli stories should both have an explicit AC covering P2 closure.

The `ADR-phase4-enforcement` guardrail in `pipeline-state.json` was at an invalid status value at the time of Spike A's DoD. This should be updated to `"met"` after both B spike verdicts are recorded. That update is captured in this session's pipeline-state.json write.
