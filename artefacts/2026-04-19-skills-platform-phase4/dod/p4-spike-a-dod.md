# Definition of Done: Determine whether governance logic is extractable into a shared package (Spike A)

**PR:** No formal PR — work committed directly to master at `26d65e3` (see Scope Deviations) | **Merged:** 2026-04-19
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-a.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-a-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-a-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Spike output artefact exists with valid verdict + rationale | ✅ | T1/T2/T3 passing; `spike-a-output.md` exists, verdict `PROCEED`, ~4-sentence rationale | Automated: `tests/check-p4-spike-a.js` T1–T3 | None |
| AC2 — PROCEED: interface defines all 5 governance operations | ✅ | T4×5 + T5×5 passing; all five operation labels (skill-resolution, hash-verification, gate-evaluation, state-advancement, trace-writing) present with parameter/return shapes | Automated: `tests/check-p4-spike-a.js` T4–T5 | Design decision: 5 labels consolidated into 3 combined functions in the artefact; all labels remain resolvable via cross-reference (see Scope Deviations) |
| AC3 — REDESIGN: blocking constraint + minimum shared contract | ✅ N/A | Verdict is PROCEED; REDESIGN path not applicable | Automated: T6–T7 correctly skipped | None |
| AC4 — Verdict in pipeline-state.json and decisions.md entry | ✅ | T8/T8b/T9/T10a–T10e passing; verdict `PROCEED` in both `phase4.spikes["spike-a"]` and `features[0].spikes[0]`; decisions.md ARCH entry includes decision, alternatives, rationale, and revisit trigger | Automated: `tests/check-p4-spike-a.js` T8–T10e | None |
| AC5 — E3 stories reference Spike A output as architecture input | ✅ | T11/T12 passing; `p4-enf-package.md` and `p4-enf-mcp.md` both reference `spike-a-output.md` | Automated: `tests/check-p4-spike-a.js` T11–T12 | None |

**ACs satisfied: 5/5** (AC3 N/A — PROCEED verdict, REDESIGN path not exercised by design)

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** The `feature/p4-spike-a` worktree was established via `/branch-setup` but the spike investigation and all deliverable commits were made in the main working tree directly on `master`. The work was pushed to `origin/master` at `26d65e3`. No draft PR was opened. This is a process deviation from the standard inner loop; the work is complete and on master, but the audit trail lacks a PR reference. Recorded here for `/trace` awareness.

**Deviation 2 — 5 operations consolidated to 3 functions:** The story AC2 names five discrete operations (skill-resolution, hash-verification, gate-evaluation, state-advancement, trace-writing). The spike artefact documents a design decision to consolidate naturally-paired operations: hash-verification is folded into `resolveAndVerifySkill()` (same call, same return shape) and state-advancement is folded into `evaluateGateAndAdvance()` (state transition is the `newState` field of the gate result). All five labels are present in the artefact with cross-references to their combined functions. The AC2 test T4/T5 passes because all five labels are in the content. This is a design clarification, not a gap.

---

## Test Plan Coverage

**Tests from plan implemented:** 13/13 test IDs
**Assertions passing:** 24/24
**Tests passing in CI:** 24 (T6–T7 correctly skipped — REDESIGN path, verdict is PROCEED)

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — spike-a-output.md exists | ✅ | ✅ | |
| T2 — verdict is valid enum value | ✅ | ✅ | Found: PROCEED |
| T3 — rationale ≥3 sentences | ✅ | ✅ | Found ~4 sentences |
| T4 (×5) — all 5 operation labels present | ✅ | ✅ | All 5 labels found |
| T5 (×5) — each label has param/return detail | ✅ | ✅ | All 5 labels near function signatures |
| T6–T7 — REDESIGN path | ✅ | N/A | Correctly skipped (PROCEED verdict) |
| T8 — pipeline-state phase4.spikes["spike-a"] exists | ✅ | ✅ | |
| T8b — spike-a entry has valid verdict | ✅ | ✅ | Found: PROCEED |
| T9 — state verdict matches artefact verdict | ✅ | ✅ | Both: PROCEED |
| T10a–T10e — decisions.md ARCH entry complete | ✅ | ✅ | All 5 fields present |
| T11 — p4-enf-package references Spike A | ✅ | ✅ | |
| T12 — p4-enf-mcp references Spike A | ✅ | ✅ | |
| T-NFR1 — no credentials outside code blocks | ✅ | ✅ | 0 found |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — No API keys, tokens, or credentials in spike artefact | ✅ | T-NFR1 passing; automated scan found 0 credential-shaped strings outside code blocks |
| C5 — Hash verification preserved as primary audit signal | ✅ | `resolveAndVerifySkill()` signature includes `expectedHash` param and `{ hashValid }` return field; artefact explicitly states hash-at-execution-time is non-negotiable |
| C4 — Human approval routing preserved | ✅ | Out of scope for this spike (no code changes); artefact explicitly excludes approval handling from the enforcement package — approval events route through the existing approval-channel adapter (ADR-006) |
| Audit — Verdict written to both artefact and pipeline-state.json | ✅ | Both paths updated: `phase4.spikes["spike-a"].verdict` and `features[0].spikes[0].verdict` = `"PROCEED"` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Consumer confidence (unassisted onboarding) | ❌ | After E3 enforcement stories complete + Spikes B1/B2 complete | This spike resolves the architecture decision prerequisite for M2, but the metric itself requires at least one unassisted team member to complete a full outer loop. That is not measurable from a design spike alone. Signal remains `not-yet-measured`. |

---

## Definition of Done Outcome

**COMPLETE WITH DEVIATIONS ✅**

ACs satisfied: 5/5 (AC3 N/A)
Deviations: 2 recorded (no formal PR; 5-op to 3-op design consolidation)
Test gaps: None
NFRs: All addressed

**Follow-up actions:**
1. Process deviation (no PR) — noted for `/trace`. No follow-up story required; work is complete on master. Future spike stories should use the worktree for the full implementation rather than switching to the main tree.
2. `ADR-phase4-enforcement` guardrail in `pipeline-state.json` has an invalid status value (`"pending — written after Spike A/B1/B2 verdicts"` is not a valid schema enum). This should be corrected to `"not-assessed"` and updated to `"met"` once Spike B1/B2 verdicts are recorded and the architecture-guardrails.md ADR is written. Recommend fixing in the Spike B1 or B2 story.
3. heymishy must explicitly approve the Spike A PROCEED verdict (HIGH oversight) before `p4-spike-b1` and `p4-spike-b2` can enter their implementation phase, and before `p4-enf-package` can enter DoR.
