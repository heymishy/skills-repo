## Story: Align Web UI test-plan/DoR artefact save paths and Step-1 scanner with the canonical per-story convention

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** None — short-track (no discovery artefact by design)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator running a multi-story feature's /test-plan or /definition-of-ready through the web UI journey flow**,
I want to **each story's test-plan and DoR artefact saved to its own file, and the Step-1 scanner to correctly find every completed story's artefact**,
So that **a second story's artefact doesn't silently overwrite the first story's, and the journey doesn't appear to "revert" from a completed stage back to an earlier one because the scanner is looking in the wrong place.**

## Bug found (live, via web UI dogfooding)

Investigating an operator report that a test-plan session appeared to have "reverted" from a completed Definition of Ready (DoR) back to test-plan, tracing showed three different, mutually-inconsistent path conventions colliding in `src/web-ui/routes/skills.js`:

1. **The prompt** (`buildSystemPrompt`'s test-plan/definition-of-ready protocol additions, lines ~2042/2128) instructs the model to slug its artefact as `[featureSlug]-tp-[story-id]` / `[featureSlug]-dor-[story-id]`.
2. **The actual save path** (`htmlSubmitTurn` line ~2556 and `handlePostTurnStreamHtml` line ~5183, both via the `alrf-s8` fix) ignores that slug for any journey-linked session and always writes to the flat path `artefacts/[featureSlug]/[skillName].md` — with no story ID anywhere in the path. For a multi-story feature run through the web UI, **every story's test-plan write overwrites the same file** — this is the actual root cause of the "reverted" symptom, and is a real data-loss bug, not a display glitch.
3. **The Step-1 scanner** (`computeStep1Summary`, lines ~2297-2335) scans for yet a third convention — `artefacts/[featureSlug]-tp-[story-id]/test-plan.md` — matching the stale prompt text from (1), not the actual save path from (2). It has never found anything either way, which is why it has zero existing test coverage.
4. **The canonical, already-established convention** — confirmed by `skills/test-plan/SKILL.md:226` (`artefacts/[feature]/test-plans/[story-slug]-test-plan.md`), `skills/definition-of-ready/SKILL.md:349` (`artefacts/[feature]/dor/[story-slug]-dor.md`), and 15+ real recent feature directories on disk produced by CLI-driven sessions (e.g. `artefacts/2026-08-29-diagram-validation-and-types/test-plans/s1-...-test-plan.md`) — is a per-story file inside a `test-plans/`/`dor/` subdirectory within the flat feature directory. This is the target convention; nothing needs to be invented.

## Architecture Constraints

- Edit `src/web-ui/routes/skills.js` only: `linkSessionToJourney`, the two `session.artefactPath` construction sites (`htmlSubmitTurn`, `handlePostTurnStreamHtml`), `computeStep1Summary`'s `test-plan`/`definition-of-ready` branches, and the two prompt-text SLUG instructions.
- New shared helper (`computeArtefactPath` or equivalent) used by both artefact-path construction sites, to avoid duplicating the story-scoped-vs-flat branching logic twice.
- `linkSessionToJourney` gains a `session.currentStoryId` assignment, sourced from `journey.stories[journey.currentStoryIndex]` (`.id` then `.slug` fallback, matching the existing pattern already used in `journey.js` line ~2374). No change to any other field it sets.
- Artefact-path construction: when `session.currentStoryId` is present AND `skillName` is `test-plan` or `definition-of-ready`, build the canonical per-story path (`artefacts/[slug]/test-plans/[storyId]-test-plan.md` or `artefacts/[slug]/dor/[storyId]-dor.md`). Otherwise (no story ID known, e.g. a standalone/non-journey session, or any other skillName), fall back to the existing flat `artefacts/[slug]/[skillName].md` path exactly as today — this is a deliberate, tested no-regression fallback, not an oversight.
- `computeStep1Summary`'s rewritten `test-plan`/`definition-of-ready` branches scan the real subdirectory (`test-plans/`/`dor/`) for files ending in `-test-plan.md`/`-dor.md`, applying the same path-traversal safety check already used by the function's `review` branch (`resolvedDir.startsWith(artefactsBase + path.sep)`).
- Prompt SLUG text: correct the misleading `-tp-[story-id]`/`-dor-[story-id]` instruction to state the plain feature slug, matching the wording style already used by the `review`/`definition` protocol blocks in the same file — the server determines the per-story save path automatically once a story is linked.
- Do not touch the `dor-contract.md` file — confirmed the web UI journey flow never produces one (out of scope, unaffected by this story either way).
- Do not change `journey.js`'s `currentStoryIndex` advancement logic, or any of its 8 `linkSessionToJourney` call sites — this story only changes what `linkSessionToJourney` itself does with the journey it already reads.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. (Does not touch `lpmf-s1`'s `listArtefacts` — separate finding, separate story, separate file.)

## Acceptance Criteria

**AC1:** Given a journey-linked session whose journey has `stories: [{id:'s1',...}, {id:'s2',...}]` and `currentStoryIndex: 1`, When `linkSessionToJourney` runs, Then `session.currentStoryId` is set to `'s2'`.

**AC2:** Given a journey-linked session with `currentStoryId: 's2'` and `skillName: 'test-plan'`, When a turn completes with an artefact block, Then `session.artefactPath` is `artefacts/[slug]/test-plans/s2-test-plan.md` — not the flat `artefacts/[slug]/test-plan.md`.

**AC3:** Given the same scenario as AC2 but `skillName: 'definition-of-ready'`, When a turn completes, Then `session.artefactPath` is `artefacts/[slug]/dor/s2-dor.md`.

**AC4:** Given a session with no `currentStoryId` (standalone/non-journey session, or a journey session created before a story was linked), When a `test-plan` or `definition-of-ready` turn completes, Then `session.artefactPath` falls back to the existing flat `artefacts/[slug]/[skillName].md` path exactly as today — no regression for this case.

**AC5:** Given `artefacts/[featureSlug]/test-plans/` contains `s1-test-plan.md` and `s2-test-plan.md` on disk, When `computeStep1Summary(featureSlug, 'test-plan')` runs, Then it reports both `s1` and `s2` as completed test-plan artefacts (not "no prior test-plan artefacts found").

**AC6:** Given the same setup as AC5 but for `artefacts/[featureSlug]/dor/` containing `s1-dor.md`, When `computeStep1Summary(featureSlug, 'definition-of-ready')` runs, Then it reports `s1` as a completed DoR artefact.

**AC7:** Given AC2/AC3's streaming counterpart (`handlePostTurnStreamHtml`), When the same story-scoped scenarios run through the streaming turn handler instead of the non-streaming one, Then the same per-story paths are produced — both call sites stay behaviourally identical.

**AC8:** Given the existing `alrf-s8` test suite (`tests/check-alrf-s8-journey-slug-priority.js`), When it runs unmodified against the changed code, Then all 4 of its ACs still pass — this story must not regress the `discovery`/other non-story-scoped skillName paths that `alrf-s8` already covers (none of those sessions carry a `currentStoryId`, so they hit the unchanged flat-path fallback from AC4).

## Out of Scope

- `dor-contract.md` — never produced by the web UI journey flow, unaffected either way.
- Any change to how or when `journey.currentStoryIndex` advances between stories — pre-existing, unchanged.
- Migrating any already-written flat-path artefacts on disk (e.g. the four `2026-08-31-*` dogfooding fixes' own test-plan.md/definition-of-ready.md files from earlier this session) to the new convention — this story fixes the code path going forward; it does not rewrite history.
- `lpmf-s1`'s `listArtefacts` Postgres-merge fix — separate story, separate file, no overlap.

## NFRs

- **Performance:** Not applicable — same-scale filesystem scan as today, just a different directory.
- **Security:** Path-traversal guard preserved for the new scanner directories, matching the existing pattern used elsewhere in the same function.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2 — touches 5 distinct spots in one file (linkSessionToJourney, 2 artefact-path sites, 2 scanner branches) plus 2 prompt-text edits; each individually small, but correctness depends on the shared helper being used consistently by both artefact-path sites.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session (operator asked to tackle this and 2 other findings blocking continued dogfooding)
