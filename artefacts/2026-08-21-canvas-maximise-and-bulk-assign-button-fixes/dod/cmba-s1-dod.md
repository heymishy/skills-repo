# Definition of Done: cmba-s1 — Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label

**PR:** https://github.com/heymishy/skills-repo/pull/752 | **Merged:** 2026-08-22T03:46:48Z
**Story:** `artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/stories/cmba-s1-fix-readonly-maximise-and-stuck-button-label.md`
**Test plan:** `artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/test-plans/cmba-s1-test-plan.md`
**Assessed by:** Claude (agent) — written retroactively on 2026-08-26, closing a bookkeeping gap: PR #752 merged 2026-08-22 but this DoD was never written and `pipeline-state.json` was left showing `prStatus: draft`/`dodStatus: not-started`.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `readOnlyRender_swToggleCanvasFs_isDefined`, `readOnlyRender_buttonMarkupCallsRealFunction` — fresh run on master 2026-08-26, 2/2 pass | Automated test | None |
| AC2 | ✅ | `readOnlyRender_swToggleArtefactFs_isDefined` — fresh run, pass | Automated test | None |
| AC3 | ✅ | `liveSessionRender_allThreeFunctionsAndLiveOnlyContent_stillPresent` (6 assertions: all 3 toggle functions, SSE-pump helper, Cmd/Ctrl+Enter handler, input form) — fresh run, pass | Automated test | None |
| AC4 | ✅ | `bmauAssignToModule_successHandler_resetsButtonLabel` — fresh run, pass; `check-bmau-s1-bulk-assign-checkbox-ui.js` (5/5) re-run clean, confirming no regression to the adjacent checkbox/selection logic this fix sits next to | Automated test | None |

**Test file:** `tests/check-cmba-s1-readonly-maximise-and-stuck-label.js` — 15/15 passing on a fresh run against current master (2026-08-26), 4 days and two unrelated feature merges (`fresc-s1`, `pncg-s1`) after this story's own merge, confirming no drift.

---

## Scope Deviations

None. Both fixes (chat-view.js's readOnly script-suppression split, products.js's bulk-assign success-handler reset) match the story's Architecture Constraints exactly — confirmed by the shared-mechanism test (`toggleMechanism_isSharedNotDuplicated_betweenArtefactAndCanvasMaximise` in `check-cdpl-s1-canvas-panel-layout-fix.js`, also re-run clean) which guards against a second, divergent fullscreen implementation being introduced.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (2 for AC1, 1 each for AC2/AC3/AC4 — AC3 covers 6 sub-assertions)
**Tests passing in CI:** 5/5 (part of PR #752's merged CI run) and re-confirmed fresh on 2026-08-26

**Gaps (tests not implemented):** None per the test plan's own "Test Gaps and Risks" section ("None").

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Story's own NFR section: "None identified — client-side script/DOM fixes only" |
| Security | ✅ N/A | Story's own NFR section: "None identified" |
| Accessibility | ✅ N/A | No `aria-label`/`title` changes — story's own NFR section confirms these were already correct pre-fix |
| Audit | ✅ N/A | Story's own NFR section: "None new" |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track gap-closure story with no formally tracked benefit metric (story's own Benefit Linkage: "None formally tracked") — closes two live-confirmed UI bugs found during retroactive DoD review of `cdpl-s1`/`bmau-s1`. |

---

## Outcome

**COMPLETE, WITH ONE OPEN FOLLOW-UP (not blocking)**

**Follow-up actions:**
1. **The verification script's 4 manual click-through scenarios (`cmba-s1-verification.md`) were never executed against a real deployed instance.** The story's own test plan required no manual/E2E coverage (all 4 ACs were fully satisfied by unit-level structural tests against the real rendering source), and `decisions.md`'s RISK-ACCEPT explicitly accepted proceeding without a pre-implementation review of this script — but the post-merge smoke test the same decision entry anticipated ("Scenarios 1, 2, and 4... are the complete post-merge smoke test") was also never run. AC1's bug was originally a *live, browser-confirmed* production error (`ReferenceError` seen twice in a real console) — the automated tests confirm the function is now defined and wired in the rendered HTML, but do not click a real button in a real browser. Recommend a quick live pass on skills-framework.fly.dev the next time an operator has a historical `/design` or `/definition` conversation open, or as part of the next Chrome-based verification session — low urgency given the fix mechanism is simple (removing a conditional that suppressed function definitions) and well-covered structurally.
2. `pipeline-state.json` bookkeeping was stale for this story (`prStatus: draft`, `dodStatus: not-started`, feature `stage: branch-setup`) despite PR #752 having merged 2026-08-22 — corrected as part of this DoD write (see commit).

---

## DoD Observations

1. **This is a retroactive DoD, written 4 days after merge.** No `/definition-of-done` run occurred immediately after PR #752 merged — the story sat at `branch-complete`/`prStatus: draft` in `pipeline-state.json` despite the PR being merged, the exact "short-track story never reaches DoD" gap this repo's own `CLAUDE.md` documents as a historical pattern (see the Short-track section, referencing `pcr-s1`/`stis-s1`/`tst-s1`/`jlc-s1`/`cfg-s1`). Found while surveying overall pipeline state for other stale bookkeeping, not through any dedicated audit — worth treating as a signal that this class of gap may still be recurring silently for other short-track stories beyond the five already documented.
