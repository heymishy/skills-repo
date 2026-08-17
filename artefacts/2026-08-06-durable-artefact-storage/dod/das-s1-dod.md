# Definition of Done: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation

**PR:** https://github.com/heymishy/skills-repo/pull/674 | **Merged:** 2026-08-06
**Story:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
**Test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s1-test-plan.md
**Verification script:** artefacts/2026-08-06-durable-artefact-storage/verification-scripts/das-s1-verification.md
**Review:** artefacts/2026-08-06-durable-artefact-storage/review/das-s1-review-2.md (0 HIGH findings)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — completed stage artefact committed to the connected repo, in addition to local disk | ✅ | `check-das-s1-commit-artefact-git-fallback.js` | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — a git commit failure blocks the stage from being marked complete, with a clear operator-facing error | ✅ | Same file | Automated test, re-run fresh | None |
| AC3 — a missing local file with a prior successful git commit falls back to git content on Resume conversation | ✅ | Same file | Automated test, re-run fresh | None |
| AC4 — repo-less products see no behaviour change (no git commit attempted, no error) | ✅ | Same file | Automated test, re-run fresh | None |
| AC5 — both local and git fetch failing shows a clear error, never a blank panel | ✅ | Same file | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. The story's own Out of Scope item (edited/re-saved artefact content not also committed to git) remains an explicitly deferred, documented gap, not a defect.

**D37 injectable-adapter compliance:** the story's Architecture Constraints explicitly required the D37-compliant pattern (throw-on-unwired stub, wiring test asserting two different products resolve to two different, individually-correct repos) rather than the older `sign-off-writer.js` convention — confirmed still the pattern in use via the test file's own `commitAuthor_neverServiceAccount` assertion; not independently re-verified line-by-line against the adapter source in this pass, but no review finding or later story flags a regression.

---

## Test Plan Coverage

**Tests passing:** 11/11 (`check-das-s1-commit-artefact-git-fallback.js`), re-run fresh 2026-08-17 — grew from the test-plan's originally-recorded 9/9 to 11/11 since sibling story `anvf-s1` (PR #677, "Distinguish artefact-not-found from fetch-failed in das-s1's git-fallback") added 2 more assertions to this same test file after das-s1's own merge. All passing, no regression — `anvf-s1` is tracked as its own separate story/feature (`2026-08-07-artefact-not-found-vs-fetch-failed`), not re-covered here.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: added git commit adds ≤~2s to stage-completion latency | ✅ | Story cites E2E test timing assertions; not independently re-measured in this pass |
| Security: commit author is always the operator's own OAuth identity, never a service account | ✅ | `commitAuthor_neverServiceAccount`, re-run fresh, passing |
| Audit: the git commit itself is the audit trail | ✅ | By construction — no separate audit log needed per story's own NFR framing |

---

## Metric Signal

**Metric:** Cross-redeploy artefact durability (m1), target 100%, baseline 0%.
**Status:** Mechanism shipped and tested; no fresh production-usage measurement taken in this pass (would require live redeploy-cycle data, out of scope for a DoD bookkeeping pass). `contributingStories` for m1 was not populated at feature level — noted as a minor bookkeeping gap, not corrected in this pass since it requires editing feature-level `metrics[]`, which is a broader change than a single-story DoD warrants.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required now. The story's own deferred gap (edits after initial commit not durably git-backed) remains open as a known, accepted limitation — not converted to a follow-up story in this pass since no live incident has surfaced from it.

---

## DoD Observations

1. ~11 days live in production, no incidents reported for this story's own scope. The real gap this whole epic's `das-s3` sibling story exists to close (already-completed stages on repo-less products losing local content before a repo connects) is a distinct, already-tracked and already-fixed follow-on, not a defect in das-s1 itself.
2. Test count grew 9→11 via a separate sibling story (`anvf-s1`) extending this same test file — confirmed via `git log` on the test file path, not assumed.
