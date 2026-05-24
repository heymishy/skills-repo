# Definition of Ready Checklist

## Definition of Ready: Add `skills init` command for atomic feature initialisation (SC-05)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-05-skills-init.md`
**Test plan reference:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-05-skills-init-test-plan.md`
**Verification script:** `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-05-skills-init-verification.md`
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-25

---

## Contract Proposal

**What will be built:**
A new module `src/enforcement/cli-init.js` that exports `init(slug, description, repoRoot)` returning `{exitCode, stdout, stderr}`. No `process.exit()` calls — same pattern as `cli-advance.js`. The `bin/skills` dispatcher will be extended with an `init` branch that calls this module. Slug validation regex `/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/`, prototype pollution guard, path traversal guard (`path.resolve(outputPath).startsWith(repoRoot + path.sep)`), and atomic write (tmp-then-rename) are mandatory. The command will create a discovery-stage stub in pipeline-state.json with fields: `slug`, `name` (from --description or title-cased slug), `stage: "discovery"`, `health: "green"`, `stories: []`, `metrics: []`, `updatedAt: <today ISO date>`.

**What will NOT be built:**
- No modification to `skills advance` behaviour — it intentionally exits 8 on unknown slug
- No additional fields beyond the discovery-stage stub (subsequent stages add their own fields)
- No creation of artefact directories — CLI writes to pipeline-state.json only
- No GUI or web UI integration
- No changes to any enforcement module logic (assurance-gate.yml, run-assurance-gate.js, governance-package.js, journey.js)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — valid slug creates correct stub atomically | T1 (module exports init), T2 (valid slug → exit 0 + correct fields), T3 (--description → name), T4 (no description → title-cased), T5 (no .tmp left), IT1 (spawn exits 0) | unit + integration |
| AC2 — duplicate slug exits non-zero, state unchanged | T6 (duplicate → non-zero exit), T7 (error contains slug, state unchanged), IT2 (spawn duplicate non-zero) | unit + integration |
| AC3 — invalid slugs exit non-zero | T8-T13 (6 invalid slug patterns) | unit |
| AC4 — check-pipeline-state-integrity passes after init | T14 | unit |
| AC5 — `node bin/skills` lists init subcommand | IT3 | integration |

**Assumptions:**
The module pattern follows `cli-advance.js` exactly: pure function, no `process.exit()`, returns `{exitCode, stdout, stderr}`. Tests that need to write to pipeline-state.json will use a temp copy inside the repo root to satisfy the path-traversal guard (same approach as cli-advance tests). The `bin/skills` dispatcher passes `repoRoot = process.cwd()` or `path.resolve(__dirname, '..')`.

**Estimated touch points:**
Files: `src/enforcement/cli-init.js` (new), `bin/skills` (modified — add init branch)
Services: none. APIs: none. Read/write: `.github/pipeline-state.json` (via tmp-then-rename)

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. The atomic write pattern (tmp-then-rename, no process.exit, repoRoot-scoped path guard) is consistent with cli-advance.js precedent and satisfies NFR requirements. All 5 ACs are covered by the implementation plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1-T5+IT1, AC2→T6-T7+IT2, AC3→T8-T13, AC4→T14, AC5→IT3 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit items |
| H5 | Benefit linkage field references a named metric | ✅ | M3 — Architecture blind-spot recurrence rate |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | reviewStatus: passed |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011, Plain Node.js, atomic write, input validation — all populated; no guardrail violation |
| H-E2E | No CSS-layout-dependent ACs without RISK-ACCEPT | ✅ | No CSS-layout ACs — not applicable |
| H-NFR | NFR profile exists; story has NFR section | ✅ | nfr-profile.md exists; story NFRs: Atomicity, No external deps, Input validation, Exit codes; NFR profile has mandatory SC-05 security entry |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | copilot-instructions.md disk-canonicity and path-traversal rules are internal standards, not external regulatory clauses — no external sign-off required |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | NFR profile present (story has non-None NFRs) | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ | `Hamis — 2026-05-24` present in discovery.md |
| H-ADAPTER | Injectable adapter wiring check | ✅ | SC-05 introduces no injectable adapters (setX() patterns); it owns its own require chain per P13 pattern |

**Hard blocks: 17/17 passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings for SC-05 — not applicable | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Solo developer context: agent-authored script aligned to test plan. All steps are mechanically executable commands. Risk low. | Hamis — 2026-05-25 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No uncertain items — not applicable | — |

---

## Oversight Level

**Oversight:** Low
**Rationale:** SC-05 adds a new CLI command to the non-enforcement path (pipeline-state.json feature creation). No changes to enforcement logic, CI configuration, or shared governance modules. Low oversight confirmed in the epic artefact.
**Sign-off required:** No (Low oversight)
**Signed off by:** Not required

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add `skills init` command for atomic feature initialisation — artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-05-skills-init.md
Test plan: artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-05-skills-init-test-plan.md
Verification script: artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-05-skills-init-verification.md

Goal:
Make every test in tests/check-gpa-sc05-skills-init.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

What to build:
1. src/enforcement/cli-init.js — exports init(slug, description, repoRoot)
   returning {exitCode, stdout, stderr}. NO process.exit() calls.
   Pattern: follow cli-advance.js exactly (same module structure).
   Required behaviours:
   - Slug validation: /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/ (or equivalent)
     All of these must fail validation: spaces, /, .., _, leading hyphen, trailing hyphen
   - Duplicate slug: read state file, check for existing slug, exit non-zero with
     'Error: feature slug \'<slug>\' already exists in pipeline-state.json'
     Do NOT modify the state file on duplicate.
   - Prototype pollution guard: reject slugs that are Object prototype property names
     (__proto__, constructor, prototype, etc.)
   - Path traversal guard: path.resolve(stateFilePath).startsWith(repoRoot + path.sep)
     before any write — reject with non-zero exit if guard fails
   - Atomic write: write to pipeline-state.json.tmp first, validate JSON,
     then fs.renameSync to pipeline-state.json. No .tmp left on disk after
     success OR after any failure.
   - New feature stub fields (all required):
       slug: <provided slug>
       name: <description value if --description given, otherwise title-case(slug.replace(/-/g,' '))>
       stage: "discovery"
       health: "green"
       stories: []
       metrics: []
       updatedAt: <today as ISO date string YYYY-MM-DD>
   - Append new feature to state.features[] — do not replace or sort the array.
   - Exit 0 with stdout message on success.
   - Exit code contract (mandatory — tests must assert the specific code, not just non-zero):
     - `0` — success
     - `1` — validation error (invalid slug format, missing slug argument, path traversal guard fires)
     - `2` — conflict (slug already exists in pipeline-state.json)
   - T6 must assert `exitCode === 2`, not just `exitCode !== 0`. IT2 must also assert exit code 2.

2. bin/skills — add init dispatch branch:
   if (subcommand === 'init') {
     const slug = args[1];
     const descIdx = args.indexOf('--description');
     const description = descIdx !== -1 ? args[descIdx + 1] : null;
     const { init } = require('../src/enforcement/cli-init');
     const result = init(slug, description, repoRoot);
     process.stdout.write(result.stdout);
     if (result.stderr) process.stderr.write(result.stderr);
     process.exit(result.exitCode);
   }
   Also update the usage/help output to include:
     init <slug> [--description "..."]   Create a new feature stub in pipeline-state.json

3. tests/check-gpa-sc05-skills-init.js — create RED first, then GREEN.
   Test prefix: [gpa-sc05]
   Tests must use a temp copy of pipeline-state.json inside the repo root
   (to satisfy path-traversal guard). See test plan for full list (T1-T14, IT1-IT3,
   NFR-T1 through NFR-T3).

Key test file for reference pattern: src/enforcement/cli-advance.js
Key constraint: tests that write to state must use tmpStateFile = path.join(repoRoot,
  'pipeline-state.test-' + Date.now() + '.json') — inside repoRoot so path guard passes.

Constraints:
- No external npm dependencies (must run with only `node` available)
- CommonJS modules (require/module.exports)
- No process.exit() in the module — only in bin/skills dispatcher
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Do not touch: src/enforcement/cli-advance.js, governance-package.js,
  run-assurance-gate.js, assurance-gate.yml, journey.js
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter ambiguity not covered by the ACs or tests: add a PR comment

Test output format (mandatory):
  [gpa-sc05] Results: N passed, 0 failed

Oversight level: Low
```
