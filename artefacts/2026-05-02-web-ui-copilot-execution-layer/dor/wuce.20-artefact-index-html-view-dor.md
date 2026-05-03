# Definition of Ready: Feature artefact index HTML view

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.20 — Feature artefact index HTML view
**Epic:** E5 — HTML Frontend Layer (E5 Read Views)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator viewing a feature in the browser / I want GET /features/:slug to return an HTML artefact index / So that I can navigate directly to any artefact without knowing its file path." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 17 tests in wuce.20 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Artefact editing, creation, deletion, full-text search, version history explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T1–T3,T13,T14; AC2: T8,T9; AC3: T4–T7,T15,T16; AC4: T10; AC5: T11; AC6: T12 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-004, ADR-009, ADR-012 (listArtefacts adapter); artefact-labels.js separate module constraint |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (escHtml on all values), Accessibility (WCAG 2.1 AA via renderShell), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile exists at `artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md` |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King and Jenni Ralph — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | No MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E5. Human review required before PR merge. Named sign-off: Hamish King.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Feature artefact index HTML view — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.20-artefact-index-html-view.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.20-artefact-index-html-view-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce20-artefact-index-html.js
- Extend handleGetFeatureArtefacts() in src/web-ui/routes/features.js with content-type negotiation:
  - Accept: text/html → renderShell wrapping artefact list HTML
  - Accept: application/json or no header → JSON unchanged
- Use existing renderArtefactItem(artefact) — do not rewrite or duplicate
- Create src/web-ui/utils/artefact-labels.js — exports getLabel(type) function with static mapping:
  dor → "Ready Check", benefit-metric → "Benefit Metric", test-plan → "Test Plan", discovery → "Discovery"
  Unknown types must return a non-empty fallback string (not throw)
- Import renderShell() from src/web-ui/utils/html-shell.js
- Import escHtml() from src/web-ui/utils/html-shell.js — apply to all path, type, and date values rendered in HTML
- Zero artefacts → empty-state message, no empty <ul>
- authGuard: unauthenticated → 302
- Audit log: { userId, route: '/features/:slug', featureSlug, timestamp }
- ADR-012: listArtefacts(featureSlug, token) adapter — no inline fetch
- Open a draft PR when all 17 tests pass — do not mark ready for review
- Oversight level: High — add PR comment confirming named sign-off from Hamish King
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.20-artefact-index-html-view-dor-contract.md
