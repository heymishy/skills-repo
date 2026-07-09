# Definition of Ready: Create and wire the 3 initial flags across both projects

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.5-initial-flags-wired.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.5-initial-flags-wired-test-plan.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.5-initial-flags-wired-dor-contract.md
**Assessed by:** Copilot (definition-of-ready skill)
**Date:** 2026-07-10

---

## Contract Review

Contract Proposal checked against the story's 4 ACs and the test plan: no mismatches found. The proposed flag-key constants module and the 3 handler gates map directly onto AC1–AC4. One documentation-hygiene note surfaced during this check (not a scope mismatch): the test plan's NFR section flags the story's Security NFR line as still referencing the superseded `billing-v2` placeholder — checked against the current story text, this has **already been corrected** to `org-kanban-view`. The test plan's note is stale, not the story. No hard block from Contract Review.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator), I want the 3 named flags...created in both PostHog projects and actually wired to gate real, already-shipped app behaviour, So that flag toggling is proven end-to-end..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 2 integration (+ 1 manual); AC2: 1 unit + 2 integration; AC3: 2 integration; AC4: 1 unit (+ 1 manual) |
| H4 | Out-of-scope section is populated | ✅ | 4th flag; automated flag-parity CI check |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 2 — Feature flags toggle without a redeploy |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2 (2026-07-09): 0 HIGH, 0 MEDIUM, 0 LOW. Outcome: PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Test plan's Coverage gaps table lists 2 explicit **External-dependency** gaps (AC1's live-environment independence confirmation, AC4's real dashboard parity) — both acknowledged with a stated mitigation (manual scenario in the verification script), not silently dropped. This satisfies H8's "gaps explicitly acknowledged" clause. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 cited (all flag checks go through the shared `isEnabled()` helper, no bespoke logic) — accurate. Review Run 2: 0 HIGH/MEDIUM/LOW, "IMPROVED" from Run 1's fictional-feature findings, now fully resolved |
| H-E2E | CSS-layout-dependent AC with no E2E tooling and no RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC — the Accessibility NFR is framed as a no-regression claim, structurally covered by the AC1 integration tests per the test plan's own reasoning |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` covers this story implicitly via the S1.1/S1.3 budgets it inherits, plus ADR-025 tenant-isolation applying to `org-kanban-view` |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ (N/A) | Not regulated |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal" checked |
| H-ADAPTER | Injectable adapter introduced/wired by this story (D37) | N/A | This story only calls the already-established `isEnabled()` helper (S1.1) against 3 named flag keys — it introduces no new adapter and wires no new PostHog connection point. Not in scope for H-ADAPTER per this DoR run's story-selection note. |

**Hard block result: all PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs are identified (or "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | Review Run 2: 0 MEDIUM remaining (both Run 1 mediums resolved when the fictional GLM-5.2/billing-v2 features were replaced with real, already-shipped routes). Nothing to acknowledge. | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | `bri-s1.5-initial-flags-wired-verification.md` has not yet been reviewed by a human domain expert. This script also contains 2 manual scenarios requiring real staging+prod PostHog dashboard access — an unreviewed script increases the risk that the manual scenarios are run incorrectly, in addition to the general edge-case-miss risk. Standard posture for this solo-operator repo (W4 expected, not exceptional) — still logged per instruction. | Not yet acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan's Coverage gaps table uses gap type **External-dependency** (with risk ratings 🟡/🔴 and stated mitigations) for both open items — not "UNCERTAIN," and both have a documented handling path (manual scenario). No unaddressed UNCERTAIN items. | — |

---

## READY / BLOCKED Determination

**READY.** All hard blocks pass. This story has the cleanest review outcome of the 5 (0/0/0 after Run 2). The two External-dependency test gaps (AC1, AC4) are explicitly acknowledged with a mitigation path, not silent gaps — they do not block DoR per H8's own allowance.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Create and wire the 3 initial flags across both projects — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.5-initial-flags-wired.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.5-initial-flags-wired-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. This story depends on
S1.1-S1.4 all being implemented first — confirm those are merged/available
before starting.

Constraints:
- CommonJS modules, consistent with existing src/web-ui/ conventions. Gate
  each of the 3 flags through the shared isEnabled() helper only — no
  flag-specific bespoke evaluation logic (per D37/this story's Architecture
  Constraints).
- Use exactly these 3 flag key strings: wizard-ui, product-kanban-view,
  org-kanban-view. Do not reintroduce the superseded placeholder names
  (model-routing-glm52, billing-v2) anywhere in code or tests.
- Do not build a 4th flag or automated cross-project flag-parity checking —
  both explicitly out of scope; manual verification is sufficient for MVP.
- The two manual verification scenarios (AC1 live-environment confirmation,
  AC4 real dashboard parity) are out of this task's automated-test scope —
  do not attempt to automate real PostHog dashboard comparison; leave those
  as manual steps in the verification script for Hamish to run post-deploy.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, in particular D37 and ADR-025 (org-kanban-view's tenant
  isolation).
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
