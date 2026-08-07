## Test Plan: Document /design's place in the pipeline overview

**Story reference:** artefacts/2026-07-24-design-skill-pipeline-wiring/stories/dspw-s1-document-design-skill-in-pipeline.md

This is a documentation-only change. Verification is manual review, not automated tests.

## AC Coverage

| AC | Description | Verification | Risk |
|----|-------------|--------------|------|
| AC1 | /design listed between benefit-metric and definition, marked optional | Manual review of CLAUDE.md diff | 🟢 |
| AC2 | Entry/exit conditions match skills/design/SKILL.md | Manual cross-check against SKILL.md content | 🟢 |
| AC3 | Not duplicated in cross-cutting sections | Manual grep for "design" across CLAUDE.md after edit | 🟢 |

## Verification Steps

1. Diff CLAUDE.md before/after — confirm `/design` row added to the Pipeline overview table only, at the correct position.
2. Re-read `skills/design/SKILL.md`'s entry condition and description; confirm the table's wording doesn't contradict it.
3. `grep -n "design" CLAUDE.md` after the edit — confirm no second, conflicting mention was introduced.
