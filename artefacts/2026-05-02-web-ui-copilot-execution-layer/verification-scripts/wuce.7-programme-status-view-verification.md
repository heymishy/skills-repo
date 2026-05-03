# Verification Script: wuce.7 — Programme manager pipeline status view

**Story:** wuce.7-programme-status-view
**Test plan:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.7-programme-status-view-test-plan.md
**Run after:** implementation is complete on the feature branch

---

## Step 1 — Run test suite

```bash
cd <repo-root>
node tests/check-wuce7-programme-status-view.js
```

**Expected output:**
```
[wuce7-programme-status-view] 49 passed, 0 failed
```

**Fail condition:** any test fails → fix before proceeding.

---

## Step 2 — Verify fixture files exist

```bash
ls tests/fixtures/github/pipeline-state-feature.json
ls tests/fixtures/github/pipeline-state-done-feature.json
ls tests/fixtures/github/pipeline-state-trace-findings.json
ls tests/fixtures/github/pipeline-state-awaiting-dispatch.json
```

**Expected:** all four files present.

**Spot-check done-feature fixture:**
```bash
node -e "
const f = require('./tests/fixtures/github/pipeline-state-done-feature.json');
const allMerged = f.stories.every(s => s.prStatus === 'merged');
const allPassed = f.stories.every(s => s.traceStatus === 'passed');
console.log('all merged:', allMerged, '| all passed:', allPassed);
"
# Expected: all merged: true | all passed: true
```

---

## Step 3 — Manual AC2 verification (amber indicator + text label)

1. Start the server locally with a feature having `traceStatus: "has-findings"` in the mock data
2. Navigate to `/status`
3. **Expected:** the affected feature row shows:
   - A visible amber/yellow colour indicator
   - The text label **"Trace findings"** visible alongside the colour (not generic "blocked")
4. **Fail condition:** only colour change with no text label; or text says "blocked" rather than "Trace findings"

---

## Step 4 — Manual AC3 verification ("Awaiting implementation dispatch" label)

1. In the status board, find a feature with `dorStatus: "signed-off"` + `prStatus: "none"` in the mock data
2. **Expected:** feature row displays **"Awaiting implementation dispatch"** as the status label

---

## Step 5 — Manual AC4 verification (export as Markdown)

1. Navigate to `/status`
2. Click "Export as Markdown"
3. **Expected:** a `.md` file downloads with a pipeline status summary table
4. Open the downloaded file — verify it contains a markdown table with feature names and stages that can be pasted into a report

---

## Step 6 — Manual AC5 verification (Done group visually separated)

1. In the status board with both in-progress and done features
2. **Expected:** done features appear under a separate "Done" section/heading; visually distinct from in-progress features
3. The "Done" condition uses only `prStatus: "merged"` AND `traceStatus: "passed"` — verify no new fields were introduced by checking that only these two fields from existing stories drive the classification

---

## Step 7 — Accessibility spot check (WCAG 2.1 AA)

1. Navigate to `/status`
2. Tab through the status board using keyboard only
3. **Expected:** all feature rows reachable and activatable via keyboard; no keyboard traps
4. Use a screen reader or browser accessibility tree: verify each row has a readable label (not just colour class names)

---

## Step 8 — Full npm test (regression check)

```bash
npm test
```

**Expected:** all pre-existing tests pass; no new failures.

---

## AC verification checklist

| AC | Verified by | Status |
|---|---|---|
| AC1 | T1.1, IT1 | [ ] |
| AC2 | T2.1, T6.1, Manual Step 3 | [ ] |
| AC3 | T3.1, Manual Step 4 | [ ] |
| AC4 | T5.1–T5.3, IT2, Manual Step 5 | [ ] |
| AC5 | T4.1–T4.4, T6.2, Manual Step 6 | [ ] |
