# Definition of Ready: p4-nta-standards-inject — Standards injection for non-technical discipline roles

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-standards-inject.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-nta-standards-inject-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-nta-standards-inject-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E4 — Non-Technical Access
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: non-technical outer-loop participant (discipline role — PM, risk reviewer). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M2 — Consumer confidence; M3 — Teams bot C7 fidelity (both named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike D verdict in schema ✅. `standards_injected` is a session output flag, not a new pipeline-state.json field. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C7 (standards before question), ADR-004, C5, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — standards content not sent to external services. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02; hash-verified source per C5), Correctness (`standards_injected: false` flag), Accessibility (plain text or markdown within Teams adaptive card limits). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — depends on Spike D PROCEED verdict. If Spike D returns DEFER, this story is deferred to Phase 5. Parallel dep: p4-dist-install (sidecar available); if not, graceful fallback to `standards_injected: false`. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes (contingent on Spike D PROCEED)**

---

## Coding Agent Instructions

**Proceed: Yes — contingent on Spike D PROCEED verdict. Implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** p4-nta-surface must be complete. Spike D must have PROCEED verdict. Parallel dep: p4-dist-install (graceful fallback if not complete).

**Scope contract:**
- Implement standards injector that reads standards files from installed sidecar at path from context.yml.
- AC1: at a step with applicable standards, bot sends standards content (or ≤1,200-char section) as context before the question — standards first, question second (C7).
- AC2: standards content sourced from installed sidecar (C5 hash-verified); no remote fetch at session time.
- AC3: sidecar not installed → question sent without standards context; note appended: "Standards unavailable — sidecar not installed. Run `skills-repo init` to enable standards injection."; session output marked `standards_injected: false`; session continues.
- AC4: discipline role declared at session init → only role-applicable standards injected (PM session: no engineering/security standards; risk-reviewer session: no product standards).

**Architecture constraints:**
- C7: standards content delivered before question; standards-then-question ordering is mandatory in bot message sequence
- ADR-004: standards file paths from `context.yml`; no hardcoded standards file paths
- C5: standards read from hash-verified sidecar install; no remote fetch
- MC-SEC-02: standards content not sent to external logging or analytics services

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike D DEFER → story deferred; graceful fallback if sidecar absent), W4 (verification script)
Upstream gate: Spike D PROCEED + p4-nta-surface complete.
