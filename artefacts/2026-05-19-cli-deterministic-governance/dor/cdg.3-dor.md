# Definition of Ready: `skills advance` CLI command — CI-facing state write with typed exit codes

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.3.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.3-test-plan.md
**Verification script:** artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.3-verification.md
**Review artefact:** artefacts/2026-05-19-cli-deterministic-governance/review/cdg.3-review-1.md
**Decisions artefact:** artefacts/2026-05-19-cli-deterministic-governance/decisions.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ PASS | "As a **platform maintainer**, I want to run `node bin/skills advance`... So that CI harnesses can advance pipeline state..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 8 ACs, all in Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1→T1+IT1, AC2→T2, AC3→T3, AC4→T4a+T4b, AC5→T5, AC6→T6+IT1, AC7→npm test chain, AC8→T7 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ PASS | 5 explicit out-of-scope items: validate-before-advance enforcement, trace emission, web UI route, dry-run flag, CLI-triggered trace |
| H5 | Benefit linkage field references a named metric | ✅ PASS | "M4 — Schema violation rate on CLI-written state writes" |
| H6 | Complexity is rated | ✅ PASS | Rating: 2 (some ambiguity around pipeline-state-writer.js atomic write pattern) |
| H7 | No unresolved HIGH findings from the review report | ✅ PASS | 0 HIGH findings in cdg.3-review-1.md (MEDIUM finding resolved inline — NFR section added; RISK-ACCEPT-004 logged) |
| H8 | Test plan has no uncovered ACs | ✅ PASS | All 8 ACs covered; 9 tests total (7 unit + 1 integration + 1 governance) |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Upstream dependencies cdg.1 and cdg.2 are DoD-complete; `bin/skills` and `pipeline-state-writer.js` exist on master |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ PASS | 5 architecture constraints listed (ADR-H7.1, ADR-001, schema sync rule, no new deps, D37); Category E no HIGH findings |
| H-E2E | No CSS-layout-dependent ACs without E2E tooling or RISK-ACCEPT | ✅ PASS | CLI story — no UI, no CSS-layout-dependent ACs (`hasLayoutDependentGaps: false`) |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-19-cli-deterministic-governance/nfr-profile.md |
| H-NFR2 | Compliance NFRs with named regulatory clauses have human sign-off | ✅ PASS | No regulated clauses; `regulated: false` in context.yml |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ PASS | "[x] Internal — pipeline artefacts contain delivery planning data" |
| H-NFR-profile | NFR profile present and story has NFRs declared | ✅ PASS | NFR profile active; story NFR section: "None — confirmed — cdg.3 is a CLI utility. No latency SLA, no uptime requirement, no user-facing UI." |
| H-GOV | Discovery `## Approved By` section has ≥1 non-blank entry | ✅ PASS | "Hamis — 2026-05-19" in discovery.md |
| H-ADAPTER | Injectable adapter wiring check | ✅ PASS | cdg.3 CLI binary calls `pipeline-state-writer.js` via `require()` directly — no injectable setX pattern introduced. D37 conditional ("if a default adapter is introduced") does not apply to a pure CLI binary that owns its own require chain. |

**Result: ALL 17 HARD BLOCKS PASSED**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | N/A | N/A |
| W2 | Scope stability is declared | ✅ | N/A | N/A |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ ACKNOWLEDGED | Finding resolved inline — NFR section added before review report written | decisions.md RISK-ACCEPT-004 (2026-05-24) — NFR section absent at review time; resolved inline |
| W4 | Verification script reviewed by a domain expert | ⚠️ ACKNOWLEDGED | Misspecified behaviour may not be caught until post-merge | decisions.md RISK-ACCEPT-005 (2026-05-24) — operator acts as sole domain expert on solo project |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | N/A — all gap table entries have explicit mitigations | N/A |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: `skills advance` CLI command — CI-facing state write with typed exit codes
Story artefact: artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.3.md
Test plan: artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.3-test-plan.md
Verification script: artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.3-verification.md
DoR contract: artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.3-dor-contract.md

Goal:
Make every test in the test plan pass. The test plan has 9 tests in
tests/check-cdg3-advance-cli.js (currently failing because the advance handler
does not exist). Your task is to write the minimum implementation that makes all
9 tests pass — no additional scope.

Files to create:
- src/enforcement/cli-advance.js — exports advance(featureSlug, storyId,
  fieldPairs, stateFilePath) returning { exitCode, stdout, stderr }; validates
  that featureSlug exists in pipeline-state.json, validates enum fields against
  pipeline-state.schema.json allowed values, writes atomically via temp-file
  rename; exits 8 on unknown slug, malformed field=value, or missing args; exits
  non-zero with allowed values listed on invalid enum.
- tests/check-cdg3-advance-cli.js — already expected by test plan; if not yet
  on disk write it now in TDD red state before implementing.

Files to modify:
- bin/skills — add routing for 'advance' subcommand alongside existing 'validate'
  routing; call cli-advance.js, write stdout/stderr, call process.exit(exitCode).
- package.json — append && node tests/check-cdg3-advance-cli.js to npm test chain.

Constraints:
- Language: Node.js built-in modules only (fs, path, crypto). Zero new npm
  dependencies.
- Atomic write: write to pipeline-state.json.tmp in same directory, then
  fs.renameSync to pipeline-state.json. Never a direct overwrite.
- Schema validation: read pipeline-state.schema.json to determine allowed enum
  values before writing. Reject unknown enum values with their allowed list in
  stderr.
- Exit codes: 0 (success), 8 (all error conditions — unknown slug, missing args,
  malformed field, invalid enum). Do not use codes 1–7 for advance errors.
- cli-advance.js must not call process.exit() directly. bin/skills calls
  process.exit(exitCode) after receiving the return value.
- Out of scope: validate-before-advance enforcement, trace emission, web UI route
  wiring, --dry-run flag, any new bin/skills subcommands beyond advance.
- Read .github/architecture-guardrails.md before implementing. Do not introduce
  patterns listed as anti-patterns or violate named mandatory constraints or
  Active ADRs.
- Open a draft PR when all 9 tests pass — do not mark ready for review.
- If you encounter ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review.

Oversight level: Medium — platform maintainer reviews PR before merge
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness before assigning to coding agent
**Signed off by:** Hamis — 2026-05-24
