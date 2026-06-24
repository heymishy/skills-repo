# Definition of Ready: shr.1 — Extend pipeline-state schema and harness for infra and migration track flags

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.1.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.1-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Contract Proposal

**What will be built:**
Four new optional fields (`hasInfraTrack: boolean`, `hasMigrationTrack: boolean`, `infraPlanPath: string`, `migrationReviewPath: string`) added to the story entry definition in `pipeline-state.schema.json`. The `scripts/check-pipeline-state-integrity.js` validator extended to accept these fields without error when present, and to treat their absence as valid (optional fields). The `bin/skills advance` command extended to accept these field names as valid write targets. No changes to STAGE_SEQUENCE, journey-store.js, or any route handler.

**What will NOT be built:**
H-INF and H-MIG DoR hard-block logic (that is inf.4 and mig.3). Any UI rendering of hasInfraTrack or hasMigrationTrack state in pipeline-viz.html. Automatic setting of hasInfraTrack when an infra-definition artefact is detected.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — `hasInfraTrack: true` accepted by integrity check | Unit: write story entry with hasInfraTrack: true to temp pipeline-state.json; run check-pipeline-state-integrity.js; assert exit 0 | Unit |
| AC2 — `hasMigrationTrack: true` and `migrationReviewPath` accepted | Unit: same approach with both fields; assert exit 0 | Unit |
| AC3 — `skills advance` writes all 4 fields correctly | Integration: run `node bin/skills advance [feat] [id] hasInfraTrack=true infraPlanPath=[path]`; assert fields in pipeline-state.json and integrity check passes | Integration |
| AC4 — fields absent → no error | Unit: story entry without any of the 4 fields; integrity check exits 0 | Unit |
| AC5 — schema and harness in same commit | Unit: git log shows pipeline-state.schema.json and check-pipeline-state-integrity.js in same commit | Unit |

**Assumptions:**
`pipeline-state.schema.json` uses JSON Schema draft-07 and the story entry definition is an identifiable object with `additionalProperties: true` or an explicit `properties` block that can be extended. The advance command reads field names as strings from CLI args; type coercion (string "true" → boolean true) is already handled by the existing advance implementation.

**Estimated touch points:**
Files: `.github/pipeline-state.schema.json`, `scripts/check-pipeline-state-integrity.js`, `bin/skills` (advance subcommand). Services: None. APIs: None.

**schemaDepends:** None — this story creates the schema foundation; it does not depend on prior schema fields.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC5's same-commit requirement is explicitly addressed in the touch points.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | P-Founder |
| H2 | ≥3 ACs in Given/When/Then format | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | 11 tests covering all 5 ACs |
| H4 | Out-of-scope populated | ✅ | H-INF/H-MIG logic, UI rendering, auto-setting excluded |
| H5 | Benefit linkage references named metric | ✅ | M2 — DoR gate enforcement correctness |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from review | ✅ | Review PASS; 1 MEDIUM (ADR-017) resolved by restructure |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-003, MC-CORRECT-02, script style guide — no HIGH findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-06-22-skills-infra-migration-tracks/nfr-profile.md |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile present (story has NFRs) | ✅ | nfr-profile.md exists |
| H-GOV | Approved By section present with named entry | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No injectable adapters introduced | ✅ | N/A |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-----------------------|
| W1 | NFRs populated | ✅ | Performance (integrity check ≤5s); Security (paths only) |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | 1 MEDIUM finding (ADR-017) resolved — no risk-accept needed |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder context — operator self-reviews; acknowledged |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps |

W4 acknowledged: Solo-founder repo, no separate domain expert available. Operator (Hamish King) self-reviews.

---

## Oversight

**Level:** Medium (per shared-infrastructure.md epic — shr.1 touches schema and advance harness — core pipeline machinery)
**Action:** Share DoR artefact with tech lead before assigning. Solo-founder context: Hamish King is operator and reviewer — awareness confirmed.

---

## Standards Injection

Domain tags: None declared on this story — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: shr.1 — Extend pipeline-state schema and harness for infra and migration track flags
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.1.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.1-test-plan.md
Test file: tests/check-shr1-schema-harness.js
Test runner: node tests/check-shr1-schema-harness.js

Goal:
Make every test in tests/check-shr1-schema-harness.js pass. Add the four optional boolean/string fields (hasInfraTrack, hasMigrationTrack, infraPlanPath, migrationReviewPath) to pipeline-state.schema.json and extend check-pipeline-state-integrity.js and bin/skills advance to accept them. AC5 requires schema + harness changes in the same commit — do not split.

Constraints:
- Touch: .github/pipeline-state.schema.json, scripts/check-pipeline-state-integrity.js, bin/skills (advance subcommand only)
- Do NOT touch: src/, .github/skills/, tests/ (other than the test file for this story), any pipeline-viz or dashboard file
- All four fields are OPTIONAL — absence must not produce an error
- The advance command must accept hasInfraTrack=true (string-to-boolean coercion) and infraPlanPath="path/string"
- Script style: plain Node.js, CommonJS (require), no external npm dependencies
- Architecture standards: read .github/architecture-guardrails.md before implementing
- ADR-003 (schema-first): pipeline-state.schema.json must be updated in the same commit as check-pipeline-state-integrity.js
- No credentials or artefact content in the new fields — paths only
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity: add a PR comment and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness (share this artefact)
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
