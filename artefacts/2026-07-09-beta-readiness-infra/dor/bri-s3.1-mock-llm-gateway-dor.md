# Definition of Ready: Build the mock LLM gateway and fixture set (bri-s3.1)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.1-mock-llm-gateway.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.1-mock-llm-gateway-test-plan.md
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.1-mock-llm-gateway-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.1-review-2.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.1-mock-llm-gateway-dor-contract.md
**Assessed by:** Copilot (agent)
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator), I want... So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (AC1–AC5), all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1 unit; AC2–AC5 integration; all mapped in test-plan AC Coverage table |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | `@live` fixtures and inner-loop-beyond-gate-map stages named explicitly |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 6 (`@mocked` suite runtime under 10 minutes) — named and explained |
| H6 | Complexity is rated | ✅ | Rating 3, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2, 2026-07-09 — PASS, 0 HIGH findings (confirmed, not re-checked this run) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | One acknowledged gap (AC3 regeneration-script fidelity vs. true live response) — External-dependency, mitigation documented |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies = "None within this epic" — schema check not required (see dor-contract) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 adapter wiring + decisions.md fixture-matrix note populated; no Category E HIGH findings from review |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT blocks sign-off | ✅ | No CSS-layout-dependent AC in this story's test plan (backend-only, no UI surface). E2E tooling is separately confirmed configured repo-wide: Playwright (`playwright.config.js`), `tests/e2e/` directory, per ADR-018 — this passes cleanly, not treated as a gap. |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `artefacts/2026-07-09-beta-readiness-infra/nfr-profile.md` exists and lists this story under Performance and Security |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply to this story (nfr-profile.md Compliance section: "None") |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs (not None); nfr-profile.md exists — check satisfied |
| H-GOV | Governance approval check | ✅ | Confirmed PASSED — not re-checked this run (per task instruction) |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ | (a) Architecture Constraints describe activation-gating clearly — test-mode-only adapter (mirrors ADR-018 auth-bypass-fixture pattern), not a production-data adapter requiring a separate production-wiring AC; (b) test plan includes a dedicated "Injectable adapter default stub throws when not wired" unit test asserting the exact D37 stub-throw message format. See dor-contract for full reasoning. |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set — skipped |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set — skipped |

**All hard blocks pass. No blockers.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | N/A — populated |
| W2 | Scope stability is declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 2 (2026-07-09) recorded a MEDIUM finding on AC4's phrasing (the long justification clause embedded in the AC text itself). This finding is **not yet logged** in `decisions.md` — no matching RISK-ACCEPT or acknowledgement entry found. Unacknowledged MEDIUM findings increase rework risk at PR review if the phrasing concern resurfaces. | **Not yet acknowledged — outstanding action.** |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script has not been reviewed by a domain expert. Script may miss edge cases or verify against the wrong criteria if the coding agent's implementation diverges from the intended behaviour. | Not yet done — outstanding for all 6 Epic 3 stories. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | The one coverage gap (AC3 regeneration-script fidelity) has a documented mitigation (periodic manual regeneration review) — not left as an open uncertain item. | N/A |

**Outstanding warnings requiring action before/alongside assignment:** W3 (bri-s3.1 AC4 phrasing MEDIUM finding — log in `/decisions` or resolve), W4 (verification script domain-expert review — schedule before or during implementation).

---

## Oversight level

**Medium** (per `epic-3-test-suite.md`: "Test infrastructure, not production code paths — lower risk than Epics 1/2"). Share this DoR artefact with the tech lead before assigning. No formal sign-off required.

Note: `.github/architecture-guardrails.md`'s "Operating Posture" section states human oversight defaults to High for this solo-operator repository. The epic explicitly rates this Epic 3 at Medium with its own stated rationale — that epic-level rationale is treated as the applicable oversight level for these 6 stories per this DoR run's instructions; flagging the discrepancy here for visibility rather than silently overriding either source.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY

All hard blocks pass. Two warnings (W3, W4) are outstanding and require acknowledgement — they do not block sign-off but must be logged via `/decisions` (W3) and scheduled (W4) alongside or immediately after assignment.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build the mock LLM gateway and fixture set — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.1-mock-llm-gateway.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.1-mock-llm-gateway-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS conventions matching the existing codebase (see src/modules/skill-turn-executor.js, src/modules/mock-api-client.js for existing patterns).
- D37 injectable adapter rule is mandatory: the stub default for setMockGatewayClient() (or equivalent) MUST throw `Adapter not wired: mockGatewayClient. Call setMockGatewayClient() with a real implementation before use.` — never return a silent/empty response.
- The mock gateway must only be reachable when NODE_ENV=test (or an equivalent explicit test-mode flag) is set — mirror the tests/e2e/fixtures/auth.js guard pattern exactly. No path may activate it via production configuration error.
- `@live` fixture equivalents and fixture coverage for implementation-plan/subagent-execution/verify-completion are explicitly out of scope — do not build them.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs (ADR-018 in particular). If the file does not exist, note this in a PR comment.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests (e.g. how this gateway relates to the existing src/modules/mock-api-client.js mock provider): add a PR comment describing the ambiguity and do not mark ready for review.
- The implementation plan must name the wiring of the adapter into src/modules/skill-turn-executor.js as a separate task from building the fixture-lookup/adapter module itself (D37 requirement).

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (share DoR artefact with tech lead before assigning)
