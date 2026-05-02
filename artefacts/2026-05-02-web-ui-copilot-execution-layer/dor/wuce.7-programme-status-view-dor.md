# Definition of Ready: Programme manager pipeline status view

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.7 — Programme manager pipeline status view
**Epic:** E2 — Phase 1 Full Surface
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a programme manager / I want to see a consolidated status view showing the current pipeline phase, health, and any blockers for every feature / So that I can report on delivery progress to a steering committee…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 21 tests in wuce.7 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Editing pipeline-state, custom dashboard config, WebSocket, Gantt, historical trend explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P4 — Status self-service rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.7 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | Story explicitly uses only existing pipeline-state.json fields — no new fields (ADR-003) |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-012 (`getPipelineStatus` adapter), ADR-003 (no new pipeline-state fields), server-side read access validation |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs (AC2 uses text label alongside colour indicator — testable via DOM) |
| H-NFR | NFRs declared for each active category | PASS | Security (repo read validation), Performance (<5s for 30 features), Accessibility (colour not sole indicator, WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers repository access validation for wuce.7 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | Story explicitly prohibits new pipeline-state.json fields (ADR-003) |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.7 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E2 (Phase 1 Full Surface). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Programme manager pipeline status view — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.7-programme-status-view.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.7-programme-status-view-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not add editing of pipeline-state.json, WebSocket, Gantt, or historical trend (out of scope)
- Status board reads from existing pipeline-state.json fields only: `stage`, `prStatus`, `dorStatus`, `traceStatus` — no new fields (ADR-003)
- Status indicators must use text/icon alongside colour — colour is never the sole indicator (accessibility NFR)
- "Trace findings" label (AC2) is the exact text required — not "blocked" or a generic status
- "Awaiting implementation dispatch" (AC3) is the exact text required
- "Done" group (AC5) condition: all stories `prStatus: "merged"` AND all stories `traceStatus: "passed"` — derived from existing fields only
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-012: use `getPipelineStatus(featureSlug, token)` adapter — reads pipeline-state.json from GitHub
- ADR-003: no new pipeline-state.json fields
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming no new pipeline-state.json fields are read or written
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.7-programme-status-view-dor-contract.md
