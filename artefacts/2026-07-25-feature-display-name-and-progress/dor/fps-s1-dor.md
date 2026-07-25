## Definition of Ready: Progress proxy for unknown-health features

**Story reference:** artefacts/2026-07-25-feature-display-name-and-progress/stories/fps-s1-progress-proxy-for-unknown-health.md
**Test plan reference:** artefacts/2026-07-25-feature-display-name-and-progress/test-plans/fps-s1-progress-proxy-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 6 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Direct operator-reported UX gap ("? Unknown"/"No test data yet" uninformative), found via live usage |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: fps-s1 -- artefacts/2026-07-25-feature-display-name-and-progress/stories/fps-s1-progress-proxy-for-unknown-health.md
Test plan: artefacts/2026-07-25-feature-display-name-and-progress/test-plans/fps-s1-progress-proxy-test-plan.md

In handleGetProductView (products.js), await _getArtefactCountsBulk once
for every item's journeyId (reusing s2.2's existing batched seam, same
pattern already used for the kanban board -- do NOT add a per-row query),
and pass the resulting counts map into _renderProductView. When an item's
health is 'unknown' and it has a resolvable journeyId, replace its
coverageLabel with "<stage> · N artefacts" / "<stage> · no artefacts yet"
(reuse kanban-view.js's exact wording/pluralisation, lines 46 and 316-317)
instead of the plain "No test data yet". When there's no resolvable
journeyId, or the bulk read throws, fall back to today's plain
"No test data yet" text -- matching s2.2's own AC5 failure-mode precedent.
Do NOT touch green/amber/red health rendering, colors, or the pill markup
itself -- text content only, for the unknown case only.

Sequence after fdn-s1 (same render functions).

Oversight level: Low -- reuses an existing, already-tested batching
mechanism (s2.2) end to end; no new query, no new component.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed same session, found via live usage)
