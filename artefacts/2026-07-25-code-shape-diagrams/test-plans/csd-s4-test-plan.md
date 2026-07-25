## Test Plan: /design//definition produce Data Model diagrams

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s4-design-produces-data-model-diagrams.md
**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-07-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Proposed schema changes generate a `data-model` diagram block | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Diagram shows existing touched entities, not just new ones | 2 tests | — | — | — | — | 🟢 |
| AC3 | Entity/relationship names match real migration-file naming convention | 2 tests | — | — | — | — | 🟢 |
| AC4 | Generation step prompts a reuse-check against existing entities before finalising a new entity | 2 tests | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (fixture) + real repo migration files (for naming-convention comparison)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A mock session proposing 1-2 new tables/columns | Synthetic fixture | None | |
| AC2 | A mock session that reuses an existing table (e.g. `credits`) without schema changes | Synthetic fixture, modelled on this repo's real `credits` table shape | None | Fixture should name a real, recognisable existing table to make the "shows existing touched entities" check meaningful |
| AC3 | This repo's own real migration files (`src/web-ui/modules/migrate-schema-*.js`) | Real, already-committed source | None | Used only to confirm naming CONVENTION matches, not to extract real data |
| AC4 | A mock session proposing a genuinely new entity, and a second mock proposing an entity that duplicates an existing one's purpose | Synthetic fixtures, one clean case and one deliberately-duplicate case | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### proposedSchemaChangeGeneratesDataModelBlock
- **Verifies:** AC1
- **Precondition:** A mock session proposing a new table
- **Action:** Trigger diagram generation
- **Expected result:** A `data-model` content-block is produced showing the new table and its columns
- **Edge case:** No

### existingReusedTableAppearsInDiagramEvenWithoutSchemaChange
- **Verifies:** AC2
- **Precondition:** A mock session that only reuses an existing table (`credits`), no new columns
- **Action:** Trigger diagram generation
- **Expected result:** The `credits` table appears in the generated diagram, not just an empty diagram — confirming existing-entity visibility, not just deltas
- **Edge case:** Yes — this is specifically testing the "not just new ones" requirement

### diagramOmitsUntouchedUnrelatedTables
- **Verifies:** AC2
- **Precondition:** Same fixture as above, plus other tables in the repo entirely unrelated to this feature
- **Action:** Trigger diagram generation
- **Expected result:** Unrelated tables do NOT appear in the diagram — only entities genuinely relevant to this feature
- **Edge case:** Yes — the boundary case for "relevant" vs "not relevant"

### entityNamesMatchRealMigrationFileConvention
- **Verifies:** AC3
- **Precondition:** A generated diagram referencing the `credits` table
- **Action:** Compare the diagram's entity name against the real `credits` table name as it appears in `src/web-ui/modules/migrate-schema-credits.js`
- **Expected result:** Exact match — no generic placeholder name like "Table1" or a paraphrased name
- **Edge case:** No

### diagramColumnNamesMatchRealMigrationFileConvention
- **Verifies:** AC3
- **Precondition:** Same as above, checking column-level names
- **Action:** Compare diagram column names against the real migration file's column definitions
- **Expected result:** Exact match for column names too, not just table names
- **Edge case:** No

### newEntityTriggersReuseCheckPrompt
- **Verifies:** AC4
- **Precondition:** A mock session proposing a genuinely new entity with no obvious existing match
- **Action:** Trigger diagram generation
- **Expected result:** The generation step surfaces an explicit prompt asking whether an existing entity's shape already covers the concept, before finalising the diagram
- **Edge case:** No

### existingEntityReuseDoesNotTriggerPromptRedundantly
- **Verifies:** AC4
- **Precondition:** A mock session that reuses an existing table with no new entity proposed at all
- **Action:** Trigger diagram generation
- **Expected result:** No reuse-check prompt fires — the prompt only triggers when a NEW entity is actually proposed
- **Edge case:** Yes — confirms the prompt isn't shown unnecessarily every time

---

## Integration Tests

### reuseCheckPromptAnsweredNoStillAllowsNewEntityCreation
- **Verifies:** AC4
- **Components involved:** `/design`/`/definition` session flow, diagram generation step
- **Precondition:** The reuse-check prompt has fired for a new entity
- **Action:** Operator answers "no existing entity covers this, proceed with new entity"
- **Expected result:** The diagram is finalised with the new entity included — the prompt does not block creation, only surfaces the check (matching ADR-026's own spirit: reuse where it makes sense, but new entities remain a legitimate outcome)

---

## NFR Tests

### dataModelDiagramShowsStructureOnlyNeverRowData
- **NFR addressed:** Security
- **Measurement method:** Generate a diagram for a feature touching real tenant-scoped tables; assert the diagram content contains only table/column/relationship names — no row values, no tenant IDs, no actual data
- **Pass threshold:** Zero row-level data present in any generated diagram content
- **Tool:** Unit test asserting on the generated diagram's content structure

---

## Out of Scope for This Test Plan

- As-built Data Model diagrams — covered by csd-s5's own test plan.
- Live-database schema introspection — discovery's own out-of-scope item.

---

## Test Gaps and Risks

None identified.
