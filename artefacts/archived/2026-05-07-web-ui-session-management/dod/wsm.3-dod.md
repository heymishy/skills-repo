# Definition of Done: Non-happy path navigation

**PR:** https://github.com/heymishy/skills-repo/pull/338 | **Merged:** 2026-05-08
**Story:** artefacts/archived/2026-05-07-web-ui-session-management/stories/wsm.3-non-happy-path.md
**Test plan:** artefacts/archived/2026-05-07-web-ui-session-management/test-plans/wsm.3-test-plan.md
**DoR artefact:** artefacts/archived/2026-05-07-web-ui-session-management/dor/wsm.3-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

**Note:** as with `wsm.2`, `pipeline-state.json` referenced a `dodArtefact` path that does not exist on disk (checked both current and `archived/` locations). Fresh write-up for this pass.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1/breadcrumb (`stages` array missing at original merge) | ✅ (fixed by `wsm.4`) | `check-wsm3-non-happy-path.js` re-run fresh 2026-08-17: T1b/T1c/T1d/T1e all pass | Automated test, re-run fresh 2026-08-17 | Fixed 2 days after this story's own merge |
| AC6/session-boundary marker (not injected at original merge) | ✅ (fixed by `wsm.4`) | Same file: T6b/T6c/T6d/T6e all pass | Automated test, re-run fresh 2026-08-17 | Fixed 2 days after this story's own merge |
| Full suite | ✅ | 38/38 assertions pass, including this story's own stage-commit and restore-flow coverage (T7/T8 blocks) | Automated test, re-run fresh 2026-08-17 | None |

---

## Scope Deviations

**Historical:** at original merge (2026-05-08), 8 assertions failed (`stages` array missing for breadcrumb navigation, AC1; session-boundary marker not injected, AC6) — a follow-up story was correctly flagged as required.

**Resolution — fully confirmed in this pass:** `wsm.4` (PR #339, merged 2026-05-10) directly named and fixed all 8 of these exact assertions (T1b/T1c/T1d/T1e, T6b/T6c/T6d/T6e) via the same single-defect fix (duplicate `handleGetJourneyState` handler removal). **Unlike `wsm.2`, this story shows NO remaining regression** — the full 38/38 test suite passes cleanly today, over 3 months after the fix.

**Historical significance:** this story's own PR (#338) is the origin of this repo's `CLAUDE.md` D40 conflict-marker-verification rule — a stacked-PR cherry-pick rebase left a trailing `>>>>>>> 86b5fec` conflict marker in `journey.js`, producing a `SyntaxError` that masked all AC evidence (zero tests could even run, not a failing assertion). That incident is unrelated to this story's own functional content — it was a mechanical git-conflict-resolution mistake, fixed at the time, and the D40 rule now exists specifically to prevent recurrence repo-wide.

---

## Test Plan Coverage

**Tests passing in CI:** 38/38, re-run fresh 2026-08-17. Fully clean.
**Gaps:** None remaining.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

No formal benefit-metric artefact traced for this feature. No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. This story's original deviations are genuinely, fully resolved.

---

## DoD Observations

1. **`pipeline-state.json`'s `dodStatus: "complete-with-deviations"` and `releaseReady: false` were stale** — the actual underlying deviations were fixed by `wsm.4` over 3 months ago, but the state was never updated to reflect that. This DoD pass corrects it to `dodStatus: "complete"`, `releaseReady: true`.
2. Contrast with `wsm.2` (sibling story, same original defect, same fix) — `wsm.2` has since hit a *different*, already-documented regression (404s, not the original shape-mismatch); `wsm.3` has not. Both stories needed individual re-verification rather than assuming identical outcomes just because they shared a root cause and a fix.
