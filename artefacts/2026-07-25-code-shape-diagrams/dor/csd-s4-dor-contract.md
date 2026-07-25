## Contract Proposal — `/design`/`/definition` produce Data Model diagrams

**What will be built:** SKILL.md instruction changes producing a Data Model diagram content-block (entities, relationships, schema) showing both new and existing touched entities, real migration-file-matching naming, and an ADR-026 reuse-check prompt before finalising any new entity.

**What will NOT be built:** As-built Data Model diagrams (csd-s5). Live-database schema introspection.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock session proposing new tables, assert `data-model` content-block produced | Unit |
| AC2 | Mock session reusing existing table without schema changes, assert existing entity still shown | Unit |
| AC3 | Compare diagram entity/column names against real migration-file naming | Unit |
| AC4 | Mock session proposing genuinely new entity, assert reuse-check prompt fires; mock session reusing existing entity only, assert prompt does NOT fire | Unit + Integration |

**Assumptions:** None beyond discovery's own resolved decisions.

**Estimated touch points:**
Files: `skills/design/SKILL.md`, `skills/definition/SKILL.md`
Services: None
APIs: None
