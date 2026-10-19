# Definition of Done: rpca-embed-hotfix3 — embedScreenshotPaths writes a story-prefixed relative image path

**PR:** https://github.com/heymishy/skills-repo/pull/1011 | **Merged:** 2026-10-19T18:45:41Z
**Type:** Short-track fix (CLAUDE.md "Short-track" process)
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-embed-hotfix3-test-plan.md
**DoR artefact:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-embed-hotfix3-dor.md
**Assessed by:** Claude Sonnet 5 (session)
**Date:** 2026-10-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `embedScreenshotPaths` writes a story-prefixed relative path, not a bare basename — `check-rpca-embed-hotfix3-story-prefixed-image-path.js` AC1 | unit-synthetic | None |
| AC2 | ✅ | Two stories sharing an identical screenshot basename each get their own, distinctly-resolvable path — same file, AC2 | unit-synthetic | None |
| AC3 | ✅ | Regenerating the real `journey-cx-redesign` walkthrough produces image links that actually resolve to real files on disk — same file, AC3 (parses every embedded link and `fs.existsSync`s each one against the real directory tree; zero broken links, down from 11/11 broken pre-fix) | integration-real-data | None |
| AC4 | ✅ | Pre-existing tests' own positive path assertions corrected and still pass — `check-fpd-s1-walkthrough-document-and-screenshots.js` AC3 and `check-rpca-embed-hotfix1-cross-story-ac-collision.js` AC1 updated; `check-rpca-embed-hotfix2-story-scoped-matching.js` needed no change (its own assertions were loose substring checks that remained valid) | regression | None |

---

## Scope Deviations

None. Touched exactly the files named in the DoR contract, plus the two pre-existing tests whose own positive assertions had enshrined the broken path as "expected" (named explicitly in the DoR's own touch points).

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 8 checks passing at merge (PR #1011), including both staging E2E scenarios on the first run — no `deploy-group` concurrency-lock re-run needed this time.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new NFR surface; path-format change confined to the markdown's own embedded link text | ✅ | No change to what is captured, stored, or to any other function's own signature |

---

## Metric Signal

N/A — internal correctness fix to the real-playback-capture-automation mechanism's own document-generation step, not a new metric-contributing story.

---

## Outcome

**COMPLETE**

This is the third and, as far as this session's own end-to-end verification can confirm, final defect found in `embedScreenshotPaths` this session. After this fix, the real `journey-cx-redesign` walkthrough was regenerated and independently re-verified: all 11 embedded screenshots resolve to real files on disk and each lands under its own correct story's own correct AC heading (`artefacts/2026-10-11-journey-cx-redesign/playback/walkthrough.md`, committed `55e1c45b`).

**Follow-up actions:** None identified. The mechanism has now been exercised end-to-end against real, already-committed multi-story data and found correct on all three dimensions checked (no duplication, correct story attribution, resolvable links).

---

## DoD Observations

1. **This was the third bug found in the same ~250-line function within one session, each only surfaced by actually running the full mechanism against real data rather than trusting isolated unit tests.** Bug 1 (hotfix1): duplicate pile-up on cross-story AC-id collision. Bug 2 (hotfix2): correct heading count but wrong story attribution. Bug 3 (hotfix3): correct story attribution but unresolvable image paths. Each prior fix's own test suite passed cleanly while the next bug remained latent — because each test suite, reasonably, only modelled the dimension its own fix targeted. `/improve` candidate (generalising the one logged in `rpca-embed-hotfix1-dod.md`): for any shared document-generation function, a single comprehensive "does the fully-generated artefact survive a real render" integration test (here: `fs.existsSync` on every parsed link, confirmed exactly once by `rpca-s2-hotfix1`'s own origin story `rpca-s2` test gap, repeated for `rpca-embed-hotfix3`'s own AC3) should be written FIRST, before incremental fixes, so each subsequent fix is checked against all previously-known failure modes simultaneously rather than only the one it targets.
2. This chain of three hotfixes, plus the original `journey-cx-redesign` evidence-contamination correction found earlier in the same session (see that feature's own `decisions.md`), together represent a broader pattern: this repo's playback/evidence-capture tooling had never been exercised end-to-end against real, multi-story production data before this session, despite being unit-tested and reviewed at every prior stage. Recommended as a standing `/improve` candidate for the skills pipeline itself: a "run it for real against one already-shipped multi-story feature" integration pass should be a standard exit gate for any new shared tooling, not an optional nice-to-have discovered later by accident.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rpca-embed-hotfix3 (embedScreenshotPaths writes a story-prefixed relative image path).
Check:
1. Does every AC row have a concrete evidence reference?
2. Is the claim that this is the "final" bug in embedScreenshotPaths adequately hedged ("as far as this session's own end-to-end verification can confirm") rather than overstated?
3. Is the three-bug chain (hotfix1 -> hotfix2 -> hotfix3) accurately and non-redundantly summarised across all three DoD files, with each file's own DoD Observations pointing forward/backward correctly rather than re-explaining the whole chain each time?
4. Is the broader /improve candidate (a standing "run it for real" exit gate for new shared tooling) a reasonable generalisation, or does it overreach from three bugs in one function to a pipeline-wide process claim?
Report findings as HIGH / MEDIUM / LOW.
```
