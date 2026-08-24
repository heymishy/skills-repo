## Story: Close the silent tasks[] data-loss gap in pipeline-state.json checkpoint writes

**Epic reference:** None — short-track, closing a still-open capture-log finding (2026-08-16, reconfirmed 2026-08-24 scour) that the 2026-08-23 `subagent-execution` fix only partially addressed
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [pipeline-infrastructure]

## User Story

As a **coding agent writing a pipeline-state.json checkpoint during the inner coding loop**,
I want **explicit, unambiguous instructions on where the fields I merge onto a freshly-fetched master copy actually come from**,
So that **a story's own locally-accumulated fields (its `tasks[]` array, `testPlan.passing`, etc., written by earlier writes within the same uncommitted session) are never silently discarded because I reconstructed them from only the current step's own outputs instead of reading the current local file first**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure, no benefit-metric artefact).
**How:** The 2026-08-23 fix to `subagent-execution/SKILL.md` correctly scoped *when* to fetch `origin/master` (checkpoints only, not every per-task write) after this exact bug caused real, repeated data loss on `wsi-s2` (2026-08-16) and `vrne-s1` (2026-08-22/23). But the fix left the actual merge step — `// --- apply only this story's fields to s ---` — as an unexplained placeholder comment in all three files that carry this pattern (`implementation-plan`, `subagent-execution`, `branch-complete`), with no instruction on *where* those fields are read from. A literal-minded execution can still reconstruct "this story's fields" from only the current skill step's own new outputs, silently discarding every earlier local write within the same session — the same failure mode the 2026-08-23 fix was meant to close, just one layer deeper. This story closes that remaining layer.

## Architecture Constraints

- This is a `SKILL.md` instruction change to `skills/implementation-plan/SKILL.md`, `skills/subagent-execution/SKILL.md`, `skills/branch-complete/SKILL.md`, and `skills/verify-completion/SKILL.md`, plus matching `check-skill-contracts.js` entries — no application code, no CI workflow changes.
- Per this repo's established pattern for SKILL.md instruction changes (`csd-s4`, `dta-s1`, `evcg-s1`), tests assert on the actual instruction text present in the real files.
- Do not touch `subagent-execution/SKILL.md`'s already-correct scoping rule (fetch at checkpoints, not per-task) — that part of the 2026-08-23 fix is sound and stays as-is. This story only adds the missing "where do the merged fields come from" instruction on top of it.
- `verify-completion/SKILL.md` currently has zero fetch-safety guidance at all (not wrong, but silent-by-omission and inconsistent with its 3 siblings) — this story gives it an explicit statement rather than leaving future edits free to add an unscoped "always fetch" rule there too.

## Dependencies

- **Upstream:** None. Builds on (does not replace) `subagent-execution/SKILL.md`'s existing 2026-08-23 fetch-scoping fix.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `skills/subagent-execution/SKILL.md`'s checkpoint-write code sample and its "Rule for checkpoint writes" five-step list, When this story's changes are applied, Then step 4 ("Apply only this story's fields to the fetched state") is replaced with an explicit instruction that these fields must be read from the current local worktree file's own entry for this story — not reconstructed from only the current skill step's own new outputs — and the code sample itself shows a concrete line reading the local file before the merge.

**AC2:** Given `skills/implementation-plan/SKILL.md`'s and `skills/branch-complete/SKILL.md`'s "Pipeline-state write safety" sections, When this story's changes are applied, Then both (a) receive the same explicit local-first-merge instruction as AC1, and (b) have their stale "fetch from master before every write" framing corrected to match `subagent-execution`'s already-fixed "fetch at checkpoints" scoping, since both skills' own single-write-per-story usage already implicitly relies on that correct understanding.

**AC3:** Given `skills/verify-completion/SKILL.md`'s "State update — mandatory final step" section, When this story's changes are applied, Then it gains an explicit fetch-safety statement matching the same corrected pattern as AC1/AC2 (currently has none at all — silent by omission).

**AC4:** Given `.github/scripts/check-skill-contracts.js`'s `CONTRACTS` entries for `implementation-plan`, `subagent-execution`, `branch-complete`, and `verify-completion`, When this story's changes are committed, Then each entry includes a new required-string marker matching its file's new local-first-merge instruction text, so a future edit cannot silently strip it.

**AC5:** Given the new instruction text across all 4 files, When read together, Then they consistently describe the same merge direction: read this story's own entry from the current local file, then write it onto the freshly-fetched master copy's *other* stories/features — never the reverse (never let the fetched master's stale-or-absent version of this story's own entry replace what has already accumulated locally this session).

## Out of Scope

- Rewriting the fetch/merge logic as real, shared, executable code (e.g. a `scripts/pipeline-state-merge.js` helper) rather than instruction text repeated across 4 SKILL.md files — a larger refactor with its own tradeoffs (a shared script needs its own tests, versioning, and invocation convention); this story closes the immediate data-loss gap with the same instruction-text mechanism the rest of this repo's skills already use, not a new tooling layer.
- Any change to `subagent-execution/SKILL.md`'s existing "fetch at checkpoints, not per-task" scoping rule — already correct, not touched.
- Retroactively auditing whether any already-merged story's `pipeline-state.json` history has stale/lost data from this bug before this fix — a separate, larger forensic exercise, not blocking this fix.
- The other 38 skills that write `pipeline-state.json` but only ever write once, at a natural one-shot checkpoint outside the inner coding loop (`discovery`, `definition`, `review`, etc.) — those are not exposed to the same-session multi-write pattern that causes this bug, and adding this same instruction there would be inert boilerplate.

## NFRs

- **Performance:** Not applicable — instruction text only, no new runtime behaviour.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Directly relevant — the fix improves the audit trail (SHA logging already exists; this closes the gap in what gets preserved across writes).

## Complexity Rating

**Rating:** 1 — well-understood, narrowly-scoped instruction-text change across 4 already-identified files, following an established pattern in this repo for exactly this kind of change.
**Scope stability:** Stable — the fix design is grounded in a precise, directly-read comparison of all 3 existing occurrences of the ambiguous placeholder, not speculation.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
