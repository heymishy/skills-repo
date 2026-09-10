# Definition of Done: Collapse the always-expanded "Ref docs" context manifest into a single summary indicator

**PR:** [#856](https://github.com/heymishy/skills-repo/pull/856) | **Merged:** 2026-09-10 (merge commit `515ec909`)
**Story:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s1-collapse-context-manifest.md
**Test plan:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s1-dor.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Collapsed by default: `<details id="context-manifest">` with no `open` attribute; summary reflects file count | `tests/check-wnl-s1-context-manifest-collapse.js` T1 | None |
| AC2 | ✅ | Expand reveals unchanged chips: expanded body contains the identical, unmodified `chip-ok`/`chip-warn` markup | T3 | None |
| AC3 | ✅ | Reversible toggle: native `<details>`/`<summary>` element used, no custom JS toggle state | T4 (structural — native browser semantics, not implementation logic, per test plan's own gap-typing) | None |
| AC4 | ✅ | Warning cue visible without expanding: collapsed summary shows "Context loaded (4 of 5 files) ⚠" when any file is missing; no warning cue when all loaded | T5, T6 | None |
| AC5 | ✅ | Regression — per-file markup byte-for-byte unchanged: `chip-ok`/`chip-warn` classes, `escHtml()`-escaped basenames, ✓/⚠ symbols all unchanged; existing `tests/check-iwu1-context-manifest.js` suite (8 unit + 1 integration test) still passes unmodified | T7, `check-iwu1-context-manifest.js` (19/19 passing on merged master) | None |
| AC6 | ✅ | Keyboard-accessible toggle: native `<details>`/`<summary>` — Tab + Enter/Space focus/activate by default, no custom keyboard handling added | T4 (no `onclick`, no custom script) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The change is scoped exactly to `buildContextManifestHtml()` (`src/web-ui/routes/skills.js`) — no change to which files are loaded, no change to `missing`/`warn` detection logic, no persistent collapse-state preference (all explicitly out of scope in the story and confirmed absent in the merged diff).

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 21 / 21 (unit suite expanded beyond the 8 named test-plan cases to cover additional edge fixtures under the same 7 AC-mapped test groups; all pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| collapsed-by-default-all-loaded (T1) | ✅ | ✅ | |
| collapsed-summary-reflects-exact-file-count (T2) | ✅ | ✅ | |
| expand-reveals-unchanged-chip-list (T3) | ✅ | ✅ | |
| native-details-element-present-not-custom-js (T4) | ✅ | ✅ | |
| warning-cue-visible-without-expanding (T5) | ✅ | ✅ | |
| warning-cue-absent-when-all-loaded (T6) | ✅ | ✅ | |
| per-file-markup-regression-guard (T7) | ✅ | ✅ | |
| iwu1-existing-suite-still-passes | ✅ | ✅ | `tests/check-iwu1-context-manifest.js`, 19/19 passing on merged master |

**Gaps (tests not implemented):** None.

**Mandatory route/handler E2E coverage check (verify-completion):** `tests/e2e/iwu2-right-panel-layout.spec.js` (7 tests) fails identically at the pre-fix baseline commit (`ef9bc0ff`) — confirmed pre-existing and unrelated to this story (RISK-ACCEPT logged in `decisions.md`, 2026-09-10). Full baseline `npm test` on the `wnl-s1` worktree: 633 files run, 1 failed (`tests/check-p3.5-validate-trace.js`, known pre-existing failure documented across every story this session).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No new-request overhead (Performance) | ✅ | CSS/markup-only change (native `<details>`/`<summary>`), no new network requests — confirmed by code review of the merged diff |
| Security (existing `escHtml()` reused unchanged) | ✅ | AC5 regression guard confirms escaping unchanged; no new user input surface |
| Accessibility (keyboard operability, no colour-only status) | ✅ | AC6 (native keyboard semantics), AC4 (non-colour warning cue: ⚠ symbol + text, not colour alone) |
| Data residency / Availability / Compliance | ✅ Not applicable | No new data storage or movement; additive UI change to already-live infrastructure; no regulated data |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Time-to-orientation after returning to a long-running session | ✅ (target: under 3s, 0 scroll actions) | Not yet — requires real return-to-session usage data post-ship; no session-analytics instrumentation exists yet to auto-capture this | Signal: `not-yet-measured`. Evidence note: feature just shipped (merged 2026-09-10); no real user return-to-session events have occurred since merge to measure against. |

**Recorded in pipeline-state.json:** `metrics[0].signal = "not-yet-measured"`, `evidence = "wnl-s1 shipped 2026-09-10; no real return-to-session usage data yet"`, `lastMeasured = null`. `contributingStories` for `m1` updated to include `wnl-s1`.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. Revisit M1's signal once real session-return usage data accumulates post-ship (no fixed timeline — this repo has no session-analytics auto-capture, so this requires a manual operator check-in, e.g. at the next `/improve` run).

---

## DoD Observations

1. This story's `pipeline-state.json` bookkeeping went through an unusually involved recovery path this session: the dispatched implementer fork's own bookkeeping stalled at `stage: "implementation-plan"` despite real, independently-verified work completing; corrected on master directly (`46d36f15`), which then required resolving real merge conflicts against the branch's stale copy (`f081c4ee`) before the PR could merge cleanly. Logged as an `/improve` candidate in `workspace/capture-log.md` — epic-nested story state bookkeeping (cdg.6) needs a tighter loop when a branch and master diverge on the same story block mid-session.
2. No NFR gaps or guardrail entries were absent at delivery time — the feature-level NFR profile fully covered this story at DoR sign-off.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Collapse the always-expanded Ref docs context manifest into a single summary indicator" (wnl-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
