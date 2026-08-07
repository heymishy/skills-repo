## Definition of Ready: Drift signal — as-designed vs as-built comparison

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s6-drift-signal.md
**Test plan reference:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s6-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5), operator-directed
**Date:** 2026-07-25

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Developer/engineer, Second-look reviewer |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 17 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | P1 (directly), P3, M1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 findings at all |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated, no Cat E HIGH | ✅ | ADR-026 cited |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-GOV | Discovery Approved By populated | ✅ | |

**H-E2E not triggered** — no CSS-layout-dependent ACs in this story.

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1-W3, W5 | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Spec error could go unnoticed until post-merge smoke test | RISK-ACCEPT logged in decisions.md, 2026-07-25 (epic-wide) |

---

## Coding Agent Instructions

```
Proceed: Yes
Story: csd-s6 — Drift signal — as-designed vs as-built comparison — artefacts/2026-07-25-code-shape-diagrams/stories/csd-s6-drift-signal.md
Test plan: artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s6-test-plan.md

Goal:
Make every test in the test plan pass. Implement type-specific drift
comparison logic (Data Model, Program Design, System Architecture) between
as-designed and as-built diagrams, surfaced as an explicit match/diverged
signal in canvas, with the specific difference named — not a bare
"diverged" label.

Constraints:
- Depends on csd-s3, csd-s4 (as-designed diagrams) and csd-s5 (as-built
  diagrams) being merged first — this story has nothing to compare
  without both halves.
- Drift rules are type-specific, not one generic rule:
  - Data Model: any table/column/relationship add-remove-rename, AND
    specifically flag non-optimal design (new/duplicate object where an
    existing one already served the purpose) per ADR-026.
  - Program Design: call-stack/file-tree structural changes only — a
    renamed local variable within unchanged structure must NOT flag.
  - System Architecture: new/removed service-to-service calls.
- No drift must show an explicit "Matches" signal — never silence.
- This story does NOT implement a fully automated semantic safe/unsafe
  verdict, and does NOT auto-remediate detected drift.
- The match/diverged signal must be conveyed by more than colour alone
  (WCAG 2.1 AA — icon or text label, not colour-only).
- Drift check results must be logged (matched/diverged, per type, per
  feature) — this is the evidence P3 and M1 measurement depends on.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Respect ADR-026.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing it and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness confirmed
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25
