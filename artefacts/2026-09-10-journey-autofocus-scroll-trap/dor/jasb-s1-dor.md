# Definition of Ready Checklist

## Definition of Ready: /journey's unconditional autofocus on the "new feature" input auto-scrolls past the entire feature list on every page load

**Story reference:** artefacts/2026-09-10-journey-autofocus-scroll-trap/stories/jasb-s1-remove-unconditional-autofocus-on-journey-new-feature-input.md
**Test plan reference:** artefacts/2026-09-10-journey-autofocus-scroll-trap/test-plans/jasb-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-10

---

## Contract Proposal

See `artefacts/2026-09-10-journey-autofocus-scroll-trap/dor/jasb-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed implementation (conditionally gate `autofocus` on the existing `showNewForm` boolean) directly satisfies AC1 and AC2 with no other behaviour change, and AC3's regression coverage requires no implementation change at all. No mismatches between the contract and the stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "operator visiting `/journey` to find and continue an existing feature" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3 E2E tests, one per AC |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Same "can an operator tell where they are and find what they need" thread as `2026-08-31-web-ui-navigation-legibility` — found live while verifying that feature's own problem |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | All 3 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Story's Dependencies block is "None" (upstream) — no `schemaDepends` declaration required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated — single-line fix named precisely, reuses existing `showNewForm` flag rather than introducing new state. No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ | All 3 ACs are CSS-layout-dependent (real browser scroll/focus behaviour), but E2E tooling (Playwright) is already configured for this repo — no block |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-10-journey-autofocus-scroll-trap/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as every prior short-track story in this repo** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("Yes the bug first"), following live Chrome reproduction of the bug shown to the operator before this story was written. Recorded transparently, matching the identical, already-logged H-GOV gap pattern used by every prior short-track story (e.g. `daga-s1`). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 14/14 (9 direct passes + 5 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a separate person before implementation begins | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-09-10-journey-autofocus-scroll-trap/decisions.md` — root cause confirmed via live reproduction before the story was written; fix is a single conditional-attribute change, complexity 1, low ambiguity. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's one gap-table entry (synthetic seed count of ~40 vs. staging's real 269) is an explained design choice with stated mitigation, not an unresolved uncertainty | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: /journey's unconditional autofocus on the "new feature" input auto-scrolls past the entire feature list on every page load — artefacts/2026-09-10-journey-autofocus-scroll-trap/stories/jasb-s1-remove-unconditional-autofocus-on-journey-new-feature-input.md
Test plan: artefacts/2026-09-10-journey-autofocus-scroll-trap/test-plans/jasb-s1-test-plan.md
DoR contract: artefacts/2026-09-10-journey-autofocus-scroll-trap/dor/jasb-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

(1) src/web-ui/routes/journey.js (~line 344): the "Feature name" input
currently reads:
  '<input id="jh-fname" class="jh-input" name="featureName" type="text" placeholder="e.g. Impact matrix tool" required autofocus>'
Change it so the literal `autofocus` attribute is only emitted when the
existing `showNewForm` boolean (already computed earlier in
handleGetJourney from `req.query && req.query.new === '1'`, already used
to gate the panel's highlight styling at ~line 338) is true. Do NOT
introduce a new flag or re-derive showNewForm differently -- reuse the
exact existing variable.

(2) Add a new Playwright spec (e.g. tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js)
covering all 3 ACs per the test plan:
  - AC1: seed ~40 synthetic journeys via POST /test/seed-durable-stage
    (same pattern as tests/e2e/ep1-s4-stage-selector.spec.js's own
    seedStage helper), load /journey with no query string, assert
    window.scrollY === 0 and document.activeElement is not #jh-fname.
  - AC2: load /journey?new=1, assert #jh-fname is focused
    (locator.toBeFocused()) and in the viewport (toBeInViewport()).
  - AC3: load /journey, fill #jh-fname with a unique synthetic name,
    submit the form, assert successful redirect into a new skill session.

Constraints:
- Do NOT change the "Start a new feature" section's fields, validation,
  or submit behaviour -- only the input's initial-focus condition.
- Do NOT change _mergeStateFeaturesIntoJourneyList, card layout, or any
  other part of the page.
- Do NOT add pagination or virtualization -- explicitly out of scope.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — single-line, low-blast-radius conditional-attribute fix reusing an existing, already-computed flag; root cause confirmed via live reproduction, not guessed.
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)
