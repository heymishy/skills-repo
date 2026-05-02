# Definition of Ready: Annotation and comment on artefact sections

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.8 — Annotation and comment on artefact sections
**Epic:** E2 — Phase 1 Full Surface
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a subject-matter expert (SME) reviewer / I want to add a named comment or annotation on a specific section of a pipeline artefact / So that my input is captured alongside the artefact under my identity…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 22 tests in wuce.8 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Threading/replies, delete/edit annotations, line-level granularity, approval workflows explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P3 — Non-technical attribution rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC6 each have dedicated test cases in wuce.8 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | Server-side sanitisation + length limit, ADR-012 (`commitAnnotation` adapter), committer = authenticated user |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (server-side sanitisation, max length server-side, committer identity), Performance (<5s), Accessibility (WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers server-side sanitisation and committer identity for wuce.8 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.8 review report |
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
Story: Annotation and comment on artefact sections — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.8-annotation.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.8-annotation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement threading, delete/edit, line-level annotations, or approval workflows (out of scope)
- Max annotation length: 2000 characters — enforced server-side (not only client-side)
- HTML/script content stripped server-side before commit — no raw HTML persisted (AC4)
- Committer identity = authenticated user — same constraint as wuce.3
- 409 conflict: fetch current SHA, retry once, return conflict error to client if retry fails — no silent data loss (AC6)
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-012: use `commitAnnotation(artefactPath, sectionHeading, annotationText, token)` adapter
- Annotation format in committed file: `## Annotations` section with name, section heading, text, ISO 8601 timestamp
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming sanitisation library and 409 retry logic
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.8-annotation-dor-contract.md
