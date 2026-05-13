# Verification Script: p4-enf-package

**Story:** Governance package — shared core
**Epic:** E3 — Structural enforcement

## Automated verification

```bash
node tests/check-p4-enf-package.js
```

Expected output:
```
T1 pass: module exports all five entry points
T2 pass: resolveSkill returns skill with hash
T3 pass: verifyHash mismatch returns HASH_MISMATCH object
T4 pass: verifyHash HASH_MISMATCH is error object (not null)
T5 pass: verifyHash match returns null
T6 pass: evaluateGate returns structured result
T7 pass: advanceState updates state correctly
T8 pass: writeTrace output passes trace schema
T-NFR1 pass: no force/skip bypass in verifyHash
T-NFR2 pass: no external network call in source
```

## Manual verification

1. Run `node tests/check-p4-enf-package.js` — all tests pass.
2. Inspect `src/enforcement/governance-package.js`: verify verifyHash function signature has no `force`/`skip` parameter.
3. Write a fixture trace entry using writeTrace and run `bash scripts/validate-trace.sh --ci` against it — confirm exit 0.
4. Check `src/enforcement/governance-package.js` source for `fetch(`, `http.`, `https.`, `dns` — none present.

## AC coverage

| AC | Test | Covered by |
|----|------|-----------|
| AC1 | T1–T7 | All five entry points exported and callable |
| AC2 | T3, T4, T5 | verifyHash returns HASH_MISMATCH on mismatch, null on match, no throw |
| AC3 | T8 | writeTrace schema-valid |
| NFR-C5 | T-NFR1 | No force/skip bypass |
| NFR-SEC | T-NFR2 | No external network |
