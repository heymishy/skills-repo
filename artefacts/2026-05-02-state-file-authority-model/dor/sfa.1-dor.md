# Definition of Ready: sfa.1 — Add workspace/state.schema.json and document state file authority model as ADR-016/ADR-017

**Story reference:** `artefacts/2026-05-02-state-file-authority-model/stories/sfa.1-state-file-schema-and-adr.md`
**Test plan reference:** `artefacts/2026-05-02-state-file-authority-model/test-plans/sfa.1-test-plan.md`
**Verification script:** `artefacts/2026-05-02-state-file-authority-model/verification-scripts/sfa.1-verification.md`
**NFR profile:** `artefacts/2026-05-02-state-file-authority-model/nfr-profile.md`
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-02
**Track:** Short-track (/improve extraction — test-plan → DoR → coding agent)

---

## Contract Proposal

**What will be built:**

1. `workspace/state.schema.json` — new file. JSON Schema Draft 7. `type: "object"`, `required: ["currentPhase", "lastUpdated", "checkpoint"]`, `additionalProperties` not set to `false`. `properties.currentPhase.type: "string"` (no enum). `properties.checkpoint.type: "object"`.
2. `tests/check-sfa1-state-schema.js` — new file. Custom Node.js assert runner (repo pattern). 16 tests: 14 unit + 2 NFR checks. All tests must fail before implementation.
3. `.github/architecture-guardrails.md` — append ADR-016 (two-file authority model) and ADR-017 (story nesting dual-structure) as new ADR sections after ADR-015. Append-only — no existing content modified.
4. `.github/skills/checkpoint/SKILL.md` — add a schema validation step that references `workspace/state.schema.json` by path. Minimal change — one instruction added to the state-write sequence.
5. `package.json` — add `"check:sfa1": "node tests/check-sfa1-state-schema.js"` to scripts; add `&& node tests/check-sfa1-state-schema.js` to the `test` script chain.

**What will NOT be built:**
- No data migration between `workspace/state.json` and `pipeline-state.json`
- No CI hook or GitHub Actions workflow change for workspace/state.json validation
- No changes to `pipeline-state.schema.json`
- No changes to how `/checkpoint` writes state — only how it references the schema in its instructions

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Schema exists + validates current state | `fs.existsSync` check + parse schema JSON + parse state JSON + assert all 3 schema required fields exist in current state | Unit |
| AC2 — Schema enforces 3 required fields | Read `schema.required`; assert includes `currentPhase`, `lastUpdated`, `checkpoint` | Unit |
| AC3 — ADR-016 authority model | Read guardrails; anchor on `ADR-016`; assert `pipeline-state.json` + `delivery evidence` + `workspace/state.json` + `session state` + `viz` within 2000-char window | Unit |
| AC4 — ADR-017 nesting structure | Read guardrails; anchor on `ADR-017`; assert `flat` + `stories` + `legacy` or `nested` + `not migrated` or `no migration` within 2000-char window | Unit |
| AC5 — /checkpoint references schema | Read checkpoint SKILL.md; assert `workspace/state.schema.json` present | Unit |
| AC6 — Schema tolerates extra properties | Parse schema; assert `schema.additionalProperties !== false` | Unit |

**Assumptions:**
- `workspace/state.json` exists (it does — written by prior session)
- `.github/skills/checkpoint/SKILL.md` exists (it does — pre-existing)
- The guardrails file already ends with ADR-015; agent appends after it

**Touch points:**
- New files: `workspace/state.schema.json`, `tests/check-sfa1-state-schema.js`
- Modified (append-only): `.github/architecture-guardrails.md`
- Modified (minimal instruction add): `.github/skills/checkpoint/SKILL.md`
- Modified (script entries): `package.json`

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So with named persona | ✅ | "As a platform maintainer or contributor" — specific, non-generic persona |
| H2 | At least 3 ACs in GWT format | ✅ | 6 ACs, all in Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→2 tests, AC2→4 tests, AC3→4 tests, AC4→3 tests, AC5→1 test, AC6→1 test; 2 additional NFR tests |
| H4 | Out-of-scope section populated | ✅ | 3 explicit exclusions named |
| H5 | Benefit linkage references named metric | ✅ | "Platform reliability / contributor friction — creates the measurable baseline" |
| H6 | Complexity rated | ✅ | Complexity: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs covered; gap table: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: None → schema check not required |
| H9 | Architecture Constraints populated; no Cat-E HIGH findings | ✅ | ADR-003, ADR-004 cited; no Category E HIGH findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | File system checks only |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-05-02-state-file-authority-model/nfr-profile.md` |
| H-NFR2 | No compliance NFR with regulatory clause | ✅ | meta.regulated: false; no regulatory clauses |
| H-NFR3 | Data classification not blank | ✅ | "No user data. Not PCI scope. No PII." |
| H-NFR-profile | Story declares NFRs → profile present | ✅ | Profile exists and populated |
| H-GOV | Discovery artefact Approved By ≥1 non-blank named entry | ✅ | `artefacts/2026-05-02-state-file-authority-model/discovery.md` → `heymishy — operator — 2026-05-02` |

**Hard blocks: 16/16 passed ✅**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs identified | ✅ | 3 NFRs in profile |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM findings acknowledged in /decisions | ⚠️ | 1-M1 (short-track structural gap — no formal discovery/benefit-metric) accepted; 1-M2 fixed inline in story |
| W4 | Verification script reviewed by domain expert | ⚠️ | Operator is domain expert — acknowledged inline |
| W5 | No uncertain gap table items | ✅ | No gap table entries |

**W3:** 1-M1 is accepted as a known short-track pattern (/improve extraction stories have no formal discovery chain). 1-M2 was resolved by fixing the story's NFR validation approach text. No /decisions entry required — both accepted/resolved.
**W4:** Operator acknowledged inline. Low-oversight path.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: sfa.1 — Add workspace/state.schema.json and document state file authority model as ADR-016/ADR-017
Story artefact: artefacts/2026-05-02-state-file-authority-model/stories/sfa.1-state-file-schema-and-adr.md
Test plan: artefacts/2026-05-02-state-file-authority-model/test-plans/sfa.1-test-plan.md
Verification script: artefacts/2026-05-02-state-file-authority-model/verification-scripts/sfa.1-verification.md
NFR profile: artefacts/2026-05-02-state-file-authority-model/nfr-profile.md
Test file to create: tests/check-sfa1-state-schema.js

Goal:
Make all 16 tests in tests/check-sfa1-state-schema.js pass.
Run: node tests/check-sfa1-state-schema.js

Before writing any code, run npm test to confirm the baseline. The new test file will not exist yet — that is expected. npm test overall may have pre-existing failures (check known-deferred-checks.json for the list — do not fix pre-existing failures).

Deliverables (in order):
1. Create tests/check-sfa1-state-schema.js with all 16 tests — write to FAIL first
2. Run node tests/check-sfa1-state-schema.js — confirm all fail
3. Create workspace/state.schema.json — JSON Schema Draft 7
4. Append ADR-016 and ADR-017 to .github/architecture-guardrails.md after ADR-015
5. Add workspace/state.schema.json reference to .github/skills/checkpoint/SKILL.md
6. Add package.json script entries
7. Run node tests/check-sfa1-state-schema.js — confirm all 16 pass
8. Run npm test — confirm no net-new failures introduced

Constraints:
- No new npm dependencies — Node.js built-ins only (fs, path, JSON.parse)
- .github/architecture-guardrails.md: append-only — do not modify existing content
- .github/skills/checkpoint/SKILL.md: minimal one-instruction add — do not restructure the skill
- package.json: add check:sfa1 script entry AND extend the existing test chain
- Schema additionalProperties must NOT be false
- Schema currentPhase must use "type": "string" — not an enum
- ADR-016 must contain all of: "pipeline-state.json", "delivery evidence", "workspace/state.json", "session state", reference to viz reading pipeline-state only
- ADR-017 must contain: "flat" structure for new features, "legacy" or "nested" for Phase 1/2, "not migrated" or "no migration"
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when all 16 tests pass — do not mark ready for review
- If you encounter ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — Low oversight, personal non-regulated repo
**Signed off by:** Not required — operator confirmed Proceed inline
