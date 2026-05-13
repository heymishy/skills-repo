# Verification Script: p4-enf-mcp

**Story:** MCP enforcement adapter
**Epic:** E3 — Structural enforcement

## Automated verification

```bash
node tests/check-p4-enf-mcp.js
```

Expected output:
```
T1 pass: mcp-adapter module exports handleToolCall
T2 pass: verifyHash called before skill body
T3 pass: HASH_MISMATCH → error returned, no skill body
T4 pass: valid hash → P2 context injection returns all three
T5 pass: writeTrace called with all six required fields
T6 pass: surfaceType is "mcp-interactive"
T7 pass: no persistent process pattern in source
T8 pass: multi-question payload rejected
T-NFR1 pass: no skill content in console.log calls
T-NFR2 pass: no bypass path in source
```

## Manual verification

1. Run `node tests/check-p4-enf-mcp.js` — all tests pass.
2. Inspect `src/enforcement/mcp-adapter.js`: confirm no `setInterval`, `server.listen` at module scope.
3. Emit a trace via the MCP adapter; run `bash scripts/validate-trace.sh --ci` on the output — exit 0.
4. Confirm `surfaceType` in trace file equals `"mcp-interactive"`.

## AC coverage

| AC | Test | Covered by |
|----|------|-----------|
| AC1 | T2, T3 | verifyHash before skill body; HASH_MISMATCH blocks delivery |
| AC2 | T4 | P2 context injection: skill body + standards + state |
| AC3 | T5, T6 | Trace has all 6 fields including surfaceType "mcp-interactive" |
| AC4 | T7 | No persistent process pattern in source |
| NFR-C7 | T8 | Single-question enforcement |
| NFR-SEC | T-NFR1, T-NFR2 | No skill content log; no bypass |
