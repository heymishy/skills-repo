# Definition of Ready: p4-dist-lockfile — Lockfile structure, pinning, and transparency

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-lockfile.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-lockfile-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-dist-lockfile-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E2 — Distribution Model
Oversight level: Medium

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: consumer (Craig, Thomas, or any adopter). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M1 — Distribution sync; M2 — Consumer confidence (both named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 0 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; no gaps. |
| H8-ext | Schema dependency check | ✅ PASS | Spike C verdict field in schema ✅. Lockfile JSON Schema (MC-CORRECT-02) must be defined before init writes a lockfile — a schema-first constraint, not a pipeline-state.json dependency. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C5, MC-CORRECT-02, ADR-004, Spike C output reference. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02; lockfile must not contain credentials. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02, SHA-256 minimum for C5), Correctness (schema-first), Performance (verify ≤5s). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — lockfile schema is determined by Spike C verdict. Acknowledged: Spike C gate must be cleared before implementation. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 RISK-ACCEPTed in decisions.md on 2026-04-19. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W3, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — coding agent may implement with PR review (Medium oversight).**

**Upstream gate:** Spike C must have a verdict providing the lockfile schema. p4-dist-install must be in progress or complete (lockfile is written by init).

**Scope contract:**
- Define the lockfile JSON Schema before writing any lockfile-producing code (MC-CORRECT-02).
- Implement `validateSchema(lockfile)` against the defined schema.
- Implement `verifyLockfile(lockfile, sidecarDir)` that re-computes SHA-256 hashes without network.
- AC1: lockfile must have at minimum: `upstreamSource`, `pinnedRef`, `pinnedAt`, `platformVersion`, `skills[]` (with `skillId`, `skillFile`, `contentHash`).
- AC2: verify re-computes SHA-256 per skill; mismatch → named error with expected/actual hash.
- AC3: deterministic hash computation — two pin runs of identical content produce identical lockfiles (except `pinnedAt`).
- AC4: tampered skill file detected by verify.

**Architecture constraints:**
- C5: SHA-256 minimum; hash comparison without network
- MC-CORRECT-02: JSON Schema defined first; CI test validates lockfile fixtures against schema
- ADR-004: `upstreamSource` in lockfile matches `skills_upstream.repo` in context.yml at pin time
- MC-SEC-02: No API keys, tokens, or personal data in lockfile

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — PR review by heymishy required (Medium oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike C gate), W3 (1-M1 RISK-ACCEPTed), W4 (verification script)
