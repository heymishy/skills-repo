## Story: Add an explicit checkout-verification rule to close the recurring wrong-checkout edit gap

**Epic reference:** None — short-track, closing a capture-log finding logged twice in the same session (`rcfc-s1`, 2026-08-24) with no durable fix, only manual workarounds each time
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [pipeline-infrastructure]

## User Story

As an **agent editing files in this repo when an inner-loop worktree exists for the active story**,
I want **an explicit, standing instruction to verify the target checkout before the first edit of a new turn or after a context-compaction boundary**,
So that **an edit intended for `.worktrees/<slug>/...` does not silently land in the main repo checkout instead, a mistake that recurred twice in one session with the same trigger pattern and the same manual recovery cost each time**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure, no benefit-metric artefact). Directly closes a `workspace/capture-log.md` finding (2026-08-24, `rcfc-s1`) whose own text states plainly: "the root cause ... is not actually fixed, only worked around after the fact twice now" — logged as a `gap`-type signal proposing exactly the fix this story implements, never acted on until now.

## Architecture Constraints

- This is a `CLAUDE.md` instruction-text change, not a `SKILL.md` change — the gap is a general session-conduct issue (occurs whenever a worktree exists, regardless of which skill is active), not scoped to one pipeline stage. `CLAUDE.md`'s own "During a session" section is the established home for this kind of standing rule (its direct sibling, "Verify coding-agent dispatch completion independently," is the same class of fix — added after a repeated real-world failure pattern, not speculative).
- Per the Artefact-first rule (`CLAUDE.md` itself), any behavioural change to `CLAUDE.md` requires a story artefact and a PR — not a direct master commit. This story satisfies that.
- `.github/scripts/check-skill-contracts.js` is explicitly scoped to `SKILL.md` files only (its own docstring: "Structural contract linting for SKILL.md files") — this story does not add a `CLAUDE.md` entry there; the dedicated test file alone is the guard, matching how other non-`SKILL.md` instruction content in this repo is protected.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `CLAUDE.md`'s "During a session" section, When this story's changes are applied, Then it contains a new rule instructing explicit checkout verification before the first `Edit`/`Write` call of a new turn or after a context-compaction boundary, whenever a `.worktrees/<slug>/` worktree exists for the active story.

**AC2:** Given the new rule, When read, Then it explicitly states the concrete failure trigger (a bare path with no `.worktrees/` prefix shown in a tool-result/system-reminder for a file already open in context) and the concrete recovery cost already paid twice (copy, diff-verify, discard duplicate) — not a generic restatement with no grounding.

**AC3:** Given the existing "Verify coding-agent dispatch completion independently" rule immediately preceding the new one, When this story's changes are applied, Then it remains byte-for-byte unchanged — this story only inserts a new rule, it does not rewrite the existing one.

**AC4:** Given `workspace/capture-log.md`'s two entries describing this gap (2026-08-24, `rcfc-s1`, both `gap`-type signals), When this story's changes are applied, Then both remain present and unmodified — historical record, not retroactively edited.

## Out of Scope

- Building automated tooling to detect or prevent a wrong-checkout edit (e.g. a pre-edit hook that inspects the target path against known worktree roots) — this story is a standing instruction-text fix, matching this repo's own established pattern for closing this class of gap (an explicit rule an agent follows, not new enforcement code). A tooling-based enforcement layer is a larger, separate exercise.
- Retroactively auditing this session's own already-committed artefacts for undetected wrong-checkout edits beyond the two already found and corrected — those two are fully resolved (verified via diff before discarding the duplicate each time); a broader audit is not warranted without new evidence.
- Any change to `/branch-setup`'s own worktree-creation instructions — the gap is not in how the worktree is created, only in later edits within the same session losing track of which checkout is active.

## NFRs

- **Performance:** Not applicable — instruction text only.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Directly relevant — this closes a gap in session-conduct discipline that, left unaddressed, would keep costing manual recovery time on every future worktree-based session that crosses a context-compaction boundary.

## Complexity Rating

**Rating:** 1 — a single, well-scoped instruction-text addition to one existing section of `CLAUDE.md`, following the established pattern of its own direct sibling rule, with concrete evidence already gathered (not speculative) from two real occurrences in this same session.
**Scope stability:** Stable — the fix design is grounded directly in the capture-log's own two entries describing the exact trigger and recovery pattern.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
