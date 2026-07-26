# Definition of Done: /design and /definition produce Data Model diagrams

**PR:** [#608](https://github.com/heymishy/skills-repo/pull/608) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s4-design-produces-data-model-diagrams.md
**Test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s4-test-plan.md
**DoR artefact:** artefacts/2026-07-25-code-shape-diagrams/dor/csd-s4-dor.md
**Assessed by:** Copilot
**Date:** 2026-07-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `skills/design/SKILL.md` gained a "Data Model diagram markers (csd-s4)" section tied to Step 2's "Data and state" question; emits the `data-model` CANVAS-JSON marker for proposed schema | `tests/check-csd-s4-data-model-diagram-instruction.js` (10/10 passing) | None |
| AC2 | ✅ | Instructions explicitly require including existing entities the feature touches even with no schema change (e.g. `credits` reused without alteration must still appear); explicitly excludes unrelated untouched tables | Test asserts both directions: reused-table-appears AND unrelated-table-omitted | None |
| AC3 | ✅ | Entity/column names required to exactly match real migration files (`scripts/migrate-schema-*.js`) — verified against the actual `scripts/migrate-schema-credits.js` file's real column names (`tenant_id`, `balance`, `updated_at`), not a hand-typed guess | Test extracts real column names from the real migration file and asserts the worked example uses those exact names — genuine cross-file verification, not a presence check | None |
| AC4 | ✅ | Reuse-check prompt ("Does an existing entity's shape already cover this concept?") required before finalising a new entity, citing ADR-026 by name; does not block progress if the operator confirms genuine novelty | Test covers: new-entity triggers prompt, existing-entity-reuse does not re-trigger it, and answering "no" still allows creation (integration) | None |

---

## Scope Deviations

None. As-built Data Model diagrams (csd-s5) and live-database introspection were correctly left out, matching declared out-of-scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9
**Tests passing in CI:** 10 / 10 (test plan's 9 named tests + 1 additional non-regression test)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-csd-s4-data-model-diagram-instruction.js` | ✅ | ✅ | 10/10, independently re-run at merge verification. Test count (10) exceeds the DoR's stated 9 — reported honestly by the implementing agent rather than forcing the number to match |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — structure only, never row-level/tenant data (`NFR-data-exposure-scope`) | ✅ | Dedicated NFR test (`dataModelDiagramShowsStructureOnlyNeverRowData`) asserts the instruction text and worked example never include sample/row values, only schema structure |
| Accessibility (inherits csd-s2) | ✅ | No new rendering path introduced |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P1 — Time-to-drift-determination | ❌ | Once a real feature completes the full as-designed → as-built → drift-check cycle | This story completes the as-designed half for the diagram type discovery names as the operator's top concern |
| P3 — Diverged-flag true-positive rate | ❌ | Same — requires real usage plus at least one real drift event to validate true-positive accuracy | |
| M1 — Drift caught before it became a problem | ❌ | Requires a real incident where this mechanism catches drift before it causes a problem | Cannot be measured synthetically — inherently requires real operational usage over time |

**Measurement-ready gate:** Not yet — see epic-level consolidated note.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. This story correctly implemented the AC4 reuse-check as a genuine, testable behaviour (not just documented intent) — the "reply no still allows creation" integration test specifically guards against the prompt becoming an accidental hard block, which would have contradicted the AC's own "does not block progress" framing. Good precedent for future ADR-026-citing prompts elsewhere in the pipeline.
2. Same design/SKILL.md merge conflict noted in csd-s3's DoD applies symmetrically here — see that DoD's observation 1 for the full account (both stories' own tests needed the same structural-check fix).
3. A pre-existing column-type-token naming mismatch between this story's own convention and csd-s5's `mapType()` function was discovered during csd-s6's implementation (see csd-s6 DoD observation) — not a defect in this story (AC3 only requires name-level matching, not type-token matching), but worth flagging here since it's the root cause on this story's side of that later finding.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "/design and /definition produce Data Model diagrams" (csd-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
