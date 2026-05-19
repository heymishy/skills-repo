# Definition of Ready: Feature list HTML view

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.19 — Feature list HTML view
**Epic:** E5 — HTML Frontend Layer (E5 Read Views)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator opening the platform in a browser / I want GET /features to return an HTML page listing all features / So that I can see pipeline state at a glance without using JSON-aware tooling." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 16 tests in wuce.19 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Search/filter, sorting, pagination, feature creation, JSON shape changes explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T1–T5,T12; AC2: T6,T7; AC3: T8; AC4: T9,T16; AC5: T10,T11 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-004, ADR-009 (handleGetFeatures extended, not split), ADR-012 (listFeatures adapter), content-type negotiation pattern |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (escHtml on stage/slug), Accessibility (WCAG 2.1 AA via renderShell), Audit |
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
Story: Feature list HTML view — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.19-feature-list-html-view.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.19-feature-list-html-view-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce19-feature-list-html.js
- Extend handleGetFeatures() in src/web-ui/routes/features.js with content-type negotiation:
  - Accept: text/html → return renderShell({ title, bodyContent, user }) wrapping the feature list HTML
  - Accept: application/json or no Accept header → return JSON unchanged (do not change JSON response shape)
- Use existing renderFeatureList(features) — do not rewrite or duplicate
- Import renderShell() from src/web-ui/utils/html-shell.js (created by wuce.18)
- Import escHtml() from src/web-ui/utils/html-shell.js — apply to all stage and slug values rendered in HTML
- Zero features → empty-state message in <main>, no empty <ul>
- authGuard: unauthenticated → 302 /auth/github (both HTML and JSON paths)
- Audit log: write { userId, route: '/features', timestamp } on every authenticated request
- ADR-004: repository configuration from WUCE_REPOSITORIES env var
- ADR-012: listFeatures(token) adapter — no inline fetch
- ADR-009: handleGetFeatures already separated; extend in-place, do not split into two handlers
- Open a draft PR when all 16 tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming named sign-off obtained from Hamish King
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.19-feature-list-html-view-dor-contract.md
