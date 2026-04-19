# Definition of Ready: p4-dist-upgrade — Upgrade command with diff and confirm flow

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upgrade.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-upgrade-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-dist-upgrade-review-1.md
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
| H5 | Benefit linkage names a metric | ✅ PASS | M1 — Distribution sync (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 2. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 0 MEDIUM, 1 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; no gaps. Note: LOW finding 1-L1 recommended splitting AC2 into AC2a/AC2b — test plan handles both scenarios within existing AC IDs. |
| H8-ext | Schema dependency check | ✅ PASS | Spike C verdict in schema ✅; lockfile schema dependency is a story sequencing constraint. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: C4, C5, ADR-004, POLICY.md floor. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 covered. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Audit (`previousPinnedRef` in lockfile), Correctness (atomic sidecar update per C5), Performance (diff ≤15s). |
| W2 | Scope stability declared | ⚠️ UNSTABLE | Scope: Unstable — POLICY.md floor change detection and rollback are the most complex aspects; Spike C may change `previousPinnedRef` field name. Acknowledged. |
| W3 | MEDIUM findings acknowledged | N/A | 0 MEDIUM findings. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W2, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — coding agent may implement with PR review (Medium oversight).**

**Upstream gate:** p4-dist-lockfile and p4-dist-upstream must be complete.

**Scope contract:**
- Implement `generateDiff(oldLockfile, newLockfile)` — lists changed/added/removed skills.
- Implement POLICY.md floor change detection with "⚠ POLICY FLOOR CHANGE:" visual marker in diff output.
- Implement atomic sidecar update with rollback on verify failure.
- AC1: interactive `upgrade` → diff presented → wait for y/N confirmation before any file modification.
- AC2 (success path): confirmed upgrade → verify runs automatically as final step; pass = complete.
- AC2 (failure path): verify fails → sidecar and lockfile rolled back to pre-upgrade state.
- AC3: abort (N or Ctrl-C) → sidecar + lockfile byte-for-byte identical to pre-upgrade state.
- AC4: POLICY.md floor changes rendered with distinct "⚠ POLICY FLOOR CHANGE:" marker.

**Architecture constraints:**
- C4: Human confirmation required — non-interactive CI must fail with "Upgrade requires operator confirmation" unless `--confirm` flag provided
- C5: Atomic update — full upgrade or full rollback; no partial state
- ADR-004: Upstream source from `context.yml.skills_upstream.repo`; no flag override
- MC-SEC-02: Diff output must not expose credential values or internal URL tokens

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — PR review by heymishy required (Medium oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W2 (Spike C may change `previousPinnedRef` field name), W4 (verification script)
Upstream gate: p4-dist-lockfile and p4-dist-upstream must be complete.
