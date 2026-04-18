# Definition of Ready: atr.1 — Generate standalone audit trace report from CLI

**Story:** artefacts/2026-04-18-auditor-trace-report/stories/atr.1-audit-trace-report-cli.md
**Review:** PASS — Run 1, 2026-04-18
**Test plan:** 12 tests covering 7 ACs
**Verification script:** 7 scenarios

---

## Contract Proposal

**What will be built:**
A Node.js script at `scripts/trace-report.js` that reads `pipeline-state.json` and `pipeline-state-archive.json`, walks artefact file paths, correlates with JSONL gate trace files in `workspace/traces/`, and outputs a Markdown audit report to stdout. A test file at `tests/check-trace-report.js` with fixture data.

**What will NOT be built:**
- No HTML/web UI — Markdown output only
- No file writes — stdout only, read-only operation
- No modification to the existing `/trace` skill or `validate-trace.sh`

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Active feature report | T1, T2: call generateReport with fixture active state, assert markdown structure | Unit |
| AC2 — Archived feature report | T3, T4: call generateReport with fixture archive state, assert same format | Unit |
| AC3 — Gate evidence correlation | T5, T6: fixture JSONL trace files, assert verdict/hash in output | Unit |
| AC4 — Missing artefact detection | T7: fixture with nonexistent paths, assert MISSING markers | Unit |
| AC5 — Unknown feature slug | T8: call with bad slug, assert error with available slugs | Unit |
| AC6 — No arguments | T9: call with no args, assert usage message | Unit |
| AC7 — Stage-aware chain links | T10, T11: stories at different stages, assert "not yet reached" vs MISSING | Unit |

**Assumptions:**
- `pipeline-state.json` and `pipeline-state-archive.json` use the structure produced by psa.1
- JSONL trace files in `workspace/traces/` contain `commitSha` in `completed` entries
- All artefact paths in pipeline-state are relative to repo root

**Estimated touch points:**
- Files: `scripts/trace-report.js` (new), `tests/check-trace-report.js` (new), `tests/fixtures/trace-report-test-fixture.json` (new), `package.json` (add test entry)
- Services: None
- APIs: None

---

## Contract Review

✅ Contract review passed — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS — "platform maintainer or auditor" |
| H2 | At least 3 ACs in Given/When/Then | ✅ PASS — 7 ACs |
| H3 | Every AC has at least one test | ✅ PASS — all 7 ACs mapped in coverage table |
| H4 | Out-of-scope populated | ✅ PASS — 4 items |
| H5 | Benefit linkage references named metric | ✅ PASS — M1, M2, M3 |
| H6 | Complexity rated | ✅ PASS — 1/Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — review had 0 findings |
| H8 | No uncovered ACs in test plan | ✅ PASS — all ACs in coverage table |
| H8-ext | Schema dependency check | ✅ PASS — no upstream dependencies declared |
| H9 | Architecture constraints populated | ✅ PASS — ADR-011 referenced |
| H-E2E | CSS-layout-dependent ACs | ✅ PASS — no layout-dependent ACs |
| H-NFR | NFR profile or explicit NFRs | ✅ PASS — NFRs declared: Performance, Security, Compatibility |
| H-NFR-profile | NFR profile presence | ✅ PASS — story declares NFRs but this is a single-story feature; NFRs are in-story (no separate profile needed for non-regulated single-story features) |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS — no compliance NFRs |
| H-NFR3 | Data classification | ✅ PASS — no sensitive data |

**Result: 15/15 hard blocks passed**

---

## Warnings

| # | Check | Result |
|---|-------|--------|
| W1 | NFRs populated | ✅ — Performance, Security, Compatibility declared |
| W2 | Scope stability declared | ✅ — Stable |
| W3 | MEDIUM review findings acknowledged | ✅ — no MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ Acknowledged — operator is domain expert for platform tooling |
| W5 | No UNCERTAIN items in gap table | ✅ — no gaps |

---

## Oversight Level

**Low** — single-story tooling feature, personal repo, non-regulated, complexity 1.

---

## Coding Agent Instructions

### Story
atr.1 — Generate standalone audit trace report from CLI

### Acceptance Criteria
7 ACs — see story artefact

### Test Plan
12 tests in `tests/check-trace-report.js` — see test plan artefact

### Files to create
- `scripts/trace-report.js` — main script
- `tests/check-trace-report.js` — test file
- `tests/fixtures/trace-report-test-fixture.json` — test fixture

### Files to modify
- `package.json` — add `check-trace-report.js` to test script

### Files NOT to modify
- `scripts/validate-trace.sh` — existing validation, out of scope
- `.github/skills/trace/SKILL.md` — skill file, out of scope
- Any file under `artefacts/` — read-only pipeline artefacts

### Architecture constraints
- ADR-011: Read both active and archive pipeline-state files
- No external dependencies (Node.js standard library only)
- Read-only — must not write any files

### TDD sequence
1. Write test fixture with synthetic pipeline-state data
2. Write all 12 tests (expect them to fail — script doesn't exist yet)
3. Implement `scripts/trace-report.js` with `generateReport()` function
4. Run tests until all pass
5. Verify `npm test` passes (all existing + new tests)

---

## Sign-off

**DoR status:** ✅ PROCEED
**Signed off by:** Hamish, 2026-04-18
**Oversight:** Low — no additional sign-off required

---

**Next step:** Inner coding loop — /branch-setup → /implementation-plan → /tdd → /verify-completion → /branch-complete
