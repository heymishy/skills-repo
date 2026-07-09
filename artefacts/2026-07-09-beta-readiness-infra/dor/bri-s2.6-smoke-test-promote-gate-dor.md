## Definition of Ready: Add staging smoke test + manual promote gate to prod

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.6-smoke-test-promote-gate-test-plan.md
**Contract reference:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.6-smoke-test-promote-gate-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator)..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC4 |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: T1/T2 + Scenario 1; AC2: T3/T4 + Scenario 2; AC3: T5/T6 + Scenario 3; AC4: T7/T8 + Scenario 4. **Note:** AC1's dependency on bri-s3.1 (Epic 3) for a real `@mocked` suite is a disclosed, sequenced dependency — not an uncovered gap. The test plan's own T1/T2 test the gate mechanics independent of suite size, so H3 is satisfied without waiting for Epic 3. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Automated rollback and staging-of-staging excluded |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1, phrased as direct value-movement ("this story is the actual gate... without this story's... requirement, staging would just be a second place code deploys to automatically") |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2 (2026-07-09): 0 HIGH, 0 MEDIUM, 1 LOW. Run 1's 2 HIGH findings (undisclosed Epic 3 dependency; AC1 overpromising a "full regression suite") were both resolved in Run 2 — the epic doc now carries an explicit Cross-epic dependency note, and AC1 was rewritten to cover only "the currently-available `@mocked`-tagged suite... growing as further Epic 3 stories land" |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 4 ACs covered. **The bri-s3.1 dependency is disclosed and sequenced (see epic doc's Cross-epic dependency note and this story's Architecture Constraints) — per task scope, this does NOT fail H3/H8.** The test plan explicitly separates "gate mechanics, testable now" from "full suite content, arrives with Epic 3." |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (S2.5 dependency, Epic 3/bri-s3.1 dependency, Neon 10s timeout budget, ADR-018 Playwright); ADR-018 citation added at Run 2 (resolved 1-M1 from Run 1); review Category E clean |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Infrastructure/CI story, not UI |

**Hard block result: PASS — no blocks.**

**Sequencing note (not a block):** bri-s2.6's artefacts (story, test plan, verification script, DoR) are complete and correct, and the story is READY for DoR sign-off in that sense. However, its actual implementation and full DoD sign-off are sequenced after bri-s3.1 (Epic 3, mock LLM gateway) exists, since AC1 needs a real `@mocked` suite to run against. The gate mechanics (T1–T8) can be implemented and unit-tested now; end-to-end demonstration of AC1 against live suite content should wait for bri-s3.1 to land. This is disclosed at the epic level (`epic-2-staging-environment.md`'s "Cross-epic dependency" note) and at the story level (Architecture Constraints), consistent with the epic's own statement that "S2.6 cannot reach DoD strictly before Epic 3 begins."

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ (N/A) | Review Run 2 recorded 0 MEDIUM findings (Run 1's 1-M1 ADR-018 citation gap was resolved, not carried forward) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not reviewed by a domain expert — standing W4 solo-operator posture applies | Hamish King (standing W4 RISK-ACCEPT posture) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | All four Test Gaps entries (AC1's Epic-3-dependent suite coverage, AC2's environment-reviewer repo-Settings gap, AC4's deliberately-never-live-tested rollback, NFR1's config-proxy runtime budget) have explicit handling — none are left genuinely open/uncertain. Note carried-forward LOW finding 1-L1 (cross-reference pattern to S2.2's Neon timeout, informational only, not a W5 trigger). | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add staging smoke test + manual promote gate to prod — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.6-smoke-test-promote-gate-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

IMPORTANT — sequencing: This story's gate mechanics (smoke-test job structure,
promote job gating, rollback runbook) can be implemented and unit-tested now.
Full end-to-end demonstration of AC1 (a real `@mocked` suite running and
reporting pass/fail) depends on bri-s3.1 (Epic 3, mock LLM gateway) existing.
Do not block on Epic 3 to implement the gate structure itself — the tests in
this plan (T1/T2) verify the gate mechanics independent of suite content size.

Constraints:
- Smoke-test job runs the `@mocked`-tagged Playwright suite (ADR-018) against the staging URL, after the seed step, with no `continue-on-error: true`
- Promote job must declare a `needs:` dependency on the smoke-test job and must NOT carry an `if: always()` (or equivalent) override
- Promote job must require either `workflow_dispatch` or a GitHub Actions `environment:` gate — never reachable purely by the automatic push-to-main trigger
- `--app wuce-prod` (or equivalent) must appear only inside the gated promote job, never in the automatic staging deploy job (cross-check against S2.5's own AC4 static check)
- Write `docs/rollback-runbook.md` with concrete, copy-pasteable commands (`fly releases --app wuce-prod`, `fly deploy --image ...` or `fly releases rollback`) — no vague narrative descriptions
- Do not implement automated rollback — manual-but-documented only
- Architecture standards: read `.github/architecture-guardrails.md` before implementing (ADR-018 Playwright-only E2E framework)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness (per epic rationale — "a misconfigured promote gate is the exact risk this epic exists to prevent")
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed 2026-07-10

**Overall determination: READY** (artefacts complete and DoR-signed-off; implementation/DoD sequenced after bri-s3.1 lands per the disclosed cross-epic dependency)
