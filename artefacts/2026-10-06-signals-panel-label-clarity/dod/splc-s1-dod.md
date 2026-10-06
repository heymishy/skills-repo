# Definition of Done: Signals panel must not render redundant/meaningless source and type labels on every card

**PR:** [#947](https://github.com/heymishy/skills-repo/pull/947) | **Merged:** 2026-10-06
**Story:** artefacts/2026-10-06-signals-panel-label-clarity/stories/splc-s1-collapse-redundant-source-type-labels.md
**Test plan:** artefacts/2026-10-06-signals-panel-label-clarity/test-plans/splc-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-06-signals-panel-label-clarity/dor/splc-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `splc-s1 AC1: source/type collapse to a single label line when identical` (tests/check-ep2-s1-signals-panel.js) passing; confirmed live on `wuce-staging.fly.dev/signals` post-merge — every real parse-error card shows exactly one "parse-error" label, not two | `unit` → upgraded to `live-verified` | None |
| AC2 | ✅ | `splc-s1 AC2: source and type render combined on one line when they differ` passing; confirmed live on `wuce-staging.fly.dev/signals` post-merge — the real `pipeline-state`/`feature-status` card for this very feature renders "pipeline-state · feature-status" on one line | `unit` → upgraded to `live-verified` | None |
| AC3 | ✅ | `splc-s1 AC3: data-signal-type attribute unchanged for both collapsed and combined cases` passing; `sptu-s2`/`sptu-s3`/`sptu-s4`'s own pre-existing suites (33 tests, filter/sort/dismiss logic that all depend on this attribute) pass unmodified | `unit` + `integration-real-code` (route-dispatch tests in check-sptu-s4) | None |
| AC4 | ✅ | `tests/check-ep2-s1-signals-panel.js` (14/14), `check-sptu-s2-signals-filter.js` (12/12), `check-sptu-s3-signals-sort-visibility.js` (4/4), `check-sptu-s4-signals-dismiss.js` (17/17) all pass unmodified; full `npm test` (718 files) shows 2 pre-existing/unrelated failures only, confirmed identical on an unmodified master checkout before this story's branch point | `unit` + `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. The PR's final diff matches the story's stated scope exactly: `src/web-ui/views/signals-panel-view.js`'s `_signalItem()` function, plus its own test file. The story's Out of Scope items (label-mapping dictionary, `signals-aggregator.js` source/type renaming, the filter-compose behaviour) were not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3 (plus 11 pre-existing tests in the same file, 14/14 total)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| splc-s1 AC1: source/type collapse to a single label line when identical | ✅ | ✅ | |
| splc-s1 AC2: source and type render combined on one line when they differ | ✅ | ✅ | |
| splc-s1 AC3: data-signal-type attribute unchanged for both collapsed and combined cases | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (no new I/O, pure string concat) | ✅ | Code review — `_signalItem()` remains a pure function, no new loop or I/O added; `check-ep2-s1-signals-panel.js`'s existing `<100ms` render-budget NFR test still passes unmodified |
| Security (escHtml already applied, unchanged) | ✅ | Code review — `safeSource`/`safeType` are already-escaped values before this change; `Security: signal text is escaped via escHtml` test still passes unmodified |
| Accessibility (combined label remains readable text, not icon-only) | ✅ | AC1/AC2 unit tests assert on text content directly (`parse-error`, `pipeline-state · feature-status`), confirming the label stays as real DOM text |
| Audit | ✅ N/A | Story states no new loggable event; confirmed — no change to any logging call site |

---

## Metric Signal

No metrics tracked for this feature — short-track story, no `/benefit-metric` run (per the story's own Benefit Linkage section: direct benefit stated inline, not a formally tracked metric).

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | No metric defined for this short-track fix |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- None blocking. Three related-but-separate gaps were found during this story's own delivery and are tracked in `workspace/state.json`'s `pendingActions` and `workspace/learnings.md`, not as follow-ups to this specific story: (1) `signals-aggregator.js`'s `reference/` parser EISDIR bug on subdirectories, (2) the `/improve`-defaults-to-Haiku model-routing gap with no skill-specific eval evidence, (3) `check-workspace-state.js`'s own stale hardcoded-`discovery`-key schema assumption (see DoD Observations below).

---

## DoD Observations

1. **CI failure traced to a stale, unrelated governance test, not this story's own diff.** PR #947's only CI failure (`tests/check-workspace-state.js`) was caused by a hardcoded single-phase `cycle.discovery` schema assumption (from story `p1.5`, this repo's earliest `workspace/state.json` design) that no longer matches current per-feature-narrative practice. Confirmed pre-existing and unrelated by reproducing the identical failure against an unmodified master checkout before branching. Root-caused rather than allowlisted: an attempt to add the failure to `tests/known-baseline-failures.json` (this repo's own sanctioned mechanism for exactly this situation) was blocked by the permission classifier as a potential CI bypass, and the operator chose instead to backfill `workspace/state.json`'s `cycle.discovery` with truthful data (the most recently approved real discovery in this repo's history) rather than fabricate values or allowlist the gap. `/improve` candidate: `check-workspace-state.js`'s own hardcoded-`discovery`-key assumption is now a confirmed stale-schema gap and should be opened as its own short-track story.
2. **A self-inflicted merge conflict, caused by editing the same file on two different checkouts without resyncing.** This story's own `workspace/state.json` fix (committed on `feature/splc-s1`) and a separate, unrelated end-of-session checkpoint (a full rewrite of `workspace/state.json`, committed directly to `master`) both landed in the same session without the feature branch being rebased in between — producing a real merge conflict on PR #947 that had to be resolved before merge. Resolved cleanly by taking master's version (which already carried an equivalent `cycle.discovery` backfill). `/improve` candidate: when a bookkeeping file (`workspace/state.json`, `workspace/learnings.md`) is being actively edited on an open feature branch, avoid a separate full-rewrite commit to the same file directly on master until that branch merges — or merge `master` into the branch immediately after any such master-side bookkeeping write.
3. **A browser-automation false positive was caught and retracted before it could scope-creep into this story.** During DoR investigation, a Claude-in-Chrome ref-based click on a filter-toggle link appeared not to navigate; a screenshot was misread as an "active" filtered state (actually the `parse-error` cards' own permanent styling, which also happens to sort to the top). This was initially reported to the operator as a real filter-compose bug. Re-tested via direct `window.location.href` checks before being included in this story's scope — confirmed no bug exists. Logged in `decisions.md` and `workspace/capture-log.md` as a retraction. `/improve` candidate: when a navigation's success is load-bearing for a finding, verify via `javascript_tool`'s `window.location.href` rather than trusting the browser-automation tool's own click/URL-reporting metadata, which can lag the real DOM.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Signals panel must not render redundant/meaningless source and type labels on every card" (splc-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
