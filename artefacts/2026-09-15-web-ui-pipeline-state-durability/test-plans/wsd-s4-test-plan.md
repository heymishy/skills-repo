# Test Plan: Resolve pipeline-state writer owner/repo fresh and unconditionally (wsd-s4)

**Story:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s4.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js`, driving the REAL two-step flow (`skills.js`'s `handlePostTurnStreamHtml` completes a stage, THEN `journey.js`'s `handlePostGateConfirm` runs against that already-completed session) — mirroring `dcuf-s1`'s own test-file convention for exercising the same "already `_stageDone`" reality, rather than calling `handlePostGateConfirm` directly against a hand-built session (the gap `wsd-s2`'s and `wsd-s3`'s own test suites both had).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Regression | `tests/check-owle6-pipeline-state-auto-write.js` re-run — 20 checks, unchanged |
| T2 | AC1 | Regression | `tests/check-acdg-s1-commit-guard.js` re-run — 6 checks, unchanged |
| T3 | AC1 | Regression | `tests/check-acdg-s2-durability-signal.js` re-run — 8 checks, unchanged |
| T4 | AC1 | Regression | `tests/check-das-s1-commit-artefact-git-fallback.js` re-run — 11 checks, unchanged |
| T5 | AC1 | Regression | `tests/check-dcuf-s1-github-commit-real-completion-point.js` re-run — 13 checks, unchanged |
| T6 | AC1 | Regression | `tests/check-cdg4-gate-confirm-validation.js` re-run — 10 checks, unchanged |
| T7 | AC2 | Regression | `tests/check-wsd-s2-github-pipeline-state-writer.js` re-run — 24 assertions, unchanged |
| T8 | AC3 | Behavioural (new) | Real two-step flow with a mocked DB pool (`export-data-source.setDbPool`) resolving a connected repo (`owner: 'acme'`, `repo: 'widgets'`): `handlePostTurnStreamHtml` completes the stage first, confirming `session._stageDone === true` and `session.done === true` before gate-confirm ever runs; `handlePostGateConfirm` is then called against that session; the `setPipelineStateWriter` spy's `context` argument is asserted to carry `owner: 'acme'`, `repo: 'widgets'`, `token: 'operator-token'` — not `undefined`. |
| T9 | AC4 | Live verification | Post-deploy: continue the same throwaway feature from `wsd-s2`'s/`wsd-s3`'s own live verification through a real stage completion in the production web UI; confirm a new commit touching `.github/pipeline-state.json` lands on `origin/master`. Performed by the orchestrating session directly against production. |

## Regression coverage

T1-T7 are the full existing regression surface for this call path. T8 is the new, previously-missing behavioural test that would have caught this exact bug in `wsd-s2`/`wsd-s3` had it existed then.

## Out of Scope (per story)

- Any change to `pipeline-state-github-writer.js`'s own contract.
- Consolidating `journey.js`'s now largely-dead artefact-commit block into `skills.js`.
