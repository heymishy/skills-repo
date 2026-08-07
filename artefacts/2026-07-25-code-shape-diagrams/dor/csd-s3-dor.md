## Definition of Ready: `/design`/`/definition` produce System Architecture + Program Design diagrams

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s3-design-produces-architecture-and-program-diagrams.md
**Test plan reference:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s3-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5), operator-directed
**Date:** 2026-07-25

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Developer/engineer, Second-look reviewer |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 6 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | P1, P2 — genuine, direct operator value |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 findings at all — cleanest story in the epic |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated, no Cat E HIGH | ✅ | ADR-027 cited |
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
Story: csd-s3 — /design//definition produce System Architecture + Program Design diagrams — artefacts/2026-07-25-code-shape-diagrams/stories/csd-s3-design-produces-architecture-and-program-diagrams.md
Test plan: artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s3-test-plan.md

Goal:
Make every test in the test plan pass. Update /design and/or /definition
SKILL.md instructions so completing the System Architecture and Program
Design sections produces a diagram content-block (using csd-s2's
mechanism), at feature-level granularity by default.

Constraints:
- Depends on csd-s2 being merged first (rendering mechanism must exist).
- This story does NOT produce Data Model diagrams (csd-s4) or as-built
  diagrams (csd-s5).
- Diagram generation is skill-governed work (ADR-027) — changes belong in
  skills/design/SKILL.md and/or skills/definition/SKILL.md, not
  src/web-ui/.
- Per-feature granularity is the default; per-story granularity for a
  specific feature is an explicit /definition-time judgment call, not a
  fixed rule to hardcode.
- Any SKILL.md change must go via PR review, per CLAUDE.md's Platform
  change policy — not a direct commit.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Respect ADR-027.
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
