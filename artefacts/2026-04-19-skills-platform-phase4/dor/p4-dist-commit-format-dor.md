# Definition of Ready: p4-dist-commit-format — Operator-configured commit-format validation

Story reference: artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-commit-format.md
Test plan reference: artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-commit-format-test-plan.md
Review reference: artefacts/2026-04-19-skills-platform-phase4/review/p4-dist-commit-format-review-1.md
NFR profile reference: artefacts/2026-04-19-skills-platform-phase4/nfr-profile.md
Assessed by: Copilot
Date: 2026-04-19
Epic: E2 — Distribution Model
Oversight level: Medium

---

## Hard Blocks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | User story follows As / I want / So that format | ✅ PASS | Persona: platform operator in a regulated enterprise. All three clauses present. |
| H2 | ≥3 Acceptance Criteria in Given / When / Then format | ✅ PASS | 4 ACs, all in G/W/T format. |
| H3 | Every AC is covered by at least one test | ✅ PASS | All 4 ACs covered. |
| H4 | Out-of-scope section is populated | ✅ PASS | Explicitly populated. |
| H5 | Benefit linkage names a metric | ✅ PASS | M1 — Distribution sync (named). |
| H6 | Complexity is rated | ✅ PASS | Complexity: 1. |
| H7 | 0 HIGH findings in review | ✅ PASS | Review result: PASS 0 HIGH, 1 MEDIUM (1-M1), 0 LOW. |
| H8 | No uncovered ACs in test plan | ✅ PASS | All 4 ACs covered; no gaps. |
| H8-ext | Schema dependency check | ✅ PASS | Spike C verdict field in schema ✅. |
| H9 | Architecture constraints section populated | ✅ PASS | Arch constraints: ADR-004, C1, MC-CORRECT-02, MC-SEC-02. |
| H-E2E | CSS-layout check | N/A | None. |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md exists. |
| H-NFR2 | Regulatory compliance clauses | N/A | None. |
| H-NFR3 | Data classification declared | ✅ PASS | MC-SEC-02 covered. |

**Hard blocks result: ALL PASS — no blockers**

---

## Warnings

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| W1 | NFRs identified | ✅ | Security (MC-SEC-02), Correctness (ADR-004 single config source), Performance (≤10ms). |
| W2 | Scope stability declared | ✅ STABLE | Complexity 1, Stable — driven entirely by context.yml schema. |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 RISK-ACCEPTed in decisions.md on 2026-04-19. |
| W4 | Verification script reviewed | ⚠️ PROCEED | Not independently reviewed. Acknowledged. |
| W5 | No UNCERTAIN gaps | ✅ | No gaps. |

**Warnings result: W3 acknowledged (1-M1), W4 acknowledged — Proceed: Yes**

---

## Coding Agent Instructions

**Proceed: Yes — coding agent may implement with PR review (Medium oversight).**

**Upstream gate:** p4-dist-install must be complete; `advance` command requires a sidecar. Spike C output must have defined `distribution.commit_format_regex` field in context.yml schema.

**Scope contract:**
- Implement `validateCommitFormat(regex, headCommit)` in the `advance` command path.
- Read regex exclusively from `context.yml.distribution.commit_format_regex` — no CLI argument, env var, or hardcoded fallback.
- AC1: regex set + HEAD mismatch → non-zero exit with named SHA, message excerpt, expected format
- AC2: regex absent → no validation, command proceeds
- AC3: regex set + HEAD matches → passes sub-millisecond
- AC4: invalid regex in context.yml → clear error naming the regex and context.yml line reference (not a raw library stack trace)

**Architecture constraints:**
- ADR-004: single config source — `context.yml.distribution.commit_format_regex` only
- C1: validate only, do not generate commits
- MC-CORRECT-02: schema-validated config read; undeclared field uses schema default (absent = no validation)
- MC-SEC-02: commit message not logged to external services; regex validation in-process

---

## Sign-off

**DoR verdict: SIGNED OFF**
Signed by: Copilot (assessment) — PR review by heymishy required (Medium oversight)
Date: 2026-04-19

All hard blocks: PASS
Warnings acknowledged: W3 (1-M1 RISK-ACCEPTed), W4 (verification script)
Upstream gate: p4-dist-install complete + Spike C verdict non-null.
