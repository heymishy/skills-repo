## Definition of Ready: Provision a Neon staging branch for Postgres

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.2-neon-staging-branch.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.2-neon-staging-branch-test-plan.md
**Contract reference:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.2-neon-staging-branch-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator)..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC3 |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: T1 + Scenario 1; AC2: T2 + Scenario 2; AC3: IT1/IT2 + Scenario 3 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Nightly re-branching and dev-data migration excluded |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 (see W3 note) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2 (2026-07-09): 0 HIGH, 1 MEDIUM, 0 LOW. Run 1's HIGH finding (ungrounded "30 seconds" cold-start figure) was resolved in Run 2 by sourcing the figure against Neon's published benchmarks (10-second budget) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 3 ACs covered; live schema/isolation/timing gaps are External-dependency, acknowledged in test plan's Coverage gaps table with manual-scenario handling |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (no Fly-managed Postgres, ADR-025 tenant-scoping, decisions.md free-tier validation); review Category E clean |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Infrastructure story |

**Hard block result: PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 2 finding 1-M1 (carried forward, unaddressed, 2 runs open) — Benefit Linkage is dependency-flavoured ("A staging environment that shares prod's database isn't real isolation") rather than a direct metric-movement statement. Low priority per review, not blocking, but not yet logged in `decisions.md` as RISK-ACCEPT or resolved. | Not yet |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not reviewed by a domain expert — standing W4 solo-operator posture applies | Hamish King (standing W4 RISK-ACCEPT posture) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | All gaps (live schema/isolation checks, real-world cold-start timing, IT1/IT2's helper-name assumption) have explicit handling — manual scenarios, or a stated retargeting plan if the implementation approach differs. None left genuinely open/uncertain. | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Provision a Neon staging branch for Postgres — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.2-neon-staging-branch.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.2-neon-staging-branch-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Do not fork schema-init logic per environment — the same CREATE TABLE IF NOT EXISTS statements must run unconditionally regardless of which DATABASE_URL is active
- Do not hardcode any Postgres connection string anywhere in tracked source — derive exclusively from process.env.DATABASE_URL
- Implement bounded connection handling for Neon's autosuspend cold-start: succeed within 10 seconds when the underlying connection resolves in time; on timeout, throw/reject a clearly named, bounded error (e.g. DB_CONNECT_TIMEOUT) rather than hanging indefinitely
- If a connection-readiness helper is introduced, name it clearly and update IT1/IT2's target if it diverges from the assumed `waitForDbReady(timeoutMs)` shape — flag this in the PR description, don't silently rename without a note
- No Neon connection string committed to any tracked file
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-025 tenant-scoping model applies to schema, not the connection layer here)
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
