# Verification Script: p4-nta-artefact-parity

**Story:** p4-nta-artefact-parity — Artefact format parity for bot sessions
**Test file:** `tests/check-p4-nta-artefact-parity.js`

## Pre-conditions

- Node.js ≥ 18 available
- `src/teams-bot/artefact-assembler.js` implemented
- Run from repository root

## Commands

```bash
node tests/check-p4-nta-artefact-parity.js
```

## Expected output

```
[p4-nta-artefact-parity] T1 — module exists and exports assembleArtefact
  ✓ T1a: src/teams-bot/artefact-assembler.js exists
  ✓ T1b: module loads without error
  ✓ T1c: exports assembleArtefact as function

[p4-nta-artefact-parity] T2 — complete session → artefact with required fields
  ✓ T2: assembled artefact has required template fields

[p4-nta-artefact-parity] T3 — no placeholder strings
  ✓ T3a: no [FILL IN] in output
  ✓ T3b: no TODO in output
  ✓ T3c: no PLACEHOLDER in output

[p4-nta-artefact-parity] T4 — no empty required fields
  ✓ T4: all required fields populated

[p4-nta-artefact-parity] T5 — branch name follows convention
  ✓ T5: branch name matches chore/nta-<slug>-<date>

[p4-nta-artefact-parity] T6 — incomplete session → null (no partial commit)
  ✓ T6: incomplete session returns null

[p4-nta-artefact-parity] T7 — session output includes standards_injected flag
  ✓ T7: standards_injected field present

[p4-nta-artefact-parity] T8 — no hardcoded artefact paths (ADR-004)
  ✓ T8: no hardcoded feature slug in source

[p4-nta-artefact-parity] T-NFR1 — no PII in external logs (MC-SEC-02)
  ✓ T-NFR1: no console.log with session.answers

[p4-nta-artefact-parity] T-NFR2 — no fork references in source
  ✓ T-NFR2: no forked_from or fork creation in source

[p4-nta-artefact-parity] Results: N passed, 0 failed
```

## AC coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T3, T4 |
| AC2 | T2 (template fields valid) |
| AC3 | T5 (branch naming) |
| AC4 | T6 (incomplete session) |
| NFR | T7, T8, T-NFR1, T-NFR2 |
