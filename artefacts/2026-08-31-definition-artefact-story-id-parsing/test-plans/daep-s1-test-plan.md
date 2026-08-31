## Test Plan: daep-s1 — Recognize the H2-epic/H3-story (Format A) definition-artefact shape

**Story:** artefacts/2026-08-31-definition-artefact-story-id-parsing/stories/daep-s1-recognize-epic-h2-story-h3-format.md

| AC | Test | Type |
|----|------|------|
| AC1 | `extractStoryIdsFromDefinitionArtefact` given a Format A artefact (`## Epic N — Name` + `### slug — Title` subsections, hyphenated slugs like `ep1-s1`) returns all slugs in document order | Unit |
| AC1 | Same, but with dotted slugs under Format A (`### wgol.1 — Title`) — confirms the fix isn't hyphen-only | Unit |
| AC2 | `handleGetStories` given a Format A definition artefact on disk pre-fills the textarea with every extracted slug and shows the "pre-filled" copy, not the manual-entry copy | Unit (real-render harness, same pattern as `check-dsda-s1-default-all-stories.js`) |
| AC3 | `extractStoryIdsFromDefinitionArtefact` given the existing `UNRECOGNISED_ARTEFACT` fixture (no recognized shape) still returns `[]` — no regression | Unit |
| NFR | Format B and Format C fixtures (`FLAT_FORMAT_ARTEFACT`, `H1_FORMAT_ARTEFACT` from `check-dsda-s1-default-all-stories.js`) still return their expected story lists unchanged | Unit (regression) |

**Coverage gaps:** None. This is a pure-function fix with no I/O or state; every AC is directly unit-testable.

**Out of scope (per story):** Client-side `parseDefinitionArtefact` — already correct, used only as the reference shape to mirror.
