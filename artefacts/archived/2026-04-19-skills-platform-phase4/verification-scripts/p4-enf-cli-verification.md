# Verification Script: p4-enf-cli

**Story:** CLI enforcement adapter — 9 commands
**Epic:** E3 — Structural enforcement

## Automated verification

```bash
node tests/check-p4-enf-cli.js
```

Expected output:
```
T1 pass: cli-adapter exports all 9 commands
T2 pass: all 9 exports are functions
T3 pass: advance non-permitted → error with allowed list
T4 pass: advance permitted → success
T5 pass: advance matching hash → envelope built
T6 pass: advance mismatching hash → HASH_MISMATCH error, no envelope
T7 pass: emitTrace output passes trace schema
T8 pass: no hardcoded github.com URL in source
T-NFR1 pass: no skip-verify bypass in source
T-NFR2 pass: no credentials in emitTrace output
```

## Manual verification

1. Run `node tests/check-p4-enf-cli.js` — all tests pass.
2. Invoke `emitTrace` manually; pipe output to `bash scripts/validate-trace.sh --ci` — exit 0.
3. Inspect `src/enforcement/cli-adapter.js` for `--skip-verify` or `skipVerify` — none.
4. Inspect source for hardcoded `github.com/heymishy` — none outside comments.

## AC coverage

| AC | Test | Covered by |
|----|------|-----------|
| AC1 | T1, T2 | All 9 commands exported as functions |
| AC2 | T3 | Non-permitted transition → structured error with allowed list |
| AC3 | T5, T6 | Hash check on advance; mismatch error with exact format |
| AC4 | T7 | emitTrace passes validate-trace.sh |
| NFR-C5 | T-NFR1 | No skip-verify bypass |
| NFR-ADR004 | T8 | No hardcoded URLs |
| NFR-SEC | T-NFR2 | No credentials in trace output |
