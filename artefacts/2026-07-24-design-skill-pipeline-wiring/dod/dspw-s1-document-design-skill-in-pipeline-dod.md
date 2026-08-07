# Definition of Done: Document /design's place in the pipeline overview

**PR:** #588 | **Merged:** 2026-07-24
**Story:** artefacts/2026-07-24-design-skill-pipeline-wiring/stories/dspw-s1-document-design-skill-in-pipeline.md
**Test plan:** artefacts/2026-07-24-design-skill-pipeline-wiring/test-plans/dspw-s1-document-design-skill-in-pipeline-test-plan.md
**DoR artefact:** artefacts/2026-07-24-design-skill-pipeline-wiring/dor/dspw-s1-document-design-skill-in-pipeline-dor.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | CLAUDE.md line 77: `/design` row present, between `/benefit-metric` (line 76) and `/definition` (line 78), marked "(optional)" | Manual review (documentation-only change, no automated tests per test plan) | None |
| AC2 | ✅ | Entry condition "Benefit-metric active" matches `skills/design/SKILL.md`'s own documented entry condition; exit condition "Design artefact produced (or skipped)" reflects that `/definition`'s own entry condition does not require it | Manual cross-check against `skills/design/SKILL.md` | None |
| AC3 | ✅ | `grep -n "design" CLAUDE.md` shows only the new table row plus unrelated pre-existing mentions (`/loop-design`, generic prose word "design") — no duplicate/conflicting entry introduced | Manual grep verification | None |

---

## Scope Deviations

None — no source code touched; no change to `skills/design/SKILL.md` itself; not made a mandatory gate for `/definition` (confirmed still genuinely optional, matching current runtime behaviour).

---

## Test Plan Coverage

**Tests from plan implemented:** 0 automated / 3 manual verification steps (documentation-only change, per the test plan's own framing)
**Tests passing in CI:** N/A — no automated tests for a documentation-only change

| Verification step | Performed | Result | Notes |
|------|-------------|---------|-------|
| Diff CLAUDE.md — /design row added at correct position | ✅ | ✅ | |
| Cross-check wording against skills/design/SKILL.md | ✅ | ✅ | |
| grep for duplicate/conflicting mentions | ✅ | ✅ | |

**Gaps (tests not implemented):** None — this story was scoped as documentation-only from the start (DoR explicitly notes "Documentation-only. Verification is manual review, not automated tests").

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| None beyond existing behaviour (documentation-only, no source touched) | ✅ | Confirmed via `git diff` scope — CLAUDE.md only |

Not applicable — no code, no CSS layout, no runtime behaviour changed.

---

## Metric Signal

No feature-level `metrics` array exists for this short-track fix. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. Confirmed during this story's own investigation that the actual runtime state machine (`STAGE_SEQUENCE`, `journey-store.js`) already correctly included `/design` — this was purely a documentation/reality gap, not a missing feature. A clean, low-risk fix matching its Complexity 1 rating exactly.
2. Separate finding surfaced during investigation (not fixed by this story, flagged for its own follow-up): `journey.js`'s local `STAGE_ORDER` disagrees with `journey-store.js`'s `STAGE_SEQUENCE` on `test-plan`/`review` ordering — the same finding independently surfaced again during `dtra-s1`'s own DoD write-up. **Tag as `/improve` candidate:** this is now flagged twice across two different stories' artefacts without being scheduled as its own fix — should be actioned, not flagged a third time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Document /design's place in the pipeline overview".
Check:
1. Does every AC row have a concrete evidence reference?
2. Is the outcome verdict consistent with a documentation-only, zero-deviation change?
3. Are any follow-up actions that should block release not flagged?
Report findings as HIGH / MEDIUM / LOW.
```
