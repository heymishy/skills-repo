# Definition of Ready: Fix cli-advance Boolean Coercion (B3)

**Story reference:** artefacts/2026-05-27-cli-advance-boolean-coercion/stories/b3-cli-advance-boolean-coercion.md
**Test plan reference:** artefacts/2026-05-27-cli-advance-boolean-coercion/test-plans/b3-boolean-coercion-test-plan.md
**Verification script:** artefacts/2026-05-27-cli-advance-boolean-coercion/verification-scripts/b3-boolean-coercion-verification.md
**Assessed by:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-27

---

## Contract Proposal

**What will be built:**

A `BOOLEAN_FIELDS` static array will be added to `src/enforcement/cli-advance.js`, listing the story-level fields defined as `type: boolean` in `.github/pipeline-state.schema.json` (`releaseReady`, `layoutGapsAtMerge`, `layoutGapsRiskAccepted`, `gateChecksumVerified`, `regulated`, `stalenessFlag`). In the `advance()` function's apply loop, after the existing integer coercion (`/^\d+$/` → `Number()`), a new coercion block will check whether the field name is in `BOOLEAN_FIELDS`. If it is: `"true"` → `true`, `"false"` → `false`; any other value returns `{ exitCode: 8, stderr: '...' }` without writing. Fields not in `BOOLEAN_FIELDS` are unaffected.

**What will NOT be built:**

- Live schema parsing at runtime — the registry is a static array, consistent with the existing `ENUM_FIELDS` pattern.
- Case-insensitive coercion (`"TRUE"` / `"FALSE"`) — only lowercase `"true"` / `"false"` are coerced.
- Coercion for feature-level boolean fields (e.g. `features[].regulated`) — story-level only.
- Changes to `cli-gate-advance.js` — it delegates to `advance()` so coercion is inherited automatically.
- Changes to `pipeline-state-writer.js` — already delegates to `advance()`.

**How each AC will be verified:**

| AC | Test | Type |
|---|---|---|
| AC1: `"true"` → boolean `true` for `releaseReady` | T1: call `advance()`, assert `story.releaseReady === true` and `typeof === 'boolean'` | Unit |
| AC2: `"false"` → boolean `false` for `releaseReady` | T2: call `advance()`, assert `story.releaseReady === false` and `typeof === 'boolean'` | Unit |
| AC3: Non-coercible value → exit 8, no write | T4: call `advance()` with `releaseReady=maybe`, assert exit 8, stderr content, story unchanged | Unit |
| AC4: Non-boolean string fields unaffected | T5: advance `stage=implementation` and `health=green`, assert string type preserved | Unit |
| AC5: Integer coercion (cdg.6) not broken | T3: advance `acVerified=4`, assert `typeof === 'number'` | Unit (regression) |
| AC6: Schema validation passes after boolean write | T6: write boolean via advance, run `check-pipeline-state-integrity.js`, assert exit 0 | Integration |

**Assumptions:**

- `.github/pipeline-state.schema.json` is the authoritative source for the initial `BOOLEAN_FIELDS` list; the list will be populated at implementation time by scanning schema for `"type": "boolean"` at the story-level properties depth.
- The `advance()` function is the single write path for all pipeline-state story-level field updates (per cdg.6 rule). `gate-advance` and `pipeline-state-writer.js` both delegate to `advance()`.
- The `check-pipeline-state-integrity.js` script can be exercised with a fixture-based state file in T6 (or via inline schema validation if the script requires the real file path).

**Estimated touch points:**

Files: `src/enforcement/cli-advance.js` (add `BOOLEAN_FIELDS`, modify apply loop), `tests/check-b3-boolean-coercion.js` (new test file), `package.json` (add test to chain)
Services: None
APIs: None

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs. No mismatches between the contract and the test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a pipeline operator…" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | ✅ | T1→AC1, T2→AC2, T3→AC5, T4→AC3, T5→AC4, T6→AC6 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 explicit out-of-scope items |
| H5 | Benefit linkage field references a named metric | ✅ | CDG M4 — schema validation reliability |
| H6 | Complexity is rated | ✅ | Complexity: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Short-track defect fix — review skipped per pipeline convention |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs mapped to T1–T6 |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Constraints listed in story; ENUM_FIELDS pattern maintained |
| H-E2E | Any CSS-layout-dependent ACs? | ✅ | No CSS-layout ACs — N/A |
| H-NFR | NFR profile or explicit "None" | ✅ | NFRs: None — reviewed 2026-05-27 |
| H-NFR2 | Compliance NFRs with regulatory clause | ✅ | None — N/A |
| H-NFR3 | Data classification not blank | ✅ | NFRs: None — N/A |
| H-NFR-profile | NFR profile presence check | ✅ | NFRs: None — profile not required |
| H-GOV | Approved By section in discovery artefact | ✅ | Short-track exemption: no discovery artefact. Origin: workspace/capture-log.md B3 entry, operator-approved. |
| H-ADAPTER | Injectable adapter wiring check | ✅ | No new injectable adapters introduced — N/A |

**Hard blocks result: ALL PASS — 17/17**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs identified or "None — confirmed" | ✅ | NFRs: None — confirmed in story |
| W2 | Scope stability declared | ✅ | Scope stability: Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | Short-track — no review — N/A |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed: operator confirmed during DoR run |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gap table items unaddressed |

**Warnings result: ALL CLEAR — no warnings to acknowledge**

---

## Standards injection

Domain tags: None declared in story.
Standards injection: skipped — no domain field.

---

## Oversight level

**Low** — complexity 1, single-file defect fix, no external dependencies, no user-facing behaviour changes. No sign-off required.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix cli-advance Boolean Coercion (B3) — artefacts/2026-05-27-cli-advance-boolean-coercion/stories/b3-cli-advance-boolean-coercion.md
Test plan: artefacts/2026-05-27-cli-advance-boolean-coercion/test-plans/b3-boolean-coercion-test-plan.md

Goal:
Make every test in tests/check-b3-boolean-coercion.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Implementation steps:
1. Write tests/check-b3-boolean-coercion.js (failing tests first — RED)
2. Modify src/enforcement/cli-advance.js — add BOOLEAN_FIELDS array and coercion block (GREEN)
3. Add tests/check-b3-boolean-coercion.js to the npm test chain in package.json
4. Run npm test — all tests must pass

Constraints:
- Only modify: src/enforcement/cli-advance.js, tests/check-b3-boolean-coercion.js, package.json
- Do NOT modify: bin/skills, src/enforcement/cli-gate-advance.js, src/web-ui/*, .github/pipeline-state.json, any artefact file
- Do NOT add live schema parsing — BOOLEAN_FIELDS is a static array, consistent with ENUM_FIELDS
- Prototype pollution guard (PROTO_BLOCKED) must remain intact and unmodified
- Atomic write pattern (temp-file + fs.renameSync) must remain unchanged
- ADR-H7.1: no child_process spawning
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Boolean fields to register in BOOLEAN_FIELDS (from schema — story-level):
  releaseReady, layoutGapsAtMerge, layoutGapsRiskAccepted, gateChecksumVerified, regulated, stalenessFlag

Test file: tests/check-b3-boolean-coercion.js
  Follow the exact structure pattern of tests/check-cdg3-advance-cli.js:
  - assert(condition, label) function with passed/failed counters
  - makeTmpDir, writeFixture, readFixture, makeFeature, makeStory helpers
  - loadModule() pattern for requiring src/enforcement/cli-advance.js
  - Console prefix: [b3-boolean-coercion]
  - Cleanup: fs.rmSync(tmpDir, { recursive: true, force: true }) in each test block
  - Exit: process.exit(failed > 0 ? 1 : 0)

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — Low oversight
