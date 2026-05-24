# Definition of Ready Checklist

## Definition of Ready: Wire CLI validate to CI assurance gate (SC-03)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-03-cli-validate-ci.md`
**Test plan reference:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-03-cli-validate-ci-test-plan.md`
**Verification script:** `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-03-cli-validate-ci-verification.md`
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-25

---

## Contract Proposal

**What will be built:**
H-gate evaluation logic currently in `cli-outer-loop.js` is exposed through `governance-package.js` as exported function(s) (per ADR-013). `bin/skills` is extended with a `--story <slug> --ci` flag that: (a) resolves the story artefact path from `<slug>`, (b) reads `pipeline-state.json` to check `dorStatus` and skips signed-off stories with a skip message, (c) calls the H-gate evaluation function from `governance-package.js`, (d) outputs results in canonical format `[skills-validate] Results: N passed, N failed`, and (e) exits 0 on all-pass or skip, exits 1 on any gate failure. `assurance-gate.yml` is updated to call `node bin/skills validate --story <slug> --ci` for each story in the PR's feature whose `dorStatus` is not `signed-off`. A new test file `tests/check-gpa-sc03-cli-validate-ci.js` covers T1–T5 unit tests and IT1–IT2 integration tests.

**What will NOT be built:**
- Re-evaluating H-checks for stories that are DoD-complete (merged PRs) — historical stories are out of scope.
- Replacing or removing the existing 4 structural file-existence checks in assurance-gate.yml — these remain and run alongside the H-check wiring.
- Making H-gate failures merge-blocking — that is a post-Wave-3 governance decision outside this story's scope.
- Automating `dorStatus: signed-off` write from CI — sign-off remains a deliberate human approval action.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — CI calls `skills validate --story <slug> --ci`; H1–H9 reported as named verdicts | T1 (governance-package exports H-gate fn), T2 (bin/skills uses governance-package), IT1 (spawn exit 0 for passing story) | unit + integration |
| AC2 — All H-pass → exit 0, `[skills-validate] Results: 9 passed, 0 failed` | IT1 (spawn passing story, assert output + exit code) | integration |
| AC3 — Failing H1 → exit 1, names H1 in output | T4 (unit fn call with missing file), IT2 (spawn nonexistent slug, assert H1 in output) | unit + integration |
| AC4 — dorStatus=signed-off → skip, exit 0 | T5 (invoke with signed-off story from pipeline-state) | unit |
| AC5/AC6 — 10-PR false-positive rate monitoring | Post-deploy operator observation; record in pipeline-state at DoD | metric signal |
| AC7 — H-gate functions importable from `governance-package.js`; no independent logic in `bin/skills` | T1 (import check), T2 (grep bin/skills for governance-package ref + no inline H logic) | unit |

**Assumptions:**
- A1: H-gate logic currently lives in `cli-outer-loop.js` `validate()`. The path to expose it via `governance-package.js` is: add a `checkHGates(storyArtefactPath, repoRoot)` export to `governance-package.js` that calls (or re-exposes) the logic from `cli-outer-loop.js`. Alternatively, the implementation may move the logic to `governance-package.js` directly — either approach is acceptable as long as the import path satisfies AC7.
- A2: `dorStatus: signed-off` stories in `pipeline-state.json` are identified by `feature.epics[].stories[].dorStatus === 'signed-off'` (or flat `feature.stories[].dorStatus`).
- A3 (D4 RISK-ACCEPT): For multi-story features (stories nested under epics), slug resolution may not correctly locate the story artefact in all cases. This is a known risk, accepted and logged as D4 in `decisions.md`.

**Estimated touch points:**
Files: `src/enforcement/governance-package.js` (modified — expose H-gate function(s)), `src/enforcement/cli-outer-loop.js` (possibly modified — refactoring to expose via governance-package), `bin/skills` (modified — add `--story`/`--ci` flag), `.github/workflows/assurance-gate.yml` (modified — add `skills validate --ci` step), `tests/check-gpa-sc03-cli-validate-ci.js` (new).
Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 7 ACs. The ADR-013 compliance path (expose H-gates via governance-package.js, not reimplemented in bin/skills) is correctly identified. AC5/AC6 are post-deploy metric signals with no automated test expectation — gap acknowledged in test plan and covered by DoD operator observation. The D4 RISK-ACCEPT for multi-story slug resolution is already logged in decisions.md, satisfying W3.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator responsible for governance quality..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1+T2+IT1, AC2→IT1, AC3→T4+IT2, AC4→T5, AC5→post-deploy, AC6→post-deploy, AC7→T1+T2. AC5/AC6 gaps explicitly acknowledged. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items explicitly listed |
| H5 | Benefit linkage field references a named metric | ✅ | M2 — CI H-gate enforcement coverage |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | reviewStatus: passed; review-2: 0 HIGH. The run-1 HIGH (no AC for governance-package extraction) was resolved by AC7 in run-2. |
| H8 | Test plan has no uncovered ACs | ✅ | All ACs covered; AC5/AC6 post-deploy gaps explicitly acknowledged with metric-signal classification |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream dependency: SC-01. SC-03 reads `dorStatus` from pipeline-state.json — this field exists in the schema (already used in Wave 1). `schemaDepends: [dorStatus]`. Schema field verified present. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-013, ADR-009, ADR-011 referenced and addressed. Output format references SC-04 standard. Architecture guardrails checked. |
| H-E2E | No CSS-layout-dependent ACs without RISK-ACCEPT | ✅ | No CSS-layout ACs — not applicable |
| H-NFR | NFR profile exists; story has NFR section | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists; story has output format, performance, no external npm deps NFRs |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No regulatory compliance clause for SC-03 — not applicable |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | NFR profile present (story has non-None NFRs) | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ | `Hamis — 2026-05-24` present in discovery.md |
| H-ADAPTER | Injectable adapter wiring check | ✅ | SC-03 does not introduce injectable adapters |

**Hard blocks: 17/17 passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | SC-03 review run-2 carried forward MEDIUM 2-M1 (AC1 slug resolution mechanism). Acknowledged and logged as D4 RISK-ACCEPT in `artefacts/2026-05-24-governance-platform-architecture/decisions.md`. | D4 logged in decisions.md |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script was produced by the pipeline. Post-deploy metric scenarios (AC5/AC6) are described as operator observation steps, not automated checks. Risk: false-positive rate may not be measured systematically. | Operator acknowledged — proceed. Operator will review before DoD. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | AC5/AC6 gaps are classified as metric-signal / post-deploy observation — not UNCERTAIN. Explicitly acknowledged in test plan. | — |

---

## Oversight

**Oversight level: Medium** (per parent epic `gpa-epic-02-ci-enforcement-compliance`).

SC-03 changes what CI evaluates on every PR push to master. A false-positive rate above 1 in 20 PRs would block delivery on this repository. Share this DoR artefact with the tech lead before dispatching to the coding agent. No formal sign-off required; awareness is sufficient.

**Dispatch note:** SC-03 has an upstream dependency on SC-01 (`gpa-sc-01-trace-contract`). SC-03 can be dispatched while SC-01 is in progress; H9 evaluation will warn until `standards/governance/trace-contract.md` exists, but this is expected behaviour and does not prevent SC-03 from running. Coordinate timing to avoid H9 false-negatives in CI.

---

## Coding Agent Instructions

**Story:** gpa-sc-03-cli-validate-ci — Wire CLI validate to CI assurance gate

**Oversight level:** Medium — share DoR artefact with tech lead before starting; no blocking sign-off required.

### Before writing any code

1. Run `npm test` and confirm it exits 0 — this is your clean baseline.
2. Read the full story artefact: `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-03-cli-validate-ci.md`
3. Read the test plan: `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-03-cli-validate-ci-test-plan.md`
4. Read the DoR contract: `artefacts/2026-05-24-governance-platform-architecture/dor/gpa-sc-03-cli-validate-ci-dor-contract.md`
5. Read `src/enforcement/governance-package.js` to understand its current exports.
6. Read `src/enforcement/cli-outer-loop.js` to understand the existing `validate()` implementation and H-gate logic.
7. Read `bin/skills` to understand the existing `validate` subcommand structure.

### Implementation order (TDD)

**Task 1 — Write failing tests first (RED)**
Create `tests/check-gpa-sc03-cli-validate-ci.js`. T1 (governance-package exports H-gate fn) will fail because `governance-package.js` does not yet export H-gate functions. This is the expected RED state.

**Task 2 — Expose H-gate functions via `governance-package.js` (GREEN for T1, T2)**
Add a `checkHGates(storyArtefactPath, repoRoot)` export to `governance-package.js` that calls (or wraps) the H-gate evaluation logic. The implementation may either: (a) move the H-gate logic from `cli-outer-loop.js` to `governance-package.js`, or (b) have `governance-package.js` require and re-export the function from `cli-outer-loop.js`. Option (b) is acceptable as a lower-risk approach. T1 and T2 must pass.

**Task 3 — Add `--story <slug> --ci` flag to `bin/skills validate` (GREEN for IT1, IT2, T3–T5)**
1. Parse `--story <slug>` and `--ci` flags.
2. Resolve the story artefact path from the slug (check `artefacts/` for a file matching the slug).
3. Read `pipeline-state.json`; if the story's `dorStatus` is `signed-off`, print skip message and exit 0.
4. Call `governance-package.checkHGates(storyArtefactPath, process.cwd())`.
5. Print results in canonical format `[skills-validate] Results: N passed, N failed`.
6. Exit 0 if all pass; exit 1 if any fail.

**Task 4 — Wire into assurance-gate.yml**
Add a step to assurance-gate.yml that calls `node bin/skills validate --story <slug> --ci` for each story in the PR's feature. The feature slug is resolved via the existing `extractPRSlug` mechanism. Use the D4 RISK-ACCEPT assumption: if slug resolution fails for a multi-story feature, log the failure but do not block the gate — report as a path resolution warning.

**Task 5 — Run full test suite**
`npm test` must exit 0 with `[gpa-sc03] Results: N passed, 0 failed`.

### Non-negotiable implementation constraints

- **ADR-013 compliance:** H-gate evaluation functions MUST be importable from `governance-package.js`. `bin/skills` and `cli-outer-loop.js` MUST NOT contain independent H-gate evaluation logic that is not exposed through `governance-package.js`.
- **Output format:** `[skills-validate] Results: N passed, N failed` — this is the canonical format from SC-04. Do not vary the prefix or the `N passed, N failed` suffix.
- **No external npm dependencies.**
- **Non-merge-blocking:** The CI step that calls `skills validate --ci` must use `continue-on-error: true` in `assurance-gate.yml`. This means H-gate failures are reported in the CI summary and the audit comment but do not fail the workflow job or block merge. Do NOT use `exit-code: 1` at the workflow job level. The process exit code from `bin/skills` can be 1 (correct — AC3 requires it) — `continue-on-error: true` handles the workflow-level behaviour so the job continues and the audit comment captures the failure.
- Do not modify any file under `artefacts/`. These are read-only pipeline inputs.
- Open PRs as drafts only. Never mark ready for review. Never merge.

### Done condition

`npm test` exits 0, `[gpa-sc03] Results: N passed, 0 failed` (N ≥ 5), `governance-package.js` exports an H-gate evaluation function, `bin/skills validate --story gpa-sc-01-trace-contract --ci` exits 0 (after SC-01 is DoD-complete), `bin/skills validate --story nonexistent-slug --ci` exits 1 with H1 named in output.

If any AC is ambiguous or any blocker is not resolvable from the artefact files: add a PR comment describing the specific blocker and stop. Do not improvise a workaround.

## Coding Agent Instructions

_(duplicate heading intentional — template alignment; only the block above is operative)_
