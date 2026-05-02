# Definition of Ready: Multi-turn session persistence (resume in-progress skill session)

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.16 — Multi-turn session persistence (resume in-progress skill session)
**Epic:** E4 — Phase 2 Guided UI
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a non-technical pipeline operator / I want to close my browser and resume an in-progress skill session later / So that I can complete a skill session across multiple sittings without losing my answers…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 22 tests in wuce.16 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Cross-device sync, session export/import, session branching, delegation, WebSocket persistence explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P7 — Non-technical operator skill execution rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 3 / UNSTABLE |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.16 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | Session IDs cryptographically random ≥128 bits, session state server-side only (no OAuth token in session state), storage distinction (COPILOT_HOME ephemeral vs durable store for conversation history), ADR-009 (session state storage = responsibility of session module) |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (cryptographic session IDs, 403 cross-user access, no OAuth token in session state), Performance (resume <1s), Reliability (data preserved across restart), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers session ID security and cross-user access control for wuce.16 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | ⚠️ | Complexity 3 / UNSTABLE — ACP preview caveat; v1 uses filesystem/in-memory durable store (not ACP multi-turn). Operator acknowledges instability risk. |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.16 review report |
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
Story: Multi-turn session persistence (resume in-progress skill session) — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.16-session-persistence.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.16-session-persistence-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

ACP preview caveat: v1 uses filesystem/in-memory durable store for conversation history and partial artefact (not ACP multi-turn protocol). Reinstate/remove this caveat when ACP reaches GA.

Constraints:
- Jest + Node.js (backend only); no Playwright/Cypress
- Do not implement cross-device sync, session export/import, session branching, or WebSocket persistence (out of scope)
- Session IDs must be cryptographically random with ≥128 bits of entropy — use `crypto.randomBytes(16).toString('hex')` or equivalent
- Session state storage: filesystem/in-memory durable store — stores conversation history (questions + answers), partial artefact content, question index; NOT COPILOT_HOME (which is ephemeral per-subprocess)
- CRITICAL: OAuth token must NEVER be stored in session state (server-side or client-side)
- Cross-user access: `GET /skills/sessions/:sessionId` must validate that the session belongs to the authenticated user → HTTP 403 if mismatch (AC3)
- Session expiry: inactive sessions (>24h since last activity) must be deleted server-side; response must be "Session expired" not a 404 (AC4)
- Session list at `GET /skills` shows in-progress sessions with skill name, start date, questions completed (AC5) — integrates with wuce.13 skill list
- ADR-009: session state storage is the responsibility of the session module (wuce.10) extended for durable store — not inline in route handlers
- Storage distinction: COPILOT_HOME dirs (managed by wuce.10 session-manager) = ephemeral per-subprocess; durable store = application-layer session state (this story's scope)
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Test fixtures: `tests/fixtures/sessions/durable-session-state.json`
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming: (1) session IDs cryptographically random, (2) OAuth token not in session state, (3) cross-user 403, (4) storage distinction between COPILOT_HOME and durable store
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.16-session-persistence-dor-contract.md
