## Story: Snapshot pipeline-state writer context at first-known-good, not re-read at call time

**Track:** Short-track (bug fix found during wsd-s2's own live production verification)
**Epic reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/epics/web-ui-pipeline-state-durability.md
**Domain:** web-ui

## User Story

As **the operator relying on `wsd-s2`'s GitHub-API pipeline-state writer**,
I want **the session token and resolved owner/repo passed to the writer to be captured at the exact point they are known-good, not re-read from `req.session`/`_dasOwnerRepo` a second time later in the same request**,
So that **the write actually succeeds in production, closing the gap `wsd-s2`'s own live verification found still open**.

## Benefit Linkage

Directly completes `wsd-s2`'s own unmet benefit: Pipeline-state accuracy for web-UI-originated features (Tier 1, Metric 1) and Silent-failure elimination (Tier 2, Meta Metric 1). `wsd-s2` shipped a working writer and proved the failure-visibility half live (a specific, diagnosable error now appears in Fly logs, replacing total silence) — but the write itself still failed in a real production run. This story closes that remaining gap.

## Problem (found via live verification, not a written AC beforehand)

A real throwaway feature (`2026-09-14-wsd-s2-live-verification-throwaway`) was driven through a real discovery-stage completion in production on 2026-09-15, after confirming the deploy (`GET /version` returned `336afda`, `#889`). Fly logs showed:
```
{"event":"pipeline_state_write_failed","error":"pipeline-state-github-writer: token, owner, and repo are all required (no session token or no connected repository resolved for this feature)."}
```
This occurred in the SAME request where the artefact-commit dual-write (`das-s1`) succeeded moments earlier — the resulting commit (`eb22575e`, discovery.md) is real, on `origin/master`, using the identical `req.session.accessToken` and `_dasOwnerRepo.{owner,repo}` values. Static re-reading of the merged `journey.js` code did not reveal an obvious bug — both are correctly in scope at both call sites in one function invocation. The exact mechanism (session-store race, resave/touch behaviour, or something else) was not conclusively isolated within the time available; a defensive fix was chosen over further live-debugging cycles.

## Fix

`src/web-ui/routes/journey.js`: introduce `_pipelineStateContext = { token, owner, repo }`, captured immediately after `_dasOwnerRepo` resolves (the same point `commitArtefact` already reads these values from, and where they are provably valid — the commit succeeds using them). The artefact-commit call and the later `_pipelineStateWriter` call both now read from this one snapshot, rather than the pipeline-state-writer call re-reading `req.session.accessToken` / `_dasOwnerRepo` fresh ~20 lines later.

## Acceptance Criteria

**AC1:** Given the existing `journey.js` gate-confirm test suite (`check-owle6-pipeline-state-auto-write.js`, `check-acdg-s1-commit-guard.js`, `check-acdg-s2-durability-signal.js`, `check-das-s1-commit-artefact-git-fallback.js`, `check-dcuf-s1-github-commit-real-completion-point.js`, `check-cdg4-gate-confirm-validation.js`), When this fix is applied, Then all pass unchanged.

**AC2:** Given `wsd-s2`'s own test suite (`check-wsd-s2-github-pipeline-state-writer.js`), When this fix is applied, Then all 24 assertions pass unchanged — the writer's own contract is untouched, only the caller's context construction changed.

**AC3:** Given a real production deploy of this fix, When a fresh feature is driven through a real stage completion in the web UI, Then `.github/pipeline-state.json` on `origin/master` shows a new commit reflecting that feature's stage advance — closing the gap `wsd-s2`'s own live verification found still open. (Live-verified post-deploy, not automatable.)

## Out of Scope

- Root-causing the exact mechanism behind the observed staleness (session-store internals) — the snapshot fix removes the gap regardless of the mechanism; a full root-cause investigation is not required to close this story.
- Any change to `pipeline-state-github-writer.js` itself — unaffected, still receives the same `{token, owner, repo}` shape.

## NFRs

- **None new** — this is a pure refactor of where three already-existing values are read from within one request; no new I/O, no new credential.

## Complexity Rating

**Rating:** 1 — small, mechanical, defensive fix with a clear correctness bar (existing tests pass unchanged; live re-verification confirms the write itself now succeeds).
**Scope stability:** Stable.
