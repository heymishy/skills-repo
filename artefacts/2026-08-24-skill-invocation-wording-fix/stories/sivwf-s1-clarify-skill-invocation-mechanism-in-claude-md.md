## Story: Clarify the real skill-invocation mechanism in CLAUDE.md

**Epic reference:** none (short-track, single story)
**Discovery reference:** artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md (clarified, not-pursuing native registration; this story is the superseding fix that discovery identified)
**Benefit-metric reference:** none (short-track)
**Domain:** pipeline-infrastructure / operator-documentation

## User Story

As an operator or a fresh Claude Code agent session reading `CLAUDE.md`
I want the document to state plainly how skills are actually invoked (read `skills/<name>/SKILL.md` and follow it), rather than implying `/workflow`, `/test-plan`, etc. are registered Claude Code slash commands
So that I don't waste a turn discovering via a failed Skill tool call ("Unknown skill") that the "/name" notation is this repo's own convention, not a native Claude Code feature

## Benefit Linkage

Item #7 of the 7-item ranked backlog surfaced during the 2026-08-24 capture-log sweep ("skills not registered as Claude Code invocable skills"). A full `/discovery` + `/clarify` pass (`artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md`) investigated whether to build real Claude Code native skill registration (`.claude/skills/`) to close this gap structurally. Direct technical investigation found registering skills natively adds a permanent, always-on token cost (all registered skills' `name`+`description` frontmatter injected into context at every session startup) for benefits — slash-command typing, auto-suggestion — that are largely redundant with this repo's own `CLAUDE.md` routing table, which already tells the agent exactly which skill to read and when. Decision: do not pursue native registration. This story is the smaller, bounded fix that discovery's Clarification log identified as the superseding action: correct the wording so `CLAUDE.md` stops implying something that isn't true, without touching the actual working convention.

## Architecture Constraints

- Do not rename the `/name` notation used throughout `CLAUDE.md`'s Pipeline overview table and elsewhere — that notation stays as this repo's own shorthand for "the skill documented at `skills/[name]/SKILL.md`". Renaming ~40+ existing references is out of scope and was not the decision made.
- Do not touch `.github/scripts/check-skill-contracts.js` — confirmed at prior DoR time (`vtc-s1`) that script is scoped to `SKILL.md` files only, per its own docstring; this change only touches `CLAUDE.md`.
- Do not create a `.claude/skills/` directory or any plugin manifest — that is exactly the path the discovery decided not to pursue.
- Keep the addition short — one clarifying section or paragraph, not a rewrite of the whole document's skill-reference style.

## Dependencies

None. Independent of all other stories closed this session.

## Acceptance Criteria

**AC1**
Given a fresh Claude Code agent session reads `CLAUDE.md` for the first time
When it reaches the point where `/workflow`, `/discovery`, etc. are first used as notation (before or at the start of the Pipeline overview table)
Then it finds an explicit statement that these are not registered Claude Code skills — invoking one means reading the corresponding `skills/[name]/SKILL.md` file directly and following its instructions, not calling the Skill tool

**AC2**
Given the clarifying text is added
When compared against the existing `/name` notation used throughout the rest of `CLAUDE.md` (the Pipeline overview table, the Short-track section, etc.)
Then none of that existing notation is renamed, removed, or restructured — the fix is additive (one new explanatory passage), not a rewrite

**AC3**
Given the clarifying text names the concrete failure mode it prevents
When read in isolation
Then it references the real, observed friction (a Skill tool call failing with "Unknown skill") rather than a generic, unsourced caveat — matching this session's own established pattern of citing concrete evidence (`s3fw-s1`, `vtc-s1`) rather than vague warnings

**AC4**
Given `artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md` already exists and documents the full investigation and decision
When this story's fix is read
Then it references that discovery artefact by path, so a future reader can find the full rationale (token-cost finding, etc.) without it being re-litigated in `CLAUDE.md` itself

## Out of Scope

- Renaming or restructuring the `/name` shorthand notation anywhere else in `CLAUDE.md` or in any `SKILL.md` file — out of scope per Architecture Constraints.
- Building `.claude/skills/` or any native registration mechanism — explicitly the path decided against.
- Updating `README.md`/`CONTRIBUTING.md` or any other document — this story is scoped to `CLAUDE.md` only, the document the capture-log finding specifically named.

## NFRs

None beyond the existing artefact-writing standards (no hard-wrapped prose, abbreviations expanded on first use).

## Complexity Rating

**Complexity:** 1 (well understood — a single clarifying passage, location and content already drafted during discovery's own Clarification log)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] Acceptance criteria are testable
- [x] No architectural decision requiring `decisions.md` (this is a documentation clarification, not an architectural choice — the actual architectural decision, "do not pursue native registration," is already recorded in the discovery artefact's Clarification log)
- [x] No CSS-layout-dependent ACs
- [x] No injectable adapter introduced
