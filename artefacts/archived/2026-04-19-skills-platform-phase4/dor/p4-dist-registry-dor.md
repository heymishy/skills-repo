# Definition of Ready: p4-dist-registry — Consumer fleet registry

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-registry.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-registry-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-dist-registry-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E2 — Distribution Model
Oversight level: Medium

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform maintainer (heymishy). All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M1 — Distribution sync; M2 — Consumer confidence (both named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 0 LOW — clean. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; no gaps. |
| H8-ext | Schema dependency check | ✅ PASS | Spike C verdict in schema ✅. Lockfile field name from Spike C is sequencing constraint. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: MC-CORRECT-02, ADR-004, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 — `fleet-state.json` must not contain PII. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02 — no PII in fleet-state.json), Correctness (JSON Schema CI validation), Performance (≤10s for 50 entries). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — `currentPinnedRef` field name in registry entries depends on Spike C lockfile schema verdict. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM, 0 LOW findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — coding agent may implement with PR review (Medium oversight).**

**Upstream gate:** p4-dist-lockfile must be complete (registry entries reference lockfile fields). p4-dist-upstream must be complete (upstream version comparison).

**Scope contract:**
- Define `fleet-state.json` JSON Schema with required fields: `consumerId`, `currentPinnedRef`, `pinnedAt`, `syncStatus`, `versionsBehind`.
- Implement `updateConsumerEntry(fleetState, consumer)` function.
- Implement staleness check: consumer `versionsBehind > staleThreshold` → `syncStatus: "stale"`.
- AC1: New consumer → entry created with all 5 required fields.
- AC2: `versionsBehind > staleThreshold` → `syncStatus: "stale"` and `versionsBehind` populated.
- AC3: Governance check (`npm test`) validates all `fleet-state.json` entries against schema.
- AC4: `stale_threshold` absent from context.yml → default to 2 releases.

**Architecture constraints:**
- MC-CORRECT-02: `fleet-state.json` schema defined first; CI validates against it
- ADR-004: `stale_threshold` from `context.yml.distribution.stale_threshold`; no hardcoded value in production code
- MC-SEC-02: `consumerId` must be a non-personal identifier (repo name, team name, etc.); no email/LDAP/display name

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — PR review by heymishy required (Medium oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike C gate), W4 (verification script)
Upstream gate: p4-dist-lockfile and p4-dist-upstream must be complete.
