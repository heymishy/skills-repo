## Definition of Ready: `/design`/`/definition` produce Data Model diagrams

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s4-design-produces-data-model-diagrams.md
**Test plan reference:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s4-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5), operator-directed
**Date:** 2026-07-25

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Developer/engineer, Second-look reviewer |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 9 tests |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | P1, P3, M1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 1 MEDIUM resolved via scope-note-and-approve |
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
Story: csd-s4 — /design//definition produce Data Model diagrams — artefacts/2026-07-25-code-shape-diagrams/stories/csd-s4-design-produces-data-model-diagrams.md
Test plan: artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s4-test-plan.md

Goal:
Make every test in the test plan pass. Update /design and/or /definition
SKILL.md instructions so completing schema-related sections produces a
Data Model diagram content-block, showing both new and existing touched
entities, with names matching this repo's real migration-file naming
convention, and a reuse-check prompt before finalising any new entity
(per ADR-026).

Constraints:
- Depends on csd-s2 being merged first.
- This story does NOT produce as-built Data Model diagrams (csd-s5) or
  implement live-database introspection.
- The reuse-check prompt (AC4) must not BLOCK creation of a new entity —
  it surfaces a check, the operator can still proceed with a new entity
  if no existing one covers the concept (per decisions.md's SCOPE entry
  for this AC).
- Diagram generation is skill-governed work (ADR-027) — changes belong in
  skills/design/SKILL.md and/or skills/definition/SKILL.md.
- Entity/relationship names must match this repo's real migration files
  (src/web-ui/modules/migrate-schema-*.js) exactly — no generic
  placeholder names.
- Diagram content must show schema structure only — never row-level or
  tenant-specific data.
- Any SKILL.md change must go via PR review, per CLAUDE.md's Platform
  change policy.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Respect ADR-026, ADR-027.
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
