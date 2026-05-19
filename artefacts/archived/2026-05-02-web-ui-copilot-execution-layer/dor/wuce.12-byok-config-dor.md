# Definition of Ready: BYOK and self-hosted provider configuration

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.12 — BYOK and self-hosted provider configuration
**Epic:** E3 — Phase 2 Execution Engine
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator deploying the execution engine / I want to configure a bring-your-own-key (BYOK) or self-hosted model provider / So that the Copilot CLI subprocess uses an alternative model endpoint…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 17 tests in wuce.12 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | UI for entering BYOK keys, runtime key rotation, multi-provider load balancing, provider discovery explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P6 — Skill execution success rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.12 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-004 (BYOK config via env vars only), API key never logged, ADR-012 (BYOK = configuration of executeSkill adapter) |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (API key never in logs or API response), Performance (no measurable overhead from config injection), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers API key redaction and env-var-only BYOK for wuce.12 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.12 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E3 (Phase 2 Execution Engine). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: BYOK and self-hosted provider configuration — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.12-byok-config.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.12-byok-config-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); no Playwright/Cypress
- BYOK configuration must come from environment variables only (ADR-004) — no config file, no UI input
- BYOK env vars: `COPILOT_PROVIDER_TYPE`, `COPILOT_PROVIDER_BASE_URL`, `COPILOT_PROVIDER_API_KEY`, `COPILOT_PROVIDER_MODEL`
- When all BYOK vars present: inject into subprocess env alongside `COPILOT_GITHUB_TOKEN` and `COPILOT_HOME`
- When `COPILOT_OFFLINE=true`: inject `COPILOT_OFFLINE=true` into subprocess env
- When no BYOK vars: inject nothing extra — subprocess uses default Copilot endpoint
- `COPILOT_PROVIDER_API_KEY` must NEVER appear in logs, error messages, or HTTP response bodies (including stack traces)
- `COPILOT_PROVIDER_TYPE` set but `COPILOT_PROVIDER_BASE_URL` absent → log startup warning, do not crash
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-012: BYOK is a configuration layer on the `executeSkill` adapter — not a separate subprocess module
- ADR-004: all configuration from environment variables
- Do not implement UI for key entry, runtime rotation, or multi-provider load balancing (out of scope)
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming API key redaction in error logs and env-var-only configuration
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.12-byok-config-dor-contract.md
