## Story: Resolve pipeline-state writer owner/repo fresh and unconditionally, not from the (usually-skipped) das-s1 block

**Track:** Short-track (bug found via `wsd-s3`'s own live production re-verification, superseding that fix)
**Epic reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/epics/web-ui-pipeline-state-durability.md
**Domain:** web-ui

## User Story

As **the operator relying on `wsd-s2`'s GitHub-API pipeline-state writer**,
I want **`journey.js`'s `handlePostGateConfirm` to resolve the connected repository's owner/repo independently at the pipeline-state-writer call site, not reuse a value that is only ever populated when a now-rare code path happens to run**,
So that **the write actually succeeds for real, live-chat-driven stage completions — which is the normal case, not the exception**.

## Problem (found via `wsd-s3`'s own live re-verification, not a written AC beforehand)

`wsd-s3` (PR #890) was deployed and re-verified live. The write still failed with the identical error:
```
{"event":"pipeline_state_write_failed","error":"pipeline-state-github-writer: token, owner, and repo are all required (no session token or no connected repository resolved for this feature)."}
```
Root cause this time fully isolated: `dcuf-s1` (an earlier, unrelated story, already merged before this session's `wsd` work began) had already moved the REAL artefact-commit dual-write — and the `_dasOwnerRepo` resolution it depends on — out of `journey.js`'s `handlePostGateConfirm` and into `skills.js`'s chat-turn handler (`handlePostTurnStreamHtml`). `dcuf-s1`'s own code comment states this plainly: journey.js's `if (!session._stageDone)` block is "unreachable in practice" for a real, live-chat-driven journey, because `skills.js` sets `session._stageDone = true` during the actual chat turn — before the operator ever clicks "Continue to X" and reaches `handlePostGateConfirm`. `wsd-s2`'s design (and `wsd-s3`'s "fix") both built on top of that same now-mostly-dead `if (!session._stageDone)` block, assuming it reliably populates `_dasOwnerRepo`/the token snapshot before the pipeline-state-writer call runs. It does not, for the normal case. `req.session.accessToken` was never actually the problem (always valid); `owner`/`repo` were the missing piece, because their only resolution point is inside the skipped block.

## Fix

`src/web-ui/routes/journey.js`: at the pipeline-state-writer call site, resolve `owner`/`repo` via a fresh, unconditional call to `ownerRepoForFeature(journey.featureSlug, req.session.accessToken)` — independent of `_dasOwnerRepo` (reverted to its original, `das-s1`-block-local usage for the artefact-commit call only, which is itself now understood to rarely run for real usage, matching `dcuf-s1`'s own documented reality). This mirrors exactly the resolution pattern `skills.js`'s own `handlePostTurnStreamHtml` already uses for the same purpose.

## Acceptance Criteria

**AC1:** Given the existing `journey.js`/`skills.js` gate-confirm and dual-write test suite (`check-owle6-pipeline-state-auto-write.js`, `check-acdg-s1-commit-guard.js`, `check-acdg-s2-durability-signal.js`, `check-das-s1-commit-artefact-git-fallback.js`, `check-dcuf-s1-github-commit-real-completion-point.js`, `check-cdg4-gate-confirm-validation.js`), When this fix is applied, Then all pass unchanged.

**AC2:** Given `wsd-s2`'s own test suite (`check-wsd-s2-github-pipeline-state-writer.js`), When this fix is applied, Then all 24 assertions pass unchanged.

**AC3:** Given a REAL two-step flow — `skills.js`'s `handlePostTurnStreamHtml` completes a stage first (setting `session._stageDone = true`, exactly as real usage does), THEN `journey.js`'s `handlePostGateConfirm` runs against that already-completed session (exactly as a real "Continue to X" click does) — When the pipeline-state writer is called, Then its `context` argument carries the correctly-resolved `owner`/`repo`/`token`, not `undefined` values. This is the exact scenario `wsd-s2`'s and `wsd-s3`'s own test suites never exercised (both called `handlePostGateConfirm` directly against a hand-built session with `_stageDone` left unset — the same unreality `dcuf-s1`'s own test file already documented for the artefact-commit case).

**AC4:** Given a real production deploy of this fix, When a fresh (or continuing) feature is driven through a real stage completion in the web UI, Then `.github/pipeline-state.json` on `origin/master` shows a new commit reflecting that feature's stage advance — closing the gap `wsd-s2`'s and `wsd-s3`'s own live verifications both found still open. (Live-verified post-deploy, not automatable.)

## Out of Scope

- Any change to `pipeline-state-github-writer.js` itself — unaffected.
- Consolidating `journey.js`'s now largely-dead `if (!session._stageDone)` artefact-commit block into `skills.js` alongside `dcuf-s1`'s already-moved logic — worth a future cleanup, not required to close this gap.

## NFRs

- **None new** — adds one additional `ownerRepoForFeature` DB lookup per gate-confirm call (previously only made when the largely-dead block happened to run); negligible cost, matches what `skills.js`'s own equivalent call already accepts for first-completions.

## Complexity Rating

**Rating:** 2 — the fix itself is small, but correctly diagnosing it required tracing an interaction between two files' completion-tracking logic and an earlier, unrelated story's own code-movement history.
**Scope stability:** Stable.
