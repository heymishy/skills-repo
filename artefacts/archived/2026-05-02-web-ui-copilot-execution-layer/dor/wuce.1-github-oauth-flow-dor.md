# Definition of Ready: GitHub OAuth flow and session establishment

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.1 — GitHub OAuth flow and session establishment
**Epic:** E1 — Walking Skeleton
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a business lead or non-technical stakeholder / I want to authenticate with the web UI via GitHub OAuth / So that I can access pipeline artefacts…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests in wuce.1 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Non-GitHub IdPs, Bitbucket OAuth, token refresh explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | M2 — Phase 1 stakeholder activation rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.1 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared in this story |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-004 (env vars for OAuth creds), ADR-012 (standalone auth adapter), ADR-009 (auth handler separate from read/write), CSRF state mandatory, tokens HttpOnly/Secure/SameSite=Strict |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (CSRF, HttpOnly), Performance (<2s), Accessibility (WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile exists at feature level; data classification implicit in security NFRs |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | This story introduces no new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.1 review report |
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
Story: GitHub OAuth flow and session establishment — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.1-github-oauth-flow.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.1-github-oauth-flow-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement the artefact read/render layer (wuce.2), the sign-off layer (wuce.3), or any frontend HTML/CSS not required by the 18 tests
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- ADR-004: all config (CLIENT_ID, CLIENT_SECRET, SESSION_SECRET) via environment variables only
- ADR-012: OAuth flow must use a standalone auth adapter — no inline GitHub API calls in route handlers
- ADR-009: the auth handler must be separate from read and write route handlers
- Tokens stored in HttpOnly Secure SameSite=Strict session cookies only — never in localStorage or browser JS scope
- CSRF state parameter is mandatory for the OAuth callback — missing or mismatched state returns 403
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment summarising security decisions (session cookie config, state param implementation)
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.1-github-oauth-flow-dor-contract.md
