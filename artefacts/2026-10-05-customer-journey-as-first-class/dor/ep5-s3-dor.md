# Definition of Ready Checklist

## Definition of Ready: Rename journeys/journey_stages tables to customer_journeys/customer_journey_stages

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s3-rename-journeys-table-to-avoid-platform-collision.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator relying on this feature's own database migration actually creating usable tables" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC4 verified by manual grep pass, documented as the one accepted gap type |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 — explicitly framed as a correctness prerequisite, not a new metric |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review`, per `CLAUDE.md`. Same documented exemption pattern as every other short-track story this session. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete; AC4's gap type explained, not left uncertain |
| H8-ext | Cross-story schema dependency check | ✅ | This story directly corrects `ep5-s1` (merged) — the only dependency, explicitly named |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the exact confirmed root cause, file/line references, and the fix shape; no review ran (short-track) |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Pure schema rename, no UI |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section fully populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required |
| H-NFR-profile | NFR profile presence | ✅ N/A | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists for this correction — short-track skips `/discovery`. Satisfied via the operator's own direct in-session instruction ("Rename to customer_journeys (+ stages/mappings), fix cascade"). |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — reuses `ep5-s1`'s existing `setDbClient` pattern unchanged |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator context | RISK-ACCEPT — same standing acknowledgement as every other short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | AC4's gap type explained, not left uncertain | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

[Relevant sections: none apply specifically — pure schema-identifier rename of an already-reviewed migration script, same pattern as `ep5-s1`.]

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Rename journeys/journey_stages tables to customer_journeys/customer_journey_stages -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s3-rename-journeys-table-to-avoid-platform-collision.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies
- Modify ONLY: scripts/migrate-schema-journeys.js (table/index names:
  journeys -> customer_journeys, journey_stages -> customer_journey_stages,
  feature_journey_stage_mappings -> feature_customer_journey_stage_mappings,
  plus matching index name updates), tests/check-ep5-s1-migration.js (same
  renames, PLUS add the new AC1 setup step that also runs
  journey-store-pg.js's own migrateSchema() first to genuinely reproduce
  the collision), artefacts/2026-10-05-customer-journey-as-first-class/
  design.md, benefit-metric.md, and the story files with literal SQL
  table/column identifier references (ep1-s1, ep1-s2, ep1-s3, ep2-s2,
  ep3-s1, ep3-s2, ep4-s1, ep4-s2, ep5-s1, ep5-s2 -- confirmed by grep).
- Do NOT touch src/web-ui/adapters/journey-store-pg.js or server.js:421 --
  the platform's own journeys table is correct and unrelated.
- When editing artefact files: only change backtick-quoted/code-context
  SQL identifiers (table names, FK targets, column lists). Do NOT change
  English prose uses of "journey"/"journeys" as a concept (e.g. "journey
  canvas", "sees a list of existing journeys") -- the feature is still
  conceptually about journeys, only the underlying SQL table name changes.
- Do NOT rename the migration script file itself
  (migrate-schema-journeys.js stays named as-is) or the test file.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
