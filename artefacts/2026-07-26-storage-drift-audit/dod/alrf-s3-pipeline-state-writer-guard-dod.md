# Definition of Done: pipeline-state-writer refuses to fabricate state on a missing file

**PR:** #616 (commit `aa60a72f`, also `6dde3c40`) | **Merged:** 2026-07-26 (confirmed via `git log`)
**Story:** `artefacts/2026-07-26-storage-drift-audit/stories/alrf-s3-pipeline-state-writer-guard.md`
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 -- writer throws when `.github/pipeline-state.json` does not already exist at repoRoot | Yes | `tests/check-cdg7-gate-advance.js` `T-alrf-s3a-missing-file-throws` -- asserts the writer throws on a deliberately unseeded temp dir | Automated test, re-run this session | None |
| AC2 -- a refused write does not create a bogus file | Yes | `T-alrf-s3b-missing-file-no-file-created` -- asserts `fs.existsSync(statePath)` is false after the throw is caught | Automated test, re-run this session | None |
| AC3 -- the normal path (file already exists) is completely unaffected | Yes | `T-alrf-s3c-existing-file-unaffected` -- asserts a normal write against a pre-seeded fixture still updates `prStatus` correctly; full suite passes at 40/40 (see Test Plan Coverage) | Automated test, re-run this session | None |
| AC4 -- gate-confirm route degrades correctly on a thrown write (no crash, trace emission correctly skipped) | Yes | Inspected `src/web-ui/routes/journey.js` directly this session: `stateWriteSucceeded` flag (line 2155) is set only on successful write (line 2171) and gates trace-emission branches at lines 2178, 2192, 2217 -- pre-existing try/catch + gating from `cdg.5`/ADR-023, unchanged by this story | Manual code inspection, confirmed this session | None -- verified by inspection as the story itself claims, no dedicated test exists for this AC |

## Scope Deviations

None. The story's own "Out of Scope" section names two explicitly deferred items -- other storage-drift audit findings (`workspace/ideas.json`, `workspace/estimation-norms.md`, artefact content) and the durable-store fix that would make staging writes actually persist (tracked separately under `decisions.md` D1). Both are accepted exclusions stated in the story text, not defects.

## Test Plan Coverage

Re-ran `tests/check-cdg7-gate-advance.js` directly this session (the "null passed, null failed" figure supplied at task start was unusable and not trusted): **40/40 checks passing**, including the three new named assertions `T-alrf-s3a-missing-file-throws`, `T-alrf-s3b-missing-file-no-file-created`, `T-alrf-s3c-existing-file-unaffected`, confirmed present in the test source at lines 335, 344, and 361 of `tests/check-cdg7-gate-advance.js`. The story also claims `check-owle6-pipeline-state-auto-write.js` at 20/20 unchanged; this second suite was not independently re-run this session (out of scope for this task's fresh-evidence set), so that figure is carried from the story text rather than independently re-verified.

## NFR Status

No NFRs are explicitly named in the story. The change is a data-integrity guard (fail-fast instead of silent corruption) rather than a performance, security, or availability requirement with a stated threshold.

## Metric Signal

No benefit-metric artefact is referenced by this story. The story explicitly states it moves none of `csd-e1`'s metrics directly -- it is framed as a governance-integrity fix, not a metric-linked feature.

## Outcome

**COMPLETE**
**Follow-up actions:** None from this story. The related durable-store fix (making pipeline-state writes actually succeed on staging) remains tracked separately per `decisions.md` D1 and is out of scope here.

## DoD Observations

Fix has been live in `master` since 2026-07-26 (PR #616) with no reported incident; the call-site (`journey.js`) required no changes because its pre-existing `stateWriteSucceeded` gating (from `cdg.5`/ADR-023) already handled a thrown write correctly, which this session's inspection confirmed still holds unchanged.
