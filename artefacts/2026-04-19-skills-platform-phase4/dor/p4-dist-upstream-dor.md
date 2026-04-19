# Definition of Ready: p4-dist-upstream — Upstream authority configuration from context.yml

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upstream.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-upstream-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-dist-upstream-review-1.md
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
| H6 | Complexity is rated | ✅ PASS | Complexity: 1. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 0 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; no gaps. |
| H8-ext | Schema dependency check | ✅ PASS | Spike C verdict in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: ADR-004, C5, MC-CORRECT-02. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 covered. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02 — URL treated as opaque string, no speculative DNS), Audit (ADR-004 compliance checked by `npm test`), Performance (≤5ms config read). |
| W2 | Scope stability declared | ✅ STABLE | Complexity 1, Stable — ADR-004 compliance is well-defined once Spike C decides the `skills_upstream` schema. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 RISK-ACCEPTed in decisions.md on 2026-04-19. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W3, W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — coding agent may implement with PR review (Medium oversight).**

**Upstream gate:** Spike C verdict must be non-null (provides `skills_upstream` schema).

**Scope contract:**
- Implement `getUpstreamUrl(config)` that reads exclusively from `context.yml.skills_upstream.repo`.
- AC1: valid `skills_upstream.repo` → command uses that URL, no hardcoded fallback
- AC2: absent/empty `skills_upstream.repo` → non-zero exit with exact message before network call
- AC3: URL changed in context.yml → new URL used and recorded in updated lockfile's `upstreamSource`
- AC4: governance check (`check-approval-adapters.js` or equivalent) confirms no hardcoded URL matching `github.com/heymishy` or any skills-repo URL in distribution command source files (outside test fixtures)

**Architecture constraints:**
- ADR-004: Single config source — `context.yml.skills_upstream.repo` only; no CLI flag, no env var
- C5: Content fetched from upstream is still hash-verified; source authority ≠ hash bypass
- MC-CORRECT-02: `skills_upstream` block validated against context.yml schema; missing schema entry = named error
- MC-SEC-02: URL treated as opaque string; no speculative DNS resolution on read

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — PR review by heymishy required (Medium oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W3 (1-M1 RISK-ACCEPTed), W4 (verification script)
Upstream gate: Spike C verdict non-null.
