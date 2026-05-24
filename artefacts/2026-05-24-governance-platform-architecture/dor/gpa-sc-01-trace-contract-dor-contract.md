# DoR Contract: Write trace contract standards document (SC-01)

**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-01-trace-contract.md`
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-01-trace-contract-dor.md`
**Date approved:** 2026-05-25

---

## Scope

### In scope
- `standards/governance/trace-contract.md` — new file documenting all 15 principles P01-P15, each with 4 fields
- `CONTRIBUTING.md` — add one reference to `standards/governance/trace-contract.md`
- `tests/check-gpa-sc01-trace-contract.js` — new test file (created RED first, then GREEN)

### Out of scope (MUST NOT touch)
- `src/enforcement/` — any file in the enforcement module directory
- `.github/scripts/run-assurance-gate.js`
- `.github/scripts/assurance-gate.yml`
- `src/web-ui/routes/journey.js`
- Any existing test file other than creating the new check file
- Any story artefact, test plan, or DoR artefact file

---

## schemaDepends

None — SC-01 has no upstream story dependencies. Schema dependency check not required.

---

## AC coverage contract

| AC | Required test(s) | Test file | Covered |
|----|-----------------|-----------|---------|
| AC1 — file exists + all 15 principles + 4-field depth | T1, T2, T3, T4 | tests/check-gpa-sc01-trace-contract.js | ✅ |
| AC2 — CONTRIBUTING.md reference | T5 | tests/check-gpa-sc01-trace-contract.js | ✅ |
| AC3 — npm test regression | T6 | tests/check-gpa-sc01-trace-contract.js | ✅ |
| AC4 — P02 exact pattern + source citation | T7 | tests/check-gpa-sc01-trace-contract.js | ✅ |

---

## NFR contract

| NFR | Enforcement | Verification |
|-----|-------------|-------------|
| All module path references resolve to real files | NFR-T1 in test plan | `node -e "..."` in verification script Step 9 |
| No new npm dependencies | Implementation constraint | `cat package.json` — no new entries |
| Human-readable without tooling — plain markdown | Document review | Direct read of the file |
