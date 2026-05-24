# Verification Script: Source path traversal guard for `sourceIntegrity` (SC-06)

**Story:** gpa-sc-06-source-path-guard
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-06-source-path-guard-dor.md`
**Date:** 2026-05-25

---

## CRITICAL UPSTREAM DEPENDENCY

**SC-06 cannot be dispatched or verified until SC-07 is DoD-complete.**

`sourceIntegrity` must be exported from `scripts/ci-audit-comment.js` (SC-07's deliverable) before SC-06 can add the path traversal guard. Attempting to run these scenarios against an unmodified baseline will fail at Scenario 1 with `TypeError: sourceIntegrity is not a function`.

Confirm SC-07 PR is merged before running any scenario.

---

## Pre-conditions

- SC-07 is DoD-complete — `sourceIntegrity` is exported from `scripts/ci-audit-comment.js`.
- Baseline: `npm test` passes before any changes.
- Branch for SC-06 is checked out from a clean master baseline (after SC-07 merge).

---

## Scenario 1 — Traversal path returns guard object, no file read (AC1, AC3)

**Command:**
```bash
node -e "
const { sourceIntegrity } = require('./scripts/ci-audit-comment.js');
const result = sourceIntegrity('../../etc/passwd', 'someHash');
console.log('traversal field:', result.traversal === true ? 'PASS' : 'FAIL — expected true');
console.log('sanitisedPath:', result.sanitisedPath === '[REDACTED]' ? 'PASS' : 'FAIL — expected [REDACTED]');
console.log('no raw path in result:', !JSON.stringify(result).includes('passwd') ? 'PASS' : 'FAIL — raw path leaked');
"
```

**Expected:** All three lines print `PASS`

---

## Scenario 2 — All 6 adversarial vectors return guard object (AC1)

**Command:**
```bash
node -e "
const { sourceIntegrity } = require('./scripts/ci-audit-comment.js');
const vectors = [
  '../../etc/passwd',
  '../../../etc/passwd',
  '..\\..\\.\\\\Windows\\\\System32\\\\config\\\\SAM',
  '/etc/passwd',
  'C:\\\\Windows\\\\System32\\\\config\\\\SAM',
  'artefacts/../../../etc/passwd'
];
let pass = true;
vectors.forEach(v => {
  const r = sourceIntegrity(v, null);
  if (!r || r.traversal !== true || r.sanitisedPath !== '[REDACTED]') {
    console.log('FAIL for vector:', v, '→', JSON.stringify(r));
    pass = false;
  }
});
console.log(pass ? 'PASS — all 6 vectors rejected' : 'FAIL — see above');
"
```

**Expected:** `PASS — all 6 vectors rejected`

---

## Scenario 3 — Guard placement: readFileSync only after startsWith check (AC4)

**Command:**
```bash
node -e "
const src = require('fs').readFileSync('scripts/ci-audit-comment.js', 'utf8');
const guardIdx = src.indexOf('startsWith(repoRoot');
const readIdx = src.indexOf('readFileSync', guardIdx > -1 ? guardIdx : 0);
console.log('guard present:', guardIdx > -1 ? 'PASS' : 'FAIL — guard not found');
console.log('readFileSync after guard:', guardIdx > -1 && readIdx > guardIdx ? 'PASS' : 'FAIL — read precedes guard');
"
```

**Expected:** Both lines print `PASS`

---

## Scenario 4 — Valid path inside repo returns hash comparison result — no regression (AC2)

**Command:**
```bash
node -e "
const { sourceIntegrity } = require('./scripts/ci-audit-comment.js');
const r1 = sourceIntegrity('README.md', null);
const r2 = sourceIntegrity('README.md', 'deadbeef1234');
const r3 = sourceIntegrity('package.json', 'deadbeef1234');
console.log('null hash:', r1 === '—' ? 'PASS' : 'FAIL — expected —');
console.log('mismatch hash:', r2 === '❌ DRIFT' ? 'PASS' : 'FAIL — expected ❌ DRIFT');
console.log('package.json mismatch:', r3 === '❌ DRIFT' ? 'PASS' : 'FAIL — expected ❌ DRIFT');
"
```

**Expected:** All three lines print `PASS`

---

## Scenario 5 — Raw path value does not appear in any output when guard fires (AC1 — no log injection)

**Command:**
```bash
node -e "
const { sourceIntegrity } = require('./scripts/ci-audit-comment.js');
const result = sourceIntegrity('../../secret-payload/credentials.json', 'hash');
const resultStr = JSON.stringify(result);
console.log('raw path not in result:', !resultStr.includes('secret-payload') ? 'PASS' : 'FAIL — raw path in result');
console.log('raw path not in result:', !resultStr.includes('credentials') ? 'PASS' : 'FAIL — raw path in result');
"
```

**Expected:** Both lines print `PASS`

---

## Scenario 6 — npm test exits 0 — no regression (AC2, all ACs)

**Command:**
```bash
npm test
```

**Expected:** Exit code 0. `[gpa-sc06]` test suite appears with 0 failures.

---

## Scenario 7 — SC-06 test suite explicitly exercises traversal (AC3)

**Command:**
```bash
npm test 2>&1 | grep "\[gpa-sc06\]"
```

**Expected:** Line matching `[gpa-sc06] Results: N passed, 0 failed` (N ≥ 6)

---

## M5 Evidence Check (AC4, AC5)

**Command:**
```bash
node -e "
const src = require('fs').readFileSync('scripts/ci-audit-comment.js', 'utf8');
const lines = src.split('\n');
const readLines = lines.map((l, i) => ({ l, i })).filter(({l}) => l.includes('readFileSync'));
readLines.forEach(({l, i}) => {
  const before = lines.slice(Math.max(0, i-5), i).join('\n');
  console.log('Line', i+1, ':', l.trim());
  console.log('Has guard before:', before.includes('startsWith(repoRoot') ? 'PASS' : 'FAIL — no guard before this readFileSync');
});
console.log(readLines.length === 0 ? 'No readFileSync found' : 'All checked');
"
```

**Expected:** Every `readFileSync` in the file has a `startsWith(repoRoot` guard in the preceding lines.

---

## AC Sign-off Checklist

| AC | Scenario | Verified by | Status |
|----|----------|-------------|--------|
| AC1 | S1, S2, S5 | coding agent at /verify-completion | ☐ |
| AC2 | S4 | coding agent at /verify-completion | ☐ |
| AC3 | S6, S7 | coding agent at /verify-completion | ☐ |
| AC4 | S3, M5 evidence check | coding agent at /verify-completion | ☐ |
| AC5 | M5 evidence check | operator at DoD | ☐ |
