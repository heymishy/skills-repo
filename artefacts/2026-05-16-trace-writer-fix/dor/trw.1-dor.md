# Definition of Ready: trw.1 — CI Trace Writer: Guarantee One Fresh JSONL Record per Master Push

**Story reference:** artefacts/2026-05-16-trace-writer-fix/stories/trw.1-ci-trace-writer.md
**Test plan reference:** artefacts/2026-05-16-trace-writer-fix/test-plans/trw.1-ci-trace-writer-test-plan.md
**Verification script:** artefacts/2026-05-16-trace-writer-fix/test-plans/trw.1-ci-trace-writer-test-plan.md (Human AC verification script section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**Discovery artefact:** artefacts/2026-05-16-trace-writer-fix/discovery.md
**NFR profile:** N/A — story declares NFRs: None (reviewed 2026-05-16)
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-16

---

## Contract Proposal

**What will be built:**

1. A new script `scripts/write-ci-trace.js` that:
   - Reads `GITHUB_RUN_ID`, `GITHUB_SHA`, `GITHUB_REF`, and `GITHUB_RUN_STARTED_AT` from the environment
   - Constructs one JSONL record with the 7 required fields (AC2)
   - Writes to `workspace/traces/{ISO-timestamp-with-colons-as-dashes}-ci-{8-char-sha}.jsonl` (AC3)
   - Creates the directory if absent (`{ recursive: true }`)
   - Exits 0 on success, exits 1 on write failure
   - Does not log `GITHUB_TOKEN` or any secret

2. A modification to `.github/workflows/trace-commit.yml` to add a step calling `node scripts/write-ci-trace.js` **before** the existing artifact download step.

3. A new test file `tests/check-trw1-trace-writer.js` with tests T1–T14 as specified in the test plan.

**What will NOT be built:**
- Changes to `assurance-gate.yml` artifact generation or upload logic
- Backfilling of historical trace records
- Any deletion or modification of existing trace files on `origin/traces`
- Changes to `improvement-agent-schedule.yml`

**How each AC will be verified:**

| AC | Test(s) | Type |
|----|---------|------|
| AC1 — Fresh record per push | T1, T12, T13 | Unit + Integration (YAML parse) |
| AC2 — Correct record content | T3, T4, T5, T6, T7, T8 | Unit |
| AC3 — Naming convention | T2 | Unit |
| AC4 — Additive to existing traces | T13 | Integration (YAML parse) |
| AC5 — Improvement agent compatibility | T3, T4 | Unit |
| AC6 — No regression on assurance-gate | T14 | Integration (YAML parse) |

**Regression:** Run full test suite (`npm test`). Zero new failures.

---

## Contract Review

✅ **Contract review passed** — two-file implementation (new script + workflow step), one new test file, fully additive. No existing behaviour changed. Artifact download path preserved. No schema changes. No injectable adapters.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As a platform reliability engineer, I want... So that..." |
| H2 | ≥3 ACs in GWT format | ✅ PASS | AC1–AC4 all in Given/When/Then format |
| H3 | Every AC has ≥1 test | ✅ PASS | All 6 ACs covered: AC1→T1/T12/T13, AC2→T3-T8, AC3→T2, AC4→T13, AC5→T3/T4, AC6→T14 |
| H4 | Out-of-scope populated | ✅ PASS | 3 explicit out-of-scope items stated in story |
| H5 | Benefit linkage | ✅ PASS | Platform trace freshness — P14 secondary fix; MM1 signal quality |
| H6 | Complexity rated | ✅ PASS | Complexity: 1 — Well understood, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — 0 HIGH findings (no formal review) |
| H8 | No uncovered ACs | ✅ PASS | All 6 ACs covered by T1–T14 |
| H8-ext | Cross-story schema dep | ✅ PASS | No upstream story dependencies declared — schema check not required |
| H9 | Architecture constraints populated | ✅ PASS | D37 N/A (no adapters). Path traversal N/A (hardcoded path). Credential guard via T11. |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS (N/A) | No CSS layout ACs |
| H-NFR | NFR profile or explicit None | ✅ PASS | Story declares "NFRs: None — reviewed 2026-05-16" |
| H-NFR2 | Compliance NFR with named regulatory clause | ✅ PASS (N/A) | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ PASS (N/A) | No NFR profile; story declares None |
| H-NFR-profile | NFR profile check | ✅ PASS | Story's NFRs field is "None" — profile check not required |
| H-GOV | Approved By in discovery artefact | ✅ PASS | artefacts/2026-05-16-trace-writer-fix/discovery.md — Approved By: Platform Operator — 2026-05-16 |
| H-ADAPTER | Injectable adapter wiring check | ✅ PASS (N/A) | No injectable adapters introduced by this story |

---

## Warnings

None.

---

## Oversight Level

**Low** — platform infrastructure bug fix, no user-facing impact, short-track. No sign-off required before assigning to the coding agent.

---

## Proceed: YES

All hard blocks pass. No warnings. Oversight: Low.

---

## Coding Agent Instructions

**Entry condition:** `npm test` currently passes. Tests for trw.1 do not exist yet — `tests/check-trw1-trace-writer.js` must be created as part of this story. TDD discipline: write failing tests (T1–T11 unit tests) first, then implement `scripts/write-ci-trace.js` to make them pass, then add integration tests T12–T14.

**Task 1 — Create test file (failing tests first):**

1. Create `tests/check-trw1-trace-writer.js`
2. Implement tests T1–T11 (unit tests for `scripts/write-ci-trace.js`) and T12–T14 (integration YAML-parse tests for `trace-commit.yml`)
3. Run `node tests/check-trw1-trace-writer.js` — confirm T1–T11 fail (script does not exist yet), T12–T14 fail (workflow step not yet added)
4. Do NOT implement the script yet — RED phase first

**Task 2 — Implement `scripts/write-ci-trace.js`:**

1. Create `scripts/write-ci-trace.js`
2. Read from environment: `GITHUB_RUN_ID`, `GITHUB_SHA`, `GITHUB_REF`, `GITHUB_RUN_STARTED_AT` (or `new Date().toISOString()` if absent for local runs)
3. Construct one JSONL record with exactly these fields:
   - `runId`: `process.env.GITHUB_RUN_ID || 'local'`
   - `commitSha`: `process.env.GITHUB_SHA || 'unknown'`
   - `headRef`: `process.env.GITHUB_REF || 'unknown'`
   - `trigger`: `"post-merge"`
   - `timestamp`: ISO 8601 UTC string from `new Date().toISOString()`
   - `verdict`: `"trace-committed"`
   - `surface`: `"ci-trace-commit"`
4. Derive the filename: take `timestamp`, replace all `:` with `-`, then append `-ci-{8-char-sha}.jsonl` where 8-char-sha is the first 8 characters of `commitSha`
5. Write to `workspace/traces/{filename}` — use `fs.mkdirSync(dir, { recursive: true })` before writing
6. Write `JSON.stringify(record)` (one line, no trailing newline after — or with `\n` for line-delimited JSONL) to the file
7. Do NOT log `GITHUB_TOKEN` or any other env var containing "TOKEN", "SECRET", or "KEY" to stdout, stderr, or the output file
8. Exit 0 on success; on any error, write to stderr and call `process.exit(1)`
9. Run `node tests/check-trw1-trace-writer.js` — confirm T1–T11 now pass

**Task 3 — Wire into `trace-commit.yml`:**

1. Open `.github/workflows/trace-commit.yml`
2. Find the step that downloads the `assurance-trace` artifact (look for `actions/download-artifact` with `name: assurance-trace`)
3. Add a new step **before** that step:
   ```yaml
   - name: Write fresh CI trace record
     run: node scripts/write-ci-trace.js
   ```
4. The new step must appear earlier in the workflow than the artifact download step
5. Run `node tests/check-trw1-trace-writer.js` — confirm T12–T14 now pass (YAML parse checks)

**Task 4 — Full test suite and commit:**

1. Run `npm test` — confirm zero new failures
2. Run conflict marker scan: `Select-String -Pattern '<<<<<<|======|>>>>>>' .github/workflows/trace-commit.yml` → zero results (D40)
3. Commit: `feat(trw.1): add write-ci-trace.js and wire into trace-commit.yml`
4. Open a draft PR

**Files to touch:**
- `scripts/write-ci-trace.js` — CREATE
- `.github/workflows/trace-commit.yml` — add one step before artifact download
- `tests/check-trw1-trace-writer.js` — CREATE

**Files NOT to touch:**
- `.github/workflows/assurance-gate.yml` — do not modify
- `.github/workflows/improvement-agent-schedule.yml` — do not modify
- `artefacts/` — do not modify
- `workspace/traces/` — do not pre-create; the script creates it at runtime

**Security checks (before committing):**
- Confirm `write-ci-trace.js` does not reference `GITHUB_TOKEN` anywhere in its output
- Confirm path is hardcoded: the only variable in the output path is the timestamp/sha derived from env vars, never from user input
- Run T11 explicitly and verify it passes
