# Definition of Ready: p4-nta-surface — Teams bot runtime (C11 compliant)

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-surface.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-nta-surface-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-nta-surface-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E4 — Non-Technical Access
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: non-technical outer-loop participant (PM, BA, risk reviewer). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M3 — Teams bot C7 fidelity (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike D verdict in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C11, C7, ADR-004, Spike D output. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no credentials; user input stored only to designated session state store. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Availability (≤5s Teams response), Correctness (C7 state machine unit tests). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — entirely dependent on Spike D PROCEED verdict. If Spike D returns DEFER, this story is deferred to Phase 5. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes (contingent on Spike D PROCEED)**

---

## Coding Agent Instructions

**Proceed: Yes — contingent on Spike D PROCEED verdict. If Spike D = DEFER, this story is deferred to Phase 5. Implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** Spike D must have a PROCEED verdict with an output artefact specifying the compliant runtime architecture.

**Scope contract:**
- Implement Teams bot using Spike D's PROCEED architecture (stateless webhook or Azure Function).
- AC1: C7 state machine — after sending a question, bot transitions to AWAITING_RESPONSE; no second message until response received.
- AC2: Response received → record response with step + question ID → PROCESSING → output → READY_FOR_NEXT_QUESTION → next question.
- AC3: CI test confirms handler is stateless — no in-memory session state between invocations; session state in external store.
- AC4: CI check confirms no hardcoded credentials + all config from `.github/context.yml`.

**Architecture constraints:**
- C11: stateless webhook or Azure Function; no persistent bot server process; per-session lifecycle at maximum
- C7: state machine enforced in code (not prompt instruction); AWAITING_RESPONSE lock is a hard constraint
- ADR-004: Teams bot config (tenant ID, channel routing, workflow step pointers) from `.github/context.yml`
- MC-SEC-02: no user input stored beyond designated session state store; no credentials in runtime code

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike D DEFER → story deferred to Phase 5), W4 (verification script)
Upstream gate: Spike D PROCEED verdict required.
