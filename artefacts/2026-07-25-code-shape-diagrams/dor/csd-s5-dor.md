## Definition of Ready: As-built diagram generation via static migration-file parsing

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s5-as-built-diagram-generation.md
**Test plan reference:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s5-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5), operator-directed
**Date:** 2026-07-25

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Developer/engineer |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 10 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | P1, P2, M1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 1 LOW resolved |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated, no Cat E HIGH | ✅ | ADR-027 cited (added during /review) |
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
Story: csd-s5 — As-built diagram generation via static migration-file parsing — artefacts/2026-07-25-code-shape-diagrams/stories/csd-s5-as-built-diagram-generation.md
Test plan: artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s5-test-plan.md

Goal:
Make every test in the test plan pass. Build a static SQL/migration-file
parser and call-graph/file-structure extraction, invoked from
/verify-completion and/or /branch-complete, producing as-built versions of
all three diagram types, saved as versioned artefact files.

Constraints:
- Depends on csd-s2 (rendering mechanism), csd-s3, csd-s4 (as-designed
  diagrams must exist for the epic's drift check, csd-s6, to have both
  halves) being merged first.
- Static parsing only — no live-database connection for this story
  (discovery's own resolved decision, decisions.md).
- Must NOT re-prompt an agent to describe from memory what it built —
  extraction must read real files/AST structure directly.
- Malformed/unparseable migration files must fail with a clear, specific
  error — never silently produce an empty or incorrect diagram.
- As-built diagrams must be written to the feature's artefact folder as
  versioned files, not just held transiently in session memory
  (artefact-first convention).
- This is skill-governed work (ADR-027) — belongs in
  skills/verify-completion/SKILL.md (or equivalent) plus a parsing module,
  not src/web-ui/.
- Diagram content must show schema structure only — never row-level data.
- Any SKILL.md change must go via PR review, per CLAUDE.md's Platform
  change policy.
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
