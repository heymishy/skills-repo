# Definition of Ready: Bootstrap flags server-side on session start to avoid UI flicker

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.3-server-side-bootstrap.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.3-server-side-bootstrap-test-plan.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.3-server-side-bootstrap-dor-contract.md
**Assessed by:** Copilot (definition-of-ready skill)
**Date:** 2026-07-10

---

## Contract Review

Contract Proposal checked against the story's 4 ACs and the test plan: no mismatches found. The proposed bootstrap step, its session-caching behaviour (which is the actual mechanism proving AC2), and `handleGetWizard`'s gated-render logic map directly onto AC1–AC4 and their unit/integration/E2E tests. No hard block from Contract Review.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a first beta customer, I want the wizard canvas to render in its final gated state on first paint, So that I never see a flicker..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 1 unit + 2 integration; AC2: 1 unit; AC3: 1 unit + 1 integration; AC4: 1 integration + 1 E2E |
| H4 | Out-of-scope section is populated | ✅ | Live mid-session updates; client-side dev override |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 2 — Feature flags toggle without a redeploy |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 (2026-07-09): 0 HIGH, 3 MEDIUM, 0 LOW. Outcome: PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Test plan: "None. All 4 ACs are covered..." The one NFR-level gap (Accessibility — no AT-automation tooling exists in this repo) is explicitly logged in Test Gaps and Risks, not silently dropped |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ (see note) | D37, the model-first web-UI architecture (`product/tech-stack.md`), and ADR-018 (Playwright spec under `tests/e2e/`) are all cited and match the canonical definitions. **Spot-check note:** the current story text already includes the ADR-018 citation that review Run 1's finding 1-M3 flagged as missing — this citation appears to have been added to the story after Run 1, but no Run 2 exists to confirm the fix was reviewed. See W3 below. |
| H-E2E | CSS-layout-dependent AC with no E2E tooling and no RISK-ACCEPT | ✅ (N/A, confirmed per test plan) | AC4's "no flicker" behaviour is verified via raw initial-HTML inspection (an integration-level server-rendering concern), not CSS layout/`getBoundingClientRect` — per the test plan's own classification note, this is explicitly not a CSS-layout-dependent gap type |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` includes the flag-bootstrap ≤200ms row applying to bri-s1.3 |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ (N/A) | Not regulated |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal" checked |
| H-ADAPTER | Injectable adapter introduced/wired by this story (D37) | N/A | This story consumes S1.1's `isEnabled()` adapter as-is for bootstrap timing; it does not introduce a new adapter or wire a new PostHog connection point. Not in scope for H-ADAPTER per this DoR run's story-selection note. |

**Hard block result: all PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs are identified (or "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 1 logged 3 MEDIUM findings, **none logged in `decisions.md`**: **1-M1** — AC2 uses hedge phrasing ("the change is **not expected to** apply until next session-start") rather than an assertive requirement; still present verbatim in the current story text. **1-M2** — Benefit Linkage's connection to Metric 2 is a stretch (this story is about first-paint flicker, a UX-quality concern adjacent to — not the direct mechanism of — redeploy-free toggling, which S1.1 delivers); still present in current text. **1-M3** — AC4 requires a Playwright test but ADR-018 was not cited in Architecture Constraints; **the current story text already appears to cite ADR-018**, so this finding may already be resolved at the source, but no review Run 2 exists to confirm it and no `decisions.md` entry records the fix. Recommend: log all 3 in `decisions.md` (even 1-M3, for audit-trail completeness) or trigger a lightweight review Run 2. | Not yet acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | `bri-s1.3-server-side-bootstrap-verification.md` has not yet been reviewed by a human domain expert. Standard posture for this solo-operator repo (W4 expected, not exceptional) — still logged per instruction. | Not yet acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan's Coverage gaps: "None." The Accessibility NFR gap is typed "Untestable-by-nature" with a stated mitigation, not "UNCERTAIN" left unaddressed. | — |

---

## READY / BLOCKED Determination

**READY.** All hard blocks pass. Review Run 1's 3 MEDIUM findings (W3) remain unacknowledged in `decisions.md` — this does not block, but is flagged for operator attention, particularly the possible-already-fixed 1-M3 which deserves a confirming note either way.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Bootstrap flags server-side on session start to avoid UI flicker — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.3-server-side-bootstrap.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.3-server-side-bootstrap-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS modules, consistent with existing src/web-ui/ conventions. Hook
  the bootstrap step into the existing session-start flow ahead of page
  render, per product/tech-stack.md §Web UI layer.
- Do not implement live mid-session flag updates (websocket/SSE) or a
  client-side dev override — both explicitly out of scope.
- The AC4 Playwright spec (tests/e2e/) may be descoped with a decisions.md
  note if the integration tests are judged sufficient at implementation time,
  per the test plan's own stated allowance — this is not a license to skip
  AC4 coverage entirely, only to choose which test layer proves it.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, in particular D37, ADR-018 (Playwright: devDependency only,
  specs in tests/e2e/, unit test chain must not invoke Playwright), and
  ADR-022/ADR-023 (session model).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — Medium oversight requires engineering-lead awareness, not formal sign-off. Share this DoR artefact with the tech lead for visibility before dispatch.
**Signed off by:** Not required
