# Definition of Ready: p4-enf-cli — CLI enforcement adapter

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-cli.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-enf-cli-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-enf-cli-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E3 — Structural Enforcement
Oversight level: High — heymishy explicit approval required

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform operator in a regulated or CI environment (Craig's surface class). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M1 — Distribution sync; M2 — Consumer confidence (both named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 3. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered. |
| H8-ext | Schema dependency check | ✅ PASS | Spike B2 verdict in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: Craig's CLI design artefacts, Spike B2 output, C5, ADR-004, ADR-002, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — no credentials in CLI output or trace artefacts. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02; no `--skip-verify` flag per C5), Correctness (9 commands covered; emit-trace validated), Performance (`advance` ≤3s). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — Spike B2 Assumption A2 (trace schema compatibility) is the primary risk; REDESIGN may require schema alignment work. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — implementation requires heymishy explicit approval (High oversight) before merge.**

**Upstream gate:** Spike B2 must have a non-null verdict (Assumption A2 result needed). `p4-enf-decision` ADR must be committed. `p4-enf-package` must be complete.

**Scope contract:**
- Implement Mode 1 MVP command set (9 commands): `init`, `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emit-trace`.
- Use Craig's CLI design artefacts as source reference: `artefacts/2026-04-18-cli-approach/`.
- If Spike B2 flagged a trace schema delta, implement that delta in this story.
- AC1: all 9 commands present; each has ≥1 passing unit test.
- AC2: `advance` from state that does not permit target → non-zero exit; message: "Transition to <target> not permitted from <current>. Allowed: <list>" (ADR-002).
- AC3: `advance` with hash mismatch → non-zero exit; message: "Hash mismatch for skill <skillId>: expected <expected>, got <actual>" (C5).
- AC4: `emit-trace` output passes `scripts/validate-trace.sh --ci`; no new parallel gate required.
- No `--skip-verify` or equivalent bypass flag permitted (C5).

**Architecture constraints:**
- C5: `advance` calls `verifyHash` before envelope build; mismatch aborts; no bypass flag
- ADR-004: all config from `.github/context.yml`; no hardcoded URLs or paths
- ADR-002: `advance` enforces `allowedTransitions` array from workflow declaration
- MC-SEC-02: no credentials in CLI output, trace artefacts, or config files produced

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — heymishy explicit approval required before merge (High oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike B2 schema alignment risk), W4 (verification script)
Upstream gate: Spike B2 verdict + p4-enf-decision ADR + p4-enf-package complete.
