# Definition of Done: rpca-s2-hotfix1 — anchor deriveSelectorFromSpec on the AC-specific inline mention

**PR:** https://github.com/heymishy/skills-repo/pull/1005 | **Merged:** 2026-10-19T03:38:37Z
**Type:** Short-track fix (CLAUDE.md "Short-track" process)
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s2-hotfix1-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s2-hotfix1-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-19

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 — a shared multi-AC header no longer collapses every AC to the same selector | ✅ | Unit test modelled on the real `jcx-s3-emotion-curve.spec.js` shape; also re-verified live against that exact real file (3 distinct correct selectors returned) and `jcx-s7-panel-entry-and-save-feedback.spec.js` | `integration-real-code` | None |
| AC2 — the existing single-AC-per-file convention still resolves correctly | ✅ | Unit test reads the real `fpd-s4-caption-sync.spec.js` file from disk, confirms the identical result as before the fix | `integration-real-code` | None |

---

## Scope Deviations

None. Touched exactly the two files named in the DoR contract.

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2
**Tests passing in CI:** 2 / 2; full regression suite 764/764 at merge

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Correctness of selector derivation across every real-world spec-file convention sampled at `/clarify` | ✅ | Re-verified against all 3 real spec files post-fix |

---

## Metric Signal

N/A — internal correctness fix to `rpca-s2`'s own mechanism, not a new metric-contributing story. Strengthens `rpca-s2`'s own M1/M2 linkage; no separate signal here.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

None beyond what's already recorded in `rpca-s2-dod.md`'s own DoD Observations (this hotfix's origin story).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-s2-hotfix1 (anchor deriveSelectorFromSpec on the AC-specific inline mention).
Check:
1. Does every AC row have a concrete evidence reference?
2. Is this short-track fix's scope strictly limited to the fix itself, with no unrelated changes?
3. Is the outcome verdict consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
