## Story: Server-side story-list extractor recognizes the H2-epic/H3-story definition-artefact format

**As an** operator resuming a feature at the `/journey/:id/stories` gate after `/definition` has produced an epic-based story breakdown,
**I want** the story-list textarea to auto-populate with every story ID from the definition artefact,
**So that** I am not forced to hand-type every story slug myself when the app already has that information on disk.

**Bug found in production:** journey `af17f555-dfa9-4f66-910b-32bec32d66b7` — `GET /journey/:id/stories` rendered an empty manual-entry textarea instead of the auto-populated one, even though `definition.md` was present and well-formed on disk with 6 stories.

**Root cause:** `extractStoryIdsFromDefinitionArtefact` (`src/web-ui/routes/journey.js`) only recognizes two of the three definition-artefact shapes that `/definition` actually produces (documented in the client-side `parseDefinitionArtefact`, `src/web-ui/routes/skills.js`):
- Format C: H1 `# Epic N` + H1 `# Story <dotted-id> — Title` — recognized ✅
- Format B: flat H2 `## <dotted-id> — Title` with a `**Epic:**` annotation — recognized ✅
- **Format A: H2 `## Epic N — Name` wrapping H3 `### <slug> — Title` subsections — NOT recognized ❌**

Format A is the shape actually produced for epic-scoped, hyphenated story IDs (e.g. `ep1-s1`, `ep1-s2`) — exactly what the `cross-channel-feature-continuity` feature's own `/definition` output used. Because the server-side extractor has no branch for it, it falls through every check and returns `[]`, which the caller (`handleGetStories`) correctly treats as "nothing found" and falls back to the empty manual-entry textarea — a legitimate fallback for a genuinely unrecognized artefact, but wrongly triggered here because the artefact *is* recognized, just not by this function.

**Given** a definition artefact using Format A (`## Epic N — Name` sections containing `### <slug> — Title` subsections, slug not required to contain a dot),
**When** `extractStoryIdsFromDefinitionArtefact` parses it,
**Then** it returns every story slug found, in document order, in the same form the client-side `parseDefinitionArtefact`'s own Format A branch would extract.

**Given** a definition artefact using Format A,
**When** an operator opens `GET /journey/:id/stories` for that feature,
**Then** the textarea is pre-filled with all extracted story slugs and the "pre-filled" copy is shown (not the "enter one per line" manual-entry copy).

**Given** a definition artefact that matches none of the three recognized formats,
**When** the extractor runs,
**Then** it still returns `[]` and the page still falls back to the manual-entry textarea, unchanged from today (no regression to the existing AC4 unrecognized-format behavior).

**Out of scope:**
- Changing the client-side `parseDefinitionArtefact` (it already handles Format A correctly — this story brings the server-side extractor in line with it, not the other way around)
- Any change to `handleGetStories`'/`handlePostStories`' own logic beyond the extractor they call
- Retroactively re-populating the story list for journeys already stuck in the manual-entry state (an operator can just paste the story IDs once; no migration needed)

**Dependencies:** None (isolated fix to one pure function)

**Complexity:** 1 — Additive branch to an existing, well-tested pure function; no state, no I/O, mirrors already-proven client-side logic.

**Scope stability:** Stable

**Architecture Constraints:**
- No new npm dependencies
- Must not alter the return value or behavior of the two already-recognized formats (Format B, Format C) — additive only
- Mirrors the client-side `parseDefinitionArtefact`'s Format A split/match logic (`src/web-ui/routes/skills.js`) for consistency, per the existing AC5 parity requirement from `dsda-s1`
