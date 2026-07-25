## Story: `skills advance` warns loudly when it creates a new story record instead of updating an existing one

**Short-track:** bug fix -- affected every kanban story branch this session (found via capture-log review).

## User Story

As **Hamish King (Founder/Operator)**,
I want **`skills advance` to make it unmistakable when it creates a brand-new story record instead of updating the one I meant**,
So that **a typo'd or short-alias story-id never again silently produces an orphaned, disconnected record while the CLI reports plain success**.

## Background / Investigation

`cli-advance.js`'s story-lookup (lines ~166-190) searches flat `feature.stories[]`, then epic-nested `feature.epics[].stories[]`, and if neither matches, unconditionally creates a new minimal `{ id: storyId }` entry and pushes it onto `feature.stories[]` -- even for a feature that has never used the flat-stories shape before. This happened for real, tonight's own capture-log confirms, when `node bin/skills advance <feature> s2.1 prStatus=...` was run against an epic-nested feature whose real story identifier was the full slug `s2.1-shared-token-redesign`, not the bare alias `s2.1` -- the CLI created a stray, disconnected `{ id: 's2.1', prStatus: ..., updatedAt: ... }` record and printed `Advanced: ... — prStatus=draft`, identical in shape to a genuine success. The mistake went unnoticed until a direct re-read of the real record showed `prStatus` still `'draft'`. The exact same short-alias mistake affected every other kanban story branch built the same session (s2.2, s3.1, s3.3, s3.4).

**Why this isn't simply forbidden:** CLAUDE.md's own `cdg.6` rule explicitly permits `advance` to be used for "initial story creation (adding a new story object to the pipeline-state)" as a sanctioned exception -- so blocking creation outright would break an already-documented, legitimate workflow. The actual gap is observability, not permission: the CLI's success output gives zero indication of which of the two very different things just happened (updated a real, existing record vs. created a brand-new one).

## Architecture Constraints

- **Creation stays allowed** -- do not add a hard block or a new required flag. This preserves the existing `cdg.6`-documented initial-story-creation use case unchanged.
- **Make the two outcomes visibly different.** Track whether the resolved `story` object was found (existing) or newly constructed, and reflect that in both the returned `stdout` message and a loud `stderr` line for the creation case -- printed regardless of `--ci`/quiet flags, since this is exactly the kind of message that must not be scrollable-past.
- **No change to exit code for the creation case** -- still `exitCode: 0`, since creation is a valid, successful outcome per `cdg.6`; only the *messaging* changes.
- **No change to the write path itself** -- the atomic temp-file-rename write, prototype-pollution guard, enum/boolean validation, and dot-notation handling are all unaffected.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a `storyId` that matches an existing story (in either flat `feature.stories[]` or epic-nested `feature.epics[].stories[]`), When `advance` runs, Then `stdout` reads exactly as before (`Advanced: <feature>/<storyId> — <fields>`), and `stderr` is empty -- no behaviour change for the existing-story case.

**AC2:** Given a `storyId` that matches NO existing story anywhere on the feature, When `advance` runs with at least one story-scoped field, Then a new story record is still created (unchanged write behaviour), but `stderr` contains a clearly-labelled warning naming the feature slug and the story-id that did not match, and `stdout`'s own message is prefixed to distinguish it from an update (e.g. `Created NEW story record: ...` rather than the plain `Advanced: ...`).

**AC3:** Given the same no-match scenario as AC2, When the result is returned, Then `exitCode` is still `0` -- creation remains a successful, permitted outcome, not a failure.

**AC4:** Given a call with ONLY feature-scoped fields (`feature.<field>=...`, no story-scoped fields at all), When `advance` runs, Then no story lookup or creation happens at all (matches existing behaviour exactly) -- AC2's new warning path is never triggered for a pure feature-level milestone call.

## Out of Scope

- Adding a `--create`/`--allow-new` flag or any other new CLI surface.
- Changing `gate-advance`'s own story-resolution logic (`cli-gate-advance.js`) -- out of scope unless it shares this exact code path (confirm during implementation; if it does, apply the same fix there too as a natural extension, not a separate story).
- Retroactively flagging or cleaning up any already-created stray records from past sessions.

## NFRs

- **Observability:** This is the entire point of the story -- convert a silent, easily-missed divergent outcome into an unmissable one.
- **Backward compatibility:** Every existing caller/test relying on the current `stdout`/exit-code shape for the FOUND-story case must be unaffected (AC1).

## Complexity Rating

**Rating:** 1 -- a boolean flag (`wasCreated`) threaded through existing logic, plus a conditional message change; no new mechanism.
**Scope stability:** Stable.
