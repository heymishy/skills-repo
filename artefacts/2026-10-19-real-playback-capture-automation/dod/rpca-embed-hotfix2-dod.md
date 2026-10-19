# Definition of Done: rpca-embed-hotfix2 — embedScreenshotPaths matches on (storySlug, acId) together, not position

**PR:** https://github.com/heymishy/skills-repo/pull/1010 | **Merged:** 2026-10-19T18:27:08Z
**Type:** Short-track fix (CLAUDE.md "Short-track" process)
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-embed-hotfix2-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-embed-hotfix2-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A shot lands on its own story's section, not an earlier same-labelled one — `check-rpca-embed-hotfix2-story-scoped-matching.js` AC1 (synthetic 3-story fixture) | unit-synthetic | None |
| AC2 | ✅ | `generateWalkthroughMarkdown` emits a story marker before each heading — same file, AC2 | unit-synthetic | None |
| AC3 | ✅ | The pre-existing single-story `embedScreenshotPaths` test still passes via the fallback path — `check-fpd-s1-walkthrough-document-and-screenshots.js` re-run unchanged | regression | None |
| AC4 | ✅ | Regenerating the real `journey-cx-redesign` walkthrough places every screenshot under its own correct story's own correct AC heading — same file, AC4 (real DoD/benefit-metric/screenshot data for the real feature) | integration-real-data | See DoD Observations: the AC4 integration test itself initially had a bug in its own assertion, found and fixed before merge |

---

## Scope Deviations

None at merge time. **However:** this fix was itself later found, regenerating the real walkthrough after merge, to leave a separate, unrelated defect untouched — see DoD Observations below.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4 at merge (PR #1010 CI, after a benign `deploy-group` concurrency-lock re-run)

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new NFR surface; HTML-comment marker invisible in rendered markdown | ✅ | Marker is an HTML comment (`<!-- story: ... -->`); no change to the document's own visible heading or body text |

---

## Metric Signal

N/A — internal correctness fix to the real-playback-capture-automation mechanism's own document-generation step, not a new metric-contributing story.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

The fix correctly solves the problem it targeted: heading-matching is now scoped to `(storySlug, acId)` together, confirmed against both synthetic fixtures and the real `journey-cx-redesign` data. The deviation is a **separate, previously-undiscovered defect** in the same function that this fix did not touch (because it was out of this fix's own scope): the embedded image *path itself* (as opposed to which heading it lands under) was a bare basename with no story-directory prefix, making every embedded link broken for any multi-story feature. This was found immediately after this fix merged, while regenerating the real walkthrough as part of the session's "video demo" verification effort.

**Follow-up actions:** Fixed by `rpca-embed-hotfix3` (story-prefixed relative image path). No further action needed — hotfix3 is merged (PR #1011).

---

## DoD Observations

1. **During this fix's own development, the AC4 integration test initially failed for a reason unrelated to the production code**: the test's own assertion searched for each story's AC body text to locate its section boundary, but the newly-fixed `embedScreenshotPaths` inserts the image between the heading and that body text — so the search landed past the already-correctly-embedded image, producing a false negative. The production fix was correct on the first attempt; the test assertion was the bug. Diagnosed by tracing the exact pre- and post-embed markdown byte-for-byte rather than trusting the test's own failure message. `/improve` candidate: when a new test for a "where did X land in a generated document" question fails, verify whether the ASSERTION'S OWN section-boundary logic is sound (particularly: does it anchor on content that sits *before* or *after* the insertion point being tested?) before assuming the production code is wrong.
2. **A fix can be completely correct for its own stated scope and still leave a real, separate defect in the same function untouched.** This is not evidence of poor review — heading-matching and image-path construction are genuinely separable concerns — but it is a reminder that "I fixed the bug I found" is not the same claim as "this function is now fully correct." Both claims should be stated distinctly. See `rpca-embed-hotfix3`'s own DoD for the resolution.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-embed-hotfix2 (embedScreenshotPaths matches on (storySlug, acId) together, not position).
Check:
1. Does every AC row have a concrete evidence reference?
2. Is the "COMPLETE WITH DEVIATIONS" outcome fairly characterised given a separate defect (broken image paths) was found in the same function shortly after merge, but was genuinely out of this fix's own stated scope?
3. Does the DoD Observations section correctly distinguish "this fix's own test had a bug" (observation 1, found and fixed pre-merge) from "a separate production defect existed" (observation 2, fixed by hotfix3)?
4. Is the /improve candidate about test-assertion section-boundary logic a reasonable generalisable lesson?
Report findings as HIGH / MEDIUM / LOW.
```
