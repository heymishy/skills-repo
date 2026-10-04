# Definition of Done: Type/source filter for the signals panel

**PR:** https://github.com/heymishy/skills-repo/pull/940 | **Merged:** 2026-10-04
**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
**Test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Hiding a type removes matches from the full list, not just the current page | ✅ | Unit: `filterSignals` removes all 15 of 120 scattered `parse-error` entries. Integration: real route dispatch `GET /signals?hideType=parse-error` drops total count from 120→105, zero `parse-error` markers on any page | `integration-real-code` | None |
| AC2 — Hiding a source behaves the same; filters combine | ✅ | Unit: AND-of-NOT combination test (overlapping match not double-excluded). Integration: `GET /signals?hideType=parse-error&hideSource=capture-log` combines both | `integration-real-code` | None |
| AC3 — Filter state is visible and bookmarkable | ✅ | Integration test: two dispatches of `GET /signals?hideType=parse-error` (simulating reload) produce byte-identical output, with visible "Hiding: parse-error" text. **Live-confirmed at DoD time** against real local data (2026-10-05): navigating directly to `/signals?hideType=parse-error` in a real browser reproduced the same filtered state and visible summary from a fresh page load, not just from clicking the toggle | `integration-real-code` + live local browser confirmation | None |
| AC4 — Filtering to zero results shows a clear empty state | ✅ | Integration test: a combined filter matching every signal in the fixture renders the distinct "no signals match the current filters" message plus a clear-filters link | `integration-real-code` | None |
| AC5 — Filter controls are keyboard-accessible | ✅ | Unit test confirms toggle links are plain `<a>` elements with no `tabindex` override. **Additionally closed the DOM-presence-only gap at DoD time**: a real keyboard Tab-walk against a running local dev server (2026-10-05) showed visible browser focus landing on the first filter toggle ("Hide actuals") via sequential Tab navigation, and pressing `Enter` on that focused link navigated to `?hideType=actuals`, toggled the link text to "✓ Show actuals" (a text glyph, not colour alone), and surfaced the "Hiding: actuals — Clear filters" summary — full keyboard operability confirmed end-to-end, not just DOM presence. See `architecture-guardrails.md`'s `res-s4` anti-pattern precedent, which this closes. | `unit` + `integration-real-code` (live local keyboard-Tab + Enter-activation check) | None |
| AC6 — `ep2-s1`/`ep2-s3`'s own existing behaviour preserved when no filter applied | ✅ | Integration test reuses `ep2-s3`'s own existing AC1-AC7 assertions unchanged against `GET /signals` and `GET /signals?page=2` with no filter params — all pass | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Full-text search, saved presets, and "show only" semantics (all explicitly out of scope) were not implemented — confirmed by reviewing the merged diff (`filter-signals.js`, `signals-panel.js`, `signals-panel-view.js`, plus the new test file only).

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (the plan's own documented count after a mid-implementation correction — see DoD Observations)
**Tests passing in CI:** 12 / 12 (full suite: 713/713, 0 failures)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| filterSignals removes all signals of a hidden type from the full array (AC1) | ✅ | ✅ | |
| filterSignals is a no-op when hideTypes/hideSources are both empty (AC1/AC6 baseline) | ✅ | ✅ | |
| filterSignals combines hideTypes and hideSources, AND-of-NOT (AC2) | ✅ | ✅ | |
| Rendered filter toggle controls are plain `<a>` elements, no tabindex override (AC5) | ✅ | ✅ | |
| Real route dispatch: `?hideType=parse-error` excludes from every page (AC1) | ✅ | ✅ | |
| Real route dispatch: `?hideType=parse-error,decision` hides both comma-separated values (AC1/AC2) | ✅ | ✅ | |
| Real route dispatch: `?hideType=parse-error&hideSource=capture-log` combines both (AC2) | ✅ | ✅ | |
| Real route dispatch: applied filters visible and survive reload (AC3) | ✅ | ✅ | Fixed mid-implementation: shared session object across both dispatches after a CSRF-token-identity bug was found (see DoD Observations) |
| Real route dispatch: combined filter matching zero signals shows distinct empty state (AC4) | ✅ | ✅ | |
| Real route dispatch: no filter params renders identically to pre-sptu-s2 behaviour (AC6) | ✅ | ✅ | |
| NFR: filtering the real ~5,340-signal array stays within <100ms budget | ✅ | ✅ | |
| NFR: unrecognized hideType/hideSource value never throws, never hides unmatched signals | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage gap audit (Step 4):** No AC in this story was classified `CSS-layout-dependent` at `/test-plan` (confirmed in the test plan's own Step 3a note — filter toggles are plain `<a>` links, DOM-structure assertions suffice for the automated suite). No RISK-ACCEPT was required at that gate. The *separate* UI-evidence gate (for AC5's real-world keyboard-operability claim) was closed directly at DoD time via a live browser check, per the AC5 row above — not via RISK-ACCEPT.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — filtering ~5,340 signals stays within <100ms budget | ✅ | Dedicated NFR test in `check-sptu-s2-signals-filter.js`, passing |
| Accessibility — filter controls fully keyboard-operable, colour never sole indicator | ✅ | AC5 unit test + live keyboard-Tab + Enter-activation check (above); toggle state uses a ✓ text glyph, not colour alone, confirmed in both code review and the live screenshot | 
| Security — hideType/hideSource validated against real observed value set | ✅ | Dedicated unit test confirms unrecognized values never throw and never hide unmatched signals |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Time-to-triage | ❌ | Not yet | `sptu-s2` only delivers the filter leg; the full filter→sort→dismiss×10 flow also needs `sptu-s3`/`sptu-s4`, both unstarted |
| Metric 2 — Page-1 signal-to-noise ratio | ✅ | Now | Measured live against real local data (2026-10-05, local dev server on merged master): unfiltered `/signals` page 1 showed 1 `parse-error` signal among its first entries; with `?hideType=parse-error` applied, page 1 showed 0 `parse-error` signals — a 100% reduction on this sample, meeting both the target (0% visible) and the minimum validation signal (≥90% reduction). This is `integration-real-code` evidence (real local dev server, real signal data, not mocked) rather than `live-verified` (reserved for a real staging/production instance) — no staging deployment of this web-UI exists to check against (confirmed earlier this session via direct CI workflow inspection for the sibling `validate-trace.ps1` fix; the same applies here — this app has no staging environment in this repo's current setup). |

**Metric 1 — Signal: not-yet-measured**
**Evidence note:** Requires `sptu-s3` (sort) and `sptu-s4` (dismiss) to also ship before the full timed flow is measurable.
**Date measured:** null

**Metric 2 — Signal: on-track**
**Evidence:** 1→0 `parse-error` signals visible on page 1 after filtering, real local data, 2026-10-05 (see above). Target (0% visible) met exactly on this sample; minimum validation signal (≥90% reduction) exceeded.
**Date measured:** 2026-10-05

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. Two real issues were found and fixed during implementation (both already logged in `decisions.md`): (a) the implementation plan's own Task 2 test-split prediction was wrong — documentation-only, caught and corrected by the Task 2 subagent, not a code defect; (b) the AC3 integration test's own fixture had a CSRF-token-identity bug (`fakeReqRes()` minted a new session, and therefore a new CSRF token, per call), making the "reload" comparison fail unconditionally regardless of real filter correctness — found by the Task 3 subagent, which correctly declined to fix it outside its route/view-only scope and flagged it back; fixed by the orchestrating session by sharing one session object across both dispatches, verified via the real `csrf_token_generate` log event showing `wasNew:false` on the second dispatch.
2. The original query-param design (`?hideType=a&hideType=b` arriving as an array) was wrong and was caught and corrected at `/definition-of-ready`, before any code was written — `server.js`'s real `parseQuery` is last-wins on repeated keys, never array-shaped. This is recorded in the story's own Architecture Constraints and `decisions.md`, not a post-hoc finding.
3. Metric 2's measurement event (above) is the first real signal data this feature has produced. It is `integration-real-code`-tier (real local dev server, real signal data) because no staging deployment exists for this web-UI in the current repo setup — this should not be read as a lower-confidence result, only as an honestly-tagged evidence tier, consistent with this feature's own established discipline of not overclaiming `live-verified` status.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Type/source filter for the signals panel" (sptu-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
