## Story: Extend bulk "Capture all" to include auto-resolved targets

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`)

## Background

Builds on `actr-s2`. `buildCaptureAllList` (`src/utils/capture-all.js`) currently filters to only ACs that already have an entry in `journey.captureTargets` (set manually) — an AC with a successful auto-resolution (`actr-s2`) but no manual entry is silently excluded from "Capture all" today, which would otherwise defeat the point of auto-resolution for the bulk path — the primary path product owners actually use per `ppc-s2`'s own AC1 wording ("another capture action... capture-all").

## User Story

As a **product owner running "Capture all evidence" for a feature**,
I want **every AC with either a manually-set or an auto-resolved capture target included**,
So that **I don't have to manually set a target for each AC just to make the bulk action pick it up**.

## Benefit Linkage

**Metric moved:** `m1` — same linkage as `actr-s1`/`actr-s2`. Completes the friction removal for the bulk path.
**How:** Confirmed with the operator (2026-10-28), direct continuation of `actr-s2`.

## Architecture Constraints

- `buildCaptureAllList`'s existing pure-function signature/contract (`{acs, captureTargets}` -> `{toCapture, skipped}`) is extended to also accept the per-AC auto-resolved targets computed by `actr-s2`'s resolution step (same shape, a list of `{acId, url, selector}`). Resolution itself is NOT re-run inside `buildCaptureAllList` — it stays a pure list-merge function, consistent with its current design (no I/O inside this module today, and this story must not introduce any).
- `handlePostCaptureAll` (`playback-evidence.js`) must compute the same per-AC auto-resolution `actr-s2` already computes for the single-AC render path, once per AC in the group, before calling `buildCaptureAllList` — reusing `actr-s2`'s own resolution function directly, not a second implementation.
- Manual target still takes priority over auto-resolved, per the same rule as `actr-s2` AC3, for any AC where both exist.

## Dependencies

- **Upstream:** `actr-s2`.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a feature with 3 ACs — one with a manual target, one with no manual target but a resolvable auto-target, one with neither — When "Capture all" runs, Then exactly 2 ACs are included in `toCapture` (the manual one and the auto-resolved one) and 1 is in `skipped`.

**AC2:** Given an AC with both a manual and an auto-resolvable target, When "Capture all" runs, Then the manual target's url/selector is the one dispatched, not the auto-resolved one.

**AC3:** Given the 2-AC group from AC1, When `dispatchCaptureWorkflow` is called, Then its `targets` array contains the correct, per-AC-sourced url/selector for each (unchanged dispatch shape from today — per-AC source only differs in origin).

**AC4:** Given an AC whose auto-resolution attempt fails (test-plan missing, spec missing, or spec resolves no match), When "Capture all" runs, Then that AC lands in `skipped` exactly as it does today for an AC with no manual target — no new error path introduced.

**AC5:** Given the existing `captureAllLock`/progress-reporting behaviour, When the auto-resolution-aware list is built, Then `captureAllLock.setTotal` still reflects the correct total count including auto-resolved ACs — progress reporting is not undercounted.

## Out of Scope

- Any change to the GitHub Actions worker or artifact download/finalise path (`_finaliseInProgressCaptures`) — unaffected, it already treats every dispatched AC uniformly regardless of target origin.
- Any new UI affordance beyond what `actr-s2` already added per-AC (the bulk view reuses the same per-AC rendering).

## NFRs

- **Security:** Same as `actr-s2` — no new surface; this story only changes which ACs are included in an existing, already-scoped dispatch call.
- **Performance:** Resolution work for N ACs in a group must not become extra artefact fetches beyond what `actr-s2` already does per AC — acceptable to resolve once per `handlePostCaptureAll` request (capture-all is itself rate-limited to 1/60s), but must not re-fetch per AC more than once within that single request.
- **Accessibility:** Not applicable — no new rendering surface beyond `actr-s2`'s.
- **Audit:** None beyond existing logging.

## Complexity Rating

**Rating:** 2 — straightforward merge logic, but depends on `actr-s2` landing first and its resolution function being cleanly reusable from a loop context.
**Scope stability:** Stable.
