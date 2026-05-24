# Definition of Ready Checklist

## Definition of Ready: Add path traversal guard to manifest sourcePath reads (SC-06)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-06-source-path-guard.md`
**Test plan reference:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-06-source-path-guard-test-plan.md`
**Verification script:** `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-06-source-path-guard-verification.md`
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-25

---

## CRITICAL UPSTREAM DEPENDENCY — DO NOT DISPATCH UNTIL SC-07 IS DOD-COMPLETE

SC-06 depends on SC-07 having merged to master. `sourceIntegrity` must be an exported function in `scripts/ci-audit-comment.js` (SC-07's deliverable) before SC-06 can add the path traversal guard to it. If the coding agent begins implementation before SC-07 is merged, `sourceIntegrity` will not exist as an export and the implementation will fail.

**Dispatch gate:** Confirm via `gh pr list --state merged` or `git log --oneline` that the SC-07 PR is merged before creating the dispatch issue for SC-06.

---

## Contract Proposal

**What will be built:**
A path traversal guard is added to the `sourceIntegrity(sourcePath, manifestHash)` function in `scripts/ci-audit-comment.js` (which will exist as an exported function after SC-07 merges). The guard uses `path.resolve(inputPath).startsWith(repoRoot + path.sep)`. If the check fails (traversal attempt), the function returns `{ traversal: true, sanitisedPath: '[REDACTED]' }` without reading the file and without logging the raw path. Valid in-repo paths are not affected. A new test file `tests/check-gpa-sc06-source-path-guard.js` exercises 6 adversarial vectors (as listed in T1–T4 of the test plan) and at least one valid-path regression test.

**What will NOT be built:**
- Guarding other `readFileSync` or `fs.read*` calls in `scripts/ci-audit-comment.js` that are not part of `sourceIntegrity` — out of scope for this story.
- Changes to `manifest.json` schema or structure — no schema changes.
- Changes to CI comment posting, GitHub API calls, or authentication in assurance-gate.yml.
- Any new behaviour in the happy path of `sourceIntegrity` beyond adding the guard.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Traversal path rejected; returns `{ traversal: true, sanitisedPath: '[REDACTED]' }`; no file read | T1+T2 (6 adversarial vector calls, assert return shape), S1 in verification script | unit |
| AC2 — Valid in-repo paths work as before | T3 (valid path, null hash → '—'), S4 in verification script | unit |
| AC3 — 0 test failures; guard is tested in SC-06 suite | T5 (npm test exit 0), T1+T2+T3+T4 in SC-06 suite, S6/S7 in verification script | unit + integration |
| AC4 — `readFileSync` guarded: guard check precedes read | T4 (source code static check — guard before readFileSync), S3+M5 in verification script | unit |
| AC5 — Raw path not in any output when guard fires | S5 in verification script (spot check — no raw path in result JSON) | spot check |

**Assumptions:**
- SC-07 is DoD-complete and `sourceIntegrity` is exported from `scripts/ci-audit-comment.js`.
- `repoRoot` is available to `sourceIntegrity` — either as a parameter, or via `process.cwd()` / `path.resolve(__dirname, '../..')`. The implementation must not hard-code the repo root path.

**Estimated touch points:**
Files: `scripts/ci-audit-comment.js` (modified — add guard to `sourceIntegrity` only), `tests/check-gpa-sc06-source-path-guard.js` (new).
Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed guard exactly addresses the security requirement (OWASP path traversal, ADR-016 security constraint). The scope is tightly bounded to a single function in a single file. The return shape `{ traversal: true, sanitisedPath: '[REDACTED]' }` is well-defined and the 6 adversarial vectors are enumerated. The upstream dependency constraint is explicit and gate-able.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a security-conscious platform operator..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1+T2, AC2→T3, AC3→T5, AC4→T4, AC5→spot check / verification script. No uncovered ACs. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items explicitly listed |
| H5 | Benefit linkage field references a named metric | ✅ | M5 — security hardening metric |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | reviewStatus: passed; 0 HIGH, 0 MEDIUM findings in review |
| H8 | Test plan has no uncovered ACs | ✅ | All ACs covered; AC5 spot-check noted as verification-script step rather than automated test — explicitly acknowledged |
| H8-ext | Cross-story schema dependency check | ✅ | SC-06 has a code-level upstream dependency on SC-07, not a pipeline-state schema field dependency. `schemaDepends: []`. The H8-ext schema field check passes — no new schema fields are read by SC-06. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-016 (path traversal), ADR-011 (security hardening). copilot-instructions.md path traversal standard followed verbatim. No guardrail violations. |
| H-E2E | No CSS-layout-dependent ACs without RISK-ACCEPT | ✅ | No CSS-layout ACs — not applicable |
| H-NFR | NFR profile exists; story has NFR section | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists; story has security, no-file-read-on-traversal, no-raw-path-log NFRs |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No regulatory compliance clause for SC-06 — not applicable |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | NFR profile present (story has non-None NFRs) | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ | `Hamis — 2026-05-24` present in discovery.md |
| H-ADAPTER | Injectable adapter wiring check | ✅ | SC-06 does not introduce injectable adapters |

**Hard blocks: 17/17 passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | 0 MEDIUM findings — not applicable | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script was produced by the pipeline. AC5 spot check (no raw path in output) is a manual read — not automated. Risk: raw path leak is missed during DoD if spot check is skipped. | Operator acknowledged — proceed. Operator will review verification script before DoD sign-off. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | AC5 gap (post-deploy smoke check) acknowledged. Acceptable. | — |

---

## Oversight

**Oversight level: Medium** (per parent epic `gpa-epic-02-ci-enforcement-compliance`).

SC-06 adds a security guard to the CI audit comment path. Although the scope is a single function, the security implications of getting the guard wrong (either too strict — blocking valid paths — or too loose — allowing traversal) warrant tech lead awareness. Share this DoR artefact with the tech lead before dispatching to the coding agent. No formal sign-off required.

---

## Coding Agent Instructions

**Story:** gpa-sc-06-source-path-guard — Add path traversal guard to manifest sourcePath reads

**Oversight level:** Medium — share DoR artefact with tech lead before starting; no blocking sign-off required.

### CRITICAL: DO NOT BEGIN IMPLEMENTATION UNTIL SC-07 IS CONFIRMED MERGED

Before writing any code, verify that the SC-07 PR (`gpa-sc-07-inline-js-extraction`) has been merged to master:
```bash
git log --oneline origin/master | head -10
```
`sourceIntegrity` must be an exported function in `scripts/ci-audit-comment.js`. If it is not, SC-06 cannot be implemented — stop and post a PR comment.

### Before writing any code

1. Confirm SC-07 is merged: `node -e "const m = require('./scripts/ci-audit-comment.js'); console.log(typeof m.sourceIntegrity);"` — must print `function`.
2. Run `npm test` and confirm it exits 0 — this is your clean baseline.
3. Read the full story artefact: `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-06-source-path-guard.md`
4. Read the test plan: `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-06-source-path-guard-test-plan.md`
5. Read the DoR contract: `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-06-source-path-guard-dor-contract.md`
6. Read `scripts/ci-audit-comment.js` — locate `sourceIntegrity` and inspect the function body before making any changes.

### Implementation order (TDD)

**Task 1 — Write failing tests first (RED)**
Create `tests/check-gpa-sc06-source-path-guard.js`. T1–T2 (adversarial vectors return guard object) will fail before the guard is added. This is the expected RED state.

**Task 2 — Add the path traversal guard to `sourceIntegrity` (GREEN)**
Add the guard at the top of `sourceIntegrity`, before any `fs.readFileSync` call:
```js
const repoRoot = path.resolve(__dirname, '..');
const resolvedPath = path.resolve(sourcePath);
if (!resolvedPath.startsWith(repoRoot + path.sep)) {
  return { traversal: true, sanitisedPath: '[REDACTED]' };
}
```
Adjust `repoRoot` derivation as needed for the module's actual location. The guard MUST precede the `readFileSync` call. The function MUST NOT log or include the raw `sourcePath` in any output when the guard fires.

**Task 3 — Verify no regression on valid paths**
T3 (valid path, null hash) must still return `'—'`. T4 (source code static check) must pass. Run the SC-06 test suite.

**Task 4 — Run full test suite**
`npm test` must exit 0 with `[gpa-sc06] Results: N passed, 0 failed`.

### Non-negotiable implementation constraints

- **Guard pattern is mandatory:** Use `path.resolve(inputPath).startsWith(repoRoot + path.sep)` — this is the canonical pattern from `copilot-instructions.md`. Do not use `includes('../')` string matching or any other pattern.
- **Return shape is mandatory:** `{ traversal: true, sanitisedPath: '[REDACTED]' }` — do not use a string return, do not throw an error.
- **No raw path in any output:** When the guard fires, do not `console.log(sourcePath)`, do not include the raw path in the return value, do not include it in any error message.
- **No readFileSync before the guard:** The guard check must be the first operation in the function that involves the path. The `readFileSync` call must come after `startsWith` returns true.
- **Only modify `sourceIntegrity`:** Do not add guards to other functions in `scripts/ci-audit-comment.js`. Scope is limited to `sourceIntegrity` only.
- **No external npm dependencies.**
- Do not modify any file under `artefacts/`. These are read-only pipeline inputs.
- Open PRs as drafts only. Never mark ready for review. Never merge.

### Done condition

`npm test` exits 0, `[gpa-sc06] Results: N passed, 0 failed` (N ≥ 5), all 6 adversarial vectors return `{ traversal: true, sanitisedPath: '[REDACTED]' }`, `readFileSync` is guarded in `sourceIntegrity`, raw traversal path does not appear in any function output.

If any AC is ambiguous or any blocker is not resolvable from the artefact files: add a PR comment describing the specific blocker and stop. Do not improvise a workaround.

## Coding Agent Instructions

_(duplicate heading intentional — template alignment; only the block above is operative)_
