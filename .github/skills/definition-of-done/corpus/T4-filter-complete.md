# Corpus Case T4 — Dashboard date filter: genuinely complete

## Case metadata

```json
{
  "case_id": "T4",
  "label": "Dashboard date range filter — genuinely complete (all checks pass)",
  "difficulty": "baseline",
  "expected_verdict": "COMPLETE",
  "expected_gap": null,
  "adversarial_pattern": "This is the baseline case: everything is correct. All 4 ACs are verified with named tests. No out-of-scope implementation. NFR evidenced by a named performance test. Metric signal captured. The trap for a model here is over-triggering — adding false deviations or warnings that do not apply. A correct model produces a clean COMPLETE verdict with no invented gaps. A model that reflexively hedges or adds phantom warnings fails D5 and inflates D2.",
  "failure_modes_to_watch": [
    "Phantom deviation: model invents an out-of-scope item not present in the PR",
    "NFR hedge: model questions performance evidence even though a specific test result is cited",
    "Verdict COMPLETE WITH DEVIATIONS when verdict should be COMPLETE",
    "Metric step skipped: D4 docked for not assessing the metric signal"
  ]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #238 has been merged.

---

### Story artefact

**Story ID:** dash.6
**Feature:** Analytics Dashboard
**Epic:** Reporting and Filtering

---

## Story: Dashboard date range filter

**As a** dashboard user,
**I want** to filter the metrics view by a custom date range (start date, end date),
**So that** I can analyse data for a specific period without being limited to preset time windows.

## Acceptance Criteria

**AC1:** Given I am on the dashboard, when I select a start date and end date using the date picker and click Apply, then all metrics panels update to show data for the selected range only, and the active filter is displayed in the filter bar as "From [start] to [end]".

**AC2:** Given I select a start date that is after the end date, when I click Apply, then an inline validation error appears: "Start date must be before end date" and no filter is applied.

**AC3:** Given I have applied a custom date filter, when I click Reset, then the filter reverts to the default view (last 30 days) and all metrics panels refresh.

**AC4:** Given the date range filter is applied, when the page is refreshed, then the selected date range is preserved in the URL as query parameters (`?from=YYYY-MM-DD&to=YYYY-MM-DD`) and the filter is reapplied on page load.

## Out of Scope

- Preset date range shortcuts (Last 7 days, Last 90 days, etc.) — deferred to dash.7.
- Saved/named date filters — deferred to dash.8.
- Date range comparison (current period vs prior period) — deferred to dash.9.
- Export filtered data to CSV — deferred to export epic.

## NFRs

**NFR-1:** Applying the date filter must complete (metrics panels updated) within 2 seconds for date ranges up to 12 months. Measured as time from Apply click to last panel render complete.

## Complexity

Complexity: 1 (well understood; URL param sync is the only non-trivial element)

---

### Test plan summary

**Test plan artefact:** artefacts/analytics-dashboard/test-plans/dash.6-test-plan.md

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 | T1: filter applied shows correct range in all panels; T2: filter bar shows "From X to Y" label | Full | — |
| AC2 | T3: inverted date range shows validation error; T4: invalid range does not trigger API call | Full | — |
| AC3 | T5: Reset reverts to 30-day default; T6: panels refresh after reset | Full | — |
| AC4 | T7: URL params set on Apply; T8: page reload reapplies filter from params | Full | — |
| NFR-1 | T9: performance test — 12-month range filter completes in 1,340ms (Playwright timing) | Full | Measured in integration environment |

No test plan gaps.

---

### DoR artefact summary

**DoR artefact:** artefacts/analytics-dashboard/dor/dash.6-dor.md
**DoR verdict:** PROCEED
**Warnings acknowledged:** None
**Oversight level:** Low

---

### Metric context

**Feature metric:** M1 — Dashboard user engagement (weekly active dashboard sessions)
**dash.6 contribution:** Listed in M1 `contributingStories: ["dash.6"]`. The date filter is expected to increase session length by enabling exploration; M1 signal should be checked 2 weeks post-merge.

**Current M1 state:** `signal: "not-yet-measured"` — feature launched 2026-05-12; insufficient data for a weekly cohort signal yet.

---

### PR description — PR #238 (merged 2026-05-15)

```
## Summary
Implements dashboard date range filter (dash.6).

## Changes
- src/components/DateRangePicker.tsx — date picker component with validation
- src/components/FilterBar.tsx — updated to display active range label
- src/hooks/useDateFilter.ts — filter state + URL sync hook
- src/pages/Dashboard.tsx — wired DateRangePicker and filter reset button
- tests/DateRangePicker.test.tsx — T1–T9 (9 tests)

## Test results
9/9 tests pass. All ACs and NFR-1 verified. Performance test (T9): 12-month range filter completed in 1,340ms against the integration environment (target: ≤ 2,000ms).

## Notes
URL param sync (AC4) uses URLSearchParams API with pushState — no external routing library needed. Validation error (AC2) renders inline below the date picker, not as a toast, for better accessibility.
```

---

## Expected verdict

**Verdict:** COMPLETE

**Reason:** All 4 ACs are verified by named tests (T1–T8). NFR-1 is verified by T9 (1,340ms < 2,000ms target, measured in integration environment). No out-of-scope implementations — the PR only touches filter components and the date hook. M1 metric signal is "not-yet-measured" (feature launched 3 days ago, insufficient cohort data — this is correct and expected). No deviations, no gaps.

**What a correct model output looks like:**
> ✅ AC1 — Filter applied + bar label: T1+T2 pass
> ✅ AC2 — Validation error for inverted range: T3+T4 pass
> ✅ AC3 — Reset to 30-day default: T5+T6 pass
> ✅ AC4 — URL param sync + restore on reload: T7+T8 pass
>
> Scope check: No out-of-scope implementations detected. PR changes are limited to filter components and dashboard wiring.
>
> NFR-1 ✅ — Filter completes in 1,340ms (T9, integration environment) — within 2,000ms target.
>
> Metric M1 signal: not-yet-measured — feature launched 2026-05-12, insufficient data for weekly cohort. Expected measurement window: 2 weeks post-merge. No signal update required at this time.
>
> **Verdict: COMPLETE** ✅
> ACs satisfied: 4/4. Deviations: None. Test gaps: None.

**What a failing model output looks like (false negative / over-hedging):**
> AC4 ⚠️ — URL param sync: T7+T8 pass but using pushState may have browser compatibility concerns not tested.
> NFR-1 ⚠️ — 1,340ms is within target but no load test under concurrent users was run.
> **Verdict: COMPLETE WITH DEVIATIONS**

## Adversarial signal

The over-hedging failure mode is the risk here, not a false positive. The model must resist the temptation to invent qualifications. The performance test result is specific (1,340ms, integration environment) and well within the 2,000ms target — it does not need a load test caveat unless one is required by the story (it is not). The URL sync approach (pushState) is an implementation note, not a scope deviation. A model that adds phantom warnings to every COMPLETE verdict is not calibrated for gate use — it creates friction for passing stories.
