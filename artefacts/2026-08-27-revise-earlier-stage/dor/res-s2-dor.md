# Definition of Ready: Overwrite a reopened stage's artefact in place on revision

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md
**Test plan reference:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s2-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-08-28

---

## Contract Proposal

See `res-s2-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, no mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Operator (solo product owner + engineer running the outer loop) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 10 tests across 5 ACs |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | 2 metrics named |
| H6 | Complexity is rated | ✅ | 3 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2 — 0 HIGH (1-H1 fixed on res-s3, res-s2 itself had 0 HIGH in Run 1) |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["prStatus", "dodStatus"]` declared in contract; both fields confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 5 constraints named (ADR-023, CLAUDE.md disk canonicity + path traversal, pre-revision handoff); Run 2 Architecture compliance score 5, no HIGH |
| H-E2E | CSS-layout-dependent gate | ✅ | Not applicable |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-27-revise-earlier-stage/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | Same discovery artefact as res-s1 — passes |
| H-ADAPTER | Injectable adapter wiring | ✅ | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ | Not applicable |
| H-MIG | Migration-review gate | ✅ | Not applicable |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Unstable — declared |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | No MEDIUM findings (2 LOW only) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md (2026-08-28) — covers all 4 stories |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | Gap table: None |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Overwrite a reopened stage's artefact in place on revision — artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md
Test plan: artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/web-ui/routes/journey.js conventions
- Path traversal guard is mandatory on every write: path.resolve(inputPath) must startsWith(repoRoot + path.sep) before any fs.writeFileSync call
- No versioning/dated-copy mechanism — in-place overwrite only
- Pre-revision content must be captured in memory before the write executes and handed forward within the same turn-handling flow to the materiality-check step (res-s3) — do not attempt to re-read it from disk afterward
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Depends on res-s1 (Dependencies: Upstream) — confirm res-s1's prStatus/dodStatus in pipeline-state.json before assuming its reopen mechanism is available (H8-ext)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
Read this file directly before implementing.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Hamish King — Platform Owner (confirmed aware, 2026-08-28)
