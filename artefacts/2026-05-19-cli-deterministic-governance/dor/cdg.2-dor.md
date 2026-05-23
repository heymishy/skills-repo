# Definition of Ready: H1-H9 DoR deterministic checks — complete coverage and ≥33 test fixtures

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.2.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.2-test-plan.md
**Assessed by:** GitHub Copilot (operator: Hamis)
**Date:** 2026-05-23

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ PASS | "As a **platform maintainer**, I want…, So that…" — non-generic role |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 8 ACs; AC1-AC7 are full GWT; AC8 missing explicit "When" clause (review finding 2-L1) — minimum threshold of 3 well-formed ACs satisfied by remaining 7 |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | All 8 ACs mapped in AC coverage table (cdg.2-test-plan.md §AC Coverage Table) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ PASS | 5 explicit exclusions named: non-DoR gate implementations, H-E2E/H-NFR checks, W1-W5 warning checks, automatic correction, fixture file on-disk preference |
| H5 | Benefit linkage field references a named metric | ✅ PASS | "M3 — Gate logic unit test fixtures (≥33 fixtures)" with mechanism sentence. No disqualifying phrase detected |
| H6 | Complexity is rated | ✅ PASS | Rating: 2; Scope stability: Stable — 33-item catalogue pre-established |
| H7 | No unresolved HIGH findings from the review report | ✅ PASS | Review (cdg.2-review-1.md, Run 1, 2026-05-23): 0 HIGH, 2 MEDIUM (resolved — see below), 2 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ PASS | All 8 ACs covered. 2 acknowledged gaps: AC7 fixture may pass before implementation (low risk, TDD note logged); AC1/H3/H6/H7/H8/H8-ext/H9 violation cases deferred (low risk, accepted) |
| H8-ext | Cross-story schema dependency declaration | ✅ PASS | Upstream dependency: cdg.1 (DoD-complete code dependency, not a schema field dependency). No schemaDepends declaration required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS | 5 constraints listed: ADR-011 (pure function), ADR-013 (path traversal guard), Product constraint 3 (read-only), OWASP A01, test fixture isolation. Category E review: PASS |
| H-E2E | No CSS-layout-dependent ACs without E2E tooling or RISK-ACCEPT | ✅ PASS | CLI output only — no layout-dependent ACs |
| H-NFR | NFR profile file exists | ✅ PASS | artefacts/2026-05-19-cli-deterministic-governance/nfr-profile.md |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ PASS | OWASP A01:2021 and MC-SEC-02 are platform constraints; no external regulatory compliance clauses (no GDPR, HIPAA, PCI etc.) requiring independent sign-off |
| H-NFR3 | Data classification field not blank | ✅ PASS | "Internal — pipeline artefacts contain delivery planning data. Low sensitivity. No PII." |
| H-NFR-profile | Story declares NFRs; nfr-profile.md exists | ✅ PASS | Story NFRs section populated (performance, security, no new deps, test isolation). nfr-profile.md present |
| H-GOV | Discovery Approved By has at least one non-blank, non-engineering-role entry | ✅ PASS | "Hamis — 2026-05-19" (operator/owner — personal project, sole decision-maker) |
| H-ADAPTER | Injectable adapters have wiring ACs and throwing stub defaults | ✅ PASS | No injectable adapters introduced in cdg.2 scope |

**Result: 17/17 hard blocks PASS — story PROCEEDS ✅**

---

## Review Findings Disposition (H7)

**Finding 2-M1 (MEDIUM):** Missing H1-H9 check catalogue — no authoritative list of what the 33 checks require.
**Resolution:** `artefacts/2026-05-19-cli-deterministic-governance/reference/dor-h1-h9-check-catalogue.md` created during test-plan run (commit 3a9e20f). Fully resolved before DoR — not just acknowledged.

**Finding 2-M2 (MEDIUM):** Exit code mapping undefined — no canonical table assigning exit codes to check categories.
**Resolution:** Exit code mapping defined in the reference catalogue: H1→1, H2→2, H3→3, H4→4, H5→5, H6→6, H7/H8/H8-ext/H9→7, SYSTEM errors→8. Fully resolved before DoR.

**Finding 2-L1 (LOW):** AC8 missing explicit "When" clause.
**Resolution:** Accepted at test plan — threshold of ≥3 GWT ACs is met by AC1-AC7. Low risk.

**Finding 2-L2 (LOW):** AC8 regression baseline undefined in absolute terms.
**Resolution:** Resolved in test plan — G2a asserts absolute count ≥33.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | N/A | N/A |
| W2 | Scope stability is declared | ✅ | N/A | N/A |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | N/A — both MEDIUM findings are fully resolved (catalogue + exit code mapping) before DoR, not merely acknowledged | N/A |
| W4 | Verification script reviewed by a domain expert | ⚠️ WARN | Misspecified behaviour in verification script may cause agent to implement against wrong criteria | Hamis — RISK-ACCEPT-003 in decisions.md (2026-05-23). Same context as cdg.1 RISK-ACCEPT-002. Unit test suite provides independent specification layer |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | N/A — all gap entries marked "Accepted" with rationale | N/A |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: H1-H9 DoR deterministic checks — complete coverage and ≥33 test fixtures
Story artefact: artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.2.md
Test plan: artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.2-test-plan.md
Verification script: artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.2-verification.md
Reference catalogue: artefacts/2026-05-19-cli-deterministic-governance/reference/dor-h1-h9-check-catalogue.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify. The failing tests to write first (TDD red state) are T8, T9, T10. T11 may already pass but must be confirmed green.

Files to touch (only these three):
  - src/enforcement/cli-outer-loop.js   ← extend with H2-H9 checks
  - tests/check-cli-outer-loop.js       ← add T8, T9, T10, T11 test blocks
  - tests/check-cli-governance.js       ← add G2a, G2b governance count assertions

Files NOT to touch:
  - Any file under artefacts/
  - .github/pipeline-state.json
  - bin/skills
  - Any other file in src/ or tests/ not listed above

Implementation notes:
  1. H2-H9 use a new header-extraction regex (STORY_REF_HEADER_RE) — NOT the H1 embedded regex (STORY_REF_RE). Pattern: /\*\*Story reference:\*\*\s+(\S+\.md)/. This allows test fixtures to use .tmp-test-cdg2-XXXXXX/ paths inside ROOT.
  2. Add EXIT constants: EXIT = { OK:0, H1:1, H2:2, H3:3, H4:4, H5:5, H6:6, H7_THROUGH_H9:7, SYSTEM:8 }. Consistent with the reference catalogue.
  3. Test fixtures (T8-T11) must write synthetic tmp files inside the repository root so the path traversal guard passes. Use os.tmpdir() only if it resolves to a path under the repo root, otherwise write under process.cwd() + '/.tmp-test-cdg2-XXXXXX/'.
  4. T8 fixture: DoR with "**Story reference:** .tmp-test-cdg2-XXXX/story-h2-few-acs.md" + story file with only 2 ACs → expect exitCode===2, stderr includes "H2 FAIL" and "minimum 3 ACs required".
  5. T9 fixture: Story with 3 ACs where AC2 has no Given/When/Then → expect exitCode===2, stderr includes "H2 FAIL" and "AC2" and "Given/When/Then".
  6. T10 fixture: Story with Benefit Linkage containing "needed for the next feature to proceed" → expect exitCode===5, stderr includes "H5 FAIL" and "technical dependency".
  7. T11 fixture: Well-formed story (3+ GWT ACs, non-blank Out-of-Scope, M99 metric, Complexity Rating 2, Architecture Constraints with ADR reference) → expect exitCode===0.
  8. G2a: read tests/check-cli-outer-loop.js and assert count of "assert(" occurrences ≥33.
  9. G2b: read src/enforcement/cli-outer-loop.js and assert it contains the EXIT constant map or equivalent string pattern for error message format.
 10. The authoritative check-by-check specification is the reference catalogue at artefacts/2026-05-19-cli-deterministic-governance/reference/dor-h1-h9-check-catalogue.md — read it before implementing H2-H9.
 11. Each H-check that fails must emit to stderr: "[Hx FAIL] <specific reason including which AC or field is problematic>".
 12. First-failing check category wins — once an exit code is set, continue scanning for additional violations in the same category but do not downgrade to a lower-numbered exit code.

Constraints:
  - Language: JavaScript (Node.js 18+). No new npm dependencies.
  - All tests run via plain node with process.exit(1) on failure — no Jest/Mocha/test framework.
  - validate() must be a pure function: no process.exit, no state writes, no HTTP calls, no subprocess calls.
  - Path traversal guard from cdg.1 must remain intact: path.resolve + startsWith(rootWithSep).
  - Read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs. If the file does not exist, note this in a PR comment.
  - Open a draft PR when all tests pass — do not mark ready for review.
  - If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and stop.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight — proceed directly)
**DoR status:** Signed off ✅ — 2026-05-23
