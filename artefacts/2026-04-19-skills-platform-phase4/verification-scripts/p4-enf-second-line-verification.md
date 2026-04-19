# Verification Script: p4-enf-second-line

**Story:** Theme F second-line evidence chain inputs
**Epic:** E3 — Structural enforcement

## Automated verification

```bash
node tests/check-p4-enf-second-line.js
```

Expected output:
```
T1 pass: theme-f-inputs.md exists
T2 pass: CLI section has all six required fields
T3 pass: workflow declaration structure section present
T4 pass: MCP trace contract section present
T5 pass: executorIdentity documented as optional
T6 pass: validate-trace.sh accepts trace without executorIdentity
T7 pass: Phase 4 / Theme F boundary section present
T8 pass: Theme F out-of-scope items named with Q4 reference
T-NFR1 pass: no credentials in document
T-NFR2 pass: executorIdentity optional in trace JSON schema
```

## Manual verification

1. Run `node tests/check-p4-enf-second-line.js` — all tests pass.
2. Open `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md`: read the Phase 4 / Theme F boundary section.
3. Confirm "dual-authority approval", "RBNZ", or "second-line governance model" named as NOT in Phase 4.
4. Confirm Craig's Q4 decision is cited.
5. Write a trace fixture without `executorIdentity`; run `bash scripts/validate-trace.sh --ci` — exit 0.

## AC coverage

| AC | Test | Covered by |
|----|------|-----------|
| AC1 | T1–T5 | Document exists with three sections + executorIdentity optional |
| AC2 | T6, T-NFR2 | Trace schema accepts missing executorIdentity |
| AC3 | T7, T8 | Boundary section; Theme F out-of-scope named with Q4 reference |
| NFR-SEC | T-NFR1 | No credentials in document |
| NFR-CORRECT | T-NFR2 | executorIdentity optional in schema |
