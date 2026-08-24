## Story: Close the false-wait gap in subagent-execution's Step 3 final-review dispatch

**Epic reference:** None — short-track, closing a capture-log finding confirmed to recur twice (`rcfc-s1`'s Step 3 dispatch, then re-confirmed via loop-design metrics pull after `evcg-s1`/`psms-s1`)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [pipeline-infrastructure]

## User Story

As a **coding agent dispatching the Step 3 final-review subagent in `/subagent-execution`**,
I want **the same mandatory background-process warning that every per-task dispatch (Steps 2a/2b/2c) already carries**,
So that **a cross-cutting final-review subagent does not start a background verification command and then wait indefinitely for a completion notification that will never arrive, exactly the failure mode the Step 2a/2b/2c warning already prevents everywhere else in this same skill**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure, no benefit-metric artefact). The Meta Metric 2 (false-wait incident count, `artefacts/2026-08-23-inner-loop-ceremony-optimisation/loop-design.md`) target is 0/story. `rcfc-s1` scored 1 — its Step 3 dispatch hit the false-wait trap despite the warning text being present verbatim at every one of that story's other dispatch sites, because it was never added to Step 3's own dispatch instructions in `subagent-execution/SKILL.md`. A loop-design metrics pull across the last 7 inner-loop runs (`vrne-s1`–`s4`, `rcfc-s1`, `evcg-s1`, `psms-s1`) confirmed 0 false-wait incidents across every regular per-task dispatch since the original 2026-08-14 fix landed, and exactly 1 incident — Step 3 — the one dispatch site that fix never reached.

## Architecture Constraints

- This is a `SKILL.md` instruction-text change to `skills/subagent-execution/SKILL.md` only (Step 3's dispatch context list), plus a matching `check-skill-contracts.js` entry — no application code, no CI workflow changes.
- Do not touch Steps 2a/2b/2c's own already-correct warning text — copy the same warning into Step 3 by cross-reference ("the same background-process warning as 2a/2b/2c"), matching the exact pattern 2b and 2c already use to reference 2a, rather than re-deriving new wording.
- Per this repo's established pattern for `SKILL.md` instruction changes (`csd-s4`, `dta-s1`, `evcg-s1`, `psms-s1`), tests assert on the actual instruction text present in the real file.

## Dependencies

- **Upstream:** None. Builds on (does not replace) the original 2026-08-14 background-process warning fix already present at Steps 2a/2b/2c.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `skills/subagent-execution/SKILL.md`'s Step 3 ("Final review") dispatch context list, When this story's changes are applied, Then the list includes a "Mandatory, every dispatch" background-process warning line, cross-referencing Steps 2a/2b/2c's own warning by the same phrasing those steps already use to reference each other.

**AC2:** Given the new Step 3 warning line, When read, Then it explicitly states this is the one dispatch site in this skill that was previously missing the warning, and names the concrete evidence (`rcfc-s1`'s own Step 3 dispatch recurring the failure with the warning present everywhere else in the same run) — not a generic restatement with no grounding.

**AC3:** Given `.github/scripts/check-skill-contracts.js`'s `CONTRACTS` entry for `subagent-execution`, When this story's changes are committed, Then the entry includes a new required-string marker matching the new Step 3 warning text, so a future edit cannot silently strip it.

**AC4:** Given the existing Steps 2a/2b/2c warning text and the DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED status table, When this story's changes are applied, Then both remain byte-for-byte unchanged — this story only adds to Step 3, it does not rewrite any existing section.

## Out of Scope

- Any change to Steps 2a/2b/2c's own warning text or structure — already correct, not touched.
- Adding the same warning to any other skill's dispatch instructions (`implementation-review`, `spike`, etc.) — this story is scoped to the one confirmed-recurring gap in `subagent-execution/SKILL.md` specifically; a broader audit of every skill that dispatches subagents is a separate, larger exercise not undertaken here.
- Any change to how Step 3's final reviewer is invoked (model selection, context construction beyond the warning) — only the missing warning line is added.

## NFRs

- **Performance:** Not applicable — instruction text only.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Directly relevant — this closes a gap in the audit trail for exactly why Step 3 was the one site still producing false-wait incidents after the original fix.

## Complexity Rating

**Rating:** 1 — a single, well-scoped instruction-text addition to one section of one file, following an established pattern (`csd-s4`, `dta-s1`, `evcg-s1`, `psms-s1`) for exactly this kind of change, with concrete evidence already gathered (not speculative).
**Scope stability:** Stable — the fix design is grounded in a direct read comparison of Step 3's dispatch instructions against Steps 2a/2b/2c's, confirming the omission precisely.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
