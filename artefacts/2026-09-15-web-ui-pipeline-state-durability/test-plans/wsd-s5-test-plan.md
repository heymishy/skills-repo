# Test Plan: Fetch pipeline-state.json content via the Git Blobs API (wsd-s5)

**Story:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s5.md
**Track:** Short-track

---

## Test Cases

`tests/check-wsd-s2-github-pipeline-state-writer.js` updated: every existing GET mock (T1, T2, T5, T6, T7, T9) split into a Contents-API-meta handler (`sha` only) plus a new `blobHandler`/`anyBlobHandler` mock for the Git Blobs API GET. One new test (T10) added.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1-T9 | AC1, AC2 | Regression | Existing assertions re-verified against the new two-GET mock shape — sha-matching, feature-only updates, no-false-conflict, genuine-409-retry, exhausted-retry capture, non-409 failure capture, invalid-enum rejection all still hold. |
| T10 | AC3 | Behavioural (new) | Mocked Contents API response entirely omits `content` (mirrors GitHub's real >1 MB behaviour) — writer must still succeed via the Git Blobs API fetch, with the correct field change present in the final PUT content. |
| T11 | AC4 | Live verification | Post-deploy: continue the same throwaway feature from `wsd-s2`'s/`wsd-s3`'s/`wsd-s4`'s own live verification through a real stage completion; confirm a new commit touching `.github/pipeline-state.json` finally lands on `origin/master`. |

## Regression coverage

The full existing named suite (`check-owle6-pipeline-state-auto-write.js` through `check-wsd-s4-pipeline-state-owner-repo-resolution.js`) is re-run unchanged — this fix touches only `fetchState()`'s internal mechanics, not any call site or contract.

## Out of Scope (per story)

- Reducing `pipeline-state.json`'s own file size.
- Any change to the PUT step.
