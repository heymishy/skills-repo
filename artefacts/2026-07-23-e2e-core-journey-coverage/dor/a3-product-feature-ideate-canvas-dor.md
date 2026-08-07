## Definition of Ready: Drive product + first-feature creation via rough-idea/ideate, assert canvas and artefact persistence

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a3-product-feature-ideate-canvas.md
**Test plan reference:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a3-product-feature-ideate-canvas-test-plan.md
**Contract reference:** artefacts/2026-07-23-e2e-core-journey-coverage/dor/a3-product-feature-ideate-canvas-dor-contract.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## Contract Review

✅ **Contract review passed** — the proposed implementation aligns with all 4 ACs. **Revised 2026-07-23** (see decisions.md ARCH entry): AC3 now runs against `MOCK_LLM_GATEWAY=true` with a deterministic fixture, removing the model-emission gap entirely — no mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Hamish King (Founder/Operator) |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 ACs, 4 tests |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | m1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs (gap explicitly acknowledged) | ✅ | No gaps — AC3 is fully deterministic via `MOCK_LLM_GATEWAY=true` (revised 2026-07-23) |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: A2 → `schemaDepends: ["dorStatus"]` declared, field present in schema |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | Cites ADR-024, ADR-022; 0 findings |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered |
| H-NFR | NFR profile exists | ✅ | Present |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By populated | ✅ | Hamish King — Founder/Operator — 2026-07-23 (M1 signal recorded) |
| H-ADAPTER | Injectable adapter check | ✅ | Not triggered |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**All hard blocks passed — 19/19.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM after Run 2) | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md, 2026-07-23 (feature-wide) |
| W5 | No UNCERTAIN gap items | ✅ | No gaps remain (revised 2026-07-23) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Drive product + first-feature creation via rough-idea/ideate, assert canvas and artefact persistence — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a3-product-feature-ideate-canvas.md
Test plan: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a3-product-feature-ideate-canvas-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS, Playwright Test under `tests/e2e/`, never in the unit test chain, per ADR-018
- Reuse A1/A2's auth+plan fixtures — do not duplicate signup/billing setup
- Set `MOCK_LLM_GATEWAY=true` for this story's server process/session — do NOT call the real model (revised 2026-07-23, matches discovery's original constraint). Configure the mock fixture to always include a canvas marker so AC3 is deterministic.
- Top up the `e2e-test-` tagged test tenant's credits via `POST /api/admin/credits/adjust` in test setup — "no free tier" (SCOPE-002) is intentional product policy; do not implement a credit grant in application code
- AC4's artefact comparison must read from disk/Postgres via the same API path the app itself uses (per this repo's disk-canonicity convention, write-then-read-from-disk before handoff) — do not compare against in-memory session state directly
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-23
