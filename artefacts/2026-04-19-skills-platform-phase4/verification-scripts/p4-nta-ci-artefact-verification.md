# Verification Script: p4-nta-ci-artefact

**Story:** p4-nta-ci-artefact — CI integration for non-git-native governance surfaces
**Test file:** `tests/check-p4-nta-ci-artefact.js`

## Pre-conditions

- Node.js ≥ 18 available
- `src/teams-bot/ci-reporter.js` implemented
- Run from repository root

## Commands

```bash
node tests/check-p4-nta-ci-artefact.js
```

## Expected output

```
[p4-nta-ci-artefact] T1 — module exists and exports checkBotArtefact
  ✓ T1a: src/teams-bot/ci-reporter.js exists
  ✓ T1b: module loads without error
  ✓ T1c: exports checkBotArtefact as function

[p4-nta-ci-artefact] T2 — standards_injected: false → warning (not error)
  ✓ T2a: result is not null
  ✓ T2b: result.level is "warning"

[p4-nta-ci-artefact] T3 — standards_injected: true → null
  ✓ T3: clean artefact returns null

[p4-nta-ci-artefact] T4 — warning message identifies artefact and flag
  ✓ T4a: message contains artefact path
  ✓ T4b: message contains "standards_injected"

[p4-nta-ci-artefact] T5 — standards_injected: false never produces level: error
  ✓ T5: level is not "error" or "failure"

[p4-nta-ci-artefact] T6 — governance scripts have no bot-specific bypass
  ✓ T6a: no skipIfBot pattern in tests/
  ✓ T6b: no isBotProduced bypass in tests/

[p4-nta-ci-artefact] T7 — CI summary has no surface-specific annotation
  ✓ T7: clean artefact produces null (no annotation)

[p4-nta-ci-artefact] T8 — no credentials in CI reporter output (MC-SEC-02)
  ✓ T8: no Bearer/secret/password in warning message

[p4-nta-ci-artefact] T-NFR1 — no hardcoded paths (ADR-004)
  ✓ T-NFR1: no hardcoded artefact paths in source

[p4-nta-ci-artefact] T-NFR2 — level values are only "warning" or null (MC-CORRECT-02)
  ✓ T-NFR2: no other level values returned

[p4-nta-ci-artefact] Results: N passed, 0 failed
```

## AC coverage

| AC | Tests |
|----|-------|
| AC1 | T6 (no bot-specific bypass in CI) |
| AC2 | T3 (trace validation passes implicitly) |
| AC3 | T2, T4, T5 (warning not failure) |
| AC4 | T7 (no surface annotation) |
| NFR | T8, T-NFR1, T-NFR2 |
