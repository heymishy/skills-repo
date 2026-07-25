## Contract Proposal — As-built diagram generation via static migration-file parsing

**What will be built:** A static SQL/migration-file parser and call-graph/file-structure extraction, invoked from `/verify-completion`/`/branch-complete`, generating as-built versions of all three diagram types, written as versioned artefact files.

**What will NOT be built:** Live-database introspection. Real-time/continuous regeneration outside `/verify-completion`/`/branch-complete`.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real migration-file fixtures in this repo's format, assert correct table/column/relationship extraction | Unit |
| AC2 | Real merged feature's file structure/call graph, assert diagram reflects actual code (not agent memory) | Unit + Integration |
| AC3 | Artefact-folder inspection after generation, assert files saved | Integration |
| AC4 | Deliberately malformed migration-file fixture, assert clear error surfaced, no silent empty/incorrect diagram | Unit |

**Assumptions:** None beyond discovery's resolved static-parsing decision.

**Estimated touch points:**
Files: `skills/verify-completion/SKILL.md` (or equivalent), a new parsing module under `src/` or `scripts/`
Services: None
APIs: None
