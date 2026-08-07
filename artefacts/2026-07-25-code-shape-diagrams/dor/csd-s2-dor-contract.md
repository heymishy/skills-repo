## Contract Proposal — Canvas rendering of the diagram content-block type

**What will be built:** Extends csd-s1's dispatch mechanism to all three diagram types (`system-architecture`, `program-design`, `data-model`), a labelled error-box state for malformed mermaid syntax, "As Designed"/"As Built" label differentiation when both are present, and keyboard-navigation-safe markup.

**What will NOT be built:** The drift/match-diverged comparison logic itself (csd-s6). Editable/interactive diagrams (zoom, pan, click-to-expand).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render each of the 3 types, assert visible type label | Unit |
| AC2 | Render deliberately malformed mermaid syntax, assert labelled error box (not blank, not stack trace) | Unit |
| AC3 | Render as-designed + as-built pair, assert visual distinguishability | Integration + Playwright E2E |
| AC4 | Playwright keyboard-navigation test across a page with a diagram block present | E2E |

**Assumptions:** None beyond csd-s1's (same mermaid dependency, same security constraint).

**Estimated touch points:**
Files: Same rendering module as csd-s1, extended for the remaining two types + error/label states
Services: None
APIs: None
