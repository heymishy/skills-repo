# Verification Script: CLI `skills validate --ci` command (SC-03)

**Story:** gpa-sc-03-cli-validate-ci
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-03-cli-validate-ci-dor.md`
**Date:** 2026-05-25

---

## Pre-conditions

- Baseline: `npm test` passes before any changes.
- Branch for SC-03 is checked out from a clean master baseline.
- SC-01 (`gpa-sc-01-trace-contract`) is DoD-complete — `standards/governance/trace-contract.md` exists. Note: SC-03 can be dispatched while SC-01 is in progress; H9 will warn until SC-01 lands, which is expected behaviour.

---

## Scenario 1 — `governance-package.js` exports H-gate evaluation function (AC7)

**Command:**
```bash
node -e "const mod = require('./src/enforcement/governance-package.js'); console.log(typeof mod.checkHGates || typeof mod.evaluateHGates || typeof mod.runHGateChecks, 'is function?', ['checkHGates','evaluateHGates','runHGateChecks'].some(k => typeof mod[k] === 'function') ? 'PASS' : 'FAIL');"
```

**Expected:** `PASS` — at least one H-gate evaluation function is exported

---

## Scenario 2 — `bin/skills` uses `governance-package.js` rather than inline H-gate logic (AC7)

**Command:**
```bash
node -e "
const src = require('fs').readFileSync('bin/skills', 'utf8');
const hasRef = src.includes('governance-package');
const noInline = !(/H1.*FAIL|checkH1|'H1'.*Found/).test(src);
console.log('governance-package ref:', hasRef ? 'PASS' : 'FAIL');
console.log('no inline H-logic:', noInline ? 'PASS' : 'FAIL');
"
```

**Expected:** Both lines print `PASS`

---

## Scenario 3 — `skills validate --story <slug> --ci` exits 0 for a passing story (AC2)

**Command:**
```bash
node bin/skills validate --story gpa-sc-01-trace-contract --ci; echo "Exit: $?"
```

**Expected:**
- Exit code 0
- Output contains `[skills-validate] Results:` followed by `0 failed`

---

## Scenario 4 — `skills validate --story <nonexistent-slug> --ci` exits 1 and names H1 (AC3)

**Command:**
```bash
node bin/skills validate --story this-slug-does-not-exist-12345 --ci; echo "Exit: $?"
```

**Expected:**
- Exit code 1
- Output contains `H1: FAIL` and the path that was not found
- Does not crash with uncaught exception

---

## Scenario 5 — Signed-off story is skipped (AC4)

**Command:**
```bash
node bin/skills validate --story gpa-sc-01-trace-contract --ci 2>&1 | grep -i "SKIP\|signed"
```

(Note: gpa-sc-01 has `dorStatus: signed-off` in pipeline-state.json after Wave 1 dispatch. If output format is `SKIP — dorStatus is signed-off`, this test passes.)

**Expected:** Output line contains `SKIP` and `signed-off`

---

## Scenario 6 — Output format is canonical (AC2)

**Command:**
```bash
node -e "
const out = require('child_process').execSync('node bin/skills validate --story gpa-sc-01-trace-contract --ci 2>&1', { encoding: 'utf8' });
const match = /\[skills-validate\] Results: \d+ passed, \d+ failed/.test(out);
console.log(match ? 'PASS — canonical format present' : 'FAIL — missing canonical format');
console.log(out.trim());
"
```

**Expected:** `PASS — canonical format present`

---

## Scenario 7 — npm test exits 0 (AC4 baseline)

**Command:**
```bash
npm test
```

**Expected:** Exit code 0. All existing tests pass. `[gpa-sc03]` test suite appears with 0 failures.

---

## Scenario 8 — Test suite includes SC-03 specific tests (AC7)

**Command:**
```bash
npm test 2>&1 | grep "\[gpa-sc03\]"
```

**Expected:** Line matching `[gpa-sc03] Results: N passed, 0 failed` (N ≥ 5)

---

## Post-deploy Metric Signal (AC5/AC6) — record at DoD after 10 CI runs

After merging and observing 10 PR pushes to master:
1. Count PRs where `skills validate --ci` raised a false-positive rejection (valid PR blocked).
2. If false-positive count = 0: record M2 signal as `on-track` in pipeline-state.json.
3. If false-positive rate > 1/20: append RISK-ACCEPT to decisions.md and restrict CI wiring to flat-stories-only features.

This is not automated — requires operator observation over the post-deploy period.

---

## AC Sign-off Checklist

| AC | Scenario | Verified by | Status |
|----|----------|-------------|--------|
| AC1 | S3, S4 | coding agent at /verify-completion | ☐ |
| AC2 | S3, S6 | coding agent at /verify-completion | ☐ |
| AC3 | S4 | coding agent at /verify-completion | ☐ |
| AC4 | S5 | coding agent at /verify-completion | ☐ |
| AC5 | Post-deploy, 10 PR runs | operator at DoD | ☐ |
| AC6 | Post-deploy observation | operator at DoD | ☐ |
| AC7 | S1, S2, S8 | coding agent at /verify-completion | ☐ |
