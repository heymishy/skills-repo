# DoR Contract: Team-membership lookups stay indexed at ~100 members per tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s6.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s6-schema-scale-validation-test-plan.md

---

## Contract Proposal

**What will be built:**
1. Whatever index (or confirmation an existing one suffices) is needed on `team_memberships` for `(person_id, tenant_id)` lookups to stay indexed at 100 rows per tenant.
2. A `DATABASE_URL`-gated test suite that seeds 100 synthetic rows, runs `EXPLAIN`, and times the lookup query — skipping visibly (not silently passing) when no real Postgres connection is configured.

**What will NOT be built:**
- No real load testing against concurrent traffic.
- No validation beyond ~100 rows.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test (real Postgres, `DATABASE_URL`-gated): seed 100 rows, `EXPLAIN`, assert index scan | integration |
| AC2 | Integration test (same gate): time the lookup, assert under 50ms | integration |
| AC3 | Unit test (mocked `fake-test-db.js`, no gate needed): 1-member tenant lookup unaffected | unit |
| AC4 | Integration test (same gate): batch-insert 100 rows, compare to sequential baseline | integration |

**Assumptions:**
- The `PRIMARY KEY (person_id, tenant_id)` already declared in tir-s1's schema may already be sufficient for AC1's index requirement — this story's first task should be confirming that before assuming a new index is needed.
- Per the operator-confirmed RISK-ACCEPT (2026-07-13, decisions.md), AC1/AC2/AC4 are only meaningfully verified when `DATABASE_URL` is set; the coding agent must not weaken this to a mocked assertion.

**Estimated touch points:**
Files: possible schema addition (index) alongside tir-s1's tables, new `tests/check-tir-s6-schema-scale-validation.js`
Services: Postgres (`DATABASE_URL`, gated)
APIs: None

---

## Contract Review

Reviewed against all 4 story ACs and the test plan's AC Coverage table:

- AC1 ↔ index confirmation/addition, verified by the gated `EXPLAIN` test — ✅ aligned.
- AC2 ↔ same schema work, verified by the gated timing test — ✅ aligned.
- AC3 ↔ no schema change needed for the regression case, verified by the mocked unit test — ✅ aligned.
- AC4 ↔ same schema work, verified by the gated batch-insert test — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Team admin / tech lead" (review noted as a reasonable stretch — infrastructure story) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3 of 4 tests are `DATABASE_URL`-gated — see H8 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 4 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH, 0 MEDIUM, 1 LOW (persona stretch, non-blocking) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | The `DATABASE_URL` gate for AC1/AC2/AC4 is explicitly acknowledged as a RISK-ACCEPT in decisions.md (2026-07-13), confirmed by the operator during /test-plan — not a silent gap |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` — hard dependency on tir-s1 (schema), soft on tir-s5 (bulk-insert path validation); `dorStatus` confirmed present in schema. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Extends tir-s1's schema, ADR-025 cited |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs — the `DATABASE_URL` gap is `External-dependency` type, not `CSS-layout-dependent`, so H-E2E does not apply to it |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | Schema/index change only, no new adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set — this story's `DATABASE_URL` dependency is a test-environment concern handled via RISK-ACCEPT, not a formal infra-provisioning track |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 1: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as prior stories. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | The `DATABASE_URL` gap is a *known*, resolved-handling gap (RISK-ACCEPT logged), not an UNCERTAIN/unaddressed one | — |

---

## Oversight

**Level:** Medium (per epic tir-e1)
**Handling:** Same as prior stories. Additionally: before this story is considered fully done, confirm a real `DATABASE_URL`-backed environment actually ran AC1/AC2/AC4 at least once — a merge where all 3 tests were silently skipped every time would leave Metric 4 unverified in practice, even though DoR is satisfied by the RISK-ACCEPT today.
