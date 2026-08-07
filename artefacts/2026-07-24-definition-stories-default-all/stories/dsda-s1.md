## Story: Default to all stories from /definition when starting the per-story review sequence, instead of asking the operator to type them

**Epic reference:** None — short-track (bounded fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator's direct observation (2026-07-24, captured in `workspace/capture-log.md`) that after `/definition`, the real UI flow presents a manual textarea asking the operator to type which story slugs to move forward, rather than defaulting to all stories `/definition` actually wrote.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## User Story

As **Hamish King (Founder/Operator)**,
I want **the transition from `/definition` into the per-story review sequence to default to every story `/definition` actually wrote, rather than making me re-type story slugs I already named in the definition step**,
So that **I don't have to remember and manually retype identifiers the system already has, and the same all-stories batch carries through review, test-plan, and DoR without asking again at each stage**.

## Benefit Linkage

**Metric moved:** None — pure operator-workflow fix, not tied to a Tier 1 product metric (no benefit-metric artefact exists for this short-track story, per CLAUDE.md's short-track convention). Benefit stated directly: removes a genuinely redundant manual-entry step for information the system already possesses.

## Architecture Constraints

- **The story-ID data already exists, twice — once client-side, never server-side.** Confirmed via direct code read (2026-07-24): `journey.js` embeds a client-side JS function, `parseDefinitionArtefact(md)`, in the definition-stage chat page's own inline `<script>` block (used to drive the story-map canvas display). It correctly extracts story IDs from the real definition artefact markdown across (at least) two supported formats: H1 epic/story headers ("Format C": `# Epic N: Name`, `# Story id — Title`) and a flat-story fallback format. This logic runs ONLY in the browser — the server (`handleGetStories`/`handlePostStories`) has no equivalent and today relies entirely on the operator re-typing slugs into a textarea.
- **Do not silently reimplement a second, independently-drifting parser.** The new server-side story-extraction logic must mirror the SAME story-ID regex patterns the client-side `parseDefinitionArtefact` already uses (cross-reference both in code comments so a future format change to one is a visible prompt to update the other) — do not invent different regex patterns that might disagree with what the canvas actually displayed to the operator during `/definition`.
- **Auto-population is the default, not the only path.** If server-side extraction finds zero story IDs (a genuine parse failure, or a definition artefact format the parser doesn't recognise), `handleGetStories` must fall back to the existing manual-entry textarea, pre-filled with whatever the extraction attempt DID find (even if incomplete) — not a hard failure that blocks the operator from proceeding. This preserves an escape hatch for parser gaps.
- **The manual-entry form must remain reachable**, e.g. as an "edit the list" affordance next to the auto-populated default, so an operator who genuinely wants to adjust the story list (add, remove, reorder before starting review) is not locked out — the fix is "default to all, don't force manual re-entry," not "remove the ability to adjust."

## Dependencies

- **Upstream:** None.
- **Downstream:** None known — this story does not change `PER_STORY_SEQ`'s (review → test-plan → definition-of-ready) existing per-story progression logic, only how the initial story list is populated.

## Acceptance Criteria

**AC1:** Given a journey has just completed `/definition` and gate-confirm redirects to `/journey/:id/stories`, When the page renders, Then the story list is already populated with every story ID the server successfully extracted from the real definition artefact — not an empty textarea.

**AC2:** Given the auto-populated list from AC1, When the operator submits without editing it, Then every extracted story proceeds through review → test-plan → definition-of-ready in sequence, exactly as today's manually-typed flow already does per story (no change to `PER_STORY_SEQ`'s existing progression).

**AC3:** Given the operator wants to adjust the auto-populated list (add, remove, or reorder a story) before proceeding, When they use the still-available edit affordance, Then they can do so — the auto-default does not remove the ability to manually control the list.

**AC4:** Given a definition artefact that the server-side extraction cannot parse (a genuine parse failure or unrecognised format), When `/journey/:id/stories` renders, Then the page falls back to the existing manual-entry textarea (empty or partially pre-filled with whatever was extracted) rather than blocking the operator or throwing an error page.

**AC5:** Given the server-side extraction logic, When tested against the same definition-artefact fixture formats the client-side `parseDefinitionArtefact` already handles (H1 epic/story headers, flat-story fallback), Then it extracts the identical set of story IDs the canvas would have displayed for that same artefact — confirming no drift between what the operator saw during `/definition` and what gets defaulted here.

## Out of Scope

- Refactoring `parseDefinitionArtefact` itself, or extracting it into a shared client+server module — this story adds a new, narrower server-side story-ID-only extractor; a full shared-module refactor (if warranted) is a separate, later decision.
- Any change to `PER_STORY_SEQ`'s review → test-plan → DoR progression logic itself.
- Reordering or prioritising stories beyond what the operator can already do via the still-available manual edit (AC3) — no new drag-and-drop or ranking UI.

## NFRs

- **Performance:** Negligible — one additional file read + regex parse per `/journey/:id/stories` render, same cost class as other artefact reads already happening elsewhere in this codebase.
- **Security:** None new — reads an artefact the journey already owns via its existing `completedStages`/`artefactPath` mechanism; no new file-path input from the request.
- **Accessibility:** The edit affordance (AC3) must remain keyboard-operable; the auto-populated textarea/list must not rely on a mouse-only interaction to reach.
- **Audit:** Not applicable — no new audited action.

## Complexity Rating

**Rating:** 2 — well-understood problem, but correctly mirroring an existing, non-trivial multi-format parser without introducing drift (AC5) requires real care, not just a mechanical change.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — N/A (short-track, no epic); Low oversight (defaulting an existing manual step, reversible via the retained edit affordance)
