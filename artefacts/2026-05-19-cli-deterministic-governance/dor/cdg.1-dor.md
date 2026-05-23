# Definition of Ready: `skills validate` command — CLI entry point, exit code framework, and governance check

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.1.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.1-test-plan.md
**Verification script:** artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.1-verification.md
**Review artefact:** artefacts/2026-05-19-cli-deterministic-governance/review/cdg.1-review-1.md
**Decisions artefact:** artefacts/2026-05-19-cli-deterministic-governance/decisions.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ PASS | "As a **platform maintainer**, I want to run `node bin/skills validate`... So that I can confirm..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 6 ACs, all in Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1→3 tests (T4a–T4c), AC2→3 (T5a–T5c), AC3→4 (IT1a–IT2b), AC4→3 (T6a–T6c), AC5→6 (T1–T3, G1a–G1c), AC6→2 (T7a–T7b) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ PASS | 5 explicit out-of-scope items (H2-H9 impls, state writes, advance/emit-trace, cli-adapter.js, lockfile pinning) |
| H5 | Benefit linkage field references a named metric | ✅ PASS | "M3 — Gate logic unit test fixtures (baseline establishment)" |
| H6 | Complexity is rated | ✅ PASS | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ PASS | 0 HIGH findings in cdg.1-review-1.md (2 MEDIUM, acknowledged in decisions.md RISK-ACCEPT-001) |
| H8 | Test plan has no uncovered ACs | ✅ PASS | All 6 ACs covered; NFR3 pre-implementation state limitation acknowledged in test plan gap table |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Story Dependencies: "Upstream: None" — no upstream schema check required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ PASS | 5 architecture constraints listed; Category E score 5/5 in review (no HIGH findings) |
| H-E2E | No CSS-layout-dependent ACs without E2E tooling or RISK-ACCEPT | ✅ PASS | CLI story — no UI, no CSS-layout-dependent ACs (`hasLayoutDependentGaps: false`) |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-19-cli-deterministic-governance/nfr-profile.md |
| H-NFR2 | Compliance NFRs with named regulatory clauses have human sign-off | ✅ PASS | OWASP A01 is a standards reference, not a regulated clause requiring sign-off; `regulated: false` in context.yml |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ PASS | "[x] Internal — pipeline artefacts contain delivery planning data" |
| H-NFR-profile | NFR profile present and story has NFRs declared | ✅ PASS | NFR profile active; story declares Performance, Security, Portability, No-new-deps NFRs |
| H-GOV | Discovery `## Approved By` section has ≥1 non-blank entry | ✅ PASS | "Hamis — 2026-05-19" in discovery.md. M1 signal: role unverified for independent non-engineer audit standard — accepted on solo personal non-regulated project |
| H-ADAPTER | Injectable adapter wiring check | ✅ PASS | No injectable adapter (setX) pattern introduced; `validate` is a pure exported function, not a dependency-injection wiring |

**Result: ALL 17 HARD BLOCKS PASSED**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | N/A | N/A |
| W2 | Scope stability is declared | ✅ | N/A | N/A |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ ACKNOWLEDGED | Unacknowledged medium findings increase review rework risk at PR | decisions.md RISK-ACCEPT-001 (2026-05-23) — 1-M1 (uninstructive fixture) + 1-M2 (AC3 exit code unspecified) |
| W4 | Verification script reviewed by a domain expert | ⚠️ ACKNOWLEDGED | Misspecified behaviour may not be caught until post-merge | decisions.md RISK-ACCEPT-002 (2026-05-23) — operator acts as sole domain expert on solo project |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | N/A — all gap table entries have explicit mitigations | N/A |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: `skills validate` command — CLI entry point, exit code framework, and governance check
Story artefact: artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.1.md
Test plan: artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.1-test-plan.md
Verification script: artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.1-verification.md
DoR contract: artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.1-dor-contract.md

Goal:
Make every test in the test plan pass. The test plan has 24 tests across two
files: tests/check-cli-outer-loop.js (21 tests) and tests/check-cli-governance.js
(3 governance tests). Both files are currently in TDD red state (they fail because
the implementation files do not exist yet). Your task is to write the minimum
implementation that makes all 24 tests pass — no additional scope.

Files to create:
- bin/skills — thin Node.js entry point with shebang #!/usr/bin/env node; reads
  process.argv, routes 'validate' subcommand to cli-outer-loop.js, writes stdout/
  stderr, calls process.exit(exitCode)
- src/enforcement/cli-outer-loop.js — exports validate(artefactPath, gateName,
  repoRoot) returning { exitCode, stdout, stderr }; must not call process.exit()
  directly; must not write to any file
- tests/check-cli-outer-loop.js — already exists in TDD red state; do not modify
  the test assertions; you may add helper setup only
- tests/check-cli-governance.js — already exists in TDD red state; do not modify

File to update:
- package.json — append both test files to the npm test chain:
  && node tests/check-cli-outer-loop.js && node tests/check-cli-governance.js

Constraints:
- Language: Node.js (built-in modules only — fs, path). Zero new entries in
  package.json dependencies or devDependencies.
- Exit codes: 0 (pass), 1–7 (H-category violations, H1 maps to 1), 8 (unsupported
  gate / path traversal / insufficient arguments). Do not use exit codes outside 0–8.
- The validate function must be pure and testable: it returns { exitCode, stdout,
  stderr } and does not call process.exit(), write files, or make network calls.
- Path traversal guard is mandatory (OWASP A01): resolve artefactPath with
  path.resolve(), assert it starts with repoRoot + path.sep, return exit 8 if not.
  Do not log the raw path value in stderr.
- Read-only enforcement: no fs.writeFile, fs.appendFile, or fs.writeFileSync in
  cli-outer-loop.js. The validate command is read-only.
- Portability: bin/skills must have the shebang #!/usr/bin/env node as its first
  line. No OS-specific paths or Windows-only APIs.
- Out of scope: H2–H9 check implementations, state writes, any CLI subcommand
  other than 'validate', modification of cli-adapter.js, lockfile pinning.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate named
  mandatory constraints or Active ADRs. If the file does not exist, note this in a
  PR comment.
- Open a draft PR when all 24 tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review.

Oversight level: Medium — platform maintainer reviews PR before merge
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness before assigning to coding agent
**Signed off by:** Hamis — 2026-05-23
