# Definition of Ready: cdg.6 — `skills advance` epic-nested lookup, dot-notation field writes, integer coercion, and harness wiring rule

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.6.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.6-test-plan.md
**Review report:** Short-track — no formal review run. Zero HIGH findings (see inline contract review below).
**Discovery artefact:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Decisions artefact:** artefacts/2026-05-19-cli-deterministic-governance/decisions.md
**NFR profile:** N/A — story declares NFRs inline (no new dependencies, no new data classification, OWASP A03 addressed by AC6)
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## Contract Proposal

**What will be built:**

1. **`src/enforcement/cli-advance.js`** — three targeted changes:
   - Epic-nested story lookup: before the "find or create" step, search `feature.epics[].stories[]` for the story ID in addition to `feature.stories[]`. If found in epic-nested, update in place. If not found in either, create in flat `feature.stories[]` (preserve existing behaviour).
   - Dot-notation single-level field write: if a field name contains exactly one `.`, split into `[parent, child]`, initialise `story[parent]` as `{}` if absent, set `story[parent][child] = value` (merge, not replace).
   - Integer coercion: before assigning any value, if the value string matches `/^\d+$/`, coerce to `Number(value)`.
   - Prototype pollution guard: reject any field name or dot-notation segment that equals `__proto__`, `constructor`, or `prototype` — return exit 8.

2. **`tests/check-cdg6-advance-enhancements.js`** — 13 tests (T1–T13) covering all 7 ACs as specified in the test plan.

3. **`.github/copilot-instructions.md`** — add one rule to the Coding Standards section mandating `node bin/skills advance` for all agent post-merge pipeline-state story field updates.

4. **`package.json`** — append `&& node tests/check-cdg6-advance-enhancements.js` to the `test` script.

**What will NOT be built:**
- Dot-notation deeper than 1 level — out of scope
- Changes to `bin/skills`, `cli-validate.js`, `pipeline-state-writer.js`
- Changes to `.github/pipeline-state.schema.json`
- Backfilling of stale fields in existing pipeline-state.json records
- GitHub Actions workflow changes

**How each AC will be verified:**

| AC | Test(s) | Type |
|----|---------|------|
| AC1 — Epic-nested found + updated | T1, T2 | Unit + Integration |
| AC2 — Flat story unchanged | T3 | Unit |
| AC3 — Not found → creates flat | T4 | Unit |
| AC4 — Dot-notation single-level | T5, T6, T7 | Unit |
| AC5 — Integer coercion | T8, T9 | Unit |
| AC6 — Prototype pollution guard | T10, T11 | Unit |
| AC7 — copilot-instructions.md rule | Manual grep + T13 | Governance |

**Regression:** Full `npm test` suite must pass. Existing cdg.3 tests (T1–T23 in `check-cdg3-advance-cli.js`) must continue to pass unchanged.

---

## Contract Review

**Inline security review (SHORT-TRACK):**

| Category | Finding | Severity | Resolution |
|----------|---------|----------|-----------|
| OWASP A03 (Injection) — prototype pollution | `__proto__`, `constructor`, `prototype` as field names would silently mutate Object.prototype | HIGH | AC6 adds explicit guard; exit 8 before any write |
| OWASP A01 (Broken Access Control) — path traversal | Already mitigated by existing `path.resolve` + `startsWith(repoRoot)` guard in cdg.3 | N/A | Existing guard preserved |
| Type confusion — integer as string | Schema divergence (cosmetic, not exploitable) | LOW | AC5 resolves via coercion |
| Epic-nested phantom create | Silent data corruption (wrong record updated) | MEDIUM | AC1 resolves |

**No HIGH findings remain after AC6 implementation.** Contract review PASSED.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS | "As a **platform maintainer**, I want…" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 7 ACs, all in Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1→T1+T2, AC2→T3, AC3→T4, AC4→T5+T6+T7, AC5→T8+T9, AC6→T10+T11, AC7→T13+manual |
| H4 | Out-of-scope section populated | ✅ PASS | 6 explicit out-of-scope items |
| H5 | Benefit linkage references named metric | ✅ PASS | M4 and M2 named |
| H6 | Complexity rated | ✅ PASS | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ PASS | AC6 resolves the one HIGH (OWASP A03); inline contract review PASSED |
| H8 | No uncovered ACs | ✅ PASS | All 7 ACs covered in test plan |
| H8-ext | Cross-story dependency check | ✅ PASS | cdg.3 merged (`prStatus: merged`); `src/enforcement/cli-advance.js` exists on master |
| H9 | Architecture constraints populated; no Category E HIGH | ✅ PASS | ADR-001 (CommonJS), no new deps, OWASP A03 guard required |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS | CLI story — no UI |
| H-NFR | NFR profile or inline declaration | ✅ PASS | Declared inline above |
| H-NFR2 | No regulated clauses without human sign-off | ✅ PASS | `regulated: false` |
| H-NFR3 | Data classification not blank | ✅ PASS | Internal — pipeline artefacts |

---

## Warnings

None. Short-track — no warnings raised.

---

## Oversight level

**Low** — bounded changes to one existing module, one test file, one governance file. All test coverage automated.

---

## Coding Agent Instructions

**Entry condition:** All Hard Blocks above show ✅ PASS.

**Proceed:** Yes

**Branch:** `feature/cdg.6`
**Worktree:** `.worktrees/cdg.6`
**Story ID:** `cdg.6`
**Feature slug:** `2026-05-19-cli-deterministic-governance`

**Task sequence (TDD — RED first):**

1. **RED**: Write `tests/check-cdg6-advance-enhancements.js` with all 13 tests. Run `npm test` — expect the new tests to fail. Do not write implementation yet.

2. **GREEN — epic-nested lookup (AC1–AC3)**: Modify `src/enforcement/cli-advance.js` to search epic-nested stories before the existing find-or-create logic. Run tests — T1, T2, T3, T4 must pass.

3. **GREEN — dot-notation (AC4)**: Add single-level dot-notation path parsing in `cli-advance.js`. Run tests — T5, T6, T7 must pass.

4. **GREEN — integer coercion (AC5)**: Add `/^\d+$/` coercion before field assignment. Run tests — T8, T9 must pass.

5. **GREEN — prototype pollution guard (AC6)**: Add guard rejecting `__proto__`, `constructor`, `prototype` segments. Run tests — T10, T11 must pass.

6. **GREEN — copilot-instructions.md rule (AC7)**: Add the mandate to `.github/copilot-instructions.md` Coding Standards section. Run T12, T13.

7. **COMMIT**: `git add src/enforcement/cli-advance.js tests/check-cdg6-advance-enhancements.js .github/copilot-instructions.md package.json`

8. **Governance commit**: Update `.github/pipeline-state.json` for cdg.6: `stage: branch-complete`, `prStatus: draft`, `acVerified: 7`, `passing: 13`, `totalTests: 13`.

**Required checks before opening PR:**
- `npm test` — 0 failures
- `node scripts/check-pipeline-state-integrity.js` — 0 warnings, 0 failures
- Conflict marker scan: `Select-String -Pattern '<<<<<<|======|>>>>>>' src/enforcement/cli-advance.js`

**File touchpoints (authoritative list — see contract):**
- `src/enforcement/cli-advance.js` — MODIFY
- `tests/check-cdg6-advance-enhancements.js` — CREATE
- `.github/copilot-instructions.md` — MODIFY (Coding Standards section only)
- `package.json` — MODIFY (test script only)
- `.github/pipeline-state.json` — MODIFY (cdg.6 story fields only)
