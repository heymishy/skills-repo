## Definition of Ready: Canvas rendering of the diagram content-block type

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s2-canvas-diagram-rendering.md
**Test plan reference:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s2-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5), operator-directed
**Date:** 2026-07-25

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Developer/engineer |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 7 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | P2, rewritten during /review |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, both MEDIUM + 1 LOW resolved |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated, no Cat E HIGH | ✅ | ADR-026, ADR-027, MC-SEC-01 all cited |
| H-E2E | Layout-dependent ACs have E2E tooling or RISK-ACCEPT | ✅ | AC3/AC4 CSS-layout-dependent; Playwright configured — no gap |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-GOV | Discovery Approved By populated | ✅ | |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Resolved | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Spec error could go unnoticed until post-merge smoke test | RISK-ACCEPT logged in decisions.md, 2026-07-25 (epic-wide entry covers all 6 stories) |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Coding Agent Instructions

```
Proceed: Yes
Story: csd-s2 — Canvas rendering of the diagram content-block type — artefacts/2026-07-25-code-shape-diagrams/stories/csd-s2-canvas-diagram-rendering.md
Test plan: artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s2-test-plan.md

Goal:
Make every test in the test plan pass. Extend csd-s1's proven diagram
content-block mechanism to production quality: all three diagram types,
clear labelled error states for malformed mermaid syntax, visual
distinguishability between as-designed/as-built variants, and keyboard-
navigation compatibility.

Constraints:
- Depends on csd-s1 being merged first — do not start until csd-s1's PR
  is merged to master.
- Extend the same dispatch mechanism csd-s1 proved — do not introduce a
  parallel rendering path per diagram type.
- This story does NOT implement the drift/match-diverged comparison
  logic (csd-s6) — rendering only.
- This story does NOT add editable/interactive diagram features (zoom,
  pan, click-to-expand).
- Same MC-SEC-01 mermaid security-level requirement as csd-s1, applied
  consistently across all three types.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not violate ADR-026, ADR-027, or MC-SEC-01.
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
