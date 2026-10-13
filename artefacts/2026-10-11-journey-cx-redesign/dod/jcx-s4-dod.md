# Definition of Done: Persona card on the Customer experience tab, pre-populated from the product's own discovery artefacts

**PR:** https://github.com/heymishy/skills-repo/pull/981 | **Merged:** 2026-10-13
**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s4.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s4-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s4-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — suggestions offered from scanned discovery.md files, raw text only | ✅ | `check-jcx-s4-persona-card.js`: "AC1 (unit)" (raw-text extraction), "AC1 (integration)" (product-scoped), "(UI, E2E) clicking a suggestion fills the reference text area, never auto-splitting into the 3 fields" | `unit`, `integration-real-code`, real jsdom DOM-interaction | None |
| AC2 — no features/no persona found → blank form, no error | ✅ | "AC2: zero feature slugs returns an empty suggestions array, no error" + "AC2 (missing discovery.md)" | `unit` | None |
| AC3 — selecting/typing a persona saves to the 3 new columns | ✅ | "AC3: saving a persona writes persona_name/persona_role/persona_goal via one UPDATE" + "(UI, E2E) submitting the editor form POSTs all 3 persona fields to the save route" | `integration-real-code` + real jsdom DOM-interaction | None |
| AC4 — re-opening editor shows saved persona, not stale suggestions | ✅ | "AC4: a journey with a saved persona renders it, not the original suggestions" — exercises the real `handleGetJourneyCanvas` handler end to end | `integration-real-code` | None |
| AC5 — multiple distinct personas shown separately, not merged | ✅ | "AC5: two distinct personas under the same product are returned as separate entries, not merged" | `unit` | None |

### Verification strength summary
- `unit`: 4
- `integration-real-code`: 3 (including AC4's real-handler render test)
- Real jsdom DOM-interaction (`dispatchEvent`, matching `jcx-s1`'s own established convention): 2
- `live-verified`: 0 — see UI-evidence gate below

### UI-evidence gate
AC1 and AC3 both have a browser-observable interaction component (clicking a suggestion, submitting a form). Added 2 real jsdom E2E tests specifically to close this gap mid-implementation (not left to a bare RISK-ACCEPT): clicking a real suggestion button in a real rendered DOM fills the reference textarea with the exact raw text, and submitting the real form POSTs all 3 field values to the correct route. Combined with AC4's own real-handler render test, every piece of this story's logic has DOM-level or handler-level evidence. Still logged as an explicit RISK-ACCEPT (`decisions.md`, 2026-10-13) for the one thing genuinely missing: a literal pixel-rendered Chrome session, blocked by the same unresolved local-server-hang / no-fresh-browser-session issues as `jcx-hotfix1`/`jcx-s2`/`jcx-s3`.

---

## Scope Deviations

None in the story's own functional scope. One real, necessary regression-fix ripple: widening the journey-row `SELECT` to add `product_id`/`persona_*` broke 13 pre-existing tests' own mock-pool regex (same drift class as `jcx-s1`/`jcx-s2`) — fixed in the same PR, not deferred, not a scope violation (these are test-infrastructure fixes required to keep the suite green, not new product behavior).

---

## Test Plan Coverage

**Tests from plan implemented:** 7/7 (plus 2 added UI interaction tests, beyond the plan)
**Tests passing in CI:** 11/11 — confirmed via PR #981 (all 8 checks green), independently verified in a Linux/Node 24 Docker container before pushing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit, raw extraction) | ✅ | ✅ | |
| AC1 (integration, product-scoped) | ✅ | ✅ | |
| AC2 (empty scan) | ✅ | ✅ | |
| AC2 (missing discovery.md) | ✅ | ✅ | Added beyond the plan's own single AC2 test, covering a second real-world empty case |
| AC3 (save) | ✅ | ✅ | |
| AC3 (cross-tenant) | ✅ | ✅ | Added beyond the plan, matching D13 precedent |
| AC4 (re-open) | ✅ | ✅ | |
| AC5 (distinct personas) | ✅ | ✅ | |
| NFR (zero DB calls in scanner) | ✅ | ✅ | |
| (added) suggestion-click UI | ✅ | ✅ | |
| (added) form-submit UI | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — bounded file scan, not repo-wide | ✅ | Code review: `getPersonaSuggestions` queries only `feature_slug`s under the journey's own `product_id`, not every feature in the repo |
| Security — no new cross-tenant DB exposure, scanner is a pure file reader | ✅ | NFR test: `persona-scanner.js` source text contains zero `pool.query`/database-call patterns |
| Accessibility — WCAG 2.1 AA | ✅ | Code review: the editor form uses native `<label>`/`<input>`/`<textarea>` elements with no custom focus-trap or `outline:none` override, matching `jcx-s1`'s own already-established no-custom-focus-management pattern for this app's inline forms |
| Audit — none, persona data is descriptive | ✅ N/A | — |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Operator CX judgment vs. the reference bar | ✅ (baseline: "Not matching") | Not yet | `jcx-s3` (emotion curve) + `jcx-s4` (persona card) together are the two headline structural changes the CX spike identified as closing the gap to the reference examples. Both are now shipped — the real measurement event (soliciting the operator's own direct judgment) hasn't happened yet. |

**Measurement-ready gate:** Not yet.
**Evidence note:** Both headline mechanisms (emotion curve, persona card) are now functionally complete and merged; the actual M1 measurement event is a direct operator judgment solicitation, not inferable from code.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: one RISK-ACCEPT on a literal pixel-rendered browser session — every functional behavior already has DOM-level or handler-level evidence.)

**Follow-up actions:**
1. **Owner: future session.** Once the local dev server's hang is fixed or a fresh browser session is available, perform a real interactive check of the persona card as a final visual/UX confirmation.
2. **Owner: future session, product.** Now that both `jcx-s3` and `jcx-s4` have shipped, solicit the operator's own direct M1 judgment against the 3 reference examples — the real measurement event for this metric.

---

## DoD Observations

1. This story's own RISK-ACCEPT evolved mid-implementation from a weaker "not attempted" shape to a stronger "functionally proven, only visual confirmation missing" shape by adding 2 targeted jsdom tests rather than accepting the gap as-is — worth reinforcing as the default move whenever a live-browser check is blocked and the interaction logic can be exercised in jsdom instead: close what CAN be closed before logging what can't.
2. The regex-drift pattern (widening a shared SQL query breaks pre-existing mock-pool tests) has now recurred 3 times this session (`jcx-s1`'s AC5 markup, `jcx-s2`'s mapping query, `jcx-s4`'s journey-row query). Worth a dedicated `/improve` candidate: a lint-style check that flags any mock-pool regex in `tests/*.js` whose anchored prefix no longer appears verbatim anywhere in `src/web-ui/routes/*.js`'s own real SQL strings, catching this class of drift automatically rather than only at full-suite-run time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-s4 (persona card).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the RISK-ACCEPT reasonable given the 2 added jsdom interaction tests close most of the original gap?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Is the DoD Observation about a regex-drift lint check worth scoping as its own /improve candidate?
Report findings as HIGH / MEDIUM / LOW.
```
