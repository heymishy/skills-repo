## Definition of Ready: Build an idempotent anonymized seed script for staging

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.4-anonymized-seed-script.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
**Contract reference:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.4-anonymized-seed-script-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator)..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC4 |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: T1–T3; AC2: T4/T5; AC3: T6/T7; AC4: IT1 + Scenario 4 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Billing seed data and configurable volume excluded |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1, phrased as direct value-movement ("A smoke test... against an empty staging database can't meaningfully validate anything") — no M1-style dependency-flavoured finding on this story |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 (2026-07-09): 0 HIGH, 0 MEDIUM, 0 LOW — "Strongest-specified story in the epic" |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 4 ACs covered; AC4's real-pipeline-invocation gap is explicitly acknowledged and cross-referenced to S2.5's own test plan |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (ADR-025 tenant scoping, D37 adapter injection); review Category E clean — "ADR-025 and D37 both correctly and specifically applied" |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Infrastructure story |
| H-ADAPTER | D37 injectable DB-connection adapter compliance | ✅ (with DoR-added supplement) | (a) production wiring is covered by AC4 + cross-referenced S2.5 test — confirmed sufficient. (b) the story's own Architecture Constraints did not state the stub-throws requirement; this DoR contract adds it explicitly to the Coding Agent Instructions below, so it is no longer missing at implementation time. (c) wiring-as-separate-task is flagged as a forward requirement for `/implementation-plan`, not a DoR-time failure. |

**Hard block result: PASS — no blocks.** (H-ADAPTER required a DoR-time supplement — see contract and Coding Agent Instructions — rather than being satisfied by the story text alone.)

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ (N/A) | Review Run 1 recorded 0 MEDIUM findings — no acknowledgement needed | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not reviewed by a domain expert — standing W4 solo-operator posture applies | Hamish King (standing W4 RISK-ACCEPT posture) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | The one Coverage gap (real automatic post-deploy invocation, AC4) is an External-dependency gap with explicit handling (manual scenario + cross-reference to S2.5's test plan) — acknowledged, not open-uncertain | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build an idempotent anonymized seed script for staging — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.4-anonymized-seed-script.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Seed script's DB connection is an injectable adapter (D37): `let _dbConnection = defaultConnection; function setDbConnection(fn) { _dbConnection = fn; }`
- The default/stub `_dbConnection` MUST throw, not silently return an empty/no-op connection:
  `throw new Error('Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.')`
  Do not let the stub return a fake success — this masks misconfiguration.
- Idempotency must be structural (e.g. `INSERT ... ON CONFLICT DO NOTHING` or an equivalent pre-check), not a wipe-and-reseed
- Every tenant-scoped row must carry a non-null `tenant_id` (ADR-025)
- Every seeded identifier (names, emails) must be obviously synthetic — no realistic-looking real-world identifiers
- Zero seeding of Stripe/billing state — out of scope (S3.5 covers that separately)
- Wire the real Postgres adapter as production default is a SEPARATE task from writing the seed logic + injectable setter — do not bundle them into one task/commit (D37 rule #3)
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-025 tenant-scoping model)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness (per epic rationale)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed 2026-07-10

**Overall determination: READY**
