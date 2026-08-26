# Definition of Ready: lsbm-s1 — Show the /clarify and /estimate sub-step buttons live, not only after a page reload

**Story reference:** artefacts/2026-08-27-live-sidestep-buttons-missing/stories/lsbm-s1-live-substep-affordance-injection.md
**Test plan reference:** artefacts/2026-08-27-live-sidestep-buttons-missing/test-plans/lsbm-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (live production bug, root-caused via direct source inspection)

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator finishing the discovery or definition stage in a live conversation" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC4: static-source unit tests + manual scenarios; AC5/AC6: full unit coverage |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions, including the related-but-broader "disable input after done" gap |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | No formal benefit-metric artefact — same treatment as prior short-track fixes this session |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's own "Coverage gaps" section explicitly explains and mitigates the one gap type (live-browser proof), matching an already-accepted repo precedent (`check-ougl4`) — not a silent absence |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Extraction/hoisting/injection design detailed with exact line references |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact — short-track |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 14/14.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | This story touches client-side chat JS that's exercised by every discovery/definition session in the app — a real but bounded blast radius, mitigated by AC5's byte-identical-output regression guard on the already-working resume path | Hamish King (operator) — implicit in the standing "full pipeline with subagents" direction already established this session |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ Acknowledged | The one gap (true live-browser proof) is explicitly named, its reason given, and its mitigation (manual verification scenarios) stated — not an open "UNCERTAIN" | N/A — explicitly mitigated |

All warnings resolved or acknowledged. RISK-ACCEPT for W4 logged in `decisions.md`.

---

## Oversight level

**Medium** — the fix touches client-side JS exercised on every discovery/definition chat session (real blast radius), but the design is a mechanical extraction plus an additive injection path with an explicit byte-identical regression guard on the existing, already-working resume behaviour (AC5), keeping risk bounded without escalating to High.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

**Applicable excerpts:**

> **HTML render function unit test pattern:** Assert on specific string fragments, never full-HTML snapshot equality — except where an explicit byte-identical comparison is the actual point (AC5's regression guard, a narrow, deliberate exception matching the pattern's own "Do NOT use assert.strictEqual... full-snapshot" guidance for the *general* case, not this specific mechanical-extraction-must-not-change-output case).

No other section of this file is directly implicated — this story does not touch `renderShell`/nav rendering, Postgres fallback, or CSRF/session infrastructure.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: lsbm-s1 — Show the /clarify and /estimate sub-step buttons live, not only after a page reload
  — artefacts/2026-08-27-live-sidestep-buttons-missing/stories/lsbm-s1-live-substep-affordance-injection.md
Test plan: artefacts/2026-08-27-live-sidestep-buttons-missing/test-plans/lsbm-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. Extract buildJourneySubStepAffordance(skillName, journeyId) (or similar
   name) in src/web-ui/routes/skills.js from the existing inline markup
   in the full-render path's `if (skillName === 'discovery') {...} else
   if (skillName === 'definition') {...}` branches (~line 4157-4239).
   Have the full-render path call this new function instead of inlining
   -- output must be byte-identical (AC5).
2. In the unconditional script section where GATE_CONFIRM_URL /
   NEXT_STAGE_LABEL are already computed (~line 2921-2923), add a
   SUBSTEP_HTML JS string constant from the new function's output, and
   move the click-handler function definitions (swLaunchClarify,
   swToggleEstimate, the estimate-form submit wiring) to be defined
   unconditionally in this same script section -- not nested inside the
   session.done-gated subStepJs block.
3. Extend showCommitLink() (~line 3512-3528) to inject SUBSTEP_HTML into
   the DOM before the plain gate-confirm form when it's non-empty, then
   explicitly attach the estimate form's submit listener to the
   freshly-inserted #sw-estimate-form element.
4. Write tests/check-lsbm-s1-live-substep-injection.js covering AC1-AC6,
   following tests/check-ougl4-journey-aware-chat-button.js's exact
   house style (makeSession/freshRequire/string-content assertions).
5. Re-run tests/check-ougl4-journey-aware-chat-button.js and confirm it
   still passes unchanged, then run the full suite.

Constraints:
- No new npm dependencies.
- The full-render path (session.done already true at render time) must
  produce byte-identical output to before this fix for the sub-step
  markup section specifically -- verify this directly, don't assume it.
- Do not disable the chat input after done -- explicitly out of scope.
- Do not touch das-s1's stage-completion/artefact-saving logic.
- Do not change the /estimate form's fields or validation.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a
  PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — tech-lead/operator awareness (satisfied: operator directed both the live-bug investigation and the "#3 next" priority directly)
**Signed off by:** Claude (agent), on explicit operator direction ("#3 side-trip buttons" selected as the next story)
**Date:** 2026-08-27
**Proceed:** Yes — all hard blocks pass, all warnings resolved or acknowledged
