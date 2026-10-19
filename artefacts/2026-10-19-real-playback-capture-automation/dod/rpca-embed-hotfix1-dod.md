# Definition of Done: rpca-embed-hotfix1 — embedScreenshotPaths scopes matches per story, not globally by AC id

**PR:** https://github.com/heymishy/skills-repo/pull/1009 | **Merged:** 2026-10-19T17:28:57.006Z
**Type:** Short-track fix (CLAUDE.md "Short-track" process)
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-embed-hotfix1-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-embed-hotfix1-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Two stories sharing an AC id each get their own screenshot, no duplicate pile-up on the first matching heading — `check-rpca-embed-hotfix1-cross-story-ac-collision.js` AC1 (image-count-per-section assertions) | unit-synthetic | None |
| AC2 | ✅ | The pre-existing single-story `embedScreenshotPaths` test still passes — `check-fpd-s1-walkthrough-document-and-screenshots.js` re-run unchanged | regression | None |

---

## Scope Deviations

None at merge time. **However:** this fix was later found, by this same session immediately after merging and running `/feature-playback` for real against `journey-cx-redesign`, to be itself insufficient — see DoD Observations below.

---

## Test Plan Coverage

**Tests from plan implemented:** 2 / 2
**Tests passing in CI:** 2 / 2 at merge (PR #1009 CI, after a benign `deploy-group` concurrency-lock re-run)

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No visible/behavioural change to the document's own human-readable content | ✅ | Cursor is a purely internal matching mechanism; no change to heading or body text |

---

## Metric Signal

N/A — internal correctness fix to the real-playback-capture-automation mechanism's own document-generation step, not a new metric-contributing story.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

The fix satisfied both its own written ACs and merged cleanly. The deviation is not a scope deviation but a **correctness gap discovered after merge**: the cursor-based approach prevents duplicate pile-up (its stated goal) but does not guarantee correct story attribution when the `shots` array only covers a subset of stories — the realistic calling pattern. A shot can still match an earlier, unrelated story's own same-labelled heading that the cursor hasn't reached yet. This was found by this same session, unprompted, immediately after merging, by actually regenerating the real `journey-cx-redesign` walkthrough rather than relying on the synthetic test fixtures alone.

**Follow-up actions:** Fixed properly by `rpca-embed-hotfix2` (story-scoped `(storySlug, acId)` matching via an invisible heading marker). No further action needed — hotfix2 is merged (PR #1010).

---

## DoD Observations

1. **A test passing in isolation does not prove the mechanism is correct end-to-end.** Both this fix's own unit tests (AC1 synthetic fixture, AC2 regression) passed cleanly, and the PR merged with a clean CI run — but the fix was still wrong for realistic multi-story input. The gap was only found by actually running the full `/feature-playback` pipeline against real data, not by writing more synthetic unit tests. `/improve` candidate: short-track fixes to shared document-generation logic should include at least one integration test against real, already-committed multi-story data where one exists, not only synthetic fixtures modelling the bug being fixed — synthetic fixtures tend to only model the *exact* collision already found, not the next one.
2. This gap, once found, was disclosed transparently rather than left as a silent "fixed" claim — see `rpca-embed-hotfix2`'s own DoD and test-plan for the full trace of how the second bug was located and fixed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-embed-hotfix1 (embedScreenshotPaths scopes matches per story, not globally by AC id).
Check:
1. Does every AC row have a concrete evidence reference?
2. Is the "COMPLETE WITH DEVIATIONS" outcome fairly characterised given the fix was found insufficient shortly after merge?
3. Does the DoD Observations section correctly point to rpca-embed-hotfix2 as the real fix, without re-litigating it here?
4. Is the /improve candidate (integration test against real multi-story data for shared document-generation logic) a reasonable generalisable lesson?
Report findings as HIGH / MEDIUM / LOW.
```
