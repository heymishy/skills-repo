# DoR Contract: Write test output format standards document (SC-04)

**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-04-test-output-format.md`
**DoR artefact:** `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-04-test-output-format-dor.md`
**Date approved:** 2026-05-25

---

## Scope

### In scope
- `standards/governance/test-output-format.md` — new file documenting the test output convention
- `tests/check-gpa-sc04-test-output-format.js` — new test file (created RED first, then GREEN)

### Out of scope (MUST NOT touch)
- `.github/scripts/run-assurance-gate.js` — read only, do not modify
- `.github/scripts/assurance-gate.yml` — read only, do not modify
- Any existing test file output format — do not change any check script's output
- `CONTRIBUTING.md` — AC2 is a regression check; SC-04 does not require CONTRIBUTING.md changes
- `src/enforcement/` — any enforcement module file
- Any story artefact, test plan, or DoR artefact file

---

## schemaDepends

None — SC-04 has no upstream story dependencies. Schema dependency check not required.

---

## AC coverage contract

| AC | Required test(s) | Test file | Covered |
|----|-----------------|-----------|---------|
| AC1 — four required elements (format, regex, examples, silent-skip) | T1, T2, T3, T4 | tests/check-gpa-sc04-test-output-format.js | ✅ |
| AC2 — npm test regression | T5 | tests/check-gpa-sc04-test-output-format.js | ✅ |
| AC3 — trw.1 reference + explanation | T6 | tests/check-gpa-sc04-test-output-format.js | ✅ |
| AC4 — labelled conforming + non-conforming examples with bracket format | T4, T7 | tests/check-gpa-sc04-test-output-format.js | ✅ |

---

## NFR contract

| NFR | Enforcement | Verification |
|-----|-------------|-------------|
| Regex quoted verbatim from run-assurance-gate.js | NFR-T1 reads regex at test runtime and compares against document | Dynamic check — cannot drift silently |
| No new npm dependencies | Implementation constraint | `cat package.json` — no new entries |
