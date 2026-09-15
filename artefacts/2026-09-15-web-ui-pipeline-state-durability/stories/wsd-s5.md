## Story: Fetch pipeline-state.json content via the Git Blobs API, not the Contents API's own inline field

**Track:** Short-track (bug found via `wsd-s4`'s own live production re-verification)
**Epic reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/epics/web-ui-pipeline-state-durability.md
**Domain:** web-ui

## User Story

As **the operator relying on `wsd-s2`'s GitHub-API pipeline-state writer**,
I want **the writer to fetch `pipeline-state.json`'s content via a path that works regardless of file size**,
So that **the write succeeds for the real file — which is ~1.5 MB, over GitHub's 1 MB Contents-API inline-content ceiling — not only for small test fixtures**.

## Problem (found via `wsd-s4`'s own live re-verification, not a written AC beforehand)

`wsd-s4` (PR #891) was deployed and re-verified live. The write reached a genuinely new failure this time — real progress, since `wsd-s4` fixed the actual "no owner/repo" bug — but still failed:
```
{"event":"pipeline_state_write_failed","error":"Unexpected end of JSON input"}
```
Root cause: GitHub's Contents API (`GET /repos/:owner/:repo/contents/:path`) omits the `content` field entirely (or returns it empty) for any file over 1 MB — this is a documented GitHub API limit, not a bug in GitHub. `.github/pipeline-state.json` is ~1.5 MB (`1,535,145` bytes, confirmed locally) and growing. `pipeline-state-github-writer.js`'s original `fetchState()` decoded `body.content` directly from that same response — for the real file, `body.content` was `undefined`, `Buffer.from(undefined, 'base64').toString('utf8')` produced an empty string, and `JSON.parse('')` threw exactly this error, on every real production write. Every automated test for this module used a tiny fixture state (well under 1 MB), so none of them ever exercised this size-dependent GitHub API behaviour.

## Fix

`src/web-ui/adapters/pipeline-state-github-writer.js`'s `fetchState()`: GET the Contents API purely for its `sha` (always present regardless of file size), then GET `/repos/:owner/:repo/git/blobs/:sha` (the Git Blobs API, no size ceiling below 100 MB) using that exact sha to fetch content. This is not just a size fix — it is also *safer* against the original design's own concurrency concern than the single-GET approach: a git blob is immutable and content-addressed, so fetching it by its own sha can never observe content that doesn't correspond to exactly that sha. The PUT step is unchanged, still using the sha captured from the Contents API GET.

## Acceptance Criteria

**AC1:** Given the existing regression suite for this call path (`check-owle6-pipeline-state-auto-write.js`, `check-acdg-s1-commit-guard.js`, `check-acdg-s2-durability-signal.js`, `check-das-s1-commit-artefact-git-fallback.js`, `check-dcuf-s1-github-commit-real-completion-point.js`, `check-cdg4-gate-confirm-validation.js`, `check-wsd-s4-pipeline-state-owner-repo-resolution.js`), When this fix is applied, Then all pass unchanged.

**AC2:** Given `wsd-s2`'s own test suite (`check-wsd-s2-github-pipeline-state-writer.js`), updated to mock the two-GET flow (Contents API for sha, Git Blobs API for content), When this fix is applied, Then all existing assertions (T1-T9) pass with their mocks updated to the new two-request shape.

**AC3 (new, the actual regression this story targets):** Given a mocked Contents API response that omits the `content` field entirely — mirroring GitHub's real behaviour for any file over 1 MB, exactly matching production's `pipeline-state.json` — When the writer runs, Then it succeeds via the Git Blobs API fetch, with the correct field change present in the final PUT content. This is the exact scenario no previous test (in `wsd-s2` or `wsd-s3`/`wsd-s4`) ever exercised, since every mock used a small fixture.

**AC4:** Given a real production deploy of this fix, When the throwaway feature already used for `wsd-s2`'s/`wsd-s3`'s/`wsd-s4`'s own live verification is driven through another real stage completion, Then `.github/pipeline-state.json` on `origin/master` finally shows a new commit reflecting that feature's stage advance. (Live-verified post-deploy, not automatable.)

## Out of Scope

- Reducing `pipeline-state.json`'s own file size — already noted as a future concern in `wsd-s2`'s own Out of Scope.
- Any change to the PUT step's mechanics — unaffected, still a single PUT with the sha from the Contents API GET.

## NFRs

- **Performance:** adds one additional GET per write (blob fetch) — negligible, and this path only runs in production (the local-fs writer is unaffected and used for local dev/CLI).
- **None else new.**

## Complexity Rating

**Rating:** 2 — small fix, but required recognizing a GitHub API size-ceiling behaviour that no fixture-based test had ever triggered, plus updating an existing test file's whole mocking shape.
**Scope stability:** Stable.
