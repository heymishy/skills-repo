# Definition of Ready Checklist

## Definition of Ready: Make the "Continue to next stage" action persistently reachable regardless of scroll position

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s2-persistent-next-stage-action.md
**Test plan reference:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s2-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-10

---

## Contract Proposal

See `artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s2-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed `position: sticky` implementation directly satisfies AC1–AC5, each AC maps to a real, already-written test (2 integration + 3 E2E). No mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Developer/engineer or Platform maintainer running a multi-stage feature session through the web UI" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | M2 — Next-stage-action findability |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `/review` Run 2 (`wnl-s2-review-2.md`) — 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `wnl-s1` only as a shared-file (not upstream-blocking) note — "None" as an upstream dependency; no `schemaDepends` declaration required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, correctly cites `.sw-imp-banner`'s sticky pattern and (post-fix) the correct npm-dependency source; `/review` Category E clean at Run 2 |
| H-E2E | CSS-layout-dependent gap check | ✅ | AC1/AC3/AC5 are `CSS-layout-dependent` — E2E tooling (Playwright) already configured, all 3 covered by real E2E tests, no block |
| H-NFR | NFR profile exists | ✅ | Feature-level `nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ | "Hamish King — Platform Owner — 2026-08-31" present and substantive |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 13/13 (10 direct passes + 3 explicit N/A).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | All Run 1 MEDIUM findings resolved before Run 2 | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a separate person before implementation begins | **Acknowledged — proceed.** Low-complexity story (rating 1) reusing an already-live pattern (`.sw-imp-banner`); ACs scrutinised twice via `/review`. RISK-ACCEPT logged in `decisions.md`. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps in this test plan — all 5 ACs have a real automated test, none manual-only | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Make the "Continue to next stage" action persistently reachable regardless of scroll position — artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s2-persistent-next-stage-action.md
Test plan: artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s2-test-plan.md
DoR contract: artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s2-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

(1) src/web-ui/routes/skills.js (~line 4569): add position: sticky;
bottom: 0 (with an appropriate z-index so the control stays above
scrolled content) to the .sw-journey-gate div -- via its existing
inline style="..." attribute or an added stylesheet rule targeting
.sw-journey-gate, whichever is cleaner. The class="sw-journey-gate"
attribute MUST remain the literal string at the start of the div's
opening tag -- do not reorder attributes such that "class=" is no
longer the first attribute, and do not wrap this div in a new outer
container. tests/check-lsbm-s1-live-substep-injection.js (lines 284,
299) depends on this exact literal string as a slice-boundary anchor.

(2) Create tests/check-wnl-s2-journey-gate-sticky.js, reusing
tests/check-lsbm-s1-live-substep-injection.js's own makeSession()/
freshRequire() helpers. Implement both integration tests named in the
test plan (gate-confirm-form-unchanged, substep-affordance-markup-unaffected).

(3) Create tests/e2e/wnl-s2-journey-gate-sticky.spec.js, following the
exact pattern of tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js
(withAuth fixture, seedStage helper). Implement all 3 E2E tests named
in the test plan (AC1, AC3, AC5).

(4) Run node tests/check-lsbm-s1-live-substep-injection.js directly
and confirm all its existing tests still PASS.

Constraints:
- Do NOT change the form, CSRF field, button copy, or the "Artefact
  saved — advance to next stage" caption.
- Do NOT add a JS-based scroll listener or custom positioning logic.
- Do NOT make any other page element sticky.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. Do not introduce patterns listed as
  anti-patterns or violate named mandatory constraints or Active ADRs.
- No new npm dependencies (product/tech-stack.md's runtime constraint,
  Mandatory Constraint MC-SELF-02 -- do not cite ADR-009, which governs
  an unrelated topic).
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — small, low-risk CSS change reusing an already-established, already-live production pattern; no security, compliance, or data-model surface. Matches epic-level oversight.
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)
