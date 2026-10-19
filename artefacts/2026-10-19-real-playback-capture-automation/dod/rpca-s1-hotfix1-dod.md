# Definition of Done: rpca-s1-hotfix1 — path-traversal guard on the capture CLI

**PR:** https://github.com/heymishy/skills-repo/pull/1003 | **Merged:** 2026-10-18T23:57:56Z
**Type:** Short-track fix (CLAUDE.md "Short-track" process)
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s1-hotfix1-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s1-hotfix1-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — a feature-slug argument containing `../` is rejected before any file write is attempted | ✅ | Unit test | unit test | None |
| AC2 — a legitimate feature-slug argument is unaffected — still resolves to the expected path | ✅ | Unit test | unit test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. Touched exactly the two files named in the DoR contract: `scripts/playback-capture.js` (modify) and `tests/check-rpca-s1-hotfix1-path-guard.js` (new).

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2
**Tests passing in CI:** 2 / 2; full regression suite 763/763 at merge

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): traversal attempt rejected | ✅ | ✅ | |
| AC2 (unit): legitimate slug unaffected | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Input validation (path-traversal guard, matches `web-ui-patterns.md` convention) | ✅ | AC1/AC2 tests; this fix exists specifically to close this NFR for `rpca-s1` |

---

## Metric Signal

N/A — this is an internal hardening fix to a CLI only the operator invokes, not a feature carrying `rpca-s1`'s own M1/M2 metrics itself. No new metric signal applies here; it strengthens `rpca-s1`'s own NFR posture (see `rpca-s1-dod.md`).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. Also found and resolved during this story's own first CI run: `Scenario A E2E (staging)` was cancelled (not failed) due to a `deploy-group` concurrency-lock pre-emption, a benign repo-wide infra contention (only one staging-dependent E2E job runs at a time). Re-ran via `gh run rerun --failed`; both staging scenarios passed clean on re-run (2m39s, 2m29s). No code change required.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-s1-hotfix1 (path-traversal guard on the capture CLI).
Check:
1. Does every AC row have a concrete evidence reference?
2. Is this short-track fix's scope strictly limited to the guard itself, with no unrelated changes?
3. Is the outcome verdict consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
