## Definition of Ready: Prove the canvas diagram mechanism with a real data-model example

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s1-derisk-canvas-mermaid.md
**Test plan reference:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s1-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5), operator-directed
**Date:** 2026-07-25

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Developer/engineer |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests across unit/E2E |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage names a metric | ✅ | P2, rewritten during /review to be honest about foundational value |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, both MEDIUM findings resolved |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated, no Cat E HIGH | ✅ | ADR-026, ADR-027, MC-SEC-01 all cited |
| H-E2E | Layout-dependent ACs have E2E tooling or RISK-ACCEPT | ✅ | AC2 is CSS-layout-dependent; Playwright already configured in this repo — no gap |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-07-25-code-shape-diagrams/nfr-profile.md |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Founder/Operator — 2026-07-25 |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Resolved, not just acknowledged | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Spec error could go unnoticed until post-merge smoke test | RISK-ACCEPT logged in decisions.md, 2026-07-25 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Coding Agent Instructions

```
Proceed: Yes
Story: csd-s1 — De-risk canvas diagram block + mermaid data-model fidelity — artefacts/2026-07-25-code-shape-diagrams/stories/csd-s1-derisk-canvas-mermaid.md
Test plan: artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s1-test-plan.md

Goal:
Make every test in the test plan pass. Add a new `diagram` content-block
type (starting with `data-model`) to the /ideate canvas's existing
content-block dispatch mechanism. Prove mermaid rendering works with a
hand-authored 5+-entity fixture. Do not add scope beyond what the tests
and ACs specify.

Constraints:
- Follow this repo's existing Node.js CommonJS, zero-Express conventions
  in src/web-ui/ (see product/tech-stack.md's Web UI layer section).
- Extend the EXISTING content-block dispatch pattern (clusters/tables/
  paragraphs) — do not build a parallel rendering path (ADR-026).
- This story does NOT generate diagram content from a skill — fixture
  content only, hand-authored.
- This story does NOT cover System Architecture or Program Design
  diagram types — Data Model only.
- Mermaid's securityLevel configuration must disable HTML-injection-
  capable rendering (MC-SEC-01) — verify this is set explicitly, not left
  at a permissive default.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not violate ADR-026, ADR-027, or MC-SEC-01.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing it and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness confirmed
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (awareness confirmed, DoR artefact to be shared before assignment)
