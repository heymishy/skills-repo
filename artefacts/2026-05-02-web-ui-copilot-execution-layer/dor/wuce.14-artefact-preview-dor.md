# Definition of Ready: Incremental artefact preview as skill session progresses

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.14 — Incremental artefact preview as skill session progresses
**Epic:** E4 — Phase 2 Guided UI
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a non-technical pipeline operator / I want to see a live preview of the artefact being generated as I answer each skill question / So that I can spot errors or scope drift before the skill session is complete…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests in wuce.14 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | WebSocket/Server-Sent Events streaming, inline preview editing, diff-from-previous-version, non-markdown previews explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P7 — Non-technical operator skill execution rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / UNSTABLE |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.14 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | Preview HTML sanitised before DOM insertion, `aria-live="polite"` on preview panel, v1 uses polling (not WebSocket) |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (preview content sanitised before DOM insertion), Performance (polling ≤2s interval), Accessibility (`aria-live="polite"`, WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers preview sanitisation for wuce.14 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | ⚠️ | Complexity 2 / UNSTABLE — ACP preview caveat; v1 uses polling, streaming is progressive enhancement. Operator acknowledges instability risk. |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.14 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W2 (Unstable scope — ACP preview caveat, acknowledged) and W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E4 (Phase 2 Guided UI). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Incremental artefact preview as skill session progresses — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.14-artefact-preview.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.14-artefact-preview-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

ACP preview caveat: v1 uses polling for preview updates (not WebSocket or Server-Sent Events). Streaming is a progressive enhancement for a later story. Reinstate/remove this caveat when ACP reaches GA.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement WebSocket/SSE streaming, inline editing, diff view, or non-markdown preview (out of scope)
- Preview panel update mechanism: polling endpoint `GET /skills/:sessionId/preview` — not WebSocket
- Preview HTML must be sanitised before DOM insertion — no raw markdown from server rendered directly as innerHTML
- `aria-live="polite"` attribute must be present on the preview panel element
- Markdown rendering: tables → HTML tables, code blocks → `<pre><code>` monospace (same rendering rules as wuce.2)
- "Commit artefact" button becomes active only when `executeSkill` has returned a completed artefact (AC5) — not during preview
- Reuse existing markdown sanitiser from wuce.2 — do not create a parallel sanitisation path
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Test fixtures: reuse `tests/fixtures/cli/copilot-cli-success.jsonl` from wuce.9
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming: (1) preview sanitised before DOM insertion, (2) aria-live polite present, (3) polling not WebSocket
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.14-artefact-preview-dor-contract.md
