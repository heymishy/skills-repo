## Story: Close icrh-s1's and icv-s1's unconfirmed real-staging E2E verification

**Epic reference:** None — short-track, closing two related self-documented gaps from the same 2026-07-23 ideate-canvas-fix cluster
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As a **platform maintainer**,
I want **`icrh-s1`'s and `icv-s1`'s real-staging E2E verification AC (AC6 for both) actually confirmed passing, not left as a skipped CI job or a "pending" decisions.md entry**,
So that **two related canvas-rendering fixes from the same cluster have real confirmation they work against production infrastructure, not just unit/behavioural test coverage**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure) — closes two related gaps found while writing retroactive DoDs (2026-08-18) for stories in the same feature cluster (both merged 2026-07-23, both fixing ideate-canvas rendering bugs):
1. `icrh-s1` (Hydrate the ideate canvas from restored `session.canvasBlocks`): AC6's real-staging verification shows as **skipped**, not passed, in CI — blocked by a precondition gate. A promised manual re-run/follow-up comment was never posted, though the deploy itself was confirmed live.
2. `icv-s1` (Stop `/ideate` chat client from auto-firing an unbounded continue chain): AC6's real-staging re-verification of the originating CI-blocking failure was explicitly left "pending" in `decisions.md` and never closed — `acVerified: 5` of `6` in `pipeline-state.json` confirms it.

**How:** Both gaps are the same class of issue (a staging-E2E AC accepted at merge time with a known, explicit caveat that was never followed up) in directly adjacent stories — closing them together is more efficient than two separate single-story sessions, and may share a root cause worth understanding once investigated together.

## Architecture Constraints

- For `icrh-s1`: investigate what precondition gate is skipping the target staging test in CI, and either fix the gate or manually execute the equivalent verification and record the result.
- For `icv-s1`: execute the real-staging re-verification `decisions.md` left as "pending" and record the actual outcome, closing `acVerified` to `6` of `6`.
- Reuse each story's own existing verification-script/test infrastructure — do not build new staging-verification tooling for this story.

## Dependencies

- **Upstream:** `icrh-s1` and `icv-s1` (both merged, same cluster, 2026-07-23) — this story closes verification gaps in each story's own delivered scope.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `icrh-s1`'s AC6 staging verification, When investigated, Then the CI precondition gate that causes it to skip (rather than pass or fail) is identified and either fixed so the test actually runs, or the verification is performed manually with a recorded, real result.

**AC2:** Given `icv-s1`'s AC6 staging re-verification (currently "pending" in `decisions.md`), When executed, Then the real result is recorded in `decisions.md`, closing the pending status and updating `acVerified` to `6` of `6` in `pipeline-state.json`.

**AC3:** Given both AC1 and AC2 reveal a real defect (not just a process gap), When found, Then it is documented as a new finding for separate triage — this story's scope is closing the verification gap, not fixing unknown-in-advance defects.

## Out of Scope

- Any change to the canvas-rendering fixes themselves — both stories' underlying behaviour is already confirmed correct via unit/behavioural tests (per their own DoDs); this story only closes the staging-verification gap.
- Broader investigation into whether other stories in this same cluster (or elsewhere) have similar unconfirmed staging ACs — scoped to these two specific, already-diagnosed gaps.

## NFRs

- **Performance:** None identified.
- **Security:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2 — the CI precondition-gate investigation for `icrh-s1` has some genuine unknown (why does it skip); `icv-s1`'s side is more mechanical (a re-run already scoped).
**Scope stability:** Unstable — AC1's investigation could reveal it needs more scope once started.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
