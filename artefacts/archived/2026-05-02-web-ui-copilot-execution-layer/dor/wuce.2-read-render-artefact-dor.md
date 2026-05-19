# Definition of Ready: Read and render artefact from GitHub repository

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.2 — Read and render artefact from GitHub repository
**Epic:** E1 — Walking Skeleton
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a business lead or programme manager / I want to read any pipeline artefact from a GitHub repository / So that I can review pipeline outputs without needing a GitHub account or technical skills…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests in wuce.2 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Non-GitHub repos, editing, browsing/listing, diff views explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P4 — Status self-service rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.2 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared in this story |
| H9 | Architecture constraints populated and reference guardrails | PASS | Sanitise before innerHTML, ADR-003, ADR-012 (artefact-fetching adapter), no external CDN |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (sanitised HTML, XSS), Performance (<3s), Accessibility (WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers HTML sanitisation cross-cutting requirement for wuce.2 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | This story introduces no new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.2 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E1 (Walking Skeleton). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Read and render artefact from GitHub repository — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.2-read-render-artefact.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.2-read-render-artefact-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement the sign-off layer (wuce.3), action queue (wuce.5), or any write operation
- All markdown-to-HTML conversion must be sanitised server-side before browser rendering — no raw innerHTML from untrusted content (XSS prevention)
- No external CDN dependencies — all libraries must be bundled or inline
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- ADR-012: artefact fetching must use a named adapter — `fetchArtefact(repoPath, token)` — no inline GitHub API calls in route handlers
- ADR-003: no new pipeline-state.json fields introduced
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment noting the sanitisation library used and how XSS is mitigated
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.2-read-render-artefact-dor-contract.md
