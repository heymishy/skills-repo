# Definition of Done: /design and /definition produce System Architecture + Program Design diagrams

**PR:** [#609](https://github.com/heymishy/skills-repo/pull/609) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s3-design-produces-architecture-and-program-diagrams.md
**Test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s3-test-plan.md
**DoR artefact:** artefacts/2026-07-25-code-shape-diagrams/dor/csd-s3-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | `skills/design/SKILL.md` gained a "Canvas markers — System Architecture diagram" section tied to Step 2 (Solution architecture); emits the `system-architecture` CANVAS-JSON marker. AC text says "saved as part of the DoR artefact" — neither `/design` nor `/definition` produces a literal file named a "DoR artefact"; the implementing agent interpreted this as "part of the artefact this skill itself produces" (`design.md`) and documented the interpretation explicitly in the PR | `tests/check-csd-s3-design-definition-diagram-instructions.js` (36/36 passing); direct code review of `skills/design/SKILL.md` | **Deviation**: AC wording ("DoR artefact") doesn't literally match either skill's real output file naming — a wording gap in the story/DoR, not a functional gap. Recorded rather than silently reconciled. |
| AC2 | ⚠️ | Same pattern for Program Design, tied to `/definition`'s Step 4 (Story decomposition); same "DoR artefact" wording gap applies | `tests/check-csd-s3-design-definition-diagram-instructions.js` | Same wording deviation as AC1 |
| AC3 | ✅ | Feature-granularity default documented explicitly: one diagram set per feature, refreshed as stories complete, not per-story unless the operator explicitly decides otherwise and records it in `decisions.md` | Test asserts the multi-epic/refresh-rule generalisation (not hardcoded to a fixed story count) | None |

---

## Scope Deviations

None. Data Model diagrams (csd-s4) and as-built diagrams (csd-s5) were correctly left out, matching declared out-of-scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 36 / 36 (test plan's 6 named tests expanded into 36 concrete assertions, including non-regression checks against every pre-existing `/design` and `/definition` section)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-csd-s3-design-definition-diagram-instructions.js` | ✅ | ✅ | 36/36, independently re-run at merge verification |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Context window management (informal operating note, not a hard gate per the story itself) | ✅ | No automated gate required per the story's own framing; the added instruction text is modest in size (~40-90 lines per file) relative to the existing skill files |
| Accessibility (inherits csd-s2) | ✅ | No new rendering path introduced — reuses csd-s2's mechanism entirely |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P1 — Time-to-drift-determination | ❌ | Once a real feature runs `/design`/`/definition` (producing an as-designed diagram) AND `/verify-completion` (producing an as-built diagram via csd-s5) AND csd-s6's drift check, all for the same real feature | Establishes the as-designed half only; the metric needs both halves plus a real drift-check run |
| P2 — Diagram completion rate | ❌ | Same as above | |

**Measurement-ready gate:** Not yet — see epic-level consolidated note.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- Consider a small wording fix to this story's AC1/AC2 text (or a `decisions.md` note) clarifying that "DoR artefact" means "the artefact this skill itself produces" rather than a literal file so named — cosmetic, not functionally blocking, but worth closing the wording gap for future readers.

---

## DoD Observations

1. **Real merge conflict, correctly resolved.** csd-s3 and csd-s4 (dispatched in parallel, both touching `skills/design/SKILL.md` at the exact same anchor line) produced a genuine textual git conflict when csd-s3 merged second. Resolved by combining both sections rather than dropping either. This surfaced a real test fragility: both stories' own tests asserted marker-to-anchor proximity using a fixed character-count threshold, calibrated assuming isolated existence — combining both sections broke one or the other's threshold regardless of section order. Fixed both tests to assert structural placement (falls within the Step 2 section, before Step 3) instead of raw character distance. Candidate for `/improve`: any future test asserting "marker X is near anchor Y" in a skill file that might later gain sibling sections should use structural checks from the start, not character counts.
2. See AC1/AC2 wording deviation above — genuinely a story-authoring gap (imprecise AC text), not an implementation gap.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "/design and /definition produce System Architecture + Program Design diagrams" (csd-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
