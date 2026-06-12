# Definition of Done — dash.6: Dashboard date range filter

**Evaluated:** 2026-05-15
**PR:** #238 (merged)
**Oversight level:** Low
**DoD verdict:** ✅ PASS

---

## Evaluation summary

All DoD gates checked below. No blockers found. Two observations raised for the record.

---

## Gate-by-gate assessment

### 1. Acceptance criteria coverage

| AC | Required | Test(s) | Status |
|----|----------|---------|--------|
| AC1 | Filter applied; all panels update; filter bar shows "From X to Y" | T1, T2 | ✅ |
| AC2 | Validation error on inverted range; no filter applied | T3, T4 | ✅ |
| AC3 | Reset reverts to 30-day default; panels refresh | T5, T6 | ✅ |
| AC4 | URL params set on Apply; filter reapplied on reload | T7, T8 | ✅ |

All four ACs have explicit, named tests. Test plan records full coverage with no gaps. The PR test results confirm 9/9 pass.

**Verdict: ✅ Pass**

---

### 2. NFR coverage

| NFR | Target | Measured | Environment | Status |
|-----|--------|----------|-------------|--------|
| NFR-1 | ≤ 2,000ms (Apply click → last panel render) | 1,340ms | Integration (Playwright) | ✅ |

Result is 33% under target, providing reasonable headroom. Measurement method (Playwright timing against integration environment) is consistent with what was specified in the NFR.

**One observation noted** — see Observations section.

**Verdict: ✅ Pass**

---

### 3. Out-of-scope hygiene

The four deferred items (preset shortcuts, saved filters, comparison, CSV export) are assigned to named downstream stories/epics. Nothing in the PR description or changed files suggests any deferred scope was partially implemented.

**Verdict: ✅ Pass**

---

### 4. PR and code completeness

| Check | Detail | Status |
|-------|--------|--------|
| All ACs traceable to code | DateRangePicker, FilterBar, useDateFilter, Dashboard all present and wired | ✅ |
| Tests colocated with code | `tests/DateRangePicker.test.tsx` covers T1–T9 | ✅ |
| No external routing dependency introduced | AC4 implemented via URLSearchParams + pushState — noted in PR | ✅ |
| Accessibility consideration noted | Validation error (AC2) rendered inline, not as toast — noted in PR | ✅ |
| PR merged to correct target | PR #238 merged 2026-05-15 | ✅ |

**Verdict: ✅ Pass**

---

### 5. DoR pre-conditions

DoR verdict was PROCEED with no warnings and low oversight level. No pre-conditions were left open at sprint entry.

**Verdict: ✅ Pass**

---

### 6. Metric instrumentation

| Check | Detail | Status |
|-------|--------|--------|
| Contributing story registered | dash.6 listed in M1 `contributingStories` | ✅ |
| Signal not yet actionable | `signal: "not-yet-measured"`; feature launched 2026-05-12; < 1 week of data | ✅ (expected) |
| Review trigger documented | M1 check scheduled 2 weeks post-merge | ✅ |

M1 is not a DoD gate for this story — the signal check is a post-merge activity. Current "not-yet-measured" state is correct given the launch date.

**Verdict: ✅ Pass**

---

## Observations

These are not blockers. Raised for the team's awareness.

**OBS-1 — NFR-1 measured in integration only**
T9 was run against the integration environment, which is appropriate for a repeatable baseline. If production infrastructure differs materially (e.g., different API response times, CDN configuration), the 1,340ms result may not fully predict production behaviour. Consider running a production canary timing check once sufficient users are active, or confirming that integration is benchmarked to be representative of production for this type of query. Low risk given the 660ms headroom against the 2,000ms target.

**OBS-2 — M1 review reminder**
The 2-week post-merge M1 signal check falls approximately on **2026-05-29**. Recommend adding this to the team's sprint review or monitoring checklist to ensure it is not missed. If M1 remains `not-yet-measured` past that date, it may indicate an instrumentation gap rather than a data lag.

---

## Final verdict

```
DoD verdict: ✅ PASS
Blocker count: 0
Observation count: 2 (non-blocking)
Story status: DONE
```

dash.6 satisfies all acceptance criteria, the NFR, out-of-scope boundaries, and metric instrumentation requirements. The story is closed as done. Observations OBS-1 and OBS-2 are recommended for team follow-up but do not affect done status.