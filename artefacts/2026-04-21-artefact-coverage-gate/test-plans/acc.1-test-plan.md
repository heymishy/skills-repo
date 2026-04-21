# Test Plan: acc.1 — Artefact-first governance gate

**Story:** acc.1
**Feature:** 2026-04-21-artefact-coverage-gate
**Test count:** 8

---

## Tests

| ID | Description | Type | AC |
|----|-------------|------|----|
| T1 | `uncovered-slug-fails` — script exits non-zero when a slug has no artefact and is not exempted | Unit | AC4 |
| T2 | `covered-slug-passes` — script exits zero when all slugs have matching artefact files | Unit | AC3, AC4 |
| T3 | `exempted-slug-passes` — slug in exemption list with a reason does not cause non-zero exit | Unit | AC5 |
| T4 | `exemption-without-reason-fails` — exemption entry with empty/missing reason is treated as UNCOVERED | Unit | AC5 |
| T5 | `skill-enumeration` — script reads `.github/skills/` subdirectory names as slugs | Unit | AC1 |
| T6 | `module-enumeration` — script reads `src/` subdirectory names as slugs | Unit | AC2 |
| T7 | `package-json-chain` — `package.json` test script includes `node tests/check-artefact-coverage.js` | Governance | AC6 |
| T8 | `exemption-file-exists` — `artefact-coverage-exemptions.json` exists in the repo root | Governance | AC7 |

---

## TDD baseline

All 8 tests must fail (or be skipped as not-yet-implemented) before implementation begins. Tests T7 and T8 are governance-layer checks that read the actual repo files.

---

## AC coverage

| AC | Automated tests | Manual |
|----|----------------|--------|
| AC1 | T5 | — |
| AC2 | T6 | — |
| AC3 | T2 | — |
| AC4 | T1, T2 | — |
| AC5 | T3, T4 | — |
| AC6 | T7 | — |
| AC7 | T8 | — |
| AC8 | — | Confirmed by T1–T4 inline self-test |
