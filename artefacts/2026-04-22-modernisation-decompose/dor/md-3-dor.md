# Definition of Ready: Add ADR-014 to `architecture-guardrails.md`

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
**Test plan reference:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-3-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-04-22

---

## Contract Proposal

**What will be built:**
An updated `.github/architecture-guardrails.md` with two additions: (1) a new row in the Active ADRs table for ADR-014 with title "Two-tier artefact scope model: system corpus vs feature delivery", status "Active", and constrains-field referencing all contributors working on modernisation programmes and `/modernisation-decompose` skill invocations; and (2) a full ADR write-up section (`### ADR-014:`) appended to the body with Context, Decision, and Consequences sub-sections plus a `**Decided:**` date field.

**What will NOT be built:**
Changes to any existing ADR entries or guardrail sections. New governance check scripts to enforce the ADR programmatically. Modifications to the `guardrails-registry` YAML block (this was identified in review finding 1-M1 for md-3 as a gap — the story's ACs do not require it; the implementation will not include it).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — ADR-014 row in Active ADRs table | Content inspection: assert ADR-014 row present with correct title, status Active, constrains-field mentions modernisation and /modernisation-decompose | Unit |
| AC2 — ADR write-up with three sub-sections | Content inspection: assert `### ADR-014` heading; Context, Decision, Consequences sub-sections; `**Decided:**` date field present | Unit |
| AC3 — npm test passes after change | Run `npm test`; confirm 0 failures | Integration |

**Assumptions:**
- ADR-014 is the next available number after ADR-013 in the current Active ADRs table.
- The write-up format follows the established `### ADR-0XX:` pattern from existing entries.
- `**Decided:** 2026-04-22` is an acceptable date value.

**Estimated touch points:**
Files: `.github/architecture-guardrails.md` (modify). Services: None. APIs: None.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So with named persona | ✅ | "platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ | All 3 ACs covered — 6 unit + 1 integration + 1 NFR |
| H4 | Out-of-scope section populated | ✅ | 2 items listed |
| H5 | Benefit linkage references a named metric | ✅ | M2 named |
| H6 | Complexity rated | ✅ | Complexity 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH findings (review run 1) |
| H8 | Test plan covers all ACs or gaps acknowledged | ✅ | No gaps — all ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependency on md-1 is delivery-order only (dual-scope model design must be settled first); no pipeline-state.json fields read from md-1 — schemaDepends: [] |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 4 constraints; 0 Category E HIGH findings |
| H-E2E | No CSS-layout-dependent ACs without E2E coverage | ✅ | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists; story NFRs populated | ✅ | 1 NFR (Decided date field); nfr-profile.md exists |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | No regulated data NFRs |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Classification: Public — confirmed in nfr-profile.md |

**All 14 hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review finding 1-M1: no AC requires updating the guardrails-registry YAML block alongside the ADR row | Hamish — acknowledged, RISK-ACCEPT; guardrails-registry update deferred to a follow-up story if needed |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Hamish — acknowledged for personal pipeline |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps table entries | — |

---

## Oversight Level

**Medium** — Human oversight level set by parent epic e1-modernisation-pipeline-bridging. Share this DoR artefact with the tech lead before assigning to the coding agent.

For this personal pipeline, Hamish acts as both operator and tech lead. DoR artefact reviewed and awareness confirmed.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add ADR-014 to architecture-guardrails.md — artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
Test plan: artefacts/2026-04-22-modernisation-decompose/test-plans/md-3-test-plan.md

Goal:
Update .github/architecture-guardrails.md to add ADR-014 such that all content-
inspection unit tests and the npm test integration test in the test plan pass.

Constraints:
- Modify ONE existing file: .github/architecture-guardrails.md
- Do NOT modify any existing ADR entries, existing guardrail sections, or the
  guardrails-registry YAML block — append only
- ADR-014 row must be added to the Active ADRs table with:
    Title: "Two-tier artefact scope model: system corpus vs feature delivery"
    Status: Active
    Constrains: all contributors working on modernisation programmes; /modernisation-decompose skill invocations
- ADR-014 write-up section must be appended using existing ### ADR-0XX: heading pattern
  and must contain: Context, Decision, Consequences sub-sections
- Write-up must include **Decided:** 2026-04-22
- Review finding md-3 1-M1: do NOT update the guardrails-registry YAML block —
  this is out of scope for this story
- Architecture standards: read .github/architecture-guardrails.md before
  implementing; do not violate any existing ADR or mandatory constraint
- Sequencing: md-1 should be committed before this story to inform the
  dual-scope design, but md-3 can be coded in parallel with md-2
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: MEDIUM — platform maintainer must review the PR before merge
- If you encounter ambiguity not covered by the ACs or tests:
  add a PR comment and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only)
**Signed off by:** Hamish (operator + tech lead) — 2026-04-22
