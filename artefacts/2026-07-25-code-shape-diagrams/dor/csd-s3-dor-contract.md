## Contract Proposal — `/design`/`/definition` produce System Architecture + Program Design diagrams

**What will be built:** SKILL.md instruction changes to `/design` and/or `/definition` so completing the System Architecture and Program Design sections generates a diagram content-block (using csd-s2's mechanism) at feature-level granularity by default.

**What will NOT be built:** Data Model diagrams (csd-s4). As-built diagrams (csd-s5).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock session with completed System Architecture section, assert `system-architecture` content-block produced | Unit + Integration |
| AC2 | Mock session with completed Program Design section, assert `program-design` content-block produced | Unit + Integration |
| AC3 | Multi-story feature fixture, assert one diagram set refreshed (not duplicated) across stories | Unit + Integration |

**Assumptions:** None beyond discovery's own resolved decisions.

**Estimated touch points:**
Files: `skills/design/SKILL.md`, `skills/definition/SKILL.md`
Services: None
APIs: None
