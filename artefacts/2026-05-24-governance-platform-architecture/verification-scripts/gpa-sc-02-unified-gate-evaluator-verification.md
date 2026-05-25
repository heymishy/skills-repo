# Verification Script: SC-02 — Refactor assurance gate to unified gate evaluator

**Story:** `gpa-sc-02-unified-gate-evaluator`
**Feature:** `2026-05-24-governance-platform-architecture`
**Date:** 2026-05-24

---

## Pre-verification — ensure SC-06 is merged

```powershell
node -e "const s=require('./.github/pipeline-state.json'); const f=s.features.find(f=>f.slug==='2026-05-24-governance-platform-architecture'); const sc06=f.stories.find(st=>(st.id||st.slug)==='gpa-sc-06'); console.log('SC-06 prStatus:', sc06.prStatus)"
# Expected: SC-06 prStatus: merged
```

If SC-06 is not merged, stop — the Wave 3 gate has not been satisfied.

---

## Step 1 — Run the SC-02 test suite

```powershell
node tests/check-gpa-sc02-unified-gate-evaluator.js
```

**Expected output (all 9 tests pass):**
```
[gpa-sc02] SC-02: Refactor assurance gate to unified gate evaluator
  ✓ T1: evaluateGate structural gate all-pass returns { passed: true, findings: [] }
  ✓ T2: evaluateGate structural gate one-fail returns { passed: false, findings: [reason] }
  ✓ T3: evaluateGate structural gate multiple-fail collects all reason strings
  ✓ T4: run-assurance-gate.js references governance-package
  ✓ T5: run-assurance-gate.js calls evaluateGate with structural gate
  ✓ T6: run-assurance-gate.js has try/catch guard around governance-package require
  ✓ IT1: evaluateGateRunner hook is called when provided in ctx
  ✓ IT2: evaluateGateRunner receives correct gate args with all 4 check names
  ✓ IT3: verdict derived from evaluateGateRunner return, not inline checks.every
[gpa-sc02] Results: 9 passed, 0 failed
```

---

## Step 2 — Full npm test suite (AC5 regression check)

```powershell
npm test
```

**Expected:** All tests pass, exit code 0.

---

## Step 3 — AC1: evaluateGate called with structural gate (source confirmation)

```powershell
Select-String -Path ".github\scripts\run-assurance-gate.js" -Pattern "evaluateGate"
Select-String -Path ".github\scripts\run-assurance-gate.js" -Pattern "structural"
Select-String -Path ".github\scripts\run-assurance-gate.js" -Pattern "governance-package"
```

**Expected:** All three patterns match at least once in the file.

---

## Step 4 — AC4: No independent verdict derivation in runGate (source check)

```powershell
Select-String -Path ".github\scripts\run-assurance-gate.js" -Pattern "checks\.every"
```

**Expected:** The match, if it exists, appears only inside the fallback/degradation code path, not as the primary verdict derivation in `runGate`. (After SC-02, the primary verdict comes from `evaluateGate`; `checks.every` is only in the graceful degradation fallback, if present.)

---

## Step 5 — NFR: try/catch guards governance-package require

```powershell
Select-String -Path ".github\scripts\run-assurance-gate.js" -Pattern "try" -Context 0,5 | Where-Object { $_.Line -match "try" } | Select-Object -First 3
```

**Expected:** A `try` block appears near the `governance-package` require statement, confirming the graceful degradation guard is present.

---

## Step 6 — AC2: Functional equivalence with real root

```powershell
node -e "
const path = require('path');
const gate = require('./.github/scripts/run-assurance-gate');
const os   = require('os');
const fs   = require('fs');
const tmp  = fs.mkdtempSync(require('path').join(os.tmpdir(), 'sc02-verify-'));
const root = path.join(__dirname);
const result = gate.runGate({ trigger: 'manual', prRef: '', commitSha: '', tracesDir: tmp, root: root });
console.log('verdict:', result.verdict);
console.log('checks:', JSON.stringify(result.checks.map(c => c.name)));
"
```

**Expected:** `verdict: pass`, all 4 check names present.

---

## Step 7 — evaluateGate structural case in governance-package (source check)

```powershell
Select-String -Path "src\enforcement\governance-package.js" -Pattern "structural"
```

**Expected:** The `structural` case appears in the `evaluateGate` function's switch statement.

---

## AC coverage checklist

| AC | Verified by | Pass? |
|----|-------------|-------|
| AC1 | Step 1 (IT1, IT2), Step 3 | |
| AC2 | Step 1 (IT2, IT3), Step 6 | |
| AC3 | Step 1 (T1, T2, T3) | |
| AC4 | Step 1 (IT3), Step 4 | |
| AC5 | Step 2 (`npm test`) | |
| NFR degradation | Step 1 (T6), Step 5 | |
