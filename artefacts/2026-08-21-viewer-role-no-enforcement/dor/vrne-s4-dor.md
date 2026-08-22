# Definition of Ready: Wire the viewer-write-block gate to edge-case routes (agency client creation/invite, artefact annotations)

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s4-edge-cases.md`
**Test plan reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s4-test-plan.md`
**Contract proposal:** `artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s4-dor-contract.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

---

## Contract Review

Reviewed the Contract Proposal against all 6 ACs and the test plan. No mismatches — the additive (not replacing) wiring approach and the dedicated AC5 regression test directly match the story's own most important Architecture Constraint.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 1, AC2: 1, AC3: 1, AC4: 2, AC5: 2, AC6: 1 |
| H4 | Out-of-scope section is populated | ✅ | 4 items named, including 2 explicitly-excluded adjacent findings |
| H5 | Benefit linkage field references a named metric | ✅ | |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH; 1 MEDIUM inherited from `vrne-s1`, tracked |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — code-level dependency on `vrne-s1`, no field to validate |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | Condition does not trigger |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ | Condition does not trigger |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence when story NFRs populated | ✅ | |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank named entry | ✅ | Same as `vrne-s1` |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Inherited, tracked under `vrne-s1`'s ARCH entry |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged — `decisions.md`, 2026-08-22 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | — |

---

## Oversight level

**Medium** — same basis as the other 3 stories. Operator confirmed awareness, 2026-08-22.

---

## Standards injection

**Domain tags:** `web-ui`, `security`, `auth`
**Matched standards files:** same 3 files as `vrne-s1`/`vrne-s2` — full text in `vrne-s1-dor.md`.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire the viewer-write-block gate to edge-case routes (agency client creation/invite, artefact annotations) — artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s4-edge-cases.md
Test plan: artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Requires vrne-s1 to be DoD-complete first — import requireNonViewer, do not reimplement it
- Wire requireNonViewer into exactly 3 call sites: routes/agency-provisioning.js's POST /agency/clients/new and POST /agency/clients/:id/invite, and routes/annotation.js's POST /api/artefacts/:slug/annotations
- CRITICAL: the new role gate must be ADDITIVE to the existing org_type === 'agency' check in agency-provisioning.js, not a replacement. AC5's test must prove a non-Agency-org denial is still attributable to the pre-existing org-type check, not the new gate — do not refactor or reorder the existing check while adding the new one
- Node.js built-ins only — no new npm dependencies
- Denial logging: same structured JSON convention as the other 3 stories
- Architecture standards: read .github/architecture-guardrails.md before implementing. Applicable domain standards (auth-patterns.md, security-standards.md, web-ui-patterns.md) — see vrne-s1-dor.md for full text
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (operator confirmed directly, 2026-08-22)
**Signed off by:** Hamish King, 2026-08-22
