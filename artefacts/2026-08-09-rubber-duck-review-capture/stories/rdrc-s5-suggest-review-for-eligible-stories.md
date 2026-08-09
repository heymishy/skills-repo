## Story: Suggest rubber-duck review for eligible hero/customer-facing stories

**Epic reference:** epics/epic-1-rubber-duck-review-capture-mvp.md
**Discovery reference:** artefacts/2026-08-09-rubber-duck-review-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-08-09-rubber-duck-review-capture/benefit-metric.md

## User Story

As a **developer/operator running the outer loop**,
I want to **be proactively reminded to run a rubber-duck review when a story matches certain criteria (e.g. hero/customer-facing features)**,
So that **I don't have to remember to reach for the tool on the exact stories where it matters most (Meta Metric 3 — workflow adoption)**.

## Benefit Linkage

**Metric moved:** Meta Metric 3 — Workflow adoption / clunkiness
**How:** A proactive suggestion at the right pipeline moment (rather than relying on the operator to remember an optional tool exists) is the mechanism this story uses to test whether the workflow gets adopted — if even a nudged suggestion doesn't drive usage, the tool itself is too clunky, confirming or refuting the hypothesis directly.

## Architecture Constraints

This story modifies an existing SKILL.md file's completion-output text (`/definition-of-done` or `/branch-complete`) — CLAUDE.md's Platform change policy (Phase 2+) requires such changes to go through the standard PR-review inner loop, not a direct commit; this story's own artefact satisfies ADR-011's artefact-first prerequisite for that change. It does not introduce a new pipeline gate or modify DoD's pass/fail logic (per discovery's explicit "not a mandatory gate" clarification). (Added 2026-08-09, review run 1, finding 1-M1.)

## Dependencies

- **Upstream:** `rdrc-s2` (the human-narrated tool must exist to suggest running it) — this story does not require Stories 3-4 to be complete, since the suggestion can point to either mode once available.
- **Downstream:** None within this epic; feeds Meta Metric 3's measurement.

## Acceptance Criteria

**AC1:** Given a story reaches `/definition-of-done` (or an equivalent natural checkpoint) and matches an eligibility criterion (e.g. `domain: web-ui` and customer-facing, or explicitly tagged as a hero feature in its own artefact), When the skill's completion output is produced, Then it includes a suggestion to run the rubber-duck review tool, naming which mode (human-narrated or agent-driven, once both exist) is most relevant.

**AC2:** Given a story does NOT match the eligibility criteria, When the same skill's completion output is produced, Then no suggestion is shown — the nudge is targeted, not shown unconditionally on every story.

**AC3:** Given the operator sees the suggestion, When they decline or ignore it, Then nothing blocks or degrades — DoD still completes normally, confirming this is genuinely a nudge and not a disguised gate (per discovery's explicit clarification).

**AC4:** Given the eligibility criteria need to evolve over time (e.g. adding new domains or story tags), When the criteria are defined, Then they are expressed as an explicit, editable list or rule (e.g. in `context.yml` or a documented constant) — not hardcoded inline in a way that requires a code change to adjust.

## Out of Scope

- A mandatory gate for any condition — explicitly deferred to a future story per discovery's clarification, not part of this MVP.
- Tracking/measuring the suggestion's actual effect on Meta Metric 3 — that's an ongoing measurement activity (per the benefit-metric artefact), not a build task for this story.
- Suggesting the agent-driven mode specifically before Story 4 ships — if only the human-narrated mode (Story 2) exists at the time this story is built, the suggestion names only that mode.

## NFRs

- **Performance:** Negligible — a conditional text addition to an existing skill's output.
- **Security:** None identified.
- **Accessibility:** Not applicable — text-based CLI/skill output, no UI rendering.
- **Audit:** Not applicable to this story directly — Meta Metric 3's own measurement (tracked separately, per the benefit-metric artefact) is the audit signal this story enables.

## Complexity Rating

**Rating:** 1 — a conditional text addition to existing skill completion output, following an established pattern (similar to how CSS-layout-dependent ACs already trigger a classification prompt elsewhere in this pipeline).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
