# Definition of Ready Checklist

## Definition of Ready: Extract inline workflow JS to tested modules (SC-07)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-07-inline-js-extraction.md`
**Test plan reference:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-07-inline-js-extraction-test-plan.md`
**Verification script:** `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-07-inline-js-extraction-verification.md`
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-25

---

## Contract Proposal

**What will be built:**
`sourceIntegrity(sourcePath, manifestHash)` — currently an inline function at line ~257 of `.github/workflows/assurance-gate.yml` — is extracted to `scripts/ci-audit-comment.js` as a named export. The inline function definition in assurance-gate.yml is removed and replaced with a `require()` call to the extracted module. A new test file `tests/check-gpa-sc07-inline-js-extraction.js` is created with T1–T8 unit tests and IT1 integration test covering: export verification, inline-definition-absence check, callable-without-GH-Actions-context, pipelineStories flat layout, pipelineStories epic-nested layout, buildAuditComment fixture call, and npm test exit code.

**What will NOT be built:**
- The path traversal guard on `sourceIntegrity` — that is SC-06's scope.
- Any logic changes to `sourceIntegrity` — extraction only; no behaviour changes.
- Extraction of other workflow steps (dependency graph building, artefact upload) — separate stories if warranted.
- Changes to assurance-gate.yml trigger events, workflow permissions, or job structure.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — `buildAuditComment` exported; zero standalone audit comment logic remains inline | T1 (export check), T7 (fixture call with structural assertion) | unit |
| AC2 — `sourceIntegrity` exported; inline definition removed from assurance-gate.yml | T2 (export check — RED before implementation), T6 (grep assurance-gate.yml for inline fn) | unit |
| AC3 — Test suite exercises buildAuditComment, sourceIntegrity, pipelineStories flat, epic-nested | T3 (sourceIntegrity valid path), T4 (flat), T5 (epic-nested), T7 (fixture) | unit |
| AC4 — 0 test failures after extraction | T8 (npm test exit 0) | integration |
| AC5 — Audit comment content equivalent before/after | IT1 (realistic buildAuditComment fixture + structural equivalence assertion) | integration |

**Assumptions:**
- `buildAuditComment`, `loadPipelineStories`, `classifyArtefact`, `parseACs`, `computeIssueAcCheck` are already exported from `scripts/ci-audit-comment.js`. Only `sourceIntegrity` remains inline in assurance-gate.yml.
- `assurance-gate.yml` already calls `require('./scripts/ci-audit-comment.js')` for the existing exports. The extracted `sourceIntegrity` will be accessed via the same require call.

**Estimated touch points:**
Files: `scripts/ci-audit-comment.js` (modified — add `sourceIntegrity` export), `.github/workflows/assurance-gate.yml` (modified — replace inline function with require call), `tests/check-gpa-sc07-inline-js-extraction.js` (new).
Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed extraction aligns with all 5 ACs. The scope boundary (no logic changes, no traversal guard, no other workflow steps) exactly matches the Out of Scope section in the story. AC2 correctly identifies T2 as an initially-RED test that becomes GREEN after the extraction.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator... I want... So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1+T7, AC2→T2+T6, AC3→T3+T4+T5+T7, AC4→T8, AC5→IT1 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items explicitly listed |
| H5 | Benefit linkage field references a named metric | ✅ | M3 (primary) and M5 (prerequisite) |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | reviewStatus: passed; review-1 had 0 HIGH, 0 MEDIUM, 1 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered; AC5 gap acknowledged with IT1 mitigation |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None (upstream) — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011, ADR-009 referenced; extraction-only story; no guardrail violation |
| H-E2E | No CSS-layout-dependent ACs without RISK-ACCEPT | ✅ | No CSS-layout ACs — not applicable |
| H-NFR | NFR profile exists; story has NFR section | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists; story has Functional equivalence, No external npm deps, Importability NFRs |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No regulatory compliance clause for SC-07 — not applicable |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | NFR profile present (story has non-None NFRs) | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ | `Hamis — 2026-05-24` present in discovery.md |
| H-ADAPTER | Injectable adapter wiring check | ✅ | SC-07 is code extraction only; no injectable adapters introduced |

**Hard blocks: 17/17 passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | 0 MEDIUM findings — not applicable | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script was produced by the pipeline, not reviewed by a domain expert. Risk: a scenario may be incomplete or misdirected, leaving AC5 (functional equivalence) unverified until DoD smoke check. | Operator acknowledged — proceed. Operator will review verification script before DoD sign-off. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | AC5 gap (full CI equivalence) is acknowledged as MEDIUM in test plan with IT1 mitigation and DoD smoke check. Acceptable. | — |

---

## Oversight

**Oversight level: Medium** (per parent epic `gpa-epic-02-ci-enforcement-compliance`).

SC-07 touches `assurance-gate.yml` and `scripts/ci-audit-comment.js` — the CI audit comment path. Share this DoR artefact with the tech lead before dispatching to the coding agent. No formal sign-off required; awareness is sufficient.

---

## Coding Agent Instructions

**Story:** gpa-sc-07-inline-js-extraction — Extract inline workflow JS to tested modules

**Oversight level:** Medium — share DoR artefact with tech lead before starting; no blocking sign-off required.

### Before writing any code

0. Verify the extraction assumption:
   ```bash
   grep -n "function sourceIntegrity" .github/workflows/assurance-gate.yml
   ```
   This must return **exactly one match**. If it returns zero matches, `sourceIntegrity` has already been extracted — stop and post a PR comment. If it returns more than one match, there are duplicates — stop and post a PR comment.

1. Run `npm test` and confirm it exits 0 — this is your clean baseline.
2. Run `bash scripts/validate-trace.sh --ci` — confirm 0 failures.
3. Read the full story artefact: `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-07-inline-js-extraction.md`
4. Read the test plan: `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-07-inline-js-extraction-test-plan.md`
5. Read the DoR contract: `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-07-inline-js-extraction-dor-contract.md`
6. Confirm `scripts/ci-audit-comment.js` exists and inspect its current exports before making any changes.
7. Confirm the inline `sourceIntegrity` function definition location in `.github/workflows/assurance-gate.yml` (search for `function sourceIntegrity(`).

### Implementation order (TDD)

**Task 1 — Write failing tests first (RED)**
Create `tests/check-gpa-sc07-inline-js-extraction.js`. Run it — T2 (sourceIntegrity not yet exported) and T6 (inline still present) will fail. All others should pass. This is the expected RED state.

**Task 2 — Extract `sourceIntegrity` to ci-audit-comment.js (GREEN)**
1. Copy the `sourceIntegrity(sourcePath, manifestHash)` function body from assurance-gate.yml line ~257 into `scripts/ci-audit-comment.js`.
2. Add it to `module.exports`.
3. In assurance-gate.yml, replace the inline function definition with a reference to the already-required module: the module is already `require()`'d — just call `ciAuditComment.sourceIntegrity(sourcePath, manifestHash)` in place of the inline call.
4. Run the test file — T2 and T6 must now pass. All other tests must still pass.

**Task 3 — Run full test suite and confirm clean (AC4)**
Run `npm test` — exit code must be 0 with 0 failures across all suites including `[gpa-sc07]`.

### Non-negotiable implementation constraints

- **No logic changes to `sourceIntegrity`** — extraction only. Copy the function body verbatim; do not add the path traversal guard (that is SC-06).
- **No external npm dependencies** — `scripts/ci-audit-comment.js` must not add any new `require()` for packages not already in `package.json`.
- **No `@actions/core` hard dependency** — the exported function must be callable from a plain `node` test process without GitHub Actions context.
- **No changes to assurance-gate.yml trigger events, permissions, or job structure** — only the Node.js logic in the inline `github-script` step changes.
- Do not modify any file under `artefacts/`. These are read-only pipeline inputs.
- Open PRs as drafts only. Never mark ready for review. Never merge.

### Done condition

`npm test` exits 0, `[gpa-sc07] Results: N passed, 0 failed` (N ≥ 8), `assurance-gate.yml` contains no inline `function sourceIntegrity(` definition, `sourceIntegrity` is exported from `scripts/ci-audit-comment.js`.

If any AC is ambiguous or any blocker is not resolvable from the artefact files: add a PR comment describing the specific blocker and stop. Do not improvise a workaround.

## Coding Agent Instructions

_(duplicate heading intentional — template alignment; only the block above is operative)_
