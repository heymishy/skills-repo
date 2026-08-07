# Definition of Done: Canvas rendering of the diagram content-block type (production-harden all 3 types)

**PR:** [#607](https://github.com/heymishy/skills-repo/pull/607) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s2-canvas-diagram-rendering.md
**Test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s2-test-plan.md
**DoR artefact:** artefacts/2026-07-25-code-shape-diagrams/dor/csd-s2-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | All 3 types (`data-model`, `system-architecture`, `program-design`) render through one shared `buildDiagramBodyHtml()` helper, each with a visible `.cv-diagram-type-label` ("Data Model" / "System Architecture" / "Program Design") | Direct code review of `src/web-ui/routes/skills.js` (`buildDiagramBodyHtml`, confirmed the type-label div is present and type-specific); `tests/check-csd-s2-canvas-diagram-rendering.js` | None |
| AC2 | ✅ | Malformed mermaid syntax produces a labelled, non-blank error box via `markDiagramRenderError()` — never mermaid's own stack-trace-shaped default output, never a raw JS error | Code review + `tests/e2e/csd-s2-canvas-diagram-rendering.spec.js` (real Chromium render of the malformed-diagram fixture) | None |
| AC3 | ⚠️ | Diagrams are distinguished via the generic `canvas-block-title` span (populated from `block.title`), not a dedicated "As Designed"/"As Built" label mechanism. csd-s4's as-designed marker convention uses a plain title (e.g. "Data model"); csd-s5's as-built diagram uses `"As-built: Data model"`. The two ARE visually distinguishable in practice, but the AC's own wording implies a symmetric "As Designed" vs "As Built" label pair, and only one side carries an explicit prefix | Code review of `src/web-ui/routes/skills.js` line ~3394 (generic title rendering) cross-referenced against `skills/design/SKILL.md`'s csd-s4 marker docs and `src/modules/migration-schema-parser.js`'s csd-s5 title default | **Minor deviation**: the "As Designed" side has no explicit prefix, only the "As Built" side does. Distinguishable, but not symmetric. Recorded here rather than silently treated as fully met. |
| AC4 | ✅ | Existing keyboard navigation/focus order for other block types unaffected — diagram blocks use the same DOM structure (`canvas-block` wrapper) as cluster/table/text | Non-regression test in `tests/check-csd-s2-canvas-diagram-rendering.js`; no new tabindex/focus-trapping code introduced | None |

---

## Scope Deviations

None beyond the AC3 note above (which is a deviation in labelling symmetry, not scope). The drift/match-diverged signal (csd-s6) and editable/interactive diagrams were correctly left out of this story.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 14 / 14 (7 from the test plan + 5 Playwright E2E specs + 2 pre-existing csd-s1 tests re-verified as non-regression)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Unit/integration/NFR suite (`check-csd-s2-canvas-diagram-rendering.js`) | ✅ | ✅ | 9/9 — independently re-run at merge verification |
| E2E specs (`csd-s2-canvas-diagram-rendering.spec.js`) | ✅ | ✅ | 5/5 — real Chromium renders covering AC3/AC4's CSS-layout-dependent gaps, routed to Playwright per the DoR's B2 classification |
| csd-s1 non-regression (`check-csd-s1-derisk-canvas-mermaid.js`) | ✅ | ✅ | 8/8 — confirmed unaffected by this story's changes |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Client-side rendering safety — all 3 types | ✅ | `mermaid.initialize()` security-level config applies uniformly across `data-model`/`system-architecture`/`program-design` — confirmed by NFR test |
| Accessibility — text-alternative fallback, all 3 types | ✅ | Same `<details>`/`<pre>` mechanism as csd-s1, confirmed present for all 3 types |
| Performance — multiple diagram blocks, no more than small added delay | ✅ | No numeric baseline (per NFR profile); per-node `mermaid.run()` (rather than batched) confirmed by code review — one malformed diagram never blocks a sibling's render |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P2 — Diagram completion rate | ❌ | Once csd-s3 through csd-s6 have shipped and at least one real feature produces all diagram types end-to-end | Foundational — completes the rendering mechanism for all 3 types and both as-designed/as-built variants; does not itself move P2 |

**Measurement-ready gate:** Not yet — see epic-level consolidated note.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- Consider symmetrizing the "As Designed" vs "As Built" title convention (e.g. have `/design`'s marker docs explicitly prefix "As designed: ") in a future small fix, so the AC3 labelling is symmetric rather than one-sided. Not release-blocking — the two are already distinguishable in practice.

---

## DoD Observations

1. Same foundational-story benefit-linkage anti-pattern as csd-s1 was caught and fixed at `/review` (finding 1-M2) before merge — consistent pattern across both foundational stories in this epic, worth a standing `/improve` note: foundational/enabling stories in a multi-story epic are the most likely candidates for this anti-pattern, and this epic's `/review` caught it both times it occurred.
2. AC3's labelling asymmetry (see above) was not caught at `/review` or DoR time — it only surfaced during this DoD pass by tracing the actual title strings each downstream story (csd-4, csd-s5) chose. This is a minor gap in the DoR's own AC-verification depth: the DoR confirmed AC3 was "testable" but the eventual test coverage (a code-presence check for a title span) didn't assert the specific string content, so the asymmetry shipped without being flagged until now.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Canvas rendering of the diagram content-block type" (csd-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
