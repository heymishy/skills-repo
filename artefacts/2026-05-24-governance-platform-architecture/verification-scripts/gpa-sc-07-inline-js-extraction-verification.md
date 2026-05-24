# Verification Script: Extract inline workflow JS to tested modules (SC-07)

**Story:** gpa-sc-07-inline-js-extraction
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-07-inline-js-extraction-dor.md`
**Date:** 2026-05-25

---

## Pre-conditions

- Baseline: `npm test` passes before any changes.
- Branch for SC-07 is checked out from a clean master baseline.
- `scripts/ci-audit-comment.js` exists and exports `buildAuditComment`, `loadPipelineStories`, `classifyArtefact`, `parseACs`, `computeIssueAcCheck`.

---

## Scenario 1 — `sourceIntegrity` exported from ci-audit-comment.js (AC2)

**Command:**
```bash
node -e "const mod = require('./scripts/ci-audit-comment.js'); console.log(typeof mod.sourceIntegrity);"
```

**Expected:** `function`

---

## Scenario 2 — assurance-gate.yml contains no inline `function sourceIntegrity` definition (AC2)

**Command:**
```bash
node -e "const c = require('fs').readFileSync('.github/workflows/assurance-gate.yml', 'utf8'); console.log(c.includes('function sourceIntegrity(') ? 'FAIL — still inline' : 'PASS — not inline');"
```

**Expected:** `PASS — not inline`

---

## Scenario 3 — `sourceIntegrity` callable with valid path returns without error (AC2, AC3b)

**Command:**
```bash
node -e "
const { sourceIntegrity } = require('./scripts/ci-audit-comment.js');
const r1 = sourceIntegrity('README.md', null);
const r2 = sourceIntegrity('README.md', 'deadbeef1234');
const r3 = sourceIntegrity('nonexistent-file-12345.txt', 'hash');
console.log('null hash result:', r1);
console.log('mismatch hash result:', r2);
console.log('missing file result:', r3);
"
```

**Expected:**
- `null hash result: —`
- `mismatch hash result: ❌ DRIFT`
- `missing file result: ⚠ not found`

---

## Scenario 4 — `loadPipelineStories` finds flat stories (AC3c)

**Command:**
```bash
node -e "
const { loadPipelineStories } = require('./scripts/ci-audit-comment.js');
const state = { features: [{ slug: 'test-feat', stories: [{ id: 's1' }, { id: 's2' }] }] };
const result = loadPipelineStories(state, 'test-feat');
console.log('count:', result.length, result.length === 2 ? 'PASS' : 'FAIL');
"
```

**Expected:** `count: 2 PASS`

---

## Scenario 5 — `loadPipelineStories` finds epic-nested stories (AC3d)

**Command:**
```bash
node -e "
const { loadPipelineStories } = require('./scripts/ci-audit-comment.js');
const state = { features: [{ slug: 'test-feat', epics: [{ stories: [{ slug: 'ep1-s1' }] }, { stories: [{ slug: 'ep2-s1' }] }] }] };
const result = loadPipelineStories(state, 'test-feat');
console.log('count:', result.length, result.length === 2 ? 'PASS' : 'FAIL');
"
```

**Expected:** `count: 2 PASS`

---

## Scenario 6 — `buildAuditComment` with minimal fixture returns comment with required sections (AC1, AC3a)

**Command:**
```bash
node -e "
const { buildAuditComment } = require('./scripts/ci-audit-comment.js');
const result = buildAuditComment({ verdict: 'pass', slug: 'test-feature', traceHash: 'abc123', shortSha: 'def456', headSha: 'def456abcdef', repoUrl: 'https://github.com/test/repo', runUrl: 'https://github.com/test/repo/actions/runs/1', artifactName: 'test-artifact' });
console.log(typeof result === 'string' && result.includes('Governed Delivery Audit Record') ? 'PASS' : 'FAIL — missing expected structure');
console.log('Length:', result.length);
"
```

**Expected:** `PASS` and length > 0

---

## Scenario 7 — npm test exits 0 — no regression from extraction (AC4)

**Command:**
```bash
npm test
```

**Expected:** Exit code 0. All existing tests pass. `[gpa-sc07]` test suite appears with 0 failures.

---

## Scenario 8 — Test suite includes SC-07 specific tests (AC3)

**Command:**
```bash
npm test 2>&1 | grep "\[gpa-sc07\]"
```

**Expected:** Line matching `[gpa-sc07] Results: N passed, 0 failed` (N ≥ 8)

---

## AC Sign-off Checklist

| AC | Scenario | Verified by | Status |
|----|----------|-------------|--------|
| AC1 | S6 | coding agent at /verify-completion | ☐ |
| AC2 | S1, S2, S3 | coding agent at /verify-completion | ☐ |
| AC3 | S3, S4, S5, S6 | coding agent at /verify-completion | ☐ |
| AC4 | S7 | coding agent at /verify-completion | ☐ |
| AC5 | S7 (structural equivalence) | operator smoke check at DoD | ☐ |
