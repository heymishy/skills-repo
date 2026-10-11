# Definition of Done: Keyboard-accessible node movement (WCAG 2.1 AA)

**PR:** https://github.com/heymishy/skills-repo/pull/974 | **Merged:** 2026-10-11T05:17:01Z
**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
**Test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s4-test-plan.md
**DoR artefact:** artefacts/2026-10-10-infinite-canvas/dor/ic-s4-dor.md
**Assessed by:** Claude (session definition-of-done pass)
**Date:** 2026-10-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1a | ✅ | Criterion: `tabindex="0"` present on each node, visible non-default `:focus` style. Real-jsdom-execution unit test confirms `tabindex="0"` on every node. Live Chrome: focused node's real computed style gave `outlineStyle: "solid"`, `outlineWidth: "3px"`, `outlineColor: "rgb(37, 99, 235)"` (= `var(--accent)`), confirmed visually via a zoomed screenshot | `integration-real-code` + `live-verified` | None |
| AC1b | ✅ | Criterion: arrow key moves a focused node one fixed step, saves via `ic-s2`'s own route. Real-jsdom-execution unit test: dispatched `ArrowRight` moves the node exactly 20px and fires one save call to `.../stages/s1/position`. Live Chrome: 2× `ArrowRight` + 1× `ArrowDown` moved a real node from `(0,120)` to exactly `(40,140)` | `integration-real-code` + `live-verified` | None |
| AC2 | ✅ | Criterion: Tab/Shift+Tab move cleanly between nodes and off the canvas, no focus trap. Live Chrome, real OS-level key events: forward, 9 Tabs from the first node reached `<body>` (fully off the page); backward, 2 Shift+Tabs reached outside the canvas. No cycle into a node in either direction | `live-verified` | None — see the row below the table |
| AC3 | ✅ | Criterion: a full keyboard-only walkthrough (focus, move, reload) works end to end. Live Chrome, no mouse used: focused a node, moved it via real arrow-key presses, performed a genuine page reload against the real handler (mutated mock pool simulating persistence) — the reloaded node rendered at the exact moved position, not the default auto-layout position | `live-verified` | None |
| AC4 | ✅ | Criterion: mouse-drag and keyboard movement write to the exact same fields via the exact same route. Real-jsdom-execution unit test: a real mouse-drag event sequence and a real keyboard arrow-key move on the same node both produced exactly one save call each, to the identical URL, with identical `x`/`y` field names. Confirmed by reading `drawflow`'s own source that there is one single live position record both code paths write to (`editor.drawflow.drawflow[editor.module].data[nodeId]`), not a parallel model | `integration-real-code` | None |
| AC5 | ✅ | Criterion: holding/repeating an arrow key keeps moving the node (cumulative, not one-shot). Real-jsdom-execution unit test: two successive `ArrowRight` presses moved the node 20px then a further 20px (40px total). Live Chrome's own AC1b/AC3 walkthrough independently confirmed the same cumulative behaviour (2× `ArrowRight` = 40px) | `integration-real-code` + `live-verified` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded against the merged code. One real finding, not a code deviation: the live AC2 check found that each node's `Edit stage` link and `Map feature` button are also native tab stops, and the canvas's own outer container is one more — meaning a plain Tab sequence through the canvas is longer than "one stop per node." This did not violate AC2's own actual requirement (no trap); it only meant the E2E spec's original hardcoded press-count assertion was wrong and was corrected before merge (see `decisions.md`'s RISK-ACCEPT entry and `ic-s4-verification.md`'s Scenario 3 note).

---

## Scope Deviations

None. Confirmed via `git log master..feature/ic-s4` before merge: every commit maps directly to this story's own 3 planned tasks (tabindex/focus style, arrow-key movement, E2E spec) or to standard pipeline bookkeeping. Zero production files touched beyond `src/web-ui/routes/journeys.js`.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing:** 4 / 7 genuinely executed and passing in this environment (the real-jsdom-execution unit suite). The remaining 3 (the E2E spec) are real, written, and reviewed, but could not be executed through their own normal `DATABASE_URL`-backed Playwright harness here — **RISK-ACCEPTed** (see `decisions.md`, 2026-10-11, approved by Hamish King — Platform Owner) based on equal-or-stronger alternative live-browser evidence for the exact same 3 ACs, gathered during `/verify-completion`. `testPlan.passing` is recorded as 7 in `pipeline-state.json` on that documented, approved basis — not a raw CI-measured count. See that RISK-ACCEPT entry for the full root-cause writeup of the two confirmed, pre-existing, unrelated infra defects that block local E2E execution (an SSL-only pool config in `journey-store-pg.js`, and a missing CSRF token on the dashboard page the shared E2E fixture depends on — the second of which also blocks `ic-s2`'s own already-merged E2E spec, confirmed by reproducing it side by side).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1a — tabindex="0" present | ✅ | ✅ | Real-jsdom-execution, genuinely run |
| AC1b — arrow key moves + saves | ✅ | ✅ | Real-jsdom-execution, genuinely run |
| AC4 — same route, mouse vs. keyboard | ✅ | ✅ | Real-jsdom-execution, genuinely run |
| AC5 — repeated press cumulative | ✅ | ✅ | Real-jsdom-execution, genuinely run |
| AC1a — visible focus style (E2E) | ✅ | RISK-ACCEPT | Written, real; equivalent live-Chrome evidence gathered instead (see above) |
| AC2 — Tab order, no trap (E2E) | ✅ | RISK-ACCEPT | Written, real, and corrected against live-verified behaviour before merge; equivalent live-Chrome evidence gathered instead |
| AC3 — full keyboard walkthrough (E2E) | ✅ | RISK-ACCEPT | Written, real; equivalent live-Chrome evidence gathered instead |

Full unit suite at merge (CI, PR #974): all 8 required checks passed, confirmed via `gh pr checks` at merge time — not self-report.

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Accessibility — WCAG 2.1 AA keyboard operability for node repositioning (this story's entire purpose) | ✅ | AC3's own live, no-mouse, hands-on conformance check directly confirms this — not merely asserted |
| Performance — no additional bound beyond `ic-s2`'s own, same mechanism reused unchanged | ✅ | Reuses `ic-s2`'s own position-save route verbatim; no new performance surface introduced |
| Security — no new input surface, no new persisted data | ✅ N/A | Same CSRF-guarded route and same ownership-check-before-mutation pattern as `ic-s2`'s own `handlePatchJourneyStagePosition`, unchanged |
| Audit | ✅ N/A | None required — no data mutation beyond what `ic-s2` already covers |

---

## Metric Signal

**M1 — Spatial layout actually used**
Signal: not-yet-measured
Evidence: `contributingStories` corrected in this DoD pass to include `ic-s4` — the story's own "Benefit Linkage" section explicitly names it as closing the gap that would otherwise exclude keyboard-only operators from ever contributing to this metric, but `pipeline-state.json` had not been updated to reflect this at `/definition` time (the same drift class `ic-s2`'s own DoD found and fixed for this exact field). Measurement is now structurally possible via either input method; no real operator has moved and persisted a node in production yet.
Date measured: null

**M2 — Operator CX judgment vs. the list view it replaced**
Signal: not-yet-measured
Evidence: `contributingStories` populated in this DoD pass with all 4 stories (`ic-s1`, `ic-s2`, `ic-s3`, `ic-s4`) — intentionally left empty until now per `ic-s2`'s own DoD note ("pending the full epic shipping"). The `canvas-replacement-for-journey-stages` epic is now fully merged; this is the trigger that note named. M2's own measurement window (2-4 weeks of real operator use) can now begin.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

Reason for "WITH DEVIATIONS": not a code or AC deviation — the deviation is in the *evidentiary basis* for 3 of 7 tests (RISK-ACCEPTed equivalent live-browser verification in place of a genuine local Playwright run), fully documented in `decisions.md` and approved by the operator before this DoD was written. All 6 ACs are genuinely satisfied with real evidence; nothing here represents an uncertain or unverified product claim.

**Follow-up actions:**
1. Fix `journey-store-pg.js`'s hardcoded SSL-only pool config to support non-Neon/local Postgres targets (not this story's scope — logged in `decisions.md`).
2. Fix the dashboard page's missing CSRF token (or the shared E2E fixture's reliance on it), unblocking local E2E execution for `ep1-s3`/`ic-s2`/`ic-s3`/`ic-s4`'s own specs (not this story's scope — logged in `decisions.md`).
3. Once either (1) or (2) above is fixed, re-run `tests/e2e/ic-s4-keyboard-node-movement.spec.js` for real and update its own evidentiary basis from RISK-ACCEPTed to genuinely executed.
4. Consider a follow-up story for `check-pipeline-state-integrity.js`'s own C3 check to accommodate a documented RISK-ACCEPT the way it already (does not) accommodate a structurally-SKIPped test — this is the second time this exact checker gap has surfaced (first flagged in `ic-s2`'s own DoD Observation #1).

The `canvas-replacement-for-journey-stages` epic is now **complete** — all 4 stories (`ic-s1`–`ic-s4`) merged.

---

## DoD Observations

1. **A RISK-ACCEPT is the correct mechanism for "real evidence exists, but not through the test's own normal harness" — distinct from `ic-s2`'s own Docker-container precedent.** `ic-s2`'s DoD got a genuine CI-equivalent pass by standing up real, disposable infrastructure for a self-contained test (a migration + raw SQL, no full app server needed). `ic-s4`'s own E2E tests need the *entire* application server, including routes and pages this story never touches, to be fully healthy — and two separate, confirmed, pre-existing defects in that unrelated surface made a genuine local pass unreachable without fixing bugs outside this story's scope. Chasing a full local pass regardless (over 25 tool calls, two real root-causes found and one actually fixed) was worth the diagnostic value but not worth further scope creep once both were confirmed unrelated and reproducible against an already-merged story's own spec. The RISK-ACCEPT mechanism, with the operator's explicit sign-off, is what closed this out honestly rather than either fabricating a number or blocking indefinitely.
2. **`bin/skills advance`'s dot-notation writer silently created a wrong field when given a nested path it doesn't understand (`epic.status=complete` landed on the *story* object as a new `epic: {status:...}` field, not on the real parent epic).** Caught immediately by diffing the write before committing, not after. Worth a hardening follow-up: either the CLI should reject/error on a dot-notation key whose first segment doesn't match a known top-level story field, or its own documentation should be explicit that nested/non-story fields (like the parent epic) require the direct-script merge pattern instead.
3. **`contributingStories` drift recurred a second time** (`ic-s2`'s own DoD found and fixed the first instance) — `ic-s4` was missing from M1 despite its own "Benefit Linkage" section naming it explicitly, and M2 was still empty past its own documented "pending full epic shipping" trigger. Both fixed in this pass. This is now a confirmed *pattern*, not a one-off — worth the same `/definition`-time or `/review`-time check already suggested in `ic-s2`'s DoD: does every story's own "Benefit Linkage" section have a matching `contributingStories` entry in `pipeline-state.json`?

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Keyboard-accessible node movement (WCAG 2.1 AA)" (ic-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the RISK-ACCEPT for 3/7 tests properly justified, with a clear evidentiary trail (not just asserted)?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are the two follow-up infra defects (SSL pool config, missing dashboard CSRF token) tracked somewhere durable, not just mentioned once and forgotten?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Now that the epic is complete, is there a clear owner for the M2 measurement window that's about to start?
Report findings as HIGH / MEDIUM / LOW.
```
