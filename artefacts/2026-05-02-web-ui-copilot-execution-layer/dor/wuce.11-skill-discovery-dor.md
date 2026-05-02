# Definition of Ready: SKILL.md discovery and skill routing

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.11 — SKILL.md discovery and skill routing
**Epic:** E3 — Phase 2 Execution Engine
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As the execution engine / I want a bounded allowlist of available skills derived from SKILL.md discovery in the configured skills directory / So that skill invocations are constrained to known, validated skill names…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests in wuce.11 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Dynamic skill installation, skill metadata parsing beyond name/path, non-local filesystem explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P6 — Skill execution success rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.11 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-004 (`COPILOT_SKILLS_DIRS` env var), ADR-012 (`listAvailableSkills` adapter), skill name `[a-z0-9-]` allowlist for subprocess invocation (feeds wuce.9) |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (skill name validation, allowlist prevents injection), Performance (fast filesystem scan), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers skill name validation for wuce.11 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.11 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E3 (Phase 2 Execution Engine). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: SKILL.md discovery and skill routing — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.11-skill-discovery.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.11-skill-discovery-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); no Playwright/Cypress
- `listAvailableSkills(repoPath)` must return `[{name, path}]` — only directories that contain a SKILL.md file; subdirs without SKILL.md are excluded
- Skill name must match `[a-z0-9-]` pattern to appear in the returned list — names that do not match are excluded with a warning
- `COPILOT_SKILLS_DIRS` env var overrides default `.github/skills/` path
- Empty or missing directory → return empty array with a warning log message — not an error thrown
- The returned list is the authoritative allowlist for subprocess invocation (wuce.9) — no skill not in this list may be executed
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-012: implement as `listAvailableSkills` adapter in `src/adapters/skill-discovery.js`
- ADR-004: skills directory from `COPILOT_SKILLS_DIRS` env var
- Do not implement dynamic skill installation, skill metadata parsing, or remote skill sources (out of scope)
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming skill name validation regex and that the list is used as the allowlist for wuce.9 invocations
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.11-skill-discovery-dor-contract.md
